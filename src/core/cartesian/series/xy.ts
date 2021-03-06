import {
    ICss, IEvent, EventType, UIElement, IBuffer, ITooltipData, Alignment,
    ILegendItem, IRect
} from '../../../interface/ui-base';
import {
    IXYValue
} from '../../../interface/chart/series-data';
import {
    IXYSeries, InterpolateType, RenderType, ILayer, IXYLayer
} from '../../../interface/chart/chart'

import {
    InternalDecimatorMap, NEWSDecimationValue, NEWSPointDecimator,
    NEWSStateDecimator, XYPointDecimator, AvgContinuousDecimator, XYDummyDecimator
} from '../decimator/decimator';
import {
    getSelectionName, SimpleBuffer, bisectBuffer, isOverlapping
} from '../../utilities';
import { ColorManager } from '../../color-manager';
import { getKeys, Arrow, animatePath } from '../../svg-helper';
import { PIXIHelper, GraphicsManager } from '../../pixi-helper';
import { D3Axis } from '../axis';
import {
    ID3Chart, D3Chart, createDecimatorWorker, getBoundedPixelValue
} from '../chart';
import { ICartesianSeriesPlugin } from '../../../interface/chart/series';

import { BaseSeries } from './baseSeries';

import * as d3 from 'd3';
import * as PIXI from 'pixi.js';

export class XYSeries extends BaseSeries implements ICartesianSeriesPlugin {
    public static canRender(layer: ILayer): boolean {
        let possible = ((layer.renderType & RenderType.Line) || (layer.renderType & RenderType.Area) ||
            (layer.renderType & RenderType.Scatter) || layer.renderType & RenderType.DirectionalArrow);

        return possible !== 0 && layer.data.length === 1 && !(layer.renderType & RenderType.Stacked) &&
            layer.data[0] && layer.data[0].hasOwnProperty('values');
    }

    protected _data: IXYSeries;
    protected _values: IBuffer<IXYValue>;
    protected _colors: { [index: string]: string };
    protected _classes: string;
    protected _selectionClasses: string;
    protected _layer: IXYLayer;
    protected _worker: Worker;

    protected _pixi: PIXI.Renderer;
    protected _pixiHelper: PIXIHelper;

    constructor(chart: ID3Chart, layer: ILayer,
        svg: d3.Selection<d3.BaseType, {}, d3.BaseType, any>,
        xAxis: D3Axis, yAxis: D3Axis, isXContinuous: boolean) {

        super(chart, layer, xAxis, yAxis, isXContinuous, svg);

        this._colors = layer.colors;
        this.setData(layer);
    }

    protected initializeClasses() {
        let className: string;
        if (this._layer.renderType & RenderType.Scatter) {
            className = 'chart-scatter';
        } else if (this._layer.renderType & RenderType.Line) {
            className = 'chart-line';
        } else if (this._layer.renderType & RenderType.Area) {
            className = 'chart-area';
        } else if (this._layer.renderType & RenderType.DirectionalArrow) {
            className = 'chart-arrow';
        }

        // Build list of class names to apply
        this._classes = this.getClassNames(className);
        this._selectionClasses = this.getSelectionClasses(className);

        // set up the shared things all types will need
        if (this._layer.renderType & RenderType.Stacked) {
            this._classes += ' chart-stacked';
        }
    }

    /** exists so grouped XY can set the data instead of assuming it's*/
    public setData(layer: ILayer, index = 0) {
        this._data = layer.data[index] as IXYSeries;
        if (Array.isArray(this._data.values)) {
            this._values = new SimpleBuffer(this._data.values);
        } else {
            this._values = this._data.values;
        }

        this.initializeClasses();
    }

    protected applyStyles(): void {
        super.applyStyles();
        if (this._data.css) {
            let styles: { [index: string]: any } = this._data.css.style;
            if (styles) {
                for (let i = 0; i < this._d3Elems.length; ++i) {
                    for (let key in styles) {
                        this._d3Elems[i].style(key, styles[key]);
                    }
                }
            }
        }
    }  // applyStyles

    protected getDecimationName() {
        return this._layer.decimator ?
            getSelectionName(this._layer.decimator.getName()) : '';
    }

    protected getInterpolateType(): d3.CurveFactory {
        let type: d3.CurveFactory = d3.curveLinear;

        switch (this._layer.interpolateType) {
            case InterpolateType.StepBefore:
                type = d3.curveStepBefore;
                break;
            case InterpolateType.StepAfter:
                type = d3.curveStepAfter;
                break;
        }
        return type;
    }

    /** return the name of the series */
    public getName() {
        return this._data.name ? this._data.name : '';
    }

    /** check if this series is continuous */
    public isYContinuousSeries() {
        if (Array.isArray(this._data.values)) {
            if (this._data.values.length) {
                return !isNaN((this._data.values)[0].y);
            }
        } else {
            let buffer = this._data.values;
            if (buffer.length() > 0) {
                return !isNaN(buffer.get(0).y);
            }
        }
        return true;
    }

    public getCss(): ICss {
        return this._data.css;
    }

    /** get all discrete x values */
    public getDiscreteXValues(isStacked: boolean): string[] {
        let xMap = function (d: any): string[] {
            return [d.x];
        }

        let keys = getKeys(this._data.values as IXYValue[], xMap);
        return keys;
    }

    /** get all discrete y values */
    public getDiscreteYValues(): string[] {
        let yMap: (d: any) => any = function (d: any) {
            return [d.y];
        }

        let keys = getKeys(this._data.values as IXYValue[], yMap);
        return keys.reverse();
    }

    /** get x min max values for the object */
    public getXMinMax(): number[] {
        let xMinMax: number[] = [Number.MAX_VALUE, Number.MIN_VALUE];
        let length = this._values.length();
        for (let i = 0; i < length; ++i) {
            xMinMax[0] = Math.min(xMinMax[0], this._values.get(i).x);
            xMinMax[1] = Math.max(xMinMax[1], this._values.get(i).x);
        }
        let scalar = this.getXScalingInfo().baseScale.scalar;
        xMinMax[0] = xMinMax[0] * scalar;
        xMinMax[1] = xMinMax[1] * scalar;

        // adjust so scatter is on the screen
        // fit scatter plot to screen if we don't have to deal with zooming
        if (this._layer.renderType & RenderType.Scatter &&
            this._d3Chart.getOptions().disableZoomViewUpdate) {
            let radius = 3;
            if (this._layer.css && this._layer.css.style && this._layer.css.style.r) {
                radius = this._layer.css.style.r;
            }

            let range = xMinMax[1] - xMinMax[0];
            let offset = radius / this._d3Chart.getOptions().width * range;
            xMinMax[0] = xMinMax[0] - offset;
            xMinMax[1] = xMinMax[1] + offset;
        }

        return xMinMax;
    }

    /** get y min max values for the object */
    public getYMinMax(): number[] {
        let yMinMax: number[] = [Number.MAX_VALUE, Number.MIN_VALUE];

        let length = this._values.length();
        for (let i = 0; i < length; ++i) {
            yMinMax[0] = Math.min(yMinMax[0], this._values.get(i).y);
            yMinMax[1] = Math.max(yMinMax[1], this._values.get(i).y);
        }

        // adjust so scatter is on the screen
        // fit scatter plot to screen if we don't have to deal with zooming
        if (this._layer.renderType & RenderType.Scatter &&
            this._d3Chart.getOptions().disableZoomViewUpdate) {
            let radius = 3;
            if (this._layer.css && this._layer.css.style && this._layer.css.style.r) {
                radius = this._layer.css.style.r;
            }

            let range = yMinMax[1] - yMinMax[0];
            let offset = radius / this._d3Chart.getOptions().height * range;
            yMinMax[0] = yMinMax[0] - offset;
            yMinMax[1] = yMinMax[1] + offset;
        }

        return yMinMax;
    }

    /** decimate the data for the series or series group
     * @param xAxis representation of x-axis
     * @param yAxis representation of y-axis
     */
    public decimateData(xStart: number, xEnd: number, xAxis: D3Axis, yAxis: D3Axis): Promise<any> {
        let self = this;

        if (self._worker) {
            self._worker.terminate();
            self._worker = null;
        }

        // if we aren't stacked or don't have a custom decimationFunc
        // then we just use our customer decimators
        if (self.isXContinuousSeries()) {
            let decimator: any;

            if (self._layer.decimator) {
                decimator = self._layer.decimator;
            } else if (self._layer.renderType & RenderType.Raw) {
                decimator = new XYDummyDecimator();
            } else if (self._layer.renderType & RenderType.Line) {
                if (self._d3YAxis.isBanded()) {
                    decimator = new NEWSStateDecimator();
                } else {
                    decimator = new NEWSPointDecimator();
                }
            } else if (self._layer.renderType & RenderType.Area) {
                if (self._d3YAxis.isBanded()) {
                    decimator = new NEWSStateDecimator();
                } else {
                    decimator = new AvgContinuousDecimator();
                }
            } else if (self._layer.renderType & RenderType.Scatter) {
                decimator = new XYPointDecimator();
            } else if (self._layer.renderType & RenderType.DirectionalArrow) {
                return new Promise<any>(function (resolve, reject) {
                    self.setOutputData(self._values);
                    resolve();
                });
            } else {
                throw 'Unexpected that there is no way to decimate the given data';
            }

            let xScale = xAxis.getScale();
            let yScale = yAxis.getScale();

            // force refresh if any data changes
            if ((self._layer.enableWebWorkers || self._d3Chart.getOptions().enableWebWorkers) &&
                InternalDecimatorMap[decimator.getKey()]) {
                return new Promise<any>(function (resolve, reject) {
                    self._worker = createDecimatorWorker(decimator, xStart, xEnd, self._d3XAxis,
                        self._d3YAxis, self._values.getData(), undefined, function (data: IXYValue[]) {
                            self._worker = null;
                            self.setOutputData(data);
                            resolve();
                        }, function (error: any) {
                            self._worker = null;

                            // in this case we failed to create the worker
                            decimator.initialize(xScale, xScale.invert, yScale);
                            self.setOutputData(decimator.decimateValues(xStart, xEnd, self._values));
                            resolve();
                        });
                });
            } else {
                return new Promise<any>(function (resolve, reject) {
                    decimator.initialize(xScale, xScale.invert, yScale);
                    self.setOutputData(decimator.decimateValues(xStart, xEnd, self._values));
                    resolve();
                });
            }
        } else {
            return new Promise<any>(function (resolve, reject) {
                self.setOutputData(self._values);
                resolve();
            });
        }
    }

    protected getTooltipText(value: any) {
        if (!isNaN(value)) {
            return (value * this.getYScalingInfo().baseScale.scalar).toFixed(2) +
                this.getYScalingInfo().baseScale.units;
        } else {
            return value;
        }
    }

    /** fill in tooltip information  */
    public getTooltipMetrics(elem: UIElement, event: IEvent): ITooltipData[] {
        let tooltipData: ITooltipData = { source: elem, group: '', metrics: {} };
        if (this._layer.renderType & RenderType.Raw) {
            // ignore raw data for now as we don't know what the user
            // is using it for
        } else if (this._outputData && this._outputData.length() > 0 && event.xEnd) {
            if (this._layer.renderType & RenderType.Line ||
                this._layer.renderType & RenderType.Area) {
                if (!this._d3XAxis.isBanded()) {
                    let outputIdx = bisectBuffer(function (d: IXYValue) { return d.x; }).left
                        (this._outputData, event.xEnd);

                    if (outputIdx >= this._outputData.length()) {
                        outputIdx = this._outputData.length() - 1;
                    }

                    if (this._layer.interpolateType &&
                        this._layer.interpolateType === InterpolateType.StepAfter) {
                        --outputIdx;
                    }

                    // handle case if there is some out of bounds error
                    outputIdx = getBoundedPixelValue(outputIdx, this._outputData.length() - 1);

                    let dataName = this._data.name ? this._data.name : '';
                    tooltipData.metrics[dataName] = this.getTooltipText(this._outputData.get(outputIdx).y);

                    if (this._outputData.get(outputIdx).min !== undefined &&
                        this._outputData.get(outputIdx).max !== undefined &&
                        this._outputData.get(outputIdx).max !== this._outputData.get(outputIdx).min) {
                        tooltipData.metrics[dataName + ' Min'] =
                            this.getTooltipText(this._outputData.get(outputIdx).min);

                        tooltipData.metrics[dataName + ' Max'] =
                            this.getTooltipText(this._outputData.get(outputIdx).max);
                    }
                }
            } else if (this._layer.renderType & RenderType.Scatter) {
                // TODO
            }
        } else if (event.selection) {
            let yScalar = this.getYScalingInfo().baseScale.scalar;
            let yUnit = this.getYScalingInfo().baseScale.units;

            for (let dataIdx = 0; dataIdx < this._values.length(); ++dataIdx) {
                let key = this._values.get(dataIdx).x;
                let value = this._values.get(dataIdx).y;
                if (key == event.selection) {
                    tooltipData.metrics[this._data.name] =
                        (value * yScalar).toFixed(2) + yUnit;
                    break;
                }
            }
        }
        return [tooltipData];
    }

    /** get information for the legend to render */
    public getLegendInfo(): ILegendItem[] {
        let legendItems: ILegendItem[] = [];

        if (this._layer.renderType === RenderType.DirectionalArrow) {
            return legendItems;
        }
        for (let i = 0; i < this._d3Elems.length; ++i) {
            let key = this._data.name;
            if (this._layer.decimator) {
                key += ' ' + this._layer.decimator.getName();
            }

            // there are default for area
            let colorAttr = 'fill';
            let shape = 'rect';
            if (this._layer.renderType & RenderType.Line) {
                colorAttr = 'stroke';
                shape = 'line';
            } else if (this._layer.renderType & RenderType.Scatter) {
                shape = 'circle';
            }
            try {
                let color = this._d3Elems[i].style(colorAttr);
                legendItems.push({
                    key: key,
                    color: color,
                    opacity: this._d3Elems[i].style('opacity'),
                    shape: shape
                });
                if (color !== '') {
                    this._d3Chart.getRenderer().getColorManager().setColor(key,
                        legendItems[legendItems.length - 1].color);
                }
            } catch (e) {
                legendItems.push({
                    key: key,
                    color: this._d3Chart.getRenderer().getColorManager().getColor(key),
                    opacity: '1',
                    shape: shape,
                });
            }
        }
        return legendItems;
    }

    protected getAngle(start: IXYValue, end: IXYValue): number {
        return Math.atan2(end.y - start.y,
            end.x - start.x) * 180 / Math.PI;
    }

    protected getAnimateDuration(): number {
        return this._d3Chart.getOptions().animateDuration !== undefined ? this._d3Chart.getOptions().animateDuration : 1000;
    }

    protected renderArrows(indices: number[], color: string) {
        let self = this;
        let elem = self._d3svg.selectAll(self._selectionClasses + '.line');
        let arrow = self._d3svg.selectAll(self._selectionClasses + '.arrow');

        let isFirst = elem.empty();
        if (isFirst) {
            elem = this._d3svg.append('path')
                .classed(this._classes, true)
                .classed('line', true)
                .attr('fill', 'none')
                .attr('stroke-width', 1)
                .attr('stroke', color);

            arrow = Arrow.createArrow(self._d3svg, 4)
                .classed(this._classes, true)
                .classed('arrow', true)
                .attr('fill', color);

            if (this._data.css) {
                for (let className in this._data.css.classes) {
                    elem.classed(className, true);
                }
            }
            this._d3Elems.push(elem);
            this._d3Elems.push(arrow);
        }

        let line: d3.Line<number>;

        // Construct the D3 path generator for a line
        line = d3.line<number>()
            .x(self.xIndexMap)
            .y(self.yIndexMap);

        // set the interpolation for this area
        line.curve(this.getInterpolateType());

        if (this.getOutputData().length() > 0) {
            elem.attr('d', line(indices));

            animatePath(elem, self.getAnimateDuration());
            Arrow.animateArrow(elem, arrow, self.getAnimateDuration());
        }
    }

    // optimize the path by merging points with different X values but
    // the same Y values
    protected optimizeLinePath(yFunction: (index: number) => number) {
        let ret = [];
        let dataSize = this.getOutputData().length();
        if (dataSize > 0) {
            let lastValue = {
                x: this.xIndexMap(0),
                y: Math.round(yFunction(0))
            }
            ret.push(lastValue);

            for (let i = 1; i < dataSize; ++i) {
                let value = {
                    x: this.xIndexMap(i),
                    y: Math.round(yFunction(i))
                }

                if (value.y !== lastValue.y || i === dataSize - 1) {
                    if (ret[ret.length - 1] !== lastValue) {
                        ret.push(lastValue);
                    }
                    ret.push(value);
                }
                lastValue = value;
            }
        }
        return ret;
    }
    // ySeriesOffset is for adjust for banded/ordinal y axis renderings
    protected renderLines(color: string) {
        let self = this;

        let isStacked: boolean = (this._layer.renderType & RenderType.Stacked) ===
            RenderType.Stacked;

        let elem = self._d3svg.select(self._selectionClasses);
        let isFirst = elem.empty();

        if (isFirst) {
            let configureItemInteraction = function () {
                self.configureItemInteraction(d3.select(this), undefined, undefined);

                if (self._layer.renderType & RenderType.Raw || self._layer.onHover) {
                    d3.select(this)
                        .on('mouseenter', function () {
                            let event = {
                                caller: self._d3Chart.getElement(),
                                selection: self.getName(),
                                event: EventType.HoverStart,
                                data: self.getName(),
                                tooltip: self._d3Chart.getTooltip(),
                            }
                            self._d3Chart.onHover(event);
                            if (self._layer.onHover) {
                                self._layer.onHover(event);
                            }
                        })
                        .on('mouseleave', function () {
                            let event = {
                                caller: self._d3Chart.getElement(),
                                selection: self.getName(),
                                event: EventType.HoverEnd,
                                tooltip: self._d3Chart.getTooltip(),
                                data: self.getName()
                            }
                            self._d3Chart.onHover(event);
                            if (self._layer.onHover) {
                                self._layer.onHover(event);
                            }
                        });
                }
            }

            elem = this._d3svg.append('path')
                .classed(this._classes, true)
                .attr('id', self._classes)
                .attr('fill', 'none')
                .attr('stroke-width', 1)
                .attr('stroke', color)
                .each(configureItemInteraction); 3

            if (this._data.css) {
                for (let className in this._data.css.classes) {
                    elem.classed(className, true);
                }
            }

            if (this._data.description) {
                let offset = '0%'
                let alignment = '-.5em'
                if (self._data.description.text) {
                    offset = self._data.description.percentage ? `${self._data.description.percentage}%` : '0%';
                    alignment = self._data.description.alignment === Alignment.Bottom ? '1em' : '-.5em'
                }

                this._d3svg.append('text')
                    .classed(self._classes, true)
                    .classed('title', true)
                    .attr('dy', alignment)
                    .attr('fill', color)
                    .append('textPath')
                    .attr('startOffset', offset)
                    .attr('xlink:href', '#' + self._classes)
                    .text(this._data.description.text);
            }
        }

        /** if we we have min/max data for the lines render this information */
        if (!isStacked && this._outputData.length() > 0
            && this._outputData.get(0).hasOwnProperty('min') &&
            this._outputData.get(0).hasOwnProperty('max') &&
            this._outputData.get(0).hasOwnProperty('entry') &&
            this._outputData.get(0).hasOwnProperty('exit')) {
            // make a custom data series to use the path and reander from
            // entry to min to max to exit to the next entry

            let path: IXYValue[] = [];
            for (let i = 0; i < this._outputData.length(); ++i) {
                let data = this._outputData.get(i);
                let prevValue = data.entry;
                path.push({ x: data.x, y: data.entry });

                if (prevValue !== data.min) {
                    path.push({ x: data.x, y: data.min });
                    prevValue = data.min;
                }

                if (prevValue !== data.max) {
                    path.push({ x: data.x, y: data.max });
                    prevValue = data.max;
                }

                if (prevValue !== data.exit) {
                    path.push({ x: data.x, y: data.exit });
                }
            }

            let line = d3.line<IXYValue>()
                .x(function (d: any) { return self.xMap(d.x) })
                .y(function (d: any) { return self.yMap(d.y) })
                .curve(this.getInterpolateType());

            elem.attr('d', line(path));
        } else {
            let optimizedPath: IXYValue[];
            if (isStacked) {
                optimizedPath = self.optimizeLinePath(self.yIndexPostStackMap);
            } else {
                optimizedPath = self.optimizeLinePath(self.yIndexMap);
            }

            // set the interpolation for this area
            // Construct the D3 path generator for a line
            let line = d3.line<IXYValue>()
                .x((d: IXYValue) => { return d.x; })
                .y((d: IXYValue) => { return d.y; })
                .curve(this.getInterpolateType());
            elem.attr('d', line(optimizedPath));
        }

        this._d3Elems.push(elem);
    }

    // optimize the path by merging points with different X values but
    // the same Y values
    protected optimizeAreaPath(y0: (index: number) => number, y1: (index: number) => number) {
        let ret = [];
        let dataSize = this.getOutputData().length();
        if (dataSize > 0) {
            let lastValue = {
                x: this.xIndexMap(0),
                y0: Math.round(y0(0)),
                y1: Math.round(y1(0))
            }
            ret.push(lastValue);

            for (let i = 1; i < dataSize; ++i) {
                let value = {
                    x: this.xIndexMap(i),
                    y0: Math.round(y0(i)),
                    y1: Math.round(y1(i))
                }

                if (value.y0 !== lastValue.y0 || value.y1 !== lastValue.y1 ||
                    i === dataSize - 1) {

                    if (ret[ret.length - 1] !== lastValue) {
                        ret.push(lastValue);
                    }
                    ret.push(value);
                }
                lastValue = value;
            }
        }
        return ret;
    }
    // ySeriesOffset is for adjust for banded/ordinal y axis renderings
    protected renderAreas(indices: number[], color: string) {
        let self = this;

        let isStacked: boolean = (this._layer.renderType & RenderType.Stacked) ===
            RenderType.Stacked;

        let elem = self._d3svg.select(this._selectionClasses);
        let isFirst = elem.empty();
        if (isFirst) {
            elem = this._d3svg.append('path')
                .classed(this._classes, true)
                .attr('id', self._classes)
                .attr('fill', color);

            if (this._data.description) {
                let offset = '0%'
                let alignment = '-.5em'
                if (self._data.description) {
                    offset = self._data.description.percentage ? `${self._data.description.percentage}%` : '0%';
                    alignment = self._data.description.alignment === Alignment.Bottom ? '1em' : '-.5em'
                }

                this._d3svg.append('text')
                    .classed(self._classes, true)
                    .classed('title', true)
                    .attr('dy', alignment)
                    .attr('fill', color)
                    .append('textPath')
                    .attr('startOffset', offset)
                    .attr('xlink:href', '#' + self._classes)
                    .text(this._data.description.text);
            }
        }

        this.configureItemInteraction(elem, undefined, undefined);

        let optimizedPath: IXYValue[];
        if (isStacked) {
            optimizedPath = this.optimizeAreaPath(self.yIndexPreStackMap, self.yIndexPostStackMap);
        } else {
            if (this._outputData.length() > 0
                && this._outputData.get(0) instanceof NEWSDecimationValue) {
                // add stroke for when min/max are the same
                elem.attr('stroke', color);

                // Construct the D3 area for the graph
                optimizedPath = this.optimizeAreaPath(
                    function (index: number) {
                        return self.yMap(self._outputData.get(index).min);
                    }, function (index: number) {
                        return self.yMap(self._outputData.get(index).max);
                    });
            } else {
                optimizedPath = this.optimizeAreaPath(
                    function (index: number) {
                        return self.yMap(0);
                    }, self.yIndexMap);
                // Construct the D3 area for the graph
            }
        }

        // set the interpolation for this area
        let area: d3.Area<any> = d3.area<any>()
            .x((d: any) => { return d.x; })
            .y0((d: any) => { return d.y0; })
            .y1((d: any) => { return d.y1; })
            .curve(this.getInterpolateType());

        elem.attr('d', area(optimizedPath));
        this._d3Elems.push(elem);
    }

    protected renderCirclePoints(indices: number[], color: string, radius: number) { }

    /** maps a data value to a pixel value */
    protected xMap: (d: any) => number;
    protected yMap: (d: any) => number;

    /** maps a data value to a pixel value using the index to the element in the
     *  outputData array as the input.  This is needed for stacking the data */
    protected xIndexMap: (d: any) => number;
    protected yIndexMap: (d: any) => number;
    protected yIndexPreStackMap: (d: any) => number;
    protected yIndexPostStackMap: (d: any) => number;

    /** render all of the data in the series
     * @param svg the svg to draw the data in
     * @param yOffsets for each data point in this element
     */
    public render(yOffsets?: number[]): void {
        let self = this;

        this._d3Elems = [];

        if (this._layer.forceUpdate) {
            let oldClasses = this._classes.replace(/ /g, '.');
            this._d3svg.selectAll(oldClasses).remove();
            this.initializeClasses();
            this._layer.forceUpdate = false;
        }

        // If there's already data remove it
        let xScale = self._d3XAxis.getScale().copy();
        if (xScale.clamp) {
            xScale.clamp(false);
        }
        let yScale = self._d3YAxis.getScale().copy();
        if (yScale.clamp) {
            yScale.clamp(false);
        }

        let xSeriesOffset = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
        let ySeriesOffset = yScale.bandwidth ? yScale.bandwidth() / 2 : 0;

        // these functions are generic for the lines and areas
        // and stacked stuff
        let indices = d3.range(0, this._outputData.length());

        self.xMap = function (value: any) {
            return xScale(value) + xSeriesOffset;
        }
        self.yMap = function (value: any) {
            let yValue = yScale(value);
            if (yValue === undefined) {
                yValue = 0;
            }
            return yValue + ySeriesOffset;
        }
        self.xIndexMap = function (index: number) {
            return self.xMap(self._outputData.get(index).x);
        }
        self.yIndexMap = function (index: number) {
            return self.yMap(self._outputData.get(index).y);
        }
        self.yIndexPreStackMap = function (index: number) {
            return self.yMap(yOffsets[index]);
        }
        self.yIndexPostStackMap = function (index: number) {
            yOffsets[index] += self._outputData.get(index).y;
            return self.yMap(yOffsets[index]);
        }

        let svg = self._d3Chart.getGraphGroup();

        self._layer.getAbsolutePosition = function (value: IXYValue): IXYValue {
            // could make this faster by caching the
            let rect = svg.node().getBoundingClientRect();
            if (rect) {
                return { x: rect.left + self.xMap(value.x), y: rect.top + self.yMap(value.y) };
            }
            return { x: undefined, y: undefined };
        }


        let color: string;
        if (self._data.css) {
            color = self._data.css.style['color'];
        }
        if (!color) {
            if (self._colors && self._colors[self.getName()]) {
                color = self._colors[self.getName()];
            } else {
                color = self._d3Chart.getRenderer().getColorManager().getColor(self.getName());
            }
        }

        // do this in place because it is used by reference in the context menu
        this.initializeContextMenuItems();

        // now actually made the d3 calls to render the dat
        if (self._layer.renderType & RenderType.Line) {
            self.renderLines(color);
        } else if (self._layer.renderType & RenderType.Area) {
            self.renderAreas(indices, color);
        } else if (self._layer.renderType & RenderType.Scatter) {
            if (self._d3Chart.getOptions().forceSvgRenderer) {
                this.renderCirclePoints = D3SVGXYSeries.prototype.renderCirclePoints.bind(this);
            } else {
                this.renderCirclePoints = D3PIXIXYSeries.prototype.renderCirclePoints.bind(this);
                this.focus = D3PIXIXYSeries.prototype.focus.bind(this);
                this.unfocus = D3PIXIXYSeries.prototype.unfocus.bind(this);
                this.select = D3PIXIXYSeries.prototype.select.bind(this);
                this.unselect = D3PIXIXYSeries.prototype.unselect.bind(this);
            }
            self.renderCirclePoints(indices, color, 3);
        }
        if (self._layer.renderType & RenderType.DirectionalArrow) {
            self.renderArrows(indices, color);
        }
        self.applyStyles();
    }

    public getRenderedYRange(): number[] {
        let domain = [Number.MAX_VALUE, -Number.MAX_VALUE];
        // find the range for the data
        for (let i = 0; i < this.getOutputData().length(); ++i) {
            let point = this.getOutputData().get(i);
            if (point.min) {
                domain[0] = Math.min(point.min, domain[0]);
            } else {
                domain[0] = Math.min(point.y, domain[0]);
            }
            if (point.max) {
                domain[1] = Math.max(point.max, domain[1]);
            } else {
                domain[1] = Math.max(point.y, domain[1]);
            }
        }
        return domain;
    }
}
D3Chart.register(XYSeries);

class D3SVGXYSeries extends XYSeries {
    public renderCirclePoints(indices: number[], color: string, radius: number) {
        let self = this;

        let getTitle = function (d: any) {
            let xy = self._outputData.get(d);
            if (self._data.getTitle) {
                return self._data.getTitle(xy);
            }
            if (xy.info && xy.info.title) {
                return xy.info.title;
            }
            return '';
        }

        let getColor = function (d: any) {
            let xy = self._outputData.get(d);
            if (xy.info && xy.info.colorKey) {
                return self._d3Chart.getRenderer().getColorManager().getColor(xy.info.colorKey);
            }
            let eventName = xy.y;
            if (self._colors && self._colors[eventName]) {
                return self._colors[eventName];
            }
            return color;
        }

        let configureItemInteraction = function (d: any) {
            let xy = self._outputData.get(d);
            let selection = getTitle(d);

            self.configureItemInteraction(d3.select(this), self.getOutputData().get(d), selection);
            if (self._layer.onHover) {

                d3.select(this)
                    .on('mouseenter', function () {
                        let event = {
                            caller: self._d3Chart.getElement(),
                            selection: selection,
                            event: EventType.HoverStart,
                            tooltip: self._d3Chart.getTooltip(),
                            data: xy
                        }
                        self._d3Chart.onHover(event);
                        self._layer.onHover(event);
                        self._d3Chart.getTooltip().displayTooltip(0);
                    })
                    .on('mousemove', function () {
                        d3.event.stopPropagation();
                    })
                    .on('mouseleave', function () {
                        let event = {
                            caller: self._d3Chart.getElement(),
                            selection: selection,
                            event: EventType.HoverEnd,
                            tooltip: self._d3Chart.getTooltip(),
                            data: xy
                        }
                        self._d3Chart.onHover(event);
                        self._layer.onHover(event);
                        self._d3Chart.getTooltip().hideTooltip();
                    });
            }
        }

        let configureItem = function (d: any) {
            let xy = self._outputData.get(d);
            let obj = d3.select(this);
            if (xy.info) {
                if (xy.info.colorKey) {
                    obj.classed(getSelectionName(xy.info.colorKey), true);
                }
                let title = getTitle(d);
                if (title.length) {
                    obj.classed(getSelectionName(title), true);
                }
            }
        }


        if (this._data.showTitleText) {
            // sort the data by distance from the origin
            let data = this._outputData.getData();
            data = data.sort((a: IXYValue, b: IXYValue) => {
                return (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y)
            });

            this._outputData = new SimpleBuffer(data);

            let graphRect = this._d3Chart.getGraphGroup().node().getBoundingClientRect();

            let textBoxes: any[] = [];
            let prevRight: any;
            let prevLeft: any;
            let positionTextHelper = function (obj: any, width: number, isLeft: boolean) {
                let dx: number;
                if (isLeft) {
                    dx = -width - 10;
                } else {
                    dx = 10;
                }

                let d3Text = d3.select(obj);
                d3Text.attr('dx', `${dx}px`);

                let rect: any = obj.getBoundingClientRect();
                if (rect.left < graphRect.left) {
                    if (prevRight) {
                        // if we are off the left and have a previous right value
                        let d3TextY = Number(d3Text.attr('y'));
                        d3Text.attr('y', d3TextY - 1 - (rect.height - (prevRight.y - rect.y)));
                        return positionTextHelper(obj, width, !isLeft);
                    } else {
                        // here we are just off the screen completely so we shouldn't
                        // even be shown
                        obj.remove();
                    }
                } else if (rect.y < graphRect.y) {
                    console.log('Unable to render XY Scatter text in graph area');
                } else {
                    for (let i = 0; i < textBoxes.length; ++i) {
                        let existing = textBoxes[i];
                        if (isOverlapping(existing, rect)) {
                            if (!isLeft && Math.round(rect.x) === Math.round(existing.x) &&
                                Math.round(rect.y) === Math.round(existing.y)) {
                                // if this is the same X/Y and you're on the right
                                let d3TextX = Number(d3Text.attr('x'));
                                let text = d3Text.text();
                                if (text.length > 0 && text[0].localeCompare(',') !== 0) {
                                    d3Text.text(',' + text);
                                }
                                d3Text.attr('x', d3TextX + 1 + existing.width);
                                prevRight = existing;
                                return positionTextHelper(obj, width, false);
                            }
                            // move this to just above the text on the right
                            let d3TextY = Number(d3Text.attr('y'));
                            if (isLeft) {
                                prevLeft = existing;
                                // prevRight must exist since we try the right first
                                d3Text.attr('y', d3TextY - 1 - (rect.height - (prevRight.y - rect.y)));
                            } else {
                                prevRight = existing;
                                if (prevLeft) {
                                    d3Text.attr('y', d3TextY - 1 - (rect.height - (prevLeft.y - rect.y)));
                                }
                            }
                            return positionTextHelper(obj, width, !isLeft);
                        }
                    }
                }
                textBoxes.push(rect);
            }
            let positionText = function () {
                prevLeft = undefined;
                prevRight = undefined;
                let rect: any = this.getBoundingClientRect();
                positionTextHelper(this, rect.width, false);
            }

            let text = self._d3svg.selectAll(self.getSelectionClasses('chart-scatter')).filter('text').data(indices);
            text.exit().remove();
            text.enter()
                .append('text')
                .classed(self._classes, true)
                .text(getTitle)
                .attr('x', self.xIndexMap)
                .attr('y', self.yIndexMap)
                .attr('dy', .5)
                .attr('fill', getColor)
                .each(configureItem)
                .each(positionText);

            text
                .classed(self._classes, true)
                .text(getTitle)
                .attr('x', self.xIndexMap)
                .attr('y', self.yIndexMap)
                .each(configureItem)
                .each(positionText);
        }

        let computeRadius = function (d: any) {
            if (self._layer.useValueWhenRendering) {
                let data = self.getOutputData().get(d);
                return d3.max([data.value, radius]);
            }
            return radius;
        }

        let dataUpdate = self._d3svg.selectAll(self._selectionClasses).filter('circle').data(indices);
        dataUpdate.exit().remove();
        dataUpdate
            .enter()
            .append('circle')
            .classed(this._classes, true)
            .attr('r', computeRadius)
            .attr('cx', self.xIndexMap)
            .attr('cy', self.yIndexMap)
            .attr('fill', getColor)
            .attr('stroke', getColor)
            .each(configureItem)
            .each(configureItemInteraction)
            .each(function () { self._d3Elems.push(d3.select(this)); })

        dataUpdate
            .classed(this._classes, true)
            .attr('r', computeRadius)
            .attr('cx', self.xIndexMap)
            .attr('cy', self.yIndexMap)
            .attr('fill', getColor)
            .attr('stroke', getColor)
            .each(configureItem)
            .each(configureItemInteraction)
            .each(function () { self._d3Elems.push(d3.select(this)); })
    }
}

class D3PIXIXYSeries extends XYSeries {
    protected _stage: PIXI.Container;
    protected _graphicsMgr: GraphicsManager;
    protected _selectTempItems: any;

    public select(selection: string) {
        if (selection) {

            let self = this;
            let segments = this._d3svg.classed('selected', true);
            segments.classed('selected', true);

            let color = ColorManager.RgbToInt(segments.style('stroke'));
            let strokeWidth = parseInt(segments.style('stroke-width'), 10);

            this._d3svg.classed('selected', false);

            let createSelectionBorder = function (circle: PIXI.Sprite) {
                let circleRadius = circle.width / 2;
                let radius = circleRadius / 2 + strokeWidth;
                let border = self._graphicsMgr.add(self.getName() + radius,
                    self.getName() + radius, PIXI.SCALE_MODES.LINEAR, 1,
                    function () {
                        let pixiCircle = new PIXI.Graphics();
                        pixiCircle.beginFill(0xFFFFFF);
                        pixiCircle.drawCircle(0, 0, radius); // drawCircle(x, y, radius)
                        pixiCircle.endFill();
                        return pixiCircle;
                    });

                border.x = circle.x + circleRadius - radius;
                border.y = circle.y + circleRadius - radius;
                border.tint = color;
                border.__data__ = (circle as any).__data__;

                return border;
            }

            let items = this._pixiHelper.getSelection(selection);
            if (items) {
                if (!self._selectTempItems) {
                    self._selectTempItems = {}
                }
                items.forEach(function (elem: any, index: number) {
                    let border = createSelectionBorder(elem);
                    self._selectTempItems[`${selection}Select${index}`] = border;
                    self._stage.addChildAt(border, 0);
                });
            }
            this._pixiHelper.render();
        }
    }

    public unselect(selection: string) {
        this._d3svg.select('.segments').classed('selected', false);
        let items = this._pixiHelper.getSelection(selection);
        if (items) {
            let self = this;
            items.forEach(function (elem: any, index: number) {
                let center = self._selectTempItems[`${selection}Select${index}`];
                self._stage.removeChild(center);
                delete self._selectTempItems[`${selection}Select${index}`];
            });
            this._pixiHelper.render();
        }
    }

    public renderCirclePoints(indices: number[], color: string, radius: number) {
        let self = this;
        let chart = this._d3Chart.getElement() as any;

        let getTitle = function (d: any) {
            let xy = self._outputData.get(d);
            let ret = '';
            if (self._data.getTitle) {
                let ret = self._data.getTitle(xy);
                if (ret === undefined) {
                    ret = '';
                }
            } else if (xy.info && xy.info.title) {
                ret = xy.info.title;
            }
            return ret;
        }

        let getColor = function (d: any) {
            let xy = self._outputData.get(d);
            if (xy.info && xy.info.colorKey) {
                return self._d3Chart.getRenderer().getColorManager().getColor(xy.info.colorKey);
            }
            let eventName = xy.y;
            if (self._colors && self._colors[eventName]) {
                return self._colors[eventName];
            }
            return color;
        }

        // append webGL canvas
        let configureItemInteractionPIXI = function (elem: any, idx: any) {
            let xy = self._outputData.get(idx);

            let selection = '';
            if (self._layer.onHover) {
                selection = self._data.getTitle(idx);
                if (selection.length > 0) {
                    self._pixiHelper.addSelection(
                        getSelectionName(selection), elem);
                }
            }

            // note click is handled by the configureItemInteractionPIXI call after this
            self._pixiHelper.addInteractionHelper(elem, self._d3Chart.getOptions(),
                undefined, undefined, self._contextMenuItems,
                self._layer.onHover ? () => {
                    let event = {
                        caller: self._d3Chart.getElement(),
                        selection: selection,
                        event: EventType.HoverStart,
                        data: xy,
                        tooltip: self._d3Chart.getTooltip()
                    }
                    self._d3Chart.onHover(event);
                    self._layer.onHover(event);
                    self._d3Chart.getTooltip().displayTooltip(0);
                } : undefined,
                self._layer.onHover ? () => {
                    let event = {
                        caller: self._d3Chart.getElement(),
                        selection: selection,
                        event: EventType.HoverEnd,
                        data: xy,
                        tooltip: self._d3Chart.getTooltip()
                    }
                    self._d3Chart.onHover(event);
                    self._layer.onHover(event);
                    self._d3Chart.getTooltip().hideTooltip();
                } : undefined, undefined, chart, xy, xy);

            self.configureItemInteractionPIXI(elem, xy, selection);

            if (selection.length > 0) {
                self._pixiHelper.addSelection(getSelectionName(selection), elem);
            }
        }

        this._stage = new PIXI.Container();
        if (!this._pixiHelper) {
            this._pixiHelper = new PIXIHelper(!this._d3Chart.getOptions().forceCanvasRenderer);
            this._pixi = this._pixiHelper.getRenderer();
        }
        let foreignObject = this._pixiHelper.addPixiSvg(
            self._d3svg, this._classes, this._d3XAxis.getRangePixels(),
            this._d3YAxis.getRangePixels());

        this._pixiHelper.clearSelections();

        foreignObject
            .attr('fill', color)
            .style('fill', color);
        this._d3Elems.push(foreignObject); // this is just for legends

        self.configureItemInteraction(foreignObject, undefined, undefined);

        this._graphicsMgr = new GraphicsManager(this._pixi);

        let computeRadius = function (d: any) {
            if (self._layer.useValueWhenRendering) {
                let data = self.getOutputData().get(d);
                return d3.max([data.value, radius]);
            }
            return radius;
        }

        indices.forEach(function (idx: number) {
            let radius = computeRadius(idx);
            let sprite = self._graphicsMgr.add(self.getName() + radius,
                self.getName() + radius, PIXI.SCALE_MODES.LINEAR, 1,
                function () {
                    let pixiCircle = new PIXI.Graphics();
                    pixiCircle.beginFill(0xFFFFFF);
                    pixiCircle.drawCircle(0, 0, radius); // drawCircle(x, y, radius)
                    pixiCircle.endFill();
                    return pixiCircle;
                });

            sprite.x = self.xIndexMap(idx) - radius;
            sprite.y = self.yIndexMap(idx) - radius;
            sprite.tint = parseInt(getColor(idx).substring(1), 16);
            configureItemInteractionPIXI(sprite, idx);
            self._stage.addChild(sprite);
        });

        if (this._data.showTitleText) {
            // let labelGroup = self._d3svg.selectAll('.labels');
            // labelGroup.selectAll('*').remove();

            // indices.forEach(function (idx: number) {
            //     let fontSize = labelGroup.style('font-size');
            //     fontSize =
            //         Number(fontSize.substring(0, fontSize.length - 2)) * 2 + 'px';
            //     let text = new PIXI.Text(name,
            //         {
            //             fill: 0x000000,
            //             fontFamily: labelGroup.style('font-family'),
            //             fontSize: fontSize,
            //             fontWeight: labelGroup.style('font-weight')
            //         });
            //     // scale text down
            //     text.scale = new PIXI.Point(.5, .5);
            //     this._textMap.set(self._outputData.get(idx).info.title, text);
            // })
        }

        this._pixiHelper.render(this._stage);
    }
}
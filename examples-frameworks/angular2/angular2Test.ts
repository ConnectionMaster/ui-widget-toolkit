/// <reference path='../../examples/testBase.ts' />
/// <reference path='../../examples/testData.ts' />

import * as UWT from '../../dist';
import { Component } from '@angular/core';

let options = {
    selectionBlink: false,
    height: 30,
    leftMargin: 100
};
let optionsBigLaneBlink = {
    selectionBlink: true,
    height: 120
};
let optionsFlame = {
    selectionBlink: false,
    disableBrush: true
};

window.onload = () => {
    TestBase.configureButtons();
}
// <uwt-checkbox-tree [nodes]='nodes' (onChecked)='onChecked($event)'></uwt-checkbox-tree>
@Component({
    selector: 'test-app',
    template: `
        <div style='height: 300px'>
            <uwt-chart id='chart1' [chartTitle]='title' [chartDef]='chartDef' [colorManager]='colorManager'></uwt-chart>
        </div>
        <uwt-checkbox-tree [data]='node' (onCheckChanged)='onChecked($event)'></uwt-checkbox-tree>
        <uwt-swimlane-chart id='swimlane' [chartTitle]='swimTitle' [chartDefs]='swimDef' [renderOptions]='swimlaneOptions' [colorManager]='colorManager'></uwt-swimlane-chart>
        <uwt-pie-chart id='pie1' [chartTitle]='pieTitle' [chartDef]='pieDef' [renderOptions]='renderOptions' [colorManager]='colorManager'></uwt-pie-chart>
        <uwt-grid id='grid1' [gridTitle]='gridTitle' [gridDef]='gridDef' [gridStyle]='gridStyle' [gridClass]='gridClass' [colorManager]='colorManager'></uwt-grid>
        <div style='height: 300px'>
            <uwt-flow-diagram id='flow1' [diagramTitle]='flowTitle' [diagramDef]='diagramDef' [colorManager]='colorManager'></uwt-flow-diagram>
        </div>
        <div style='height: 300px'>
            <uwt-graph style='height: 300px' id='graph1' [graphTitle]='graphTitle' [graphDef]='graphDef' [colorManager]='colorManager'></uwt-graph>
        </div>    
        <uwt-chart id='chart3' [chartTitle]='flameTitle' [chartDef]='flameChart' [colorManager]='colorManager' [renderOptions]='flameRenderOptions'></uwt-chart>
        <uwt-sunburst-chart id='chart4' [chartTitle]='sunTitle' [chartDef]='sunChart' [colorManager]='colorManager'></uwt-sunburst-chart>
        <uwt-axis [axisDef]='axis'></uwt-axis>
        <uwt-radar-chart [chartTitle]='radarTitle' [chartDef]='radarDef'></uwt-radar-chart>
    `
})

export class TestApp {
    swimTitle = 'Swimlane Test';
    swimDef: UWT.ICartesianChart[];
    swimlaneOptions: UWT.IOptions;
    title = 'Carteisan Chart 1';
    renderOptions = optionsBigLaneBlink;
    colorManager = TestBase.colorManager;
    chartDef: UWT.ICartesianChart;
    pieTitle: string;
    pieDef: UWT.IPieChart;
    gridTitle: string;
    gridDef: any;
    gridStyle: any;
    gridClass: string[];
    flowTitle: string;
    diagramDef: UWT.IConnectedGraph;
    graphTitle: string;
    graphDef: UWT.IConnectedGraph;
    flameTitle: string;
    flameChart: UWT.ICartesianChart;
    flameRenderOptions: UWT.IOptions;
    sunTitle: string;
    sunChart: UWT.ISunburstChart;
    axis: UWT.IAxis;
    radarTitle = 'Radar Chart';
    radarDef: UWT.IRadarChart;
    node: any;

    onChecked(node: any) {
        console.log(node);
    }

    constructor() {
        let self = this;


        let timeAxis = {
            scaleType: UWT.AxisType.Linear,
            label: 'Time',
            scalingInfo: TestData.secScalingInfo,
            range: { min: 0, max: 10000 }
        };
        this.axis = {
            type: UWT.UIType.Axis,
            axisDesc: timeAxis,
            alignment: UWT.Alignment.Top
        }

        this.node =
        {
            id: 1,
            name: 'root1',
            open: true,
            notCheckable: true,
            children: [
                { id: 2, name: 'child1' },
                { id: 3, name: 'child2' },
                {
                    id: 4,
                    name: 'root2',
                    children: [
                        { id: 5, name: 'child2.1' },
                        {
                            id: 6,
                            name: 'child2.2',
                            children: [
                                { id: 7, name: 'subsub' }
                            ]
                        }
                    ]
                }
            ]
        };

        let swimChart: UWT.ICartesianChart = {
            type: UWT.UIType.Cartesian,
            title: 'foo',
            dataSets: [{
                renderType: UWT.RenderType.Line,
                data: [
                    { name: 'data-0', values: TestData.xyDataSets[0] },
                    { name: 'data-1', values: TestData.xyDataSets[1] },
                    { name: 'data-2', values: TestData.xyDataSets[2] },]
            }],
            isXContinuous: true,
            legends: [{ alignment: UWT.Alignment.Top }]
        }

        let swimChart2: UWT.ICartesianChart = {
            type: UWT.UIType.Cartesian,
            title: 'bar',
            dataSets: [{
                renderType: UWT.RenderType.Area | UWT.RenderType.Stacked,
                data: [
                    { name: 'data-0', values: TestData.xyDataSets[0] },
                    { name: 'data-1', values: TestData.xyDataSets[1] },
                    { name: 'data-2', values: TestData.xyDataSets[2] },]
            }],
            isXContinuous: true
        }

        let swimChart3: UWT.ICartesianChart = {
            type: UWT.UIType.Cartesian,
            title: 'abc',
            dataSets: [{
                renderType: UWT.RenderType.Area,
                data: [
                    { name: 'data-0', values: TestData.xyDataSets[0], css: { style: { opacity: .5 } } },
                    { name: 'data-1', values: TestData.xyDataSets[1], css: { style: { opacity: .5 } } },
                    { name: 'data-2', values: TestData.xyDataSets[2], css: { style: { opacity: .5 } } }]
            }],
            isXContinuous: true
        }

        TestBase.addElement(swimChart, 'lanes', 'lanes', 'lanes');
        TestBase.addElement(swimChart2, 'lanes', 'lanes', 'lanes');
        TestBase.addElement(swimChart3, 'lanes', 'lanes', 'lanes');

        let swimlaneDefs = [swimChart, swimChart2, swimChart3];
        self.swimDef = swimlaneDefs;
        self.swimlaneOptions = options;

        let chart: UWT.ICartesianChart = {
            type: UWT.UIType.Cartesian,
            title: 'foo2',
            dataSets: [{
                renderType: UWT.RenderType.Area,
                data: [
                    { name: 'data-0', values: TestData.xyDataSets[0] },
                    { name: 'data-1', values: TestData.xyDataSets[1] },
                    { name: 'data-2', values: TestData.xyDataSets[2] }]
            }],
            axes: [{ alignment: UWT.Alignment.Bottom, axisDesc: TestData.timeAxis }],
            isXContinuous: true,
            brushContextMenuItems: []
        };

        TestBase.addElement(chart, 'group1', 'group1');
        self.chartDef = chart;

        let pieDef: UWT.IPieChart = {
            title: '',
            type: UWT.UIType.Pie,
            data: { 'data-0': 45, 'data-1': 32, 'data-2': 12 },
            innerRadius: .25,
            legend: {
                alignment: UWT.Alignment.Right,
                definition: {
                    items: [{
                        key: 'data-0',
                        name: 'data-0: 45'
                    }]
                }
            }
        };
        TestBase.addElement(pieDef, 'group1', 'group1');

        this.pieTitle = 'Pie Chart';
        this.pieDef = pieDef;

        var columnDefs = [
            { headerName: "Make", field: "make" },
            { headerName: "Model", field: "model" },
            { headerName: "Price", field: "price" }
        ];

        var rowData = [
            { make: "data-0", model: "Celica", price: 35000 },
            { make: "data-1", model: "Mondeo", price: 32000 },
            { make: "data-2", model: "Boxster", price: 72000 },
            { make: "Ferrari", model: "California", price: 158000 },
            { make: "Nissan", model: "GT-R", price: 105000 }
        ];

        var gridOptions = {
            columnDefs: columnDefs,
            rowData: rowData,
            animateRows: true
        };

        let gridDef: UWT.IGrid = {
            type: UWT.UIType.Grid,
            gridOptions: gridOptions
        };
        this.gridTitle = 'Grid 1';
        this.gridStyle = { height: '400px' };
        this.gridClass = ['ag-theme-balham'];
        this.gridDef = gridDef;

        this.flowTitle = 'Sankey Diagram';

        let flow: UWT.IConnectedGraph = {
            type: UWT.UIType.FlowDiagram,
            links: [
                { from: 'data-0', to: 'data-2', value: 1 },
                { from: 'data-1', to: 'data-2', value: 1 },
                { from: 'data-1', to: 'data-3', value: 1 },
                { from: 'data-0', to: 'data-4', value: 1 },
                { from: 'data-2', to: 'data-3', value: 1 },
                { from: 'data-2', to: 'data-4', value: 1 },
                { from: 'data-3', to: 'data-4', value: 3 }
            ],
            legend: { alignment: UWT.Alignment.Bottom }
        }

        TestBase.addElement(flow, 'group1', 'group1');
        this.diagramDef = flow;

        this.graphTitle = 'Force Graph';

        let graph: UWT.IConnectedGraph = {
            type: UWT.UIType.ForceDirectedGraph,
            links: [
                { from: 'data-0', to: 'data-2', value: 1 },
                { from: 'data-1', to: 'data-2', value: 1 },
                { from: 'data-1', to: 'data-3', value: 1 },
                { from: 'data-0', to: 'data-4', value: 1 },
                { from: 'data-2', to: 'data-3', value: 1 },
                { from: 'data-2', to: 'data-4', value: 1 },
                { from: 'data-3', to: 'data-4', value: 3 }
            ],
            legend: { alignment: UWT.Alignment.Left }
        }

        TestBase.addElement(graph, 'group1', 'group1');
        this.graphDef = graph;

        let calltrace: any[] = [
            { "name": "schedule", "x": 206791, "dx": 57384 }, { "name": "__schedule", "x": 206855, "dx": 57308 }, { "name": "rcu_note_context_switch", "x": 206965, "dx": 94 }, { "name": "_raw_spin_lock_irq", "x": 207129, "dx": 64 }, { "name": "deactivate_task", "x": 207278, "dx": 4414 }, { "name": "dequeue_task", "x": 207328, "dx": 4354 }, { "name": "update_rq_clock.part.63", "x": 207387, "dx": 353 }, { "name": "sched_clock_cpu", "x": 207422, "dx": 283 }, { "name": "sched_clock", "x": 207497, "dx": 183 }, { "name": "native_sched_clock", "x": 207511, "dx": 155 }, { "name": "native_read_tsc", "x": 207541, "dx": 45 }, { "name": "dequeue_task_fair", "x": 207825, "dx": 3837 }, { "name": "dequeue_entity", "x": 207929, "dx": 2356 }, { "name": "update_curr", "x": 207999, "dx": 447 }, { "name": "update_min_vruntime", "x": 208168, "dx": 89 }, { "name": "cpuacct_charge", "x": 208302, "dx": 79 }, { "name": "update_cfs_rq_blocked_load", "x": 208640, "dx": 84 }, { "name": "clear_buddies", "x": 208859, "dx": 59 }, { "name": "account_entity_dequeue", "x": 208948, "dx": 169 }, { "name": "update_min_vruntime", "x": 209142, "dx": 94 }, { "name": "update_cfs_shares", "x": 209246, "dx": 999 }, { "name": "update_curr", "x": 209430, "dx": 562 }, { "name": "__calc_delta", "x": 209594, "dx": 229 }, { "name": "update_min_vruntime", "x": 209848, "dx": 89 }, { "name": "account_entity_dequeue", "x": 210012, "dx": 84 }, { "name": "account_entity_enqueue", "x": 210136, "dx": 85 }, { "name": "dequeue_entity", "x": 210350, "dx": 994 }, { "name": "update_curr", "x": 210419, "dx": 135 }, { "name": "update_cfs_rq_blocked_load", "x": 210743, "dx": 84 }, { "name": "clear_buddies", "x": 210912, "dx": 59 }, { "name": "account_entity_dequeue", "x": 211001, "dx": 85 }, { "name": "update_min_vruntime", "x": 211110, "dx": 95 }, { "name": "update_cfs_shares", "x": 211215, "dx": 89 }, { "name": "hrtick_update", "x": 211603, "dx": 19 }, { "name": "idle_balance", "x": 211777, "dx": 14838 }, { "name": "_raw_spin_unlock", "x": 211876, "dx": 35 }, { "name": "update_blocked_averages", "x": 211926, "dx": 2540 }, { "name": "_raw_spin_lock_irqsave", "x": 211995, "dx": 90 }, { "name": "update_rq_clock", "x": 212100, "dx": 397 }, { "name": "update_rq_clock.part.63", "x": 212134, "dx": 353 }, { "name": "sched_clock_cpu", "x": 212169, "dx": 284 }, { "name": "sched_clock", "x": 212244, "dx": 184 }, { "name": "native_sched_clock", "x": 212259, "dx": 154 }, { "name": "native_read_tsc", "x": 212289, "dx": 44 }, { "name": "update_cfs_rq_blocked_load", "x": 212587, "dx": 164 }, { "name": "update_cfs_rq_blocked_load", "x": 213019, "dx": 214 }, { "name": "update_cfs_rq_blocked_load", "x": 213929, "dx": 164 }, { "name": "_raw_spin_unlock_irqrestore", "x": 214342, "dx": 84 }, { "name": "sched_clock_cpu", "x": 214570, "dx": 284 }, { "name": "sched_clock", "x": 214645, "dx": 184 }, { "name": "native_sched_clock", "x": 214660, "dx": 154 }, { "name": "native_read_tsc", "x": 214690, "dx": 44 }, { "name": "load_balance", "x": 214893, "dx": 4156 }, { "name": "find_busiest_group", "x": 215221, "dx": 3674 }, { "name": "update_group_power", "x": 215505, "dx": 571 }, { "name": "msecs_to_jiffies", "x": 215574, "dx": 55 }, { "name": "sched_cfs_period_timer", "x": 215738, "dx": 45 }, { "name": "sched_cfs_period_timer", "x": 215833, "dx": 30 }, { "name": "cpumask_next_and", "x": 216131, "dx": 249 }, { "name": "find_next_bit", "x": 216191, "dx": 124 }, { "name": "target_load", "x": 216449, "dx": 55 }, { "name": "idle_cpu", "x": 216569, "dx": 59 }, { "name": "cpumask_next_and", "x": 216658, "dx": 378 }, { "name": "find_next_bit", "x": 216718, "dx": 278 }, { "name": "cpumask_next_and", "x": 217473, "dx": 249 }, { "name": "find_next_bit", "x": 217533, "dx": 124 }, { "name": "source_load", "x": 217791, "dx": 55 }, { "name": "idle_cpu", "x": 217916, "dx": 94 }, { "name": "cpumask_next_and", "x": 218050, "dx": 378 }, { "name": "find_next_bit", "x": 218110, "dx": 278 }, { "name": "sched_clock_cpu", "x": 219064, "dx": 283 }, { "name": "sched_clock", "x": 219138, "dx": 184 }, { "name": "native_sched_clock", "x": 219153, "dx": 155 }, { "name": "native_read_tsc", "x": 219183, "dx": 45 }, { "name": "msecs_to_jiffies", "x": 219382, "dx": 55 }, { "name": "sched_clock_cpu", "x": 219546, "dx": 283 }, { "name": "sched_clock", "x": 219621, "dx": 184 }, { "name": "native_sched_clock", "x": 219636, "dx": 154 }, { "name": "native_read_tsc", "x": 219665, "dx": 45 }, { "name": "load_balance", "x": 219869, "dx": 6169 }, { "name": "find_busiest_group", "x": 220197, "dx": 4405 }, { "name": "cpumask_next_and", "x": 220525, "dx": 249 }, { "name": "find_next_bit", "x": 220585, "dx": 124 }, { "name": "target_load", "x": 220844, "dx": 54 }, { "name": "idle_cpu", "x": 220963, "dx": 59 }, { "name": "cpumask_next_and", "x": 221052, "dx": 249 }, { "name": "find_next_bit", "x": 221112, "dx": 124 }, { "name": "target_load", "x": 221370, "dx": 55 }, { "name": "idle_cpu", "x": 221490, "dx": 94 }, { "name": "cpumask_next_and", "x": 221624, "dx": 378 }, { "name": "find_next_bit", "x": 221684, "dx": 278 }, { "name": "cpumask_next_and", "x": 222399, "dx": 249 }, { "name": "find_next_bit", "x": 222459, "dx": 124 }, { "name": "source_load", "x": 222718, "dx": 54 }, { "name": "idle_cpu", "x": 222842, "dx": 60 }, { "name": "cpumask_next_and", "x": 222931, "dx": 249 }, { "name": "find_next_bit", "x": 222991, "dx": 124 }, { "name": "source_load", "x": 223249, "dx": 55 }, { "name": "idle_cpu", "x": 223374, "dx": 59 }, { "name": "cpumask_next_and", "x": 223463, "dx": 378 }, { "name": "find_next_bit", "x": 223523, "dx": 278 }, { "name": "cpumask_next_and", "x": 224666, "dx": 249 }, { "name": "find_next_bit", "x": 224726, "dx": 124 }, { "name": "cpumask_next_and", "x": 225039, "dx": 249 }, { "name": "find_next_bit", "x": 225099, "dx": 124 }, { "name": "cpumask_next_and", "x": 225467, "dx": 377 }, { "name": "find_next_bit", "x": 225526, "dx": 279 }, { "name": "sched_clock_cpu", "x": 226053, "dx": 283 }, { "name": "sched_clock", "x": 226128, "dx": 184 }, { "name": "native_sched_clock", "x": 226143, "dx": 154 }, { "name": "native_read_tsc", "x": 226172, "dx": 45 }, { "name": "msecs_to_jiffies", "x": 226371, "dx": 55 }, { "name": "_raw_spin_lock", "x": 226481, "dx": 54 }, { "name": "put_prev_task_fair", "x": 226674, "dx": 314 }, { "name": "pick_next_task_fair", "x": 227012, "dx": 105 }, { "name": "pick_next_task_stop", "x": 227140, "dx": 55 }, { "name": "pick_next_task_rt", "x": 227227, "dx": 105 }, { "name": "pick_next_task_fair", "x": 227364, "dx": 105 }, { "name": "pick_next_task_idle", "x": 227501, "dx": 36 }, { "name": "probe_sched_switch", "x": 227660, "dx": 2768 }, { "name": "poor_mans_ptwrite_prev_pid", "x": 227729, "dx": 201 }, { "name": "ftrace_raw_event_switch_out", "x": 228076, "dx": 2279 }, { "name": "trace_event_buffer_lock_reserve", "x": 228213, "dx": 1310 }, { "name": "trace_buffer_lock_reserve", "x": 228268, "dx": 1246 }, { "name": "ring_buffer_lock_reserve", "x": 228323, "dx": 826 }, { "name": "rb_reserve_next_event", "x": 228473, "dx": 658 }, { "name": "trace_clock_local", "x": 228606, "dx": 191 }, { "name": "sched_clock", "x": 228619, "dx": 169 }, { "name": "native_sched_clock", "x": 228633, "dx": 142 }, { "name": "native_read_tsc", "x": 228660, "dx": 42 }, { "name": "ring_buffer_event_data", "x": 229172, "dx": 105 }, { "name": "rb_event_data", "x": 229186, "dx": 82 }, { "name": "tracing_generic_entry_update", "x": 229300, "dx": 173 }, { "name": "ring_buffer_event_data", "x": 229546, "dx": 105 }, { "name": "rb_event_data", "x": 229560, "dx": 82 }, { "name": "filter_check_discard", "x": 229706, "dx": 18 }, { "name": "trace_buffer_unlock_commit", "x": 229761, "dx": 552 }, { "name": "ring_buffer_unlock_commit", "x": 229807, "dx": 443 }, { "name": "rb_update_write_stamp", "x": 229871, "dx": 114 }, { "name": "ftrace_trace_userstack", "x": 230277, "dx": 14 }, { "name": "probe_sched_switch", "x": 230464, "dx": 553 }, { "name": "tracing_record_cmdline", "x": 230519, "dx": 301 }, { "name": "tracing_is_on", "x": 230555, "dx": 74 }, { "name": "ring_buffer_record_is_on", "x": 230583, "dx": 36 }, { "name": "tracing_record_cmdline", "x": 230829, "dx": 151 }, { "name": "tracing_is_on", "x": 230866, "dx": 73 }, { "name": "ring_buffer_record_is_on", "x": 230893, "dx": 37 }, { "name": "perf_event_task_sched_out", "x": 231135, "dx": 64 }, { "name": "__context_tracking_task_switch", "x": 231309, "dx": 41 }, { "name": "__switch_to", "x": 231391, "dx": 690 }, { "name": "native_load_sp0", "x": 231610, "dx": 28 }, { "name": "native_load_tls", "x": 231724, "dx": 60 }, { "name": "finish_task_switch", "x": 232145, "dx": 2091 }, { "name": "vtime_common_task_switch", "x": 232227, "dx": 1876 }, { "name": "vtime_account_system", "x": 232268, "dx": 1251 }, { "name": "_raw_spin_lock", "x": 232309, "dx": 50 }, { "name": "__vtime_account_system", "x": 232373, "dx": 1082 }, { "name": "get_vtime_delta", "x": 232400, "dx": 457 }, { "name": "local_clock", "x": 232437, "dx": 351 }, { "name": "sched_clock_cpu", "x": 232487, "dx": 260 }, { "name": "sched_clock", "x": 232555, "dx": 169 }, { "name": "native_sched_clock", "x": 232569, "dx": 142 }, { "name": "native_read_tsc", "x": 232597, "dx": 41 }, { "name": "account_system_time", "x": 232884, "dx": 557 }, { "name": "cpuacct_account_field", "x": 233044, "dx": 50 }, { "name": "acct_account_cputime", "x": 233103, "dx": 306 }, { "name": "__acct_update_integrals", "x": 233131, "dx": 269 }, { "name": "jiffies_to_timeval", "x": 233245, "dx": 91 }, { "name": "_raw_spin_unlock", "x": 233469, "dx": 32 }, { "name": "arch_vtime_task_switch", "x": 233528, "dx": 562 }, { "name": "_raw_spin_lock", "x": 233569, "dx": 50 }, { "name": "_raw_spin_unlock", "x": 233647, "dx": 32 }, { "name": "_raw_spin_lock", "x": 233688, "dx": 50 }, { "name": "sched_clock_cpu", "x": 233761, "dx": 260 }, { "name": "sched_clock", "x": 233829, "dx": 169 }, { "name": "native_sched_clock", "x": 233843, "dx": 142 }, { "name": "native_read_tsc", "x": 233871, "dx": 41 }, { "name": "_raw_spin_unlock", "x": 234040, "dx": 31 }, { "name": "_raw_spin_lock_irqsave", "x": 234282, "dx": 82 }, { "name": "post_schedule_idle", "x": 234400, "dx": 210 }, { "name": "idle_enter_fair", "x": 234419, "dx": 182 }, { "name": "_raw_spin_unlock_irqrestore", "x": 234624, "dx": 78 }, { "name": "tick_nohz_idle_enter", "x": 234788, "dx": 5977 }, { "name": "set_cpu_sd_state_idle", "x": 234829, "dx": 55 }, { "name": "__tick_nohz_idle_enter", "x": 234912, "dx": 5831 }, { "name": "ktime_get", "x": 234957, "dx": 251 }, { "name": "read_tsc", "x": 235035, "dx": 82 }, { "name": "native_read_tsc", "x": 235049, "dx": 41 }, { "name": "sched_clock_idle_sleep_event", "x": 235227, "dx": 287 }, { "name": "sched_clock_cpu", "x": 235245, "dx": 260 }, { "name": "sched_clock", "x": 235313, "dx": 169 }, { "name": "native_sched_clock", "x": 235327, "dx": 142 }, { "name": "native_read_tsc", "x": 235355, "dx": 41 }, { "name": "tick_nohz_stop_sched_tick", "x": 235629, "dx": 5020 }, { "name": "timekeeping_max_deferment", "x": 235734, "dx": 54 }, { "name": "rcu_needs_cpu", "x": 235816, "dx": 242 }, { "name": "rcu_cpu_has_callbacks", "x": 235875, "dx": 151 }, { "name": "irq_work_needs_cpu", "x": 236071, "dx": 32 }, { "name": "get_next_timer_interrupt", "x": 236122, "dx": 602 }, { "name": "_raw_spin_lock", "x": 236222, "dx": 50 }, { "name": "_raw_spin_unlock", "x": 236313, "dx": 32 }, { "name": "hrtimer_get_next_event", "x": 236359, "dx": 302 }, { "name": "_raw_spin_lock_irqsave", "x": 236419, "dx": 82 }, { "name": "_raw_spin_unlock_irqrestore", "x": 236537, "dx": 78 }, { "name": "nohz_balance_enter_idle", "x": 236907, "dx": 82 }, { "name": "calc_load_enter_idle", "x": 236994, "dx": 55 }, { "name": "hrtimer_start", "x": 237113, "dx": 3430 }, { "name": "__hrtimer_start_range_ns", "x": 237145, "dx": 3387 }, { "name": "lock_hrtimer_base.isra.19", "x": 237227, "dx": 182 }, { "name": "_raw_spin_lock_irqsave", "x": 237286, "dx": 82 }, { "name": "__remove_hrtimer", "x": 237496, "dx": 1365 }, { "name": "timerqueue_del", "x": 237578, "dx": 265 }, { "name": "rb_next", "x": 237633, "dx": 73 }, { "name": "rb_erase", "x": 237729, "dx": 91 }, { "name": "hrtimer_force_reprogram", "x": 237907, "dx": 904 }, { "name": "tick_program_event", "x": 238145, "dx": 657 }, { "name": "clockevents_program_event", "x": 238190, "dx": 603 }, { "name": "ktime_get", "x": 238268, "dx": 251 }, { "name": "read_tsc", "x": 238345, "dx": 83 }, { "name": "native_read_tsc", "x": 238359, "dx": 41 }, { "name": "lapic_next_deadline", "x": 238587, "dx": 174 }, { "name": "native_read_tsc", "x": 238615, "dx": 41 }, { "name": "native_write_msr_safe", "x": 238702, "dx": 36 }, { "name": "enqueue_hrtimer", "x": 239071, "dx": 434 }, { "name": "timerqueue_add", "x": 239126, "dx": 315 }, { "name": "rb_insert_color", "x": 239345, "dx": 46 }, { "name": "tick_program_event", "x": 239633, "dx": 705 }, { "name": "clockevents_program_event", "x": 239679, "dx": 648 }, { "name": "ktime_get", "x": 239756, "dx": 252 }, { "name": "read_tsc", "x": 239834, "dx": 82 }, { "name": "native_read_tsc", "x": 239848, "dx": 41 }, { "name": "lapic_next_deadline", "x": 240077, "dx": 211 }, { "name": "native_read_tsc", "x": 240110, "dx": 50 }, { "name": "native_write_msr_safe", "x": 240216, "dx": 44 }, { "name": "_raw_spin_unlock_irqrestore", "x": 240388, "dx": 94 }, { "name": "arch_cpu_idle_enter", "x": 240843, "dx": 178 }, { "name": "local_touch_nmi", "x": 240865, "dx": 34 }, { "name": "atomic_notifier_call_chain", "x": 240926, "dx": 84 }, { "name": "notifier_call_chain", "x": 240965, "dx": 33 }, { "name": "tick_check_broadcast_expired", "x": 241043, "dx": 50 }, { "name": "rcu_idle_enter", "x": 241143, "dx": 638 }, { "name": "rcu_eqs_enter", "x": 241209, "dx": 378 }, { "name": "rcu_eqs_enter_common.isra.47", "x": 241320, "dx": 245 }, { "name": "rcu_sysidle_enter", "x": 241609, "dx": 133 }, { "name": "arch_cpu_idle", "x": 241787, "dx": 9549 }, { "name": "cpuidle_idle_call", "x": 241809, "dx": 9503 }, { "name": "cpuidle_get_cpu_driver", "x": 241937, "dx": 61 }, { "name": "menu_select", "x": 242025, "dx": 8704 }, { "name": "pm_qos_request", "x": 242114, "dx": 50 }, { "name": "tick_nohz_get_sleep_length", "x": 242447, "dx": 45 }, { "name": "ns_to_timespec", "x": 242503, "dx": 138 }, { "name": "nr_iowait_cpu", "x": 242714, "dx": 50 }, { "name": "this_cpu_load", "x": 242863, "dx": 45 }, { "name": "nr_iowait_cpu", "x": 242925, "dx": 50 }, { "name": "int_sqrt", "x": 244118, "dx": 1354 }, { "name": "int_sqrt", "x": 246471, "dx": 1344 }, { "name": "int_sqrt", "x": 248769, "dx": 1355 }, { "name": "menu_reflect", "x": 250801, "dx": 61 }, { "name": "reschedule_interrupt", "x": 250873, "dx": 398 }, { "name": "smp_reschedule_interrupt", "x": 250988, "dx": 190 }, { "name": "native_apic_mem_write", "x": 251016, "dx": 24 }, { "name": "scheduler_ipi", "x": 251048, "dx": 122 }, { "name": "rcu_idle_exit", "x": 251364, "dx": 449 }, { "name": "rcu_eqs_exit", "x": 251413, "dx": 222 }, { "name": "rcu_eqs_exit_common.isra.48", "x": 251494, "dx": 121 }, { "name": "rcu_sysidle_exit", "x": 251651, "dx": 134 }, { "name": "rcu_sysidle_force_exit", "x": 251736, "dx": 37 }, { "name": "arch_cpu_idle_exit", "x": 251825, "dx": 114 }, { "name": "atomic_notifier_call_chain", "x": 251870, "dx": 61 }, { "name": "notifier_call_chain", "x": 251898, "dx": 25 }, { "name": "tick_nohz_idle_exit", "x": 251975, "dx": 4420 }, { "name": "ktime_get", "x": 252056, "dx": 223 }, { "name": "read_tsc", "x": 252125, "dx": 73 }, { "name": "native_read_tsc", "x": 252137, "dx": 37 }, { "name": "tick_nohz_stop_idle", "x": 252307, "dx": 300 }, { "name": "update_ts_time_stats", "x": 252352, "dx": 153 }, { "name": "nr_iowait_cpu", "x": 252412, "dx": 37 }, { "name": "sched_clock_idle_wakeup_event", "x": 252518, "dx": 76 }, { "name": "sched_clock_tick", "x": 252542, "dx": 16 }, { "name": "touch_softlockup_watchdog", "x": 252562, "dx": 24 }, { "name": "tick_do_update_jiffies64", "x": 252627, "dx": 48 }, { "name": "update_cpu_load_nohz", "x": 252679, "dx": 57 }, { "name": "calc_load_exit_idle", "x": 252740, "dx": 41 }, { "name": "touch_softlockup_watchdog", "x": 252789, "dx": 24 }, { "name": "tick_nohz_restart", "x": 252833, "dx": 3517 }, { "name": "hrtimer_cancel", "x": 252866, "dx": 1663 }, { "name": "hrtimer_try_to_cancel", "x": 252898, "dx": 1611 }, { "name": "lock_hrtimer_base.isra.19", "x": 252942, "dx": 162 }, { "name": "_raw_spin_lock_irqsave", "x": 252995, "dx": 73 }, { "name": "__remove_hrtimer", "x": 253181, "dx": 1210 }, { "name": "timerqueue_del", "x": 253254, "dx": 235 }, { "name": "rb_next", "x": 253303, "dx": 64 }, { "name": "rb_erase", "x": 253388, "dx": 81 }, { "name": "hrtimer_force_reprogram", "x": 253545, "dx": 802 }, { "name": "tick_program_event", "x": 253756, "dx": 583 }, { "name": "clockevents_program_event", "x": 253796, "dx": 535 }, { "name": "ktime_get", "x": 253865, "dx": 223 }, { "name": "read_tsc", "x": 253934, "dx": 73 }, { "name": "native_read_tsc", "x": 253946, "dx": 37 }, { "name": "lapic_next_deadline", "x": 254149, "dx": 153 }, { "name": "native_read_tsc", "x": 254173, "dx": 36 }, { "name": "native_write_msr_safe", "x": 254250, "dx": 32 }, { "name": "_raw_spin_unlock_irqrestore", "x": 254412, "dx": 68 }, { "name": "hrtimer_forward", "x": 254561, "dx": 41 }, { "name": "hrtimer_start_range_ns", "x": 254634, "dx": 1692 }, { "name": "__hrtimer_start_range_ns", "x": 254654, "dx": 1664 }, { "name": "lock_hrtimer_base.isra.19", "x": 254727, "dx": 162 }, { "name": "_raw_spin_lock_irqsave", "x": 254780, "dx": 73 }, { "name": "enqueue_hrtimer", "x": 255096, "dx": 384 }, { "name": "timerqueue_add", "x": 255144, "dx": 279 }, { "name": "rb_insert_color", "x": 255338, "dx": 41 }, { "name": "tick_program_event", "x": 255593, "dx": 583 }, { "name": "clockevents_program_event", "x": 255634, "dx": 534 }, { "name": "ktime_get", "x": 255703, "dx": 222 }, { "name": "read_tsc", "x": 255771, "dx": 73 }, { "name": "native_read_tsc", "x": 255784, "dx": 36 }, { "name": "lapic_next_deadline", "x": 255986, "dx": 154 }, { "name": "native_read_tsc", "x": 256010, "dx": 37 }, { "name": "native_write_msr_safe", "x": 256087, "dx": 32 }, { "name": "_raw_spin_unlock_irqrestore", "x": 256213, "dx": 68 }, { "name": "schedule_preempt_disabled", "x": 256399, "dx": 7764 }, { "name": "__schedule", "x": 256431, "dx": 7732 }, { "name": "rcu_note_context_switch", "x": 256520, "dx": 77 }, { "name": "_raw_spin_lock_irq", "x": 256654, "dx": 52 }, { "name": "pre_schedule_idle", "x": 256755, "dx": 198 }, { "name": "idle_exit_fair", "x": 256779, "dx": 154 }, { "name": "put_prev_task_idle", "x": 257010, "dx": 20 }, { "name": "pick_next_task_fair", "x": 257050, "dx": 1255 }, { "name": "clear_buddies", "x": 257184, "dx": 48 }, { "name": "set_next_entity", "x": 257245, "dx": 424 }, { "name": "update_stats_wait_end", "x": 257293, "dx": 126 }, { "name": "rb_next", "x": 257439, "dx": 56 }, { "name": "rb_erase", "x": 257516, "dx": 85 }, { "name": "clear_buddies", "x": 257750, "dx": 49 }, { "name": "set_next_entity", "x": 257811, "dx": 441 }, { "name": "update_stats_wait_end", "x": 257860, "dx": 141 }, { "name": "rb_next", "x": 258022, "dx": 56 }, { "name": "rb_erase", "x": 258098, "dx": 85 }, { "name": "probe_sched_switch", "x": 258414, "dx": 2449 }, { "name": "poor_mans_ptwrite_pid", "x": 258487, "dx": 178 }, { "name": "ftrace_raw_event_switch_in", "x": 258795, "dx": 2019 }, { "name": "trace_event_buffer_lock_reserve", "x": 258916, "dx": 1162 }, { "name": "trace_buffer_lock_reserve", "x": 258965, "dx": 1104 }, { "name": "ring_buffer_lock_reserve", "x": 259013, "dx": 733 }, { "name": "rb_reserve_next_event", "x": 259147, "dx": 582 }, { "name": "trace_clock_local", "x": 259264, "dx": 170 }, { "name": "sched_clock", "x": 259276, "dx": 150 }, { "name": "native_sched_clock", "x": 259288, "dx": 126 }, { "name": "native_read_tsc", "x": 259313, "dx": 36 }, { "name": "ring_buffer_event_data", "x": 259766, "dx": 93 }, { "name": "rb_event_data", "x": 259778, "dx": 73 }, { "name": "tracing_generic_entry_update", "x": 259879, "dx": 154 }, { "name": "ring_buffer_event_data", "x": 260098, "dx": 93 }, { "name": "rb_event_data", "x": 260110, "dx": 73 }, { "name": "filter_check_discard", "x": 260239, "dx": 17 }, { "name": "trace_buffer_unlock_commit", "x": 260288, "dx": 490 }, { "name": "ring_buffer_unlock_commit", "x": 260328, "dx": 393 }, { "name": "rb_update_write_stamp", "x": 260385, "dx": 101 }, { "name": "ftrace_trace_userstack", "x": 260745, "dx": 12 }, { "name": "probe_sched_switch", "x": 260895, "dx": 372 }, { "name": "tracing_record_cmdline", "x": 260944, "dx": 149 }, { "name": "tracing_is_on", "x": 260976, "dx": 65 }, { "name": "ring_buffer_record_is_on", "x": 261000, "dx": 33 }, { "name": "tracing_record_cmdline", "x": 261101, "dx": 134 }, { "name": "tracing_is_on", "x": 261134, "dx": 65 }, { "name": "ring_buffer_record_is_on", "x": 261158, "dx": 32 }, { "name": "perf_event_task_sched_out", "x": 261389, "dx": 56 }, { "name": "__context_tracking_task_switch", "x": 261579, "dx": 36 }, { "name": "__switch_to", "x": 261652, "dx": 655 }, { "name": "native_load_sp0", "x": 261854, "dx": 24 }, { "name": "native_load_tls", "x": 261955, "dx": 53 }, { "name": "native_write_msr_safe", "x": 262069, "dx": 32 }, { "name": "finish_task_switch", "x": 262364, "dx": 1677 }, { "name": "vtime_common_task_switch", "x": 262437, "dx": 1416 }, { "name": "vtime_account_idle", "x": 262473, "dx": 602 }, { "name": "get_vtime_delta", "x": 262490, "dx": 524 }, { "name": "local_clock", "x": 262522, "dx": 401 }, { "name": "sched_clock_cpu", "x": 262566, "dx": 302 }, { "name": "sched_clock", "x": 262627, "dx": 211 }, { "name": "native_sched_clock", "x": 262639, "dx": 181 }, { "name": "native_read_tsc", "x": 262668, "dx": 54 }, { "name": "arch_vtime_task_switch", "x": 263087, "dx": 747 }, { "name": "_raw_spin_lock", "x": 263142, "dx": 66 }, { "name": "_raw_spin_unlock", "x": 263245, "dx": 42 }, { "name": "_raw_spin_lock", "x": 263300, "dx": 66 }, { "name": "sched_clock_cpu", "x": 263397, "dx": 346 }, { "name": "sched_clock", "x": 263488, "dx": 225 }, { "name": "native_sched_clock", "x": 263506, "dx": 189 }, { "name": "native_read_tsc", "x": 263543, "dx": 54 }, { "name": "_raw_spin_unlock", "x": 263768, "dx": 42 }
        ];

        for (let i = 0; i < calltrace.length; ++i) {
            calltrace[i].key = i;
        }

        let chart7: UWT.ICartesianChart = {
            type: UWT.UIType.Cartesian,
            dataSets: [{
                renderType: UWT.RenderType.FlameChart,
                data: calltrace
            }],
            isXContinuous: true
        }
        UWT.Chart.finalize(chart7);

        TestBase.addElement(chart7);
        TestBase.elemManager.addToHighlightGroup(chart7, 'trace');
        this.flameTitle = 'Flame Chart';
        this.flameChart = chart7;
        this.flameRenderOptions = optionsFlame;

        let chart8: UWT.ISunburstChart = {
            type: UWT.UIType.Sunburst,
            data: UWT.convertTraceToTrees(calltrace)
        }

        TestBase.addElement(chart8);
        TestBase.elemManager.addToHighlightGroup(chart8, 'trace');
        UWT.addCallbacks(chart8);
        this.sunTitle = 'Sunburst Chart';
        this.sunChart = chart8;

        this.radarDef = {
            title: 'Product1',
            type: UWT.UIType.Radar,
            data: [{
                key: 'group1', data: [
                    { key: 'Sales', data: 42 },
                    { key: 'Marketing', data: 60 },
                    { key: 'Development', data: 32 },
                    { key: 'IT', data: 65 },
                    { key: 'Administration', data: 90 }
                ]
            },
            {
                key: 'group2', data: [
                    { key: 'Sales', data: 86 },
                    { key: 'Marketing', data: 34 },
                    { key: 'Development', data: 67 },
                    { key: 'IT', data: 56 },
                    { key: 'Administration', data: 90 }
                ]
            }],
            onClick: function (event: UWT.IEvent) {
                console.log('on click');
                console.log(event);
            },
            onDoubleClick: function (event: UWT.IEvent) {
                console.log('on double click');
                console.log(event);
            },
            contextMenuItems: [{
                title: 'RadarMenuItem',
                action(elem: any, data: any, index: any) {
                    console.log('index: ' + index);
                    console.log(data);
                    console.log(elem);
                }
            }],
            legend: { alignment: UWT.Alignment.Right }
        }
    }
}

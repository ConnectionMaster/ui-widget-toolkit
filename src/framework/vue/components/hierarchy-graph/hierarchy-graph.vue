<template>
    <div>
        <div class="graph-title">{{graphTitle}}</div>
        <div ref="graph"></div>
    </div>
</template>

<script>
import * as UWT from "ui-widget-toolkit/js/ui-widget-toolkit-graph";

export default {
    name: "uwtHierarchyGraph",
    props: {
        graphTitle: {
            type: String,
            default: ""
        },
        graphDef: {
            type: Object,
            default: undefined
        },
        renderOptions: {
            type: Object,
            default: () => {
                return {};
            }
        },
        colorManager: {
            type: Object,
            default: () => {
                return new UWT.ColorManager();
            }
        },
        onRender: {
            type: Function,
            default: undefined
        }
    },
    mounted: function() {
        if (!this.renderer) {
            this.renderer = new UWT.D3Renderer("", this.colorManager);
        }
        this.renderer.setOnRenderCallback(this.onRender);

        if (this.graphDef) {
            this.renderer.setDiv(this.$refs["graph"]);
            this.renderer.invalidate(this.graphDef, this.renderOptions);
        }
    },
    watch: {
        graphDef: function() {
            while (this.$refs["graph"].firstChild) {
                this.$refs["graph"].removeChild(this.$refs["graph"].firstChild);
            }
            if (this.renderer && this.graphDef) {
                this.renderer.setDiv(this.$refs["graph"]);
                this.renderer.invalidate(this.graphDef, this.renderOptions);
            }
        },
        renderOptions: function() {
            if (this.renderer && this.graphDef) {
                this.renderer.setDiv(this.$refs["graph"]);
                this.renderer.invalidate(this.graphDef, this.renderOptions);
            }
        },
        colorManager: function() {
            if (this.renderer) {
                this.renderer.setColorManager(this.colorManager);
            }
        }
    }
};
</script>

<style scoped>
.h-node {
    cursor: pointer;
}

.h-node rect {
    shape-rendering: crispEdges;
}

.h-link {
    cursor: pointer;
    stroke-opacity: 0.4;
}

.link {
    fill: none;
    stroke: #888;
    stroke-opacity: 0.4;
}
</style>
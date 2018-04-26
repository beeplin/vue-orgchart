<template>
  <div _id="app">
    <OrgChart :data="chartData"
              :vue="Vue"
              :html-to-canvas="html2canvas"
              node-id="_id"
              container-class="orgchart-container"
              chart-class="orgchart-chart"
              common-class="fa"
              spinner-class="fa fa-circle-o-notch fa-spin spinner"
              export-btn-class=""
              left-arrow-class="fa-chevron-left"
              right-arrow-class="fa-chevron-right"
              up-arrow-class="fa-chevron-up"
              down-arrow-class="fa-chevron-down"
              toggle-btn-on-class="fa-plus-square"
              toggle-btn-off-class="fa-minus-square"
              parent-node-symbol-class=""
              @drag="updateDataOnDrag">
      <div slot-scope="{ nodeData }">
        <div class="title">{{ nodeData.name }}</div>
        <div @click="addChildNode(nodeData, $event)">add child</div>
        <div @click="addSiblingNode(nodeData, $event)">add sibling</div>
        <div @click="removeNode(nodeData, $event)">remove</div>
        <div class="content">this is #{{ nodeData._id }}
        </div>
      </div>
    </OrgChart>
    <pre class="pre">{{ JSON.stringify(chartData, null, 2) }}</pre>
  </div>
</template>

<script>
import Vue from 'vue'
import createWalk from 'tree-walk'
import html2canvas from 'html2canvas'
import 'font-awesome/css/font-awesome.min.css'
import './orgchart.css'

const walk = createWalk(node => node.children)

const data1 = {
  _id: 0,
  name: 'JavaScript',
  children: [
    { _id: 1, name: 'Angular' },
    {
      _id: 2,
      name: 'React',
      children: [{ _id: 4, name: 'Preact' }],
    },
    {
      _id: 3,
      name: 'Vue',
      children: [{ _id: 5, name: 'Moon' }],
    },
  ],
}

const data2 = {
  _id: 0,
  name: 'JavaScript',
  children: [
    {
      _id: 3,
      name: 'Vue',
      children: [{ _id: 4, name: 'Preact' }, { _id: 5, name: 'Moon' }],
    },
    {
      _id: 2,
      name: 'React',
    },
    { _id: 1, name: 'Angular' },
  ],
}

export default {
  name: 'App',
  components: {
    OrgChart: () => import('./OrgChart.vue'),
  },
  data: () => ({
    chartData: data1,
    idCount: 6,
    html2canvas,
    Vue,
  }),
  mounted() {
    setTimeout(() => {
      this.chartData = data2
    }, 2500)
  },
  methods: {
    findNodeById(nodeId) {
      return walk.find(this.chartData, node => node._id === nodeId)
    },
    findParentNodeById(nodeId) {
      return walk.find(
        this.chartData,
        node =>
          node.children && node.children.some(child => child._id === nodeId),
      )
    },
    updateDataOnDrag({ targetId, sourceId, destinationId }) {
      const target = this.findNodeById(targetId)
      const source = this.findNodeById(sourceId)
      const destination = this.findNodeById(destinationId)
      source.children = source.children.filter(
        child => child._id !== target._id,
      )
      if (source.children.length === 0) this.$delete(source, 'children')
      if (!destination.children) this.$set(destination, 'children', [])
      destination.children.push(target)
    },
    addChildNode(nodeData, event) {
      const self = this.findNodeById(nodeData._id)
      if (!self.children) this.$set(self, 'children', [])
      this.idCount += 1
      self.children.push({ _id: this.idCount, name: 'new' })
    },
    addSiblingNode(nodeData, event) {
      const parent = this.findParentNodeById(nodeData._id)
      if (!parent) throw new Error('cannot add sibling to root')
      this.idCount += 1
      parent.children.push({ _id: this.idCount, name: 'new' })
    },
    removeNode(nodeData, event) {
      const self = this.findNodeById(nodeData._id)
      if (self.children && self.children.length > 0)
        throw new Error('cannot remove node that has children')
      const parent = this.findParentNodeById(nodeData._id)
      if (!parent) throw new Error('cannot remove root')
      parent.children = parent.children.filter(
        child => child._id !== nodeData._id,
      )
      if (parent.children.length === 0) this.$delete(parent, 'children')
    },
  },
}
</script>

<style>
.orgchart-container {
  position: relative;
  display: inline-block;
  width: 500px;
  height: 500px;
  background-color: blanchedalmond;
  border: 2px solid gray;
  border-radius: 5px;
}
.orgchart-chart {
  width: 100%;
  height: 100%;
}

.pre {
  display: inline-block;
  vertical-align: top;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 12px;
}
</style>

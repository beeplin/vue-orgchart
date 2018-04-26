# vue-orgchart

A Vue component that wraps [orgchart.js](https://github.com/dabeng/OrgChart.js) and supports scoped slots to customize nodes in chart.

`<ul>` support and ajax support are dropped since now you can just fetch data with your favorite ajax library like `axios`, `fetch` etc. and then pass data to this component. It will automatically repaint on data change.

## see demo

Clone this repo and run:

```bash
yarn
yarn dev
```

## install

```bash
npm i @c42/vue-orgchart
```

## usage

### props

```js
  {
    data: { type: Object, required: true }, // Data to build structure of orgchart. see below.
    vue: { type: Function, required: true }, // Vue constructor used to render nodes.
    nodeId: { type: String, default: 'id' }, // It sets one property of data as unique identifier of every orgchart node.
    direction: { type: String, default: 't2b' }, // The available values are t2b(implies "top to bottom", it's default value), b2t(implies "bottom to top"), l2r(implies "left to right"), r2l(implies "right to left").
    depth: { type: Number, default: 999 }, // It indicates the level that at the very beginning orgchart is expanded to.
    verticalDepth: { type: Number, default: 999 }, // Users can make use of this option to align the nodes vertically from the specified depth.
    exportButton: { type: Boolean, default: true }, // It enable the export button for orgchart.
    exportFilename: { type: String, default: 'OrgChart' }, // It's filename when you export current orgchart as a picture.
    htmlToCanvas: { type: Function, default: () => () => {} }, // html2canvas to convert html to picture for export.

    toggleSiblingsResp: { type: Boolean, default: true }, // Once enable this option, users can show/hide left/right sibling nodes respectively by clicking left/right arrow.
    pan: { type: Boolean, default: true }, // Users could pan the orgchart by mouse drag&drop if they enable this option.
    zoom: { type: Boolean, default: true }, // Users could zoomin/zoomout the orgchart by mouse wheel if they enable this option.
    draggable: { type: Boolean, default: true }, // Users can drag & drop the nodes of orgchart if they enable this option. **Note**: this feature doesn't work on IE due to its poor support for HTML5 drag & drop API.
    dropCriteria: { type: Function, default: () => () => true }, // Users can construct their own criteria to limit the relationships between dragged node and drop zone. Furtherly, this function accept three arguments(draggedNode, dragZone, dropZone) and just only return boolen values.

    // css classes
    containerClass: { type: String, default: '' },
    chartClass: { type: String, default: '' },
    spinnertClass: { type: String, default: '' },
    exportBtnClass: { type: String, default: '' },
    leftArrowClass: { type: String, default: '' },
    rightArrowClass: { type: String, default: '' },
    upArrowClass: { type: String, default: '' },
    downArrowClass: { type: String, default: '' },
    commonClass: { type: String, default: '' }, // Typically `fa` if using font-awesome
    parentNodeSymbolClass: { type: String, default: '' }, // Class of icon to imply that the node has child nodes.
  }
```

### events

`@drag`:

```js
onDrag = ({ targetId, sourceId, destinationId }) => {
  // targetId: id of the node being dragged
  // sourceId: id of the orignial parent node of the dragged node
  // destinationId: id of the node that the dragged node is dropped to
}
```

### add/remove/move nodes

Just modify the data, and the orgchart will update. See `src/App.vue` for a complete example.

### css

```js
import '@c42/vue-orgchart/lib/orgchart.css'
```

Or use your customized version.

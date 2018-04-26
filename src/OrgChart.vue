<template>
  <div ref="container">
    <div ref="chart" />
  </div>
</template>

<script>
/* eslint-disable no-param-reassign */
import Vue from 'vue'

export default {
  name: 'OrgChart',

  props: {
    data: { type: Object, required: true }, // Data to build structure of orgchart. see below.
    nodeId: { type: String, default: 'id' }, // It sets one property of data as unique identifier of every orgchart node.
    direction: { type: String, default: 't2b' }, // The available values are t2b(implies "top to bottom", it's default value), b2t(implies "bottom to top"), l2r(implies "left to right"), r2l(implies "right to left").
    depth: { type: Number, default: 999 }, // It indicates the level that at the very beginning orgchart is expanded to.
    verticalDepth: { type: Number, default: 999 }, // Users can make use of this option to align the nodes vertically from the specified depth.
    exportButton: { type: Boolean, default: true }, // It enable the export button for orgchart.
    exportFilename: { type: String, default: 'OrgChart' }, // It's filename when you export current orgchart as a picture.

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
  },

  data: () => ({
    innerData: {},
  }),

  watch: {
    data: {
      handler() {
        this.update()
      },
      deep: true,
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.init()
      this.update()
    })
  },

  methods: {
    init() {
      if (this.containerClass)
        this.$refs.container.setAttribute('class', this.containerClass)

      this.$refs.chart.setAttribute(
        'class',
        `orgchart${this.chartClass ? ` ${this.chartClass}` : ''}${
          this.direction !== 't2b' ? ` ${this.direction}` : ''
        }`,
      )
      this.$refs.chart.addEventListener('click', this._clickChart.bind(this))

      // append the export button to the chart-container
      if (
        this.exportButton &&
        !this.$refs.container.querySelector('.oc-export-btn')
      ) {
        const exportBtn = document.createElement('button')
        const downloadBtn = document.createElement('a')

        exportBtn.setAttribute(
          'class',
          `oc-export-btn${
            this.exportBtnClass ? ` ${this.exportBtnClass}` : ''
          }`,
        )
        exportBtn.innerHTML = 'Export'
        exportBtn.addEventListener('click', this._clickExportButton.bind(this))
        downloadBtn.setAttribute('class', 'oc-download-btn')
        downloadBtn.setAttribute('download', `${this.exportFilename}.png`)
        this.$refs.container.appendChild(exportBtn)
        this.$refs.container.appendChild(downloadBtn)
      }

      if (this.pan) {
        this.$refs.container.style.overflow = 'hidden'
        this.$refs.chart.addEventListener(
          'mousedown',
          this._onPanStart.bind(this),
        )
        this.$refs.chart.addEventListener(
          'touchstart',
          this._onPanStart.bind(this),
        )
        document.body.addEventListener('mouseup', this._onPanEnd.bind(this))
        document.body.addEventListener('touchend', this._onPanEnd.bind(this))
      }

      if (this.zoom) {
        this.$refs.container.addEventListener(
          'wheel',
          this._onWheeling.bind(this),
        )
        this.$refs.container.addEventListener(
          'touchstart',
          this._onTouchStart.bind(this),
        )
        document.body.addEventListener(
          'touchmove',
          this._onTouchMove.bind(this),
        )
        document.body.addEventListener('touchend', this._onTouchEnd.bind(this))
      }
    },

    update() {
      this.$refs.chart.innerHTML = ''
      this.$children.forEach(children => children.$destroy())
      this.$children.splice(0)
      this.buildHierarchy(
        this.$refs.chart,
        this._attachRel(JSON.parse(JSON.stringify(this.data)), '00'),
        0,
      )
    },

    _closest(el, fn) {
      return (
        el &&
        (fn(el) && el !== this.$refs.chart
          ? el
          : this._closest(el.parentNode, fn))
      )
    },
    _siblings(el, expr) {
      return Array.from(el.parentNode.children).filter(child => {
        if (child !== el) {
          if (expr) {
            return el.matches(expr)
          }
          return true
        }
        return false
      })
    },
    _prevAll(el, expr) {
      const sibs = []
      let prevSib = el.previousElementSibling

      while (prevSib) {
        if (!expr || prevSib.matches(expr)) {
          sibs.push(prevSib)
        }
        prevSib = prevSib.previousElementSibling
      }
      return sibs
    },
    _nextAll(el, expr) {
      const sibs = []
      let nextSib = el.nextElementSibling

      while (nextSib) {
        if (!expr || nextSib.matches(expr)) {
          sibs.push(nextSib)
        }
        nextSib = nextSib.nextElementSibling
      }
      return sibs
    },
    _isVisible(el) {
      return el.offsetParent !== null
    },
    _addClass(elements, classNames) {
      elements.forEach(el => {
        if (classNames.indexOf(' ') > 0) {
          classNames
            .split(' ')
            .forEach(className => el.classList.add(className))
        } else {
          el.classList.add(classNames)
        }
      })
    },
    _removeClass(elements, classNames) {
      elements.forEach(el => {
        if (classNames.indexOf(' ') > 0) {
          classNames
            .split(' ')
            .forEach(className => el.classList.remove(className))
        } else {
          el.classList.remove(classNames)
        }
      })
    },
    _css(elements, prop, val) {
      elements.forEach(el => {
        el.style[prop] = val
      })
    },
    _removeAttr(elements, attr) {
      elements.forEach(el => {
        el.removeAttribute(attr)
      })
    },
    _one(el, type, listener) {
      const one = event => {
        try {
          listener.call(this, event)
        } finally {
          el.removeEventListener(type, one)
        }
      }
      el.addEventListener(type, one)
    },
    _getDescElements(ancestors, selector) {
      const results = []
      ancestors.forEach(el => results.push(...el.querySelectorAll(selector)))
      return results
    },
    _attachRel(data, flags) {
      data.relationship =
        flags + (data.children && data.children.length > 0 ? 1 : 0)
      if (data.children) {
        data.children.forEach(child => {
          this._attachRel(child, `1${data.children.length > 1 ? 1 : 0}`)
        })
      }
      return data
    },
    _repaint(node) {
      if (node) {
        node.style.offsetWidth = node.offsetWidth
      }
    },
    // whether the cursor is hovering over the node
    _isInAction(node) {
      return (
        node
          .querySelector(':scope > .edge')
          .className.indexOf(`${this.commonClass}-`) > -1
      )
    },
    // detect the exist/display state of related node
    _getNodeState(node, relation) {
      const state = { exist: false, visible: false }
      let criteria
      if (relation === 'parent') {
        criteria = this._closest(
          node,
          el => el.classList && el.classList.contains('nodes'),
        )
        if (criteria) {
          state.exist = true
        }
        if (state.exist && this._isVisible(criteria.parentNode.children[0])) {
          state.visible = true
        }
      } else if (relation === 'children') {
        criteria = this._closest(node, el => el.nodeName === 'TR')
          .nextElementSibling
        if (criteria) {
          state.exist = true
        }
        if (state.exist && this._isVisible(criteria)) {
          state.visible = true
        }
      } else if (relation === 'siblings') {
        criteria = this._siblings(
          this._closest(node, el => el.nodeName === 'TABLE').parentNode,
        )
        if (criteria.length) {
          state.exist = true
        }
        if (state.exist && criteria.some(el => this._isVisible(el))) {
          state.visible = true
        }
      }

      return state
    },
    // find the related nodes
    getRelatedNodes(node, relation) {
      if (relation === 'parent') {
        return this._closest(node, el =>
          el.classList.contains('nodes'),
        ).parentNode.children[0].querySelector('.node')
      } else if (relation === 'children') {
        return Array.from(
          this._closest(node, el => el.nodeName === 'TABLE').lastChild.children,
        ).map(el => el.querySelector('.node'))
      } else if (relation === 'siblings') {
        return this._siblings(
          this._closest(node, el => el.nodeName === 'TABLE').parentNode,
        ).map(el => el.querySelector('.node'))
      }
      return []
    },
    _switchHorizontalArrow(node) {
      const leftEdge = node.querySelector('.leftEdge')
      const rightEdge = node.querySelector('.rightEdge')
      const temp = this._closest(node, el => el.nodeName === 'TABLE').parentNode

      if (this.toggleSiblingsResp) {
        const prevSib = temp.previousElementSibling
        const nextSib = temp.nextElementSibling

        if (prevSib) {
          if (prevSib.classList.contains('hidden')) {
            leftEdge.classList.add(this.leftArrowClass)
            leftEdge.classList.remove(this.rightArrowClass)
          } else {
            leftEdge.classList.add(this.rightArrowClass)
            leftEdge.classList.remove(this.leftArrowClass)
          }
        }
        if (nextSib) {
          if (nextSib.classList.contains('hidden')) {
            rightEdge.classList.add(this.rightArrowClass)
            rightEdge.classList.remove(this.leftArrowClass)
          } else {
            rightEdge.classList.add(this.leftArrowClass)
            rightEdge.classList.remove(this.rightArrowClass)
          }
        }
      } else {
        const sibs = this._siblings(temp)
        const sibsVisible = sibs.length
          ? !sibs.some(el => el.classList.contains('hidden'))
          : false

        leftEdge.classList.toggle(this.rightArrowClass, sibsVisible)
        leftEdge.classList.toggle(this.leftArrowClass, !sibsVisible)
        rightEdge.classList.toggle(this.leftArrowClass, sibsVisible)
        rightEdge.classList.toggle(this.rightArrowClass, !sibsVisible)
      }
    },
    _hoverNode(event) {
      let flag = false
      const node = event.target
      const topEdge = node.querySelector(':scope > .topEdge')
      const bottomEdge = node.querySelector(':scope > .bottomEdge')
      const leftEdge = node.querySelector(':scope > .leftEdge')

      if (event.type === 'mouseenter') {
        if (topEdge) {
          flag = this._getNodeState(node, 'parent').visible
          topEdge.classList.toggle(this.upArrowClass, !flag)
          topEdge.classList.toggle(this.downArrowClass, flag)
        }
        if (bottomEdge) {
          flag = this._getNodeState(node, 'children').visible
          bottomEdge.classList.toggle(this.downArrowClass, !flag)
          bottomEdge.classList.toggle(this.upArrowClass, flag)
        }
        if (leftEdge) {
          this._switchHorizontalArrow(node)
        }
      } else {
        Array.from(node.querySelectorAll(':scope > .edge')).forEach(el => {
          el.classList.remove(
            this.upArrowClass,
            this.downArrowClass,
            this.rightArrowClass,
            this.leftArrowClass,
          )
        })
      }
    },
    // define node click event handler
    _clickNode(event) {
      const clickedNode = event.currentTarget
      const focusedNode = this.$refs.chart.querySelector('.focused')

      if (focusedNode) {
        focusedNode.classList.remove('focused')
      }
      clickedNode.classList.add('focused')
    },
    // build the parent node of specific node
    _buildParentNode(currentRoot, nodeData, callback) {
      const table = document.createElement('table')

      nodeData.relationship = nodeData.relationship || '001'
      const nodeDiv = this._createNode(nodeData, 0)
      const chart = this.$refs.chart

      nodeDiv.classList.remove('slide-up')
      nodeDiv.classList.add('slide-down')
      const parentTr = document.createElement('tr')
      const superiorLine = document.createElement('tr')
      const inferiorLine = document.createElement('tr')
      const childrenTr = document.createElement('tr')

      parentTr.setAttribute('class', 'hidden')
      parentTr.innerHTML = `<td colspan="2"></td>`
      table.appendChild(parentTr)
      superiorLine.setAttribute('class', 'lines hidden')
      superiorLine.innerHTML = `<td colspan="2"><div class="downLine"></div></td>`
      table.appendChild(superiorLine)
      inferiorLine.setAttribute('class', 'lines hidden')
      inferiorLine.innerHTML = `<td class="rightLine">&nbsp;</td><td class="leftLine">&nbsp;</td>`
      table.appendChild(inferiorLine)
      childrenTr.setAttribute('class', 'nodes')
      childrenTr.innerHTML = `<td colspan="2"></td>`
      table.appendChild(childrenTr)
      table.querySelector('td').appendChild(nodeDiv)
      chart.insertBefore(table, chart.children[0])
      table.children[3].children[0].appendChild(chart.lastChild)
      callback()
    },
    _switchVerticalArrow(arrow) {
      arrow.classList.toggle(this.upArrowClass)
      arrow.classList.toggle(this.downArrowClass)
    },
    // show the parent node of the specified node
    showParent(node) {
      // just show only one superior level
      const temp = this._prevAll(
        this._closest(node, el => el.classList.contains('nodes')),
      )

      this._removeClass(temp, 'hidden')
      // just show only one line
      this._addClass(Array(temp[0].children).slice(1, -1), 'hidden')
      // show parent node with animation
      const parent = temp[2].querySelector('.node')

      this._one(parent, 'transitionend', () => {
        parent.classList.remove('slide')
        if (this._isInAction(node)) {
          this._switchVerticalArrow(node.querySelector(':scope > .topEdge'))
        }
      })
      this._repaint(parent)
      parent.classList.add('slide')
      parent.classList.remove('slide-down')
    },
    // show the sibling nodes of the specified node
    showSiblings(node, direction) {
      // firstly, show the sibling td tags
      let siblings = []
      let temp = this._closest(node, el => el.nodeName === 'TABLE').parentNode

      if (direction) {
        siblings =
          direction === 'left' ? this._prevAll(temp) : this._nextAll(temp)
      } else {
        siblings = this._siblings(temp)
      }
      this._removeClass(siblings, 'hidden')
      // secondly, show the lines
      const upperLevel = this._prevAll(
        this._closest(node, el => el.classList.contains('nodes')),
      )

      temp = Array.from(upperLevel[0].querySelectorAll(':scope > .hidden'))
      if (direction) {
        this._removeClass(temp.slice(0, siblings.length * 2), 'hidden')
      } else {
        this._removeClass(temp, 'hidden')
      }
      // thirdly, do some cleaning stuff
      if (!this._getNodeState(node, 'parent').visible) {
        this._removeClass(upperLevel, 'hidden')
        const parent = upperLevel[2].querySelector('.node')

        this._one(parent, 'transitionend', event => {
          event.target.classList.remove('slide')
        })
        this._repaint(parent)
        parent.classList.add('slide')
        parent.classList.remove('slide-down')
      }
      // lastly, show the sibling nodes with animation
      siblings.forEach(sib => {
        Array.from(sib.querySelectorAll('.node')).forEach(_node => {
          if (this._isVisible(_node)) {
            _node.classList.add('slide')
            _node.classList.remove('slide-left', 'slide-right')
          }
        })
      })
      this._one(siblings[0].querySelector('.slide'), 'transitionend', () => {
        siblings.forEach(sib => {
          this._removeClass(Array.from(sib.querySelectorAll('.slide')), 'slide')
        })
        if (this._isInAction(node)) {
          this._switchHorizontalArrow(node)
          node.querySelector('.topEdge').classList.remove(this.upArrowClass)
          node.querySelector('.topEdge').classList.add(this.downArrowClass)
        }
      })
    },
    // hide the sibling nodes of the specified node
    hideSiblings(node, direction) {
      const nodeContainer = this._closest(node, el => el.nodeName === 'TABLE')
        .parentNode
      if (!direction || (direction && direction === 'left')) {
        const preSibs = this._prevAll(nodeContainer)

        preSibs.forEach(sib => {
          Array.from(sib.querySelectorAll('.node')).forEach(_node => {
            if (this._isVisible(_node)) {
              _node.classList.add('slide', 'slide-right')
            }
          })
        })
      }
      if (!direction || (direction && direction !== 'left')) {
        const nextSibs = this._nextAll(nodeContainer)

        nextSibs.forEach(sib => {
          Array.from(sib.querySelectorAll('.node')).forEach(_node => {
            if (this._isVisible(_node)) {
              _node.classList.add('slide', 'slide-left')
            }
          })
        })
      }

      const animatedNodes = []

      this._siblings(nodeContainer).forEach(sib => {
        Array.prototype.push.apply(
          animatedNodes,
          Array.from(sib.querySelectorAll('.slide')),
        )
      })
      let lines = []

      animatedNodes.forEach(_node => {
        const temp = this._closest(_node, el => el.classList.contains('nodes'))
          .previousElementSibling

        lines.push(temp)
        lines.push(temp.previousElementSibling)
      })
      lines = [...new Set(lines)]
      lines.forEach(line => {
        line.style.visibility = 'hidden'
      })

      this._one(animatedNodes[0], 'transitionend', event => {
        lines.forEach(line => {
          line.removeAttribute('style')
        })
        let sibs = []

        if (direction) {
          if (direction === 'left') {
            sibs = this._prevAll(nodeContainer, ':not(.hidden)')
          } else {
            sibs = this._nextAll(nodeContainer, ':not(.hidden)')
          }
        } else {
          sibs = this._siblings(nodeContainer)
        }
        const temp = Array.from(
          this._closest(nodeContainer, el =>
            el.classList.contains('nodes'),
          ).previousElementSibling.querySelectorAll(':scope > :not(.hidden)'),
        )

        const someLines = temp.slice(1, direction ? sibs.length * 2 + 1 : -1)

        this._addClass(someLines, 'hidden')
        this._removeClass(animatedNodes, 'slide')
        sibs.forEach(sib => {
          Array.from(sib.querySelectorAll('.node'))
            .slice(1)
            .forEach(_node => {
              if (this._isVisible(_node)) {
                _node.classList.remove('slide-left', 'slide-right')
                _node.classList.add('slide-up')
              }
            })
        })
        sibs.forEach(sib => {
          this._addClass(Array.from(sib.querySelectorAll('.lines')), 'hidden')
          this._addClass(Array.from(sib.querySelectorAll('.nodes')), 'hidden')
          this._addClass(
            Array.from(sib.querySelectorAll('.verticalNodes')),
            'hidden',
          )
        })
        this._addClass(sibs, 'hidden')

        if (this._isInAction(node)) {
          this._switchHorizontalArrow(node)
        }
      })
    },
    // recursively hide the ancestor node and sibling nodes of the specified node
    hideParent(node) {
      const temp = Array.from(
        this._closest(node, el => el.classList.contains('nodes')).parentNode
          .children,
      ).slice(0, 3)

      // hide the sibling nodes
      if (this._getNodeState(node, 'siblings').visible) {
        this.hideSiblings(node)
      }
      // hide the lines
      const lines = temp.slice(1)

      this._css(lines, 'visibility', 'hidden')
      // hide the superior nodes with transition
      const parent = temp[0].querySelector('.node')
      const grandfatherVisible = this._getNodeState(parent, 'parent').visible

      if (parent && this._isVisible(parent)) {
        parent.classList.add('slide', 'slide-down')
        this._one(parent, 'transitionend', () => {
          parent.classList.remove('slide')
          this._removeAttr(lines, 'style')
          this._addClass(temp, 'hidden')
        })
      }
      // if the current node has the parent node, hide it recursively
      if (parent && grandfatherVisible) {
        this.hideParent(parent)
      }
    },
    // exposed method
    addParent(currentRoot, data) {
      this._buildParentNode(currentRoot, data, () => {
        if (!currentRoot.querySelector(':scope > .topEdge')) {
          const topEdge = document.createElement('i')

          topEdge.setAttribute(
            'class',
            `edge verticalEdge topEdge ${this.commonClass}`,
          )
          currentRoot.appendChild(topEdge)
        }
        this.showParent(currentRoot)
      })
    },
    // define click event handler for the top edge
    _clickTopEdge(event) {
      event.stopPropagation()
      const topEdge = event.target
      const node = topEdge.parentNode
      const parentState = this._getNodeState(node, 'parent')

      if (parentState.exist) {
        const temp = this._closest(node, el => el.classList.contains('nodes'))
        const parent = temp.parentNode.firstChild.querySelector('.node')

        if (parent.classList.contains('slide')) {
          return
        }
        // hide the ancestor nodes and sibling nodes of the specified node
        if (parentState.visible) {
          this.hideParent(node)
          this._one(parent, 'transitionend', () => {
            if (this._isInAction(node)) {
              this._switchVerticalArrow(topEdge)
              this._switchHorizontalArrow(node)
            }
          })
        } else {
          // show the ancestors and siblings
          this.showParent(node)
        }
      }
    },
    // recursively hide the descendant nodes of the specified node
    hideChildren(node) {
      const temp = this._nextAll(node.parentNode.parentNode)
      const lastItem = temp[temp.length - 1]
      const descendants = Array.from(lastItem.querySelectorAll('.node')).filter(
        el => this._isVisible(el),
      )
      const isVerticalDesc = lastItem.classList.contains('verticalNodes')
      let lines = []

      if (!isVerticalDesc) {
        descendants.forEach(desc => {
          Array.prototype.push.apply(
            lines,
            this._prevAll(
              this._closest(desc, el => el.classList.contains('nodes')),
              '.lines',
            ),
          )
        })
        lines = [...new Set(lines)]
        this._css(lines, 'visibility', 'hidden')
      }
      this._one(descendants[0], 'transitionend', event => {
        this._removeClass(descendants, 'slide')
        if (isVerticalDesc) {
          this._addClass(temp, 'hidden')
        } else {
          lines.forEach(el => {
            el.removeAttribute('style')
            el.classList.add('hidden')
            el.parentNode.lastChild.classList.add('hidden')
          })
          this._addClass(
            Array.from(lastItem.querySelectorAll('.verticalNodes')),
            'hidden',
          )
        }
        if (this._isInAction(node)) {
          this._switchVerticalArrow(node.querySelector('.bottomEdge'))
        }
      })
      this._addClass(descendants, 'slide slide-up')
    },
    // show the children nodes of the specified node
    showChildren(node) {
      const temp = this._nextAll(node.parentNode.parentNode)
      const descendants = []

      this._removeClass(temp, 'hidden')
      if (temp.some(el => el.classList.contains('verticalNodes'))) {
        temp.forEach(el => {
          Array.prototype.push.apply(
            descendants,
            Array.from(el.querySelectorAll('.node')).filter(_el =>
              this._isVisible(_el),
            ),
          )
        })
      } else {
        Array.from(temp[2].children).forEach(el => {
          Array.prototype.push.apply(
            descendants,
            Array.from(el.querySelector('tr').querySelectorAll('.node')).filter(
              _el => this._isVisible(_el),
            ),
          )
        })
      }
      // the two following statements are used to enforce browser to repaint
      this._repaint(descendants[0])
      this._one(descendants[0], 'transitionend', event => {
        this._removeClass(descendants, 'slide')
        if (this._isInAction(node)) {
          this._switchVerticalArrow(node.querySelector('.bottomEdge'))
        }
      })
      this._addClass(descendants, 'slide')
      this._removeClass(descendants, 'slide-up')
    },
    // build the child nodes of specific node
    _buildChildNode(appendTo, nodeData, callback) {
      const data = nodeData.children || nodeData.siblings

      appendTo.querySelector('td').setAttribute('colSpan', data.length * 2)
      this.buildHierarchy(
        appendTo,
        {
          children: data,
        },
        0,
        callback,
      )
    },
    // exposed method
    addChildren(node, data) {
      let count = 0

      this.$refs.chart.dataset.inEdit = 'addChildren'
      this._buildChildNode(
        this._closest(node, el => el.nodeName === 'TABLE'),
        data,
        () => {
          count += 1
          if (count === data.children.length) {
            if (!node.querySelector('.bottomEdge')) {
              const bottomEdge = document.createElement('i')

              bottomEdge.setAttribute(
                'class',
                `edge verticalEdge bottomEdge ${this.commonClass}`,
              )
              node.appendChild(bottomEdge)
            }
            if (!node.querySelector('.symbol')) {
              const symbol = document.createElement('i')

              symbol.setAttribute('class', `${this.parentNodeSymbol} symbol`)
              node.querySelector(':scope > .title').appendChild(symbol)
            }
            this.showChildren(node)
            this.$refs.chart.dataset.inEdit = ''
          }
        },
      )
    },
    // bind click event handler for the bottom edge
    _clickBottomEdge(event) {
      event.stopPropagation()
      const bottomEdge = event.target
      const node = bottomEdge.parentNode
      const childrenState = this._getNodeState(node, 'children')

      if (childrenState.exist) {
        const temp = this._closest(node, el => el.nodeName === 'TR').parentNode
          .lastChild

        if (
          Array.from(temp.querySelectorAll('.node')).some(
            _node =>
              this._isVisible(_node) && _node.classList.contains('slide'),
          )
        ) {
          return
        }
        // hide the descendant nodes of the specified node
        if (childrenState.visible) {
          this.hideChildren(node)
        } else {
          // show the descendants
          this.showChildren(node)
        }
      }
    },
    // subsequent processing of build sibling nodes
    _complementLine(oneSibling, siblingCount, existingSibligCount) {
      const temp = oneSibling.parentNode.parentNode.children

      temp[0].children[0].setAttribute('colspan', siblingCount * 2)
      temp[1].children[0].setAttribute('colspan', siblingCount * 2)
      for (let i = 0; i < existingSibligCount; i += 1) {
        const rightLine = document.createElement('td')
        const leftLine = document.createElement('td')

        rightLine.setAttribute('class', 'rightLine topLine')
        rightLine.innerHTML = '&nbsp;'
        temp[2].insertBefore(rightLine, temp[2].children[1])
        leftLine.setAttribute('class', 'leftLine topLine')
        leftLine.innerHTML = '&nbsp;'
        temp[2].insertBefore(leftLine, temp[2].children[1])
      }
    },
    // build the sibling nodes of specific node
    _buildSiblingNode(nodeChart, nodeData, callback) {
      const newSiblingCount = nodeData.siblings
        ? nodeData.siblings.length
        : nodeData.children.length
      const existingSibligCount =
        nodeChart.parentNode.nodeName === 'TD'
          ? this._closest(nodeChart, el => el.nodeName === 'TR').children.length
          : 1
      const siblingCount = existingSibligCount + newSiblingCount
      const insertPostion =
        siblingCount > 1 ? Math.floor(siblingCount / 2 - 1) : 0

      // just build the sibling nodes for the specific node
      if (nodeChart.parentNode.nodeName === 'TD') {
        const temp = this._prevAll(nodeChart.parentNode.parentNode)

        temp[0].remove()
        temp[1].remove()
        let childCount = 0

        this._buildChildNode(
          this._closest(nodeChart.parentNode, el => el.nodeName === 'TABLE'),
          nodeData,
          () => {
            childCount += 1
            if (childCount === newSiblingCount) {
              const siblingTds = Array.from(
                this._closest(
                  nodeChart.parentNode,
                  el => el.nodeName === 'TABLE',
                ).lastChild.children,
              )

              if (existingSibligCount > 1) {
                const tmp = nodeChart.parentNode.parentNode

                Array.from(tmp.children).forEach(el => {
                  siblingTds[0].parentNode.insertBefore(el, siblingTds[0])
                })
                tmp.remove()
                this._complementLine(
                  siblingTds[0],
                  siblingCount,
                  existingSibligCount,
                )
                this._addClass(siblingTds, 'hidden')
                siblingTds.forEach(el => {
                  this._addClass(el.querySelectorAll('.node'), 'slide-left')
                })
              } else {
                const tmp = nodeChart.parentNode.parentNode

                siblingTds[insertPostion].parentNode.insertBefore(
                  nodeChart.parentNode,
                  siblingTds[insertPostion + 1],
                )
                tmp.remove()
                this._complementLine(siblingTds[insertPostion], siblingCount, 1)
                this._addClass(siblingTds, 'hidden')
                this._addClass(
                  this._getDescElements(
                    siblingTds.slice(0, insertPostion + 1),
                    '.node',
                  ),
                  'slide-right',
                )
                this._addClass(
                  this._getDescElements(
                    siblingTds.slice(insertPostion + 1),
                    '.node',
                  ),
                  'slide-left',
                )
              }
              callback()
            }
          },
        )
      } else {
        // build the sibling nodes and parent node for the specific ndoe
        let nodeCount = 0

        this.buildHierarchy(this.$refs.chart, nodeData, 0, () => {
          nodeCount += 1
          if (nodeCount === siblingCount) {
            const parent = nodeChart.nextElementSibling
            const temp = parent.children[3].children[insertPostion]
            const td = document.createElement('td')

            td.setAttribute('colspan', 2)
            td.appendChild(nodeChart)
            temp.parentNode.insertBefore(td, temp.nextElementSibling)
            this._complementLine(temp, siblingCount, 1)

            const temp2 = this._closest(
              nodeChart,
              el => el.classList && el.classList.contains('nodes'),
            ).parentNode.children[0]

            temp2.classList.add('hidden')
            this._addClass(
              Array.from(temp2.querySelectorAll('.node')),
              'slide-down',
            )

            const temp3 = this._siblings(nodeChart.parentNode)

            this._addClass(temp3, 'hidden')
            this._addClass(
              this._getDescElements(temp3.slice(0, insertPostion), '.node'),
              'slide-right',
            )
            this._addClass(
              this._getDescElements(temp3.slice(insertPostion), '.node'),
              'slide-left',
            )
            callback()
          }
        })
      }
    },
    addSiblings(node, data) {
      this.$refs.chart.dataset.inEdit = 'addSiblings'
      this._buildSiblingNode(
        this._closest(node, el => el.nodeName === 'TABLE'),
        data,
        () => {
          this._closest(
            node,
            el => el.classList && el.classList.contains('nodes'),
          ).dataset.siblingsLoaded = true
          if (!node.querySelector('.leftEdge')) {
            const rightEdge = document.createElement('i')
            const leftEdge = document.createElement('i')

            rightEdge.setAttribute(
              'class',
              `edge horizontalEdge rightEdge ${this.commonClass}`,
            )
            node.appendChild(rightEdge)
            leftEdge.setAttribute(
              'class',
              `edge horizontalEdge leftEdge ${this.commonClass}`,
            )
            node.appendChild(leftEdge)
          }
          this.showSiblings(node)
          this.$refs.chart.dataset.inEdit = ''
        },
      )
    },
    removeNodes(node) {
      const parent = this._closest(node, el => el.nodeName === 'TABLE')
        .parentNode
      const sibs = this._siblings(parent.parentNode)

      if (parent.nodeName === 'TD') {
        if (this._getNodeState(node, 'siblings').exist) {
          sibs[2].querySelector('.topLine').nextElementSibling.remove()
          sibs[2].querySelector('.topLine').remove()
          sibs[0].children[0].setAttribute('colspan', sibs[2].children.length)
          sibs[1].children[0].setAttribute('colspan', sibs[2].children.length)
          parent.remove()
        } else {
          sibs[0].children[0].removeAttribute('colspan')
          sibs[0].querySelector('.bottomEdge').remove()
          this._siblings(sibs[0]).forEach(el => el.remove())
        }
      } else {
        Array.from(parent.parentNode.children).forEach(el => el.remove())
      }
    },
    // bind click event handler for the left and right edges
    _clickHorizontalEdge(event) {
      event.stopPropagation()
      const hEdge = event.target
      const node = hEdge.parentNode
      const siblingsState = this._getNodeState(node, 'siblings')

      if (siblingsState.exist) {
        const temp = this._closest(node, el => el.nodeName === 'TABLE')
          .parentNode
        const siblings = this._siblings(temp)

        if (
          siblings.some(el => {
            const _node = el.querySelector('.node')

            return this._isVisible(_node) && _node.classList.contains('slide')
          })
        ) {
          return
        }
        if (this.toggleSiblingsResp) {
          const prevSib = this._closest(node, el => el.nodeName === 'TABLE')
            .parentNode.previousElementSibling
          const nextSib = this._closest(node, el => el.nodeName === 'TABLE')
            .parentNode.nextElementSibling

          if (hEdge.classList.contains('leftEdge')) {
            if (prevSib.classList.contains('hidden')) {
              this.showSiblings(node, 'left')
            } else {
              this.hideSiblings(node, 'left')
            }
          } else if (nextSib.classList.contains('hidden')) {
            this.showSiblings(node, 'right')
          } else {
            this.hideSiblings(node, 'right')
          }
        } else if (siblingsState.visible) {
          this.hideSiblings(node)
        } else {
          this.showSiblings(node)
        }
      }
    },
    // event handler for toggle buttons in Hybrid(horizontal + vertical) OrgChart
    _clickToggleButton(event) {
      const toggleBtn = event.target
      const descWrapper = toggleBtn.parentNode.nextElementSibling
      const descendants = Array.from(descWrapper.querySelectorAll('.node'))
      const children = Array.from(descWrapper.children).map(item =>
        item.querySelector('.node'),
      )

      if (children.some(item => item.classList.contains('slide'))) {
        return
      }
      toggleBtn.classList.toggle(this.toggleBtnOnClass)
      toggleBtn.classList.toggle(this.toggleBtnOffClass)
      if (descendants[0].classList.contains('slide-up')) {
        descWrapper.classList.remove('hidden')
        this._repaint(children[0])
        this._addClass(children, 'slide')
        this._removeClass(children, 'slide-up')
        this._one(children[0], 'transitionend', () => {
          this._removeClass(children, 'slide')
        })
      } else {
        this._addClass(descendants, 'slide slide-up')
        this._one(descendants[0], 'transitionend', () => {
          this._removeClass(descendants, 'slide')
          descendants.forEach(desc => {
            const ul = this._closest(desc, el => el.nodeName === 'UL')

            ul.classList.add('hidden')
          })
        })

        descendants.forEach(desc => {
          const subTBs = Array.from(desc.querySelectorAll('.toggleBtn'))

          this._removeClass(subTBs, this.toggleBtnOffClass)
          this._addClass(subTBs, this.toggleBtnOnClass)
        })
      }
    },
    _dispatchClickEvent(event) {
      const classList = event.target.classList

      if (classList.contains('topEdge')) {
        this._clickTopEdge(event)
      } else if (
        classList.contains('rightEdge') ||
        classList.contains('leftEdge')
      ) {
        this._clickHorizontalEdge(event)
      } else if (classList.contains('bottomEdge')) {
        this._clickBottomEdge(event)
      } else if (classList.contains('toggleBtn')) {
        this._clickToggleButton(event)
      } else {
        this._clickNode(event)
      }
    },
    _onDragStart(event) {
      const nodeDiv = event.target
      const isFirefox = /firefox/.test(window.navigator.userAgent.toLowerCase())

      if (isFirefox) {
        event.dataTransfer.setData('text/html', 'hack for firefox')
      }
      // if users enable zoom or direction options
      if (this.$refs.chart.style.transform) {
        let ghostNode, nodeCover

        if (!document.querySelector('.ghost-node')) {
          ghostNode = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
          )
          ghostNode.classList.add('ghost-node')
          nodeCover = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'rect',
          )
          ghostNode.appendChild(nodeCover)
          this.$refs.chart.appendChild(ghostNode)
        } else {
          ghostNode = this.$refs.chart.querySelector(':scope > .ghost-node')
          nodeCover = ghostNode.children[0]
        }
        const transValues = this.$refs.chart.style.transform.split(',')
        const scale = Math.abs(
          window.parseFloat(
            this.direction === 't2b' || this.direction === 'b2t'
              ? transValues[0].slice(transValues[0].indexOf('(') + 1)
              : transValues[1],
          ),
        )

        ghostNode.setAttribute('width', nodeDiv.offsetWidth)
        ghostNode.setAttribute('height', nodeDiv.offsetHeight)
        nodeCover.setAttribute('x', 5 * scale)
        nodeCover.setAttribute('y', 5 * scale)
        nodeCover.setAttribute('width', 120 * scale)
        nodeCover.setAttribute('height', 40 * scale)
        nodeCover.setAttribute('rx', 4 * scale)
        nodeCover.setAttribute('ry', 4 * scale)
        nodeCover.setAttribute('stroke-width', 1 * scale)
        let xOffset = event.offsetX * scale
        let yOffset = event.offsetY * scale

        if (this.direction === 'l2r') {
          xOffset = event.offsetY * scale
          yOffset = event.offsetX * scale
        } else if (this.direction === 'r2l') {
          xOffset = nodeDiv.offsetWidth - event.offsetY * scale
          yOffset = event.offsetX * scale
        } else if (this.direction === 'b2t') {
          xOffset = nodeDiv.offsetWidth - event.offsetX * scale
          yOffset = nodeDiv.offsetHeight - event.offsetY * scale
        }
        if (isFirefox) {
          // hack for old version of Firefox(< 48.0)
          const ghostNodeWrapper = document.createElement('img')

          ghostNodeWrapper.src = `data:image/svg+xml;utf8,${new XMLSerializer().serializeToString(
            ghostNode,
          )}`
          event.dataTransfer.setDragImage(ghostNodeWrapper, xOffset, yOffset)
          nodeCover.setAttribute('fill', 'rgb(255, 255, 255)')
          nodeCover.setAttribute('stroke', 'rgb(191, 0, 0)')
        } else {
          event.dataTransfer.setDragImage(ghostNode, xOffset, yOffset)
        }
      }
      const dragged = event.target
      const dragZone = this._closest(
        dragged,
        el => el.classList && el.classList.contains('nodes'),
      ).parentNode.children[0].querySelector('.node')
      const dragHier = Array.from(
        this._closest(dragged, el => el.nodeName === 'TABLE').querySelectorAll(
          '.node',
        ),
      )

      this.dragged = dragged
      Array.from(this.$refs.chart.querySelectorAll('.node')).forEach(node => {
        if (!dragHier.includes(node)) {
          if (this.dropCriteria) {
            if (this.dropCriteria(dragged, dragZone, node)) {
              node.classList.add('allowedDrop')
            }
          } else {
            node.classList.add('allowedDrop')
          }
        }
      })
    },
    _onDragOver(event) {
      event.preventDefault()
      const dropZone = event.currentTarget

      if (!dropZone.classList.contains('allowedDrop')) {
        event.dataTransfer.dropEffect = 'none'
      }
    },
    _onDragEnd(event) {
      Array.from(this.$refs.chart.querySelectorAll('.allowedDrop')).forEach(
        el => {
          el.classList.remove('allowedDrop')
        },
      )
    },
    _onDrop(event) {
      const dropZone = event.currentTarget
      const chart = this.$refs.chart
      const dragged = this.dragged
      const dragZone = this._closest(
        dragged,
        el => el.classList && el.classList.contains('nodes'),
      ).parentNode.children[0].children[0]

      this._removeClass(
        Array.from(chart.querySelectorAll('.allowedDrop')),
        'allowedDrop',
      )
      // firstly, deal with the hierarchy of drop zone
      if (!dropZone.parentNode.parentNode.nextElementSibling) {
        // if the drop zone is a leaf node
        const bottomEdge = document.createElement('i')

        bottomEdge.setAttribute(
          'class',
          `edge verticalEdge bottomEdge ${this.commonClass}`,
        )
        dropZone.appendChild(bottomEdge)
        dropZone.parentNode.setAttribute('colspan', 2)
        const table = this._closest(dropZone, el => el.nodeName === 'TABLE')
        const upperTr = document.createElement('tr')
        const lowerTr = document.createElement('tr')
        const nodeTr = document.createElement('tr')

        upperTr.setAttribute('class', 'lines')
        upperTr.innerHTML = `<td colspan="2"><div class="downLine"></div></td>`
        table.appendChild(upperTr)
        lowerTr.setAttribute('class', 'lines')
        lowerTr.innerHTML = `<td class="rightLine">&nbsp;</td><td class="leftLine">&nbsp;</td>`
        table.appendChild(lowerTr)
        nodeTr.setAttribute('class', 'nodes')
        table.appendChild(nodeTr)
        Array.from(dragged.querySelectorAll('.horizontalEdge')).forEach(
          hEdge => {
            dragged.removeChild(hEdge)
          },
        )
        const draggedTd = this._closest(dragged, el => el.nodeName === 'TABLE')
          .parentNode

        nodeTr.appendChild(draggedTd)
      } else {
        const dropColspan = window.parseInt(dropZone.parentNode.colSpan) + 2

        dropZone.parentNode.setAttribute('colspan', dropColspan)
        dropZone.parentNode.parentNode.nextElementSibling.children[0].setAttribute(
          'colspan',
          dropColspan,
        )
        if (!dragged.querySelector('.horizontalEdge')) {
          const rightEdge = document.createElement('i')
          const leftEdge = document.createElement('i')

          rightEdge.setAttribute(
            'class',
            `edge horizontalEdge rightEdge ${this.commonClass}`,
          )
          dragged.appendChild(rightEdge)
          leftEdge.setAttribute(
            'class',
            `edge horizontalEdge leftEdge ${this.commonClass}`,
          )
          dragged.appendChild(leftEdge)
        }
        const temp =
          dropZone.parentNode.parentNode.nextElementSibling.nextElementSibling
        const leftline = document.createElement('td')
        const rightline = document.createElement('td')

        leftline.setAttribute('class', 'leftLine topLine')
        leftline.innerHTML = `&nbsp;`
        temp.insertBefore(leftline, temp.children[1])
        rightline.setAttribute('class', 'rightLine topLine')
        rightline.innerHTML = `&nbsp;`
        temp.insertBefore(rightline, temp.children[2])
        temp.nextElementSibling.appendChild(
          this._closest(dragged, el => el.nodeName === 'TABLE').parentNode,
        )

        const dropSibs = this._siblings(
          this._closest(dragged, el => el.nodeName === 'TABLE').parentNode,
        ).map(el => el.querySelector('.node'))

        if (dropSibs.length === 1) {
          const rightEdge = document.createElement('i')
          const leftEdge = document.createElement('i')

          rightEdge.setAttribute(
            'class',
            `edge horizontalEdge rightEdge ${this.commonClass}`,
          )
          dropSibs[0].appendChild(rightEdge)
          leftEdge.setAttribute(
            'class',
            `edge horizontalEdge leftEdge ${this.commonClass}`,
          )
          dropSibs[0].appendChild(leftEdge)
        }
      }
      // secondly, deal with the hierarchy of dragged node
      const dragColSpan = window.parseInt(dragZone.colSpan)

      if (dragColSpan > 2) {
        dragZone.setAttribute('colspan', dragColSpan - 2)
        dragZone.parentNode.nextElementSibling.children[0].setAttribute(
          'colspan',
          dragColSpan - 2,
        )
        const temp = dragZone.parentNode.nextElementSibling.nextElementSibling

        temp.children[1].remove()
        temp.children[1].remove()

        const dragSibs = Array.from(
          dragZone.parentNode.parentNode.children[3].children,
        ).map(td => td.querySelector('.node'))

        if (dragSibs.length === 1) {
          dragSibs[0].querySelector('.leftEdge').remove()
          dragSibs[0].querySelector('.rightEdge').remove()
        }
      } else {
        dragZone.removeAttribute('colspan')
        dragZone
          .querySelector('.node')
          .removeChild(dragZone.querySelector('.bottomEdge'))
        Array.from(dragZone.parentNode.parentNode.children)
          .slice(1)
          .forEach(tr => tr.remove())
      }
      this.$emit('drag', {
        targetId: this._getNodeId(dragged),
        sourceId: this._getNodeId(dragZone.children[0]),
        destinationId: this._getNodeId(dropZone),
      })
    },
    _getNodeId(node) {
      return JSON.parse(node.dataset.source)[this.nodeId]
    },
    _createNode(nodeData, level) {
      if (nodeData.children) {
        nodeData.children.forEach(child => {
          child.parentId = nodeData.id
        })
      }

      // 创建子节点
      const vmNode = new Vue({
        name: 'OrgChartNode',
        parent: this,
        data: () => ({
          nodeData,
        }),
        render: h => {
          const { tag, data, children } = this.$scopedSlots.default({
            nodeData,
          })
          return h(tag, data, children)
        },
      }).$mount()
      const nodeDiv = vmNode.$el

      delete nodeData.children
      nodeDiv.dataset.source = JSON.stringify(nodeData)
      if (nodeData[this.nodeId]) {
        nodeDiv.id = nodeData[this.nodeId]
      }
      const inEdit = this.$refs.chart.dataset.inEdit
      let isHidden

      if (inEdit) {
        isHidden = inEdit === 'addChildren' ? ' slide-up' : ''
      } else {
        isHidden = level >= this.depth ? ' slide-up' : ''
      }
      nodeDiv.setAttribute(
        'class',
        `node ${nodeData.className || ''}${isHidden}`,
      )
      if (this.draggable) {
        nodeDiv.setAttribute('draggable', true)
      }
      if (nodeData.parentId) {
        nodeDiv.setAttribute('data-parent', nodeData.parentId)
      }

      // append 4 direction arrows or expand/collapse buttons
      const flags = nodeData.relationship || ''

      if (this.verticalDepth && level + 2 > this.verticalDepth) {
        if (level + 1 >= this.verticalDepth && Number(flags.substr(2, 1))) {
          const toggleBtn = document.createElement('i')
          const icon =
            level + 1 >= this.depth
              ? this.toggleBtnOnClass
              : this.toggleBtnOffClass

          toggleBtn.setAttribute(
            'class',
            `toggleBtn ${this.commonClass} ${icon}`,
          )
          nodeDiv.appendChild(toggleBtn)
        }
      } else {
        if (Number(flags.substr(0, 1))) {
          const topEdge = document.createElement('i')

          topEdge.setAttribute(
            'class',
            `edge verticalEdge topEdge ${this.commonClass}`,
          )
          nodeDiv.appendChild(topEdge)
        }
        if (Number(flags.substr(1, 1))) {
          const rightEdge = document.createElement('i')
          const leftEdge = document.createElement('i')

          rightEdge.setAttribute(
            'class',
            `edge horizontalEdge rightEdge ${this.commonClass}`,
          )
          nodeDiv.appendChild(rightEdge)
          leftEdge.setAttribute(
            'class',
            `edge horizontalEdge leftEdge ${this.commonClass}`,
          )
          nodeDiv.appendChild(leftEdge)
        }
        if (Number(flags.substr(2, 1))) {
          const bottomEdge = document.createElement('i')
          const symbol = document.createElement('i')
          const title = nodeDiv.querySelector(':scope > .title')

          bottomEdge.setAttribute(
            'class',
            `edge verticalEdge bottomEdge ${this.commonClass}`,
          )
          nodeDiv.appendChild(bottomEdge)
          symbol.setAttribute('class', `${this.parentNodeSymbolClass} symbol`)
          title.insertBefore(symbol, title.children[0])
        }
      }

      nodeDiv.addEventListener('mouseenter', this._hoverNode.bind(this))
      nodeDiv.addEventListener('mouseleave', this._hoverNode.bind(this))
      nodeDiv.addEventListener('click', this._dispatchClickEvent.bind(this))
      if (this.draggable) {
        nodeDiv.addEventListener('dragstart', this._onDragStart.bind(this))
        nodeDiv.addEventListener('dragover', this._onDragOver.bind(this))
        nodeDiv.addEventListener('dragend', this._onDragEnd.bind(this))
        nodeDiv.addEventListener('drop', this._onDrop.bind(this))
      }
      return nodeDiv
    },
    buildHierarchy(appendTo, nodeData, level, callback) {
      // Construct the node
      let nodeWrapper
      const childNodes = nodeData.children
      const isVerticalNode =
        this.verticalDepth && level + 1 >= this.verticalDepth

      if (Object.keys(nodeData).length > 1) {
        // if nodeData has nested structure
        nodeWrapper = isVerticalNode
          ? appendTo
          : document.createElement('table')
        if (!isVerticalNode) {
          appendTo.appendChild(nodeWrapper)
        }
        const nodeDiv = this._createNode(nodeData, level)
        if (isVerticalNode) {
          nodeWrapper.insertBefore(nodeDiv, nodeWrapper.firstChild)
        } else {
          const tr = document.createElement('tr')

          tr.innerHTML = `
            <td ${childNodes ? `colspan="${childNodes.length * 2}"` : ''}>
            </td>
          `
          tr.children[0].appendChild(nodeDiv)
          nodeWrapper.insertBefore(
            tr,
            nodeWrapper.children[0] ? nodeWrapper.children[0] : null,
          )
        }
        if (callback) {
          callback()
        }
      }
      // Construct the inferior nodes and connectiong lines
      if (childNodes) {
        if (Object.keys(nodeData).length === 1) {
          // if nodeData is just an array
          nodeWrapper = appendTo
        }
        const isVerticalLayer =
          this.verticalDepth && level + 2 >= this.verticalDepth
        const inEdit = this.$refs.chart.dataset.inEdit
        let isHidden

        if (inEdit) {
          isHidden = inEdit === 'addSiblings' ? '' : ' hidden'
        } else {
          isHidden = level + 1 >= this.depth ? ' hidden' : ''
        }

        // draw the line close to parent node
        if (!isVerticalLayer) {
          const tr = document.createElement('tr')

          tr.setAttribute('class', `lines${isHidden}`)
          tr.innerHTML = `
          <td colspan="${childNodes.length * 2}">
            <div class="downLine"></div>
          </td>
        `
          nodeWrapper.appendChild(tr)
        }
        // draw the lines close to children nodes
        const lineLayer = document.createElement('tr')

        lineLayer.setAttribute('class', `lines${isHidden}`)
        lineLayer.innerHTML = `
        <td class="rightLine">&nbsp;</td>
        ${childNodes
          .slice(1)
          .map(
            () => `
          <td class="leftLine topLine">&nbsp;</td>
          <td class="rightLine topLine">&nbsp;</td>
          `,
          )
          .join('')}
        <td class="leftLine">&nbsp;</td>
      `
        let nodeLayer

        if (isVerticalLayer) {
          nodeLayer = document.createElement('ul')
          if (isHidden) {
            nodeLayer.classList.add(isHidden.trim())
          }
          if (level + 2 === this.verticalDepth) {
            const tr = document.createElement('tr')

            tr.setAttribute('class', `verticalNodes${isHidden}`)
            tr.innerHTML = `<td></td>`
            tr.firstChild.appendChild(nodeLayer)
            nodeWrapper.appendChild(tr)
          } else {
            nodeWrapper.appendChild(nodeLayer)
          }
        } else {
          nodeLayer = document.createElement('tr')
          nodeLayer.setAttribute('class', `nodes${isHidden}`)
          nodeWrapper.appendChild(lineLayer)
          nodeWrapper.appendChild(nodeLayer)
        }
        // recurse through children nodes
        childNodes.forEach(child => {
          let nodeCell

          if (isVerticalLayer) {
            nodeCell = document.createElement('li')
          } else {
            nodeCell = document.createElement('td')
            nodeCell.setAttribute('colspan', 2)
          }
          nodeLayer.appendChild(nodeCell)
          this.buildHierarchy(nodeCell, child, level + 1, callback)
        })
      }
    },
    _clickChart(event) {
      const closestNode = this._closest(
        event.target,
        el => el.classList && el.classList.contains('node'),
      )

      if (!closestNode && this.$refs.chart.querySelector('.node.focused')) {
        this.$refs.chart
          .querySelector('.node.focused')
          .classList.remove('focused')
      }
    },
    _clickExportButton() {
      const chartContainer = this.$refs.container
      const sourceChart = chartContainer.querySelector('.orgchart:not(.hidden)')
      const flag = this.direction === 'l2r' || this.direction === 'r2l'

      let mask = chartContainer.querySelector(':scope > .mask')
      if (!mask) {
        mask = document.createElement('div')
        mask.setAttribute('class', 'mask')
        mask.innerHTML = `<i class="${this.spinnerClass}"></i>`
        chartContainer.appendChild(mask)
      } else {
        mask.classList.remove('hidden')
      }
      chartContainer.classList.add('canvasContainer')
      import('html2canvas')
        .then(html2canvas =>
          html2canvas(sourceChart, {
            width: flag ? sourceChart.clientHeight : sourceChart.clientWidth,
            height: flag ? sourceChart.clientWidth : sourceChart.clientHeight,
            onclone(cloneDoc) {
              const canvasContainer = cloneDoc.querySelector('.canvasContainer')

              canvasContainer.style.overflow = 'visible'
              canvasContainer.querySelector(
                '.orgchart:not(.hidden)',
              ).transform =
                ''
            },
          }),
        )
        .then(canvas => {
          const downloadBtn = chartContainer.querySelector('.oc-download-btn')

          chartContainer.querySelector('.mask').classList.add('hidden')
          downloadBtn.setAttribute('href', canvas.toDataURL())
          downloadBtn.click()
          chartContainer.classList.remove('canvasContainer')
        })
        .catch(err => {
          // eslint-disable-next-line no-console
          console.error('Failed to export the curent orgchart!', err)
          chartContainer.classList.remove('canvasContainer')
        })
    },
    _loopChart(chart) {
      const subObj = {
        id: chart.querySelector('.node').id,
      }

      if (chart.children[3]) {
        Array.from(chart.children[3].children).forEach(el => {
          if (!subObj.children) {
            subObj.children = []
          }
          subObj.children.push(this._loopChart(el.firstChild))
        })
      }
      return subObj
    },
    getHierarchy() {
      if (!this.$refs.chart.querySelector('.node').id) {
        return 'Error: Nodes of orghcart to be exported must have id attribute!'
      }
      return this._loopChart(this.$refs.chart.querySelector('table'))
    },
    _onPanStart(event) {
      const chart = event.currentTarget

      if (
        this._closest(
          event.target,
          el => el.classList && el.classList.contains('node'),
        ) ||
        (event.touches && event.touches.length > 1)
      ) {
        chart.dataset.panning = false
        return
      }
      chart.style.cursor = 'move'
      chart.dataset.panning = true

      let lastX = 0
      let lastY = 0

      const lastTf = window.getComputedStyle(chart).transform

      if (lastTf !== 'none') {
        const temp = lastTf.split(',')

        if (!lastTf.includes('3d')) {
          lastX = Number.parseInt(temp[4], 10)
          lastY = Number.parseInt(temp[5], 10)
        } else {
          lastX = Number.parseInt(temp[12], 10)
          lastY = Number.parseInt(temp[13], 10)
        }
      }
      let startX = 0
      let startY = 0

      if (!event.targetTouches) {
        // pan on desktop
        startX = event.pageX - lastX
        startY = event.pageY - lastY
      } else if (event.targetTouches.length === 1) {
        // pan on mobile device
        startX = event.targetTouches[0].pageX - lastX
        startY = event.targetTouches[0].pageY - lastY
      } else if (event.targetTouches.length > 1) {
        return
      }
      chart.dataset.panStart = JSON.stringify({
        startX,
        startY,
      })
      chart.addEventListener('mousemove', this._onPanning.bind(this))
      chart.addEventListener('touchmove', this._onPanning.bind(this))
    },
    _onPanning(event) {
      const chart = event.currentTarget

      if (chart.dataset.panning === 'false') {
        return
      }
      let newX = 0
      let newY = 0
      const panStart = JSON.parse(chart.dataset.panStart)
      const startX = panStart.startX
      const startY = panStart.startY

      if (!event.targetTouches) {
        // pand on desktop
        newX = event.pageX - startX
        newY = event.pageY - startY
      } else if (event.targetTouches.length === 1) {
        // pan on mobile device
        newX = event.targetTouches[0].pageX - startX
        newY = event.targetTouches[0].pageY - startY
      } else if (event.targetTouches.length > 1) {
        return
      }
      const lastTf = window.getComputedStyle(chart).transform

      if (lastTf === 'none') {
        if (!lastTf.includes('3d')) {
          chart.style.transform = `matrix(1, 0, 0, 1, ${newX}, ${newY})`
        } else {
          chart.style.transform = `matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ${newX}, ${newY}, 0, 1)`
        }
      } else {
        const matrix = lastTf.split(',')

        if (!lastTf.includes('3d')) {
          matrix[4] = newX
          matrix[5] = `${newY})`
        } else {
          matrix[12] = newX
          matrix[13] = newY
        }
        chart.style.transform = matrix.join(',')
      }
    },
    _onPanEnd(event) {
      const chart = this.$refs.chart

      if (chart.dataset.panning === 'true') {
        chart.dataset.panning = false
        chart.style.cursor = 'default'
        document.body.removeEventListener('mousemove', this._onPanning)
        document.body.removeEventListener('touchmove', this._onPanning)
      }
    },
    _setChartScale(chart, newScale) {
      const lastTf = window.getComputedStyle(chart).transform

      if (lastTf === 'none') {
        chart.style.transform = `scale(${newScale},${newScale})`
      } else {
        const matrix = lastTf.split(',')

        if (!lastTf.includes('3d')) {
          matrix[0] = `matrix(${newScale}`
          matrix[3] = newScale
          chart.style.transform = `${lastTf} scale(${newScale},${newScale})`
        } else {
          chart.style.transform = `${lastTf} scale3d(${newScale},${newScale}, 1)`
        }
      }
      chart.dataset.scale = newScale
    },
    _onWheeling(event) {
      event.preventDefault()

      const newScale = event.deltaY > 0 ? 0.8 : 1.2

      this._setChartScale(this.$refs.chart, newScale)
    },
    _getPinchDist(event) {
      return Math.sqrt(
        (event.touches[0].clientX - event.touches[1].clientX) *
          (event.touches[0].clientX - event.touches[1].clientX) +
          (event.touches[0].clientY - event.touches[1].clientY) *
            (event.touches[0].clientY - event.touches[1].clientY),
      )
    },
    _onTouchStart(event) {
      const chart = this.$refs.chart

      if (event.touches && event.touches.length === 2) {
        const dist = this._getPinchDist(event)

        chart.dataset.pinching = true
        chart.dataset.pinchDistStart = dist
      }
    },
    _onTouchMove(event) {
      const chart = this.$refs.chart

      if (chart.dataset.pinching) {
        const dist = this._getPinchDist(event)

        chart.dataset.pinchDistEnd = dist
      }
    },
    _onTouchEnd(event) {
      const chart = this.$refs.chart

      if (chart.dataset.pinching) {
        chart.dataset.pinching = false
        const diff = chart.dataset.pinchDistEnd - chart.dataset.pinchDistStart

        if (diff > 0) {
          this._setChartScale(chart, 1)
        } else if (diff < 0) {
          this._setChartScale(chart, -1)
        }
      }
    },
  },
}
</script>

<style>
.orgchart {
  position: relative;
  display: inline-block;
  min-height: 202px;
  min-width: 202px;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  background-image: linear-gradient(
      90deg,
      rgba(200, 0, 0, 0.15) 10%,
      rgba(0, 0, 0, 0) 10%
    ),
    linear-gradient(rgba(200, 0, 0, 0.15) 10%, rgba(0, 0, 0, 0) 10%);
  background-size: 10px 10px;
  border: 1px dashed transparent;
  padding: 20px;
}

.orgchart .hidden,
.orgchart ~ .hidden {
  display: none;
}

.orgchart div,
.orgchart div::before,
.orgchart div::after {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
}

.orgchart.b2t {
  -ms-transform: rotate(180deg);
  -moz-transform: rotate(180deg);
  -webkit-transform: rotate(180deg);
  transform: rotate(180deg);
}

.orgchart.l2r {
  position: absolute;
  -ms-transform: rotate(-90deg) rotateY(180deg);
  -moz-transform: rotate(-90deg) rotateY(180deg);
  -webkit-transform: rotate(-90deg) rotateY(180deg);
  transform: rotate(-90deg) rotateY(180deg);
  -ms-transform-origin: left top;
  -moz-transform-origin: left top;
  -webkit-transform-origin: left top;
  transform-origin: left top;
}

.orgchart .verticalNodes ul {
  list-style: none;
  margin: 0;
  padding-left: 18px;
  text-align: left;
}

.orgchart .verticalNodes ul:first-child {
  margin-top: 3px;
}

.orgchart .verticalNodes > td::before {
  content: '';
  border: 1px solid rgba(217, 83, 79, 0.8);
}

.orgchart .verticalNodes > td > ul > li:first-child::before {
  top: -4px;
  height: 30px;
  width: calc(50% - 2px);
  border-width: 2px 0 0 2px;
}

.orgchart .verticalNodes ul > li {
  position: relative;
}

.orgchart .verticalNodes ul > li::before,
.orgchart .verticalNodes ul > li::after {
  content: '';
  position: absolute;
  left: -6px;
  border-color: rgba(217, 83, 79, 0.8);
  border-style: solid;
  border-width: 0 0 2px 2px;
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
}

.orgchart .verticalNodes ul > li::before {
  top: -4px;
  height: 30px;
  width: 11px;
}

.orgchart .verticalNodes ul > li::after {
  top: 1px;
  height: 100%;
}

.orgchart .verticalNodes ul > li:first-child::after {
  top: 24px;
  width: 11px;
  border-width: 2px 0 0 2px;
}

.orgchart .verticalNodes ul > li:last-child::after {
  border-width: 2px 0 0;
}

.orgchart.r2l {
  position: absolute;
  -ms-transform: rotate(90deg);
  -moz-transform: rotate(90deg);
  -webkit-transform: rotate(90deg);
  transform: rotate(90deg);
  -ms-transform-origin: left top;
  -moz-transform-origin: left top;
  -webkit-transform-origin: left top;
  transform-origin: left top;
}

.orgchart > .spinner {
  font-size: 100px;
  margin-top: 30px;
  color: rgba(68, 157, 68, 0.8);
}

.orgchart table {
  border-spacing: 0;
  border-collapse: separate;
}

.orgchart > table:first-child {
  margin: 20px auto;
}

.orgchart td {
  text-align: center;
  vertical-align: top;
  padding: 0;
}

.orgchart tr.lines .topLine {
  border-top: 2px solid rgba(217, 83, 79, 0.8);
}

.orgchart tr.lines .rightLine {
  border-right: 1px solid rgba(217, 83, 79, 0.8);
  float: none;
  border-radius: 0;
}

.orgchart tr.lines .leftLine {
  border-left: 1px solid rgba(217, 83, 79, 0.8);
  float: none;
  border-radius: 0;
}

.orgchart tr.lines .downLine {
  background-color: rgba(217, 83, 79, 0.8);
  margin: 0 auto;
  height: 20px;
  width: 2px;
  float: none;
}

/* node styling */

.orgchart .node {
  display: inline-block;
  position: relative;
  margin: 0;
  padding: 3px;
  border: 2px dashed transparent;
  text-align: center;
  width: 130px;
}

.orgchart.l2r .node,
.orgchart.r2l .node {
  width: 50px;
  height: 130px;
}

.orgchart .node > .hazy {
  opacity: 0.2;
}

.orgchart .node > .spinner {
  position: absolute;
  top: calc(50% - 15px);
  left: calc(50% - 15px);
  vertical-align: middle;
  font-size: 30px;
  color: rgba(68, 157, 68, 0.8);
}

.orgchart .node:hover {
  background-color: rgba(238, 217, 54, 0.5);
  transition: 0.5s;
  cursor: default;
  z-index: 20;
}

.orgchart .node.focused {
  background-color: rgba(238, 217, 54, 0.5);
}

.orgchart .ghost-node {
  position: fixed;
  left: -10000px;
  top: -10000px;
}

.orgchart .ghost-node rect {
  fill: #ffffff;
  stroke: #bf0000;
}

.orgchart .node.allowedDrop {
  border-color: rgba(68, 157, 68, 0.9);
}

.orgchart .node .title {
  text-align: center;
  font-size: 12px;
  font-weight: bold;
  height: 20px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: rgba(217, 83, 79, 0.8);
  color: #fff;
  border-radius: 4px 4px 0 0;
}

.orgchart.b2t .node .title {
  -ms-transform: rotate(-180deg);
  -moz-transform: rotate(-180deg);
  -webkit-transform: rotate(-180deg);
  transform: rotate(-180deg);
  -ms-transform-origin: center bottom;
  -moz-transform-origin: center bottom;
  -webkit-transform-origin: center bottom;
  transform-origin: center bottom;
}

.orgchart.l2r .node .title {
  -ms-transform: rotate(-90deg) translate(-40px, -40px) rotateY(180deg);
  -moz-transform: rotate(-90deg) translate(-40px, -40px) rotateY(180deg);
  -webkit-transform: rotate(-90deg) translate(-40px, -40px) rotateY(180deg);
  transform: rotate(-90deg) translate(-40px, -40px) rotateY(180deg);
  -ms-transform-origin: bottom center;
  -moz-transform-origin: bottom center;
  -webkit-transform-origin: bottom center;
  transform-origin: bottom center;
  width: 120px;
}

.orgchart.r2l .node .title {
  -ms-transform: rotate(-90deg) translate(-40px, -40px);
  -moz-transform: rotate(-90deg) translate(-40px, -40px);
  -webkit-transform: rotate(-90deg) translate(-40px, -40px);
  transform: rotate(-90deg) translate(-40px, -40px);
  -ms-transform-origin: bottom center;
  -moz-transform-origin: bottom center;
  -webkit-transform-origin: bottom center;
  transform-origin: bottom center;
  width: 120px;
}

.orgchart .node .title .symbol {
  float: left;
  margin-top: 4px;
  margin-left: 2px;
}

.orgchart .node .content {
  width: 100%;
  height: 20px;
  font-size: 11px;
  line-height: 18px;
  border: 1px solid rgba(217, 83, 79, 0.8);
  border-radius: 0 0 4px 4px;
  text-align: center;
  background-color: #fff;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.orgchart.b2t .node .content {
  -ms-transform: rotate(180deg);
  -moz-transform: rotate(180deg);
  -webkit-transform: rotate(180deg);
  transform: rotate(180deg);
  -ms-transform-origin: center top;
  -moz-transform-origin: center top;
  -webkit-transform-origin: center top;
  transform-origin: center top;
}

.orgchart.l2r .node .content {
  -ms-transform: rotate(-90deg) translate(-40px, -40px) rotateY(180deg);
  -moz-transform: rotate(-90deg) translate(-40px, -40px) rotateY(180deg);
  -webkit-transform: rotate(-90deg) translate(-40px, -40px) rotateY(180deg);
  transform: rotate(-90deg) translate(-40px, -40px) rotateY(180deg);
  -ms-transform-origin: top center;
  -moz-transform-origin: top center;
  -webkit-transform-origin: top center;
  transform-origin: top center;
  width: 120px;
}

.orgchart.r2l .node .content {
  -ms-transform: rotate(-90deg) translate(-40px, -40px);
  -moz-transform: rotate(-90deg) translate(-40px, -40px);
  -webkit-transform: rotate(-90deg) translate(-40px, -40px);
  transform: rotate(-90deg) translate(-40px, -40px);
  -ms-transform-origin: top center;
  -moz-transform-origin: top center;
  -webkit-transform-origin: top center;
  transform-origin: top center;
  width: 120px;
}

.orgchart .node .edge {
  font-size: 15px;
  position: absolute;
  color: rgba(68, 157, 68, 0.5);
  cursor: default;
  transition: 0.2s;
  -webkit-transition: 0.2s;
}

.orgchart.noncollapsable .node .edge {
  display: none;
}

.orgchart .edge:hover {
  color: #449d44;
  cursor: pointer;
}

.orgchart .node .verticalEdge {
  width: calc(100% - 10px);
  width: -webkit-calc(100% - 10px);
  width: -moz-calc(100% - 10px);
  left: 5px;
}

.orgchart .node .topEdge {
  top: -4px;
}

.orgchart .node .bottomEdge {
  bottom: -4px;
}

.orgchart .node .horizontalEdge {
  width: 15px;
  height: calc(100% - 10px);
  height: -webkit-calc(100% - 10px);
  height: -moz-calc(100% - 10px);
  top: 5px;
}

.orgchart .node .rightEdge {
  right: -4px;
}

.orgchart .node .leftEdge {
  left: -4px;
}

.orgchart .node .horizontalEdge::before {
  position: absolute;
  top: calc(50% - 7px);
  top: -webkit-calc(50% - 7px);
  top: -moz-calc(50% - 7px);
}

.orgchart .node .rightEdge::before {
  right: 3px;
}

.orgchart .node .leftEdge::before {
  left: 3px;
}

.orgchart .node .toggleBtn {
  position: absolute;
  left: 5px;
  bottom: -2px;
  color: rgba(68, 157, 68, 0.6);
}

.orgchart .node .toggleBtn:hover {
  color: rgba(68, 157, 68, 0.8);
}

.oc-export-btn {
  display: inline-block;
  position: absolute;
  right: 5px;
  top: 5px;
  padding: 6px 12px;
  margin-bottom: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.42857143;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  -ms-touch-action: manipulation;
  touch-action: manipulation;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  color: #fff;
  background-color: #5cb85c;
  border: 1px solid transparent;
  border-color: #4cae4c;
  border-radius: 4px;
}

.oc-export-btn:hover,
.oc-export-btn:focus,
.oc-export-btn:active {
  background-color: #449d44;
  border-color: #347a34;
}

.orgchart ~ .mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 999;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.3);
}

.orgchart ~ .mask .spinner {
  position: absolute;
  top: calc(50% - 54px);
  left: calc(50% - 54px);
  color: rgba(255, 255, 255, 0.8);
  font-size: 108px;
}

.orgchart .node {
  -webkit-transition: all 0.3s;
  transition: all 0.3s;
  top: 0;
  left: 0;
}

.orgchart .slide-down {
  opacity: 0;
  top: 40px;
}

.orgchart.l2r .node.slide-down,
.orgchart.r2l .node.slide-down {
  top: 130px;
}

.orgchart .slide-up {
  opacity: 0;
  top: -40px;
}

.orgchart.l2r .node.slide-up,
.orgchart.r2l .node.slide-up {
  top: -130px;
}

.orgchart .slide-right {
  opacity: 0;
  left: 130px;
}

.orgchart.l2r .node.slide-right,
.orgchart.r2l .node.slide-right {
  left: 40px;
}

.orgchart .slide-left {
  opacity: 0;
  left: -130px;
}

.orgchart.l2r .node.slide-left,
.orgchart.r2l .node.slide-left {
  left: -40px;
}
</style>

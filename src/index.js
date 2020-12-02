import { getElementNode } from './utils/dom'
import { merge } from './utils/util'
import Holder from './core/Holder'
import Selection from './core/Selection'
import injectControl from './injectControl'
import injectApi, { initPayload } from './injectApi'

const defaultOptions = {
  parent: '', // DOM 或 CSS选择器串
  children: '',// DOM 或 CSS选择器串
  threshold: 200, // 框选时节流函数间隔
  onStart: null, // 开始框选时的回调
  onHold: null, // 保持框选时的鼠标移动回调
  onEnd: null, // 框选结束回调
  onChange: null, // 选择结果变化的回调
  mode: 'toggle', // disposable: 一次性选择 append: 每次继续追加元素 toggle: toggle
  clearOnClick: true // 是否在点击时清空选中
}

function Pika9(options) {
  if (!window || !document) {
    throw new Error('make sure you running Pika9.js in bowser')
  }

  merge(this, initPayload)
  this._options = Object.freeze(merge({ ...defaultOptions }, options || {}, true))

  this._load()
}

injectControl(Pika9)
injectApi(Pika9)

// 装载
Pika9.prototype._load = function() {
  const options = this._options
  const parentEl = getElementNode(options.parent)

  if (!parentEl) {
    throw new Error('invalid parent node')
  }

  // 设置父元素及children
  this._parent = parentEl
  this.setSelectable(options.children)
  // 挂载选择区域元素
  this._selection = new Selection(parentEl)
  this._selection.mount()
  // 挂载事件
  this._holder = new Holder(parentEl, {
    onClick: (ev) => {
      // 单击时清空选中
      if (this._children.indexOf(ev.target) > -1) {
        this._resolveCurSelected([ev.target])
      } else if (this._options.clearOnClick) {
        this.clearSelected()
      }
    },
    onHoldStart: (ev) => {
      this._onHoldStart(ev)
    },
    onHoldMove: (ev) => {
      this._onHoldMove(ev)
    },
    onHoldEnd: (ev) => {
      this._onHoldEnd(ev)
    }
  })
  this._throttleHold = null
  this._selectedElements = []
  this._holding = true
}


export default Pika9

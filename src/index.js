import { getElementNode, getElementNodes } from './utils/dom'
import merge from './utils/merge'
import Holder from './core/Holder'
import Selection from './core/Selection'
import CSYSStrategy from './core/strategy/CSYSStrategy'
import injectControl from './injectControl'
import injectApi, { initPayload } from './injectApi'

const defaultOptions = {
  parent: null, // DOM 或 CSS选择器串
  children: null, // DOM 或 CSS选择器串数组
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
  this._baseMergeOptions = merge({ ...defaultOptions }, options || {})
  
  // Object.defineProperty(this, '_curSelectedEls', )
  this._load()
}

injectControl(Pika9)
injectApi(Pika9)

// 装载
Pika9.prototype._load = function() {
  const options = { ...this._baseMergeOptions }
  const parentEl = options.parent
  const children = options.children
  const parent = getElementNode(parentEl)
  
  if (!parent) {
    throw new Error('invalid parent node')
  }

  let childNodes = null
  childNodes = getElementNodes(children)
  if (!childNodes.length) {
    throw new Error('invalid children nodes')
  }

  options.parent = parent
  options.children = childNodes
  this._options = Object.freeze(options)
  // 创建交集策略，决定如何选中元素
  this._intersectionStrategy = new CSYSStrategy({
    elements: this._options.children
  })
  // 挂载选择区域元素
  this._selection = new Selection(this._options.parent)
  this._selection.mount()
  // 挂载事件
  this._holder = new Holder(parent, {
    onClick: (ev) => {
      // 单击时清空选中
      if (this._options.children.indexOf(ev.target) > -1) {
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

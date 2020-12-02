import { getElementNodes } from './utils/dom'
import { merge, flatten } from './utils/util'
import CSYSStrategy from './core/strategy/CSYSStrategy'

export const initPayload = {
  _intersectionStrategy: null,
  _selection: null,
  _holder: null,
  _throttleHold: null,
  _recentSelectedEls: [],
  _curSelectedEls: [],
  _enable: false,
  _holding: false
}

export default function injectApi(Pika9) {
  Pika9.prototype.setSelectable = setSelectable
  Pika9.prototype.enable = enable
  Pika9.prototype.disable = disable
  Pika9.prototype.reload = reload
  Pika9.prototype.unload = unload
}

function setSelectable(children) {
  let childNodes = []
  const flattenChildren = flatten(children)
  for (let i = 0; i < flattenChildren.length; i++) {
    const el = getElementNodes(flattenChildren[i])
    el && childNodes.push(el)
  }

  this._children = flatten(childNodes)
  // 创建交集策略，决定如何选中元素
  this._intersectionStrategy = new CSYSStrategy({
    elements: this._children
  })
}

function enable() {
  this._enable = true
  this._holder.enable()
}

function disable() {
  this._enable = false
  this._holder.disable()
}

function reload() {
  const enable = this._enable
  this.unload()
  this._load()
  if (enable) {
    this.enable()
  }
}

// 卸载
function unload() {
  // 卸载Holder事件
  this._holder.unload()
  // 清除选择元素
  this._selection.unmount()
  // 清空选中
  this.clearSelected()
  merge(this, initPayload)
}

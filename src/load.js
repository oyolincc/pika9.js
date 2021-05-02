import { getElementNode } from './utils/dom'
import Holder from './core/holder/Holder'
import Selection from './core/Selection'
import { merge } from './utils/util'
import { initPayload } from './init'
import ElManager from './core/elManager/ElManager'
import CSYSStrategy from './core/elManager/strategy/CSYSStrategy'

export function loadMixin(Pika9) {
  merge(Pika9.prototype, {
    _load,
    _checkLoad,
    enable,
    disable,
    unload
  })
}

function _load() {
  const options = this._options
  const parentEl = getElementNode(options.parent)

  if (!parentEl) {
    throw new Error('invalid parent node')
  }

  // 设置父元素及children
  this._parent = parentEl
  this._elManager = new ElManager(
    new CSYSStrategy(),
    options.mode
  )
  this.setSelectable(options.children)
  
  // 挂载选择区域元素
  this._selection = new Selection(parentEl)
  this._selection.mount()
  // 挂载事件
  this._holder = new Holder(parentEl, {
    onClick: (ev) => {
      if (this._options.cleanOnClick) {
        this._elManager.cleanSelected()
      }
      // 单击元素是否要清空？
    },
    onHoldStart: (ev) => this._onHoldStart(ev),
    onHoldMove: (ev) => this._onHoldMove(ev),
    onHoldEnd: (ev) => this._onHoldEnd(ev)
  })
  this._loaded = true
}

function _checkLoad() {
  if (this._loaded) {
    return
  }

  this._load()
}

function enable() {
  this._checkLoad()
  this._holder.enable()
  this._enable = true
}

function disable() {
  if (!this._loaded) {
    return
  }
  this._enable = false
  this._holder.disable()
}

function unload() {
  // 卸载Holder事件
  this._holder.unload()
  // 清除选择元素
  this._selection.unmount()
  // 清空选中
  this._elManager.cleanSelected()
  merge(this, initPayload)
}

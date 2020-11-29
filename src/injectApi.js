import merge from './utils/merge'

export const initPayload = {
  _baseMergeOptions: null,
  _options: null,
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
  Pika9.prototype.enable = enable
  Pika9.prototype.disable = disable
  Pika9.prototype.reload = reload
  Pika9.prototype.unload = unload
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
  const base = this._baseMergeOptions
  this.unload()
  this._baseMergeOptions = base
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

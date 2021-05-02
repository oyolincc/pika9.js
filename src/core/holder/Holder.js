import { isElement } from '../../utils/dom'
import { merge } from '../../utils/util'
import { loadMixin } from './load'

const noob = () => {}

const initPayload = {
  _loaded: false, // 是否已经装载（如事件等）
  _enable: false, // 是否启用
  _isDown: false, // 鼠标是否已经在目标元素按下
  _isHold: false, // 是否正在hold
  _startPoint: null,
  _activePoint: null,
  _target: null, // 维护的元素

  // 私有Handler
  _touchStartHandler: null,
  _touchMoveHandler: null,
  _touchEndHandler: null,
  _onOutsideMouseUp: null,
  // 外部传入的回调
  _onClick: noob,
  _onHoldStart: noob,
  _onHoldMove: noob,
  _onHoldEnd: noob
}

/**
 * @param {HTMLElement|Node} target 
 * @param {Object} callbackOpts 
 */
export default function Holder(target, callbackOpts) {
  this._init(target, callbackOpts)
}

loadMixin(Holder)

Holder.prototype.enable = function () {
  this._checkLoad()
  this._enable = true
}

Holder.prototype.disable = function () {
  this._enable = false
}

Holder.prototype._init = function (target, callbackOpts) {
  if (!isElement(target)) {
    throw new Error('Holder: target should be an element!')
  }
  merge(this, initPayload) // 清空数据
  this._target = target
  callbackOpts = callbackOpts || {}
  /* 设置回调函数 */
  this._onClick = callbackOpts.onClick || noob
  this._onHoldStart = callbackOpts.onHoldStart || noob
  this._onHoldMove = callbackOpts.onHoldMove || noob
  this._onHoldEnd = callbackOpts.onHoldEnd || noob
}

import { getStyleProperty } from '../utils/dom'
import { getShapePoints } from '../utils/position'

const noob = () => {}

function createEventInfo(startPoint, activePoint, e) {
  const info = {
    startPoint,
    target: e.target || e.srcElement,
    currentTaget: e.currentTaget
  }
  if (activePoint) {
    info.activePoint = activePoint
  }
  return info
}

/**
 * @param {HTMLElement|Node} target 
 * @param {Object} callbackOpts 
 */
export default function Holder(target, callbackOpts) {
  this._init()
  this.target = target
  this._onClick = callbackOpts.onClick || noob
  this._onHoldStart = callbackOpts.onHoldStart || noob
  this._onHoldMove = callbackOpts.onHoldMove || noob
  this._onHoldEnd = callbackOpts.onHoldEnd || noob

  let targetPoints = null
  let getPointInfo = null
  let borderWidth = 0

  this._touchStartHandler = (e) => {
    if (this._isDown || !this._enable) {
      return
    }

    targetPoints = getShapePoints(this.target)
    borderWidth = getStyleProperty(this.target, 'border-width')
    borderWidth = borderWidth ? Number(borderWidth.split('px')[0]) : 0

    // 在边框上触发事件无效
    const x = e.clientX
    const y = e.clientY
    if (x <= targetPoints[0].x + borderWidth || x >= targetPoints[1].x - borderWidth) {
      return
    }
    if (y <= targetPoints[0].y + borderWidth || y >= targetPoints[3].y - borderWidth) {
      return
    }

    getPointInfo = (x, y) => {
      const contentX = x + this.target.scrollLeft - targetPoints[0].x - borderWidth
      const contentY = y + this.target.scrollTop - targetPoints[0].y - borderWidth
      return {
        x,
        y,
        contentX,
        contentY,
        offsetX: x - contentX,
        offsetY: y - contentY
      }
    }

    const startPoint = getPointInfo(x, y)
    this._startPoint = startPoint
    this._activePoint = null

    this._prepareEmitStart = () => {
      this._onHoldStart.call(null, createEventInfo(startPoint, null, e))
    }

    this._isDown = true
  }

  this._touchMoveHandler = (e) => {
    if (!this._isDown || !this._enable) {
      return
    }

    if (!this._isHold) {
      this._isHold = true
      // 触发start事件，再触发move事件
      this._prepareEmitStart()
      this._prepareEmitStart = null
    }

    const activePoint = getPointInfo(e.clientX, e.clientY)
    this._activePoint = activePoint
    this._onHoldMove.call(null, createEventInfo(this._startPoint, activePoint, e))
  }

  this._touchEndHandler = (e) => {
    if (!this._isDown || !this._enable) {
      return
    }

    this._isDown = false
    if (this._isHold) {
      this._isHold = false
      let x = e.clientX
      let y = e.clientY
      // 鼠标在外结束的处理
      x = Math.min(x, targetPoints[1].x - borderWidth)
      x = Math.max(x, targetPoints[0].x + borderWidth)
      y = Math.min(y, targetPoints[3].y - borderWidth)
      y = Math.max(y, targetPoints[0].y + borderWidth)
      const activePoint = getPointInfo(x, y)
      this._activePoint = activePoint
      this._onHoldEnd.call(null, createEventInfo(this._startPoint, activePoint, e))
    } else {
      // 只是点击没有发生移动
      this._onClick.call(null, createEventInfo(this._startPoint, null, e))
    }
    this._prepareEmitStart = null
    getPointInfo = null
    targetPoints = null
    borderWidth = 0
  }

  // 处理在边界外
  this._onOutsideMouseUp = (e) => {
    if (this._enable) {
      this._touchEndHandler(e)
    }
  }
}

Holder.prototype.enable = function () {
  this._check()
  this._loadEvents()
  this._enable = true
}

Holder.prototype.disable = function () {
  this._check()
  this._enable = false
}

Holder.prototype.unload = function() {
  this._check()
  this._unloadEvents()
  this._init()
  this._unload = true
}

Holder.prototype._init = function () {
  /* 清空数据 */
  this.target = null
  this._listening = false
  this._enable = false // 是否开启监听
  this._isDown = false // 鼠标是否已经在目标元素按下
  this._isHold = false // 是否正在hold
  this._startPoint = null
  this._activePoint = null
  this._unload = false
  /* 重置回调函数 */
  this._onClick = null
  this._onHoldStart = null
  this._onHoldMove = null
  this._onHoldEnd = null
}

Holder.prototype._check = function() {
  if (this._unload) {
    throw new Error('Holder has been unloaded!')
  }
}

Holder.prototype._loadEvents = function() {
  if (!this._listening) {
    this._listening = true
    this.target.addEventListener('mousedown', this._touchStartHandler)
    this.target.addEventListener('mousemove', this._touchMoveHandler)
    this.target.addEventListener('mouseup', this._touchEndHandler)
    document.addEventListener('mouseup', this._onOutsideMouseUp)
  }
}

Holder.prototype._unloadEvents = function() {
  if (this._listening) {
    this.target.removeEventListener('mousedown', this._touchStartHandler)
    this.target.removeEventListener('mousemove', this._touchMoveHandler)
    this.target.removeEventListener('mouseup', this._touchEndHandler)
    document.removeEventListener('mouseup', this._onOutsideMouseUp)
    this._listening = false
  }
}

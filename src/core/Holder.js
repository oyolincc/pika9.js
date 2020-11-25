import { getStyleProperty } from '../utils/dom'
import { isOutOfContent } from '../utils/position'

const noob = () => {}

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

  let getPointInfo = null

  this._touchStartHandler = (e) => {
    if (this._isDown || !this._enable) {
      return
    }

    const targetRect = this.target.getBoundingClientRect()
    let borderWidth = getStyleProperty(this.target, 'border-width')
    borderWidth = borderWidth ? Number(borderWidth.split('px')[0]) : 0

    getPointInfo = (x, y) => {
      const contentX = x + this.target.scrollLeft - targetRect.left - borderWidth
      const contentY = y + this.target.scrollTop - targetRect.top - borderWidth
      return {
        x,
        y,
        contentX,
        contentY,
        offsetX: x - contentX,
        offsetY: y - contentY
      }
    }

    const startPoint = getPointInfo(e.clientX, e.clientY)
    this._startPoint = startPoint
    this._activePoint = null

    // 在边框上触发事件无效
    if (isOutOfContent(this.target, { x: startPoint.contentX, y: startPoint.contentY })) {
      return
    }

    this._prepareEmitStart = () => {
      this._onHoldStart.call(null, {
        startPoint,
        target: this.target
      })
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
    this._onHoldMove.call(null, {
      startPoint: this._startPoint,
      activePoint,
      target: this.target
    })
  }

  this._touchEndHandler = (e) => {
    if (!this._isDown || !this._enable) {
      return
    }

    this._isDown = false
    if (this._isHold) {
      this._isHold = false
      const activePoint = getPointInfo(e.clientX, e.clientY)
      this._activePoint = activePoint
      this._onHoldEnd.call(null, {
        startPoint: this._startPoint,
        activePoint,
        target: this.target
      })
    } else {
      // 只是点击没有发生移动
      this._onClick.call(null, {
        activePoint: this._startPoint,
        target: this.target
      })
    }
    this._prepareEmitStart = null
    getPointInfo = null
  }

  // 处理在边界外
  this._onPageMouseUp = (e) => {
    if (this.enable && this._isHold) {
      debugger
      this._touchEndHandler({})
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
    document.addEventListener('mouseup', this._onPageMouseUp)
  }
}

Holder.prototype._unloadEvents = function() {
  if (this._listening) {
    this.target.removeEventListener('mousedown', this._touchStartHandler)
    this.target.removeEventListener('mousemove', this._touchMoveHandler)
    this.target.removeEventListener('mouseup', this._touchEndHandler)
    document.removeEventListener('mouseup', this._onPageMouseUp)
    this._listening = false
  }
}

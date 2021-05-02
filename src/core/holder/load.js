import { merge } from '../../utils/util'
import { getStyleProperty } from '../../utils/dom'
import { getShapePoints } from '../../utils/position'

export function loadMixin(Holder) {
  merge(Holder.prototype, {
    _load,
    _checkLoad,
    unload
  })
}

function createEvent(startPoint, activePoint, e) {
  const info = {
    startPoint,
    target: e.target || e.srcElement,
    currentTarget: e.currentTarget
  }
  if (activePoint) {
    info.activePoint = activePoint
  }
  return info
}

function createPrivateHandler(ctx) {
  let targetPoints = null // 维护的元素顶点
  let getPointInfo = null
  let borderWidth = 0

  function _touchStartHandler(e) {
    if (ctx._isDown || !ctx._enable) {
      return
    }

    targetPoints = getShapePoints(ctx._target)
    borderWidth = getStyleProperty(ctx._target, 'border-width')
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
      const contentX = x + ctx._target.scrollLeft - targetPoints[0].x - borderWidth
      const contentY = y + ctx._target.scrollTop - targetPoints[0].y - borderWidth
      return {
        x,
        y,
        contentX,
        contentY
      }
    }

    const startPoint = getPointInfo(x, y)
    ctx._startPoint = startPoint
    ctx._activePoint = null

    ctx._prepareEmitStart = () => {
      ctx._onHoldStart.call(null, createEvent(startPoint, null, e))
    }

    ctx._isDown = true
  }

  function _touchMoveHandler(e) {
    if (!ctx._isDown || !ctx._enable) {
      return
    }

    if (!ctx._isHold) {
      ctx._isHold = true
      // 触发start事件，再触发move事件
      ctx._prepareEmitStart()
      ctx._prepareEmitStart = null
    }

    const activePoint = getPointInfo(e.clientX, e.clientY)
    ctx._activePoint = activePoint
    ctx._onHoldMove.call(null, createEvent(ctx._startPoint, activePoint, e))
  }

  function _touchEndHandler(e) {
    if (!ctx._isDown || !ctx._enable) {
      return
    }

    ctx._isDown = false
    if (ctx._isHold) {
      ctx._isHold = false
      let x = e.clientX
      let y = e.clientY
      // 鼠标在外结束的处理
      x = Math.min(x, targetPoints[1].x - borderWidth)
      x = Math.max(x, targetPoints[0].x + borderWidth)
      y = Math.min(y, targetPoints[3].y - borderWidth)
      y = Math.max(y, targetPoints[0].y + borderWidth)
      const activePoint = getPointInfo(x, y)
      ctx._activePoint = activePoint
      ctx._onHoldEnd.call(null, createEvent(ctx._startPoint, activePoint, e))
    } else {
      // 只是点击没有发生移动
      ctx._onClick.call(null, createEvent(ctx._startPoint, null, e))
    }
    ctx._prepareEmitStart = null
    getPointInfo = null
    targetPoints = null
    borderWidth = 0
  }

  // 处理在边界外
  function _onOutsideMouseUp(e) {
    if (ctx._isHold && ctx._enable) {
      ctx._touchEndHandler(e)
    }
  }

  return {
    _touchStartHandler,
    _touchMoveHandler,
    _touchEndHandler,
    _onOutsideMouseUp
  }
}

function _load() {
  merge(this, createPrivateHandler(this))
  this._target.addEventListener('mousedown', this._touchStartHandler)
  this._target.addEventListener('mousemove', this._touchMoveHandler)
  this._target.addEventListener('mouseup', this._touchEndHandler)
  document.addEventListener('mouseup', this._onOutsideMouseUp)
  this._loaded = true
}

function _checkLoad() {
  if (this._loaded) {
    return
  }
  this._load()
}

function unload() {
  if (!this._loaded) {
    return
  }
  this._target.removeEventListener('mousedown', this._touchStartHandler)
  this._target.removeEventListener('mousemove', this._touchMoveHandler)
  this._target.removeEventListener('mouseup', this._touchEndHandler)
  document.removeEventListener('mouseup', this._onOutsideMouseUp)
  this._loaded = false
}

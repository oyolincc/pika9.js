import { toArea } from './utils/position'
import { getElementNodes } from './utils/dom'
import { flatten, merge } from './utils/util'
import throttle from './utils/throttle'

export function selectMixin(Pika9) {
  merge(Pika9.prototype, {
    setSelectable,
    _updateSelection,
    _onHoldStart,
    _onHoldMove,
    _onHoldEnd
  })
}

function setSelectable(children) {
  const flattenChildren = flatten(children)
  for (let i = 0; i < flattenChildren.length; i++) {
    flattenChildren[i] = getElementNodes(flattenChildren[i])
  }
  this._children = flatten(flattenChildren)
  this._elManager.setSelectable(this._children)
}

function _updateSelection(startPoint, activePoint) {
  const contentX1 = startPoint.contentX
  const contentY1 = startPoint.contentY
  const contentX2 = activePoint.contentX
  const contentY2 = activePoint.contentY
  this._selection.update(
    contentX1,
    contentY1,
    contentX2 - contentX1,
    contentY2 - contentY1
  )
}

function selectArea(startPoint, activePoint) {
  // 更新选中
  const els = this._elManager.select(toArea(startPoint, {
    x: startPoint.x + activePoint.contentX - startPoint.contentX,
    y: startPoint.y + activePoint.contentY - startPoint.contentY
  }))

  return els
}

function _onHoldStart(ev) {
  this._holding = true
  this._selection.show()
  if (this._options.mode === 'disposable') {
    // 一次性选中，清空上次选择
    this._elManager.cleanSelected()
  }
  // 创建防抖函数
  const { onStart, onHold, threshold } = this._options
  this._elManager.initStrategy({
    origin: ev.startPoint
  })

  if (!this._throttleHold) {
    this._throttleHold = throttle(threshold, (holdEv) => {
      if (!this._holding) {
        return
      }
      
      selectArea.call(this, holdEv.startPoint, holdEv.activePoint)
      onHold && onHold.call(null, {
        start: { ...holdEv.startPoint },
        active: { ...holdEv.activePoint },
        ...this._elManager.getDiff()
      })
    })
  }
  onStart && onStart.call(null, { start: { ...ev.startPoint } })
}

function _onHoldMove(ev) {
  this._updateSelection(ev.startPoint, ev.activePoint)
  this._throttleHold && this._throttleHold(ev)
}

function _onHoldEnd(ev) {
  this._holding = false
  this._updateSelection(ev.startPoint, ev.activePoint)

  selectArea.call(this, ev.startPoint, ev.activePoint)

  const onEnd = this._options.onEnd
  const diff = this._elManager.save()
  onEnd && onEnd.call(null, {
    start: { ...ev.startPoint },
    active: { ...ev.activePoint },
    ...diff
  })
  this._selection.hide()
}
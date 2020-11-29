import { removeClass, addClass } from './utils/dom'
import throttle from './utils/throttle'

const SELECTED_CLASS = 'pika9-selected'

export default function injectControl(Pika9) {
  Pika9.prototype._onHoldStart = _onHoldStart
  Pika9.prototype._onHoldMove = _onHoldMove
  Pika9.prototype._onHoldEnd = _onHoldEnd
  Pika9.prototype._updateSelection = _updateSelection
  Pika9.prototype._resolveSelectedEls = _resolveSelectedEls
  Pika9.prototype.clearSelected = clearSelected
}

function _onHoldStart(ev) {
  this._holding = true
  this._selection.show()
  if (this._options.mode === 'disposable') {
    // 一次性选中，清空上次选择
    this.clearSelected()
  }
  // 创建防抖函数
  const { onHold, threshold } = this._options
  this._intersectionStrategy.start(ev)
  if (!this._throttleHold) {
    this._throttleHold = throttle(threshold, (holdEv) => {
      if (!this._holding) {
        return
      }
      // 更新选中
      const selectedEls = this._intersectionStrategy.hold(holdEv)
      const { added, removed } = this._resolveSelectedEls(selectedEls)
      this._recentSelectedEls = selectedEls
      onHold && onHold.call(null, {
        start: { ...ev.startPoint },
        active: { ...ev.activePoint },
        added,
        removed
      })
    })
  }
  const onStart = this._options.onStart
  onStart && onStart.call(null, { start: { ...ev.startPoint } })
}

function _onHoldMove(ev) {
  this._updateSelection(ev.startPoint, ev.activePoint)
  this._throttleHold && this._throttleHold(ev)
}

function _onHoldEnd(ev) {
  this._holding = false
  this._updateSelection(ev.startPoint, ev.activePoint)

  const selectedEls = this._intersectionStrategy.end(ev)
  const { added, removed, selected } = this._resolveSelectedEls(selectedEls, true)
  this._curSelectedEls = selected.concat()
  this._recentSelectedEls = []

  const onEnd = this._options.onEnd
  onEnd && onEnd.call(null, {
    start: { ...ev.startPoint },
    active: { ...ev.activePoint },
    added,
    removed,
    selected
  })
  this._selection.hide()
}

/**
 * 根据起点及活动点更新选择区域
 * @param {object} startPoint 
 * @param {object} activePoint 
 */
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

// [2, 4, 7, 8] + [1, 2, 7] = [4, 8], [1] + [2, 7]
/**
 * 分析集合数据，返回唯一元素集合和重复元素集合
 */
function analyzeSetDiff(set1, set2) {
  set1 = set1.concat()
  set2 = set2.concat()
  const duplicate = []
  for (let i = 0; i < set1.length; i++){
    for (let j = 0; j < set2.length; j++) {
      if (set1[i] === set2[j]) {
        duplicate.push(set1[i])
        set1.splice(i, 1)
        set2.splice(j, 1)
        i--
        break
      }
    }
  }
  return {
    diff: [set1, set2],
    duplicate
  }
}

function setSelectedClass(els) {
  let i = -1
  while (++i < els.length) {
    addClass(els[i], SELECTED_CLASS)
  }
}

function removeSelectedClass(els) {
  let i = -1
  while (++i < els.length) {
    removeClass(els[i], SELECTED_CLASS)
  }
}

/**
 * 解决元素选中效果
 * @param {Array} els 当前准备用于更新选中结果的元素
 * @param {Boolean} analyzeNetSelected 是否分析净选择
 */
function _resolveSelectedEls(els, analyzeNetSelected) {
  // 000 保存状态 上一次活动选中状态 本次活动选中状态
  const diffInfoxxx = analyzeSetDiff(this._recentSelectedEls, els)
  // const diffInfox11 = analyzeSetDiff(diffInfoxxx.duplicate, this._curSelectedEls)
  const diffInfox10 = analyzeSetDiff(diffInfoxxx.diff[0], this._curSelectedEls)
  const diffInfox01 = analyzeSetDiff(diffInfoxxx.diff[1], this._curSelectedEls)
  // const els111 = diffInfox11.duplicate
  // const els011 = diffInfox11.diff[0]
  const els110 = diffInfox10.duplicate
  const els010 = diffInfox10.diff[0]
  const els101 = diffInfox01.duplicate
  const els001 = diffInfox01.diff[0]
  const result = {
    added: [],
    removed: []
  }
  /**
   * 根据mode设置当前样式
   * disposable: 
   *    新激活: 001 
   *    取消激活: 010
   *    当前激活: this._recentSelectedEls
   * append: 
   *    新激活: 001
   *    取消激活: 010
   *    当前激活: 001 + 011 + 100 + 101 + 110 + 111 (_curSelected 和 els 取并集)
   * toggle: 
   *    新激活: 001 + 110
   *    取消激活: 010 + 101
   *    当前激活: 001 + 011 + 100 + 110 (_curSelected 和 els 的并集减去两者的交集)
   *   
   */
  const mode = this._options.mode
  if (mode === 'disposable' || mode === 'append') {
    result.added = els001
    result.removed = els010
    setSelectedClass(result.added)
    removeSelectedClass(result.removed)
    if (analyzeNetSelected) {
      if (mode === 'disposable') {
        result.selected = this._recentSelectedEls
      } else {
        const diffInfo = analyzeSetDiff(this._curSelectedEls, els)
        result.selected = diffInfo.diff[0].concat(diffInfo.diff[1]).concat(diffInfo.duplicate)
      }
    }
    return result
  }

  if (mode === 'toggle') {
    result.added = els001.concat(els110)
    result.removed = els010.concat(els101)
    setSelectedClass(result.added)
    removeSelectedClass(result.removed)
    if (analyzeNetSelected) {
      const diffInfo = analyzeSetDiff(this._curSelectedEls, els)
      result.selected = diffInfo.diff[0].concat(diffInfo.diff[1])
    }
    return result
  }
}

function clearSelected() {
  removeSelectedClass(this._curSelectedEls)
  this._curSelectedEls = []
}

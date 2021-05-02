import ComputedStrategy from './strategy/ComputedStrategy'
import { SELECT_PAYLOAD, SELECTED_CLASS } from '../../const'
import { removeClass, addClass } from '../../utils/dom'
import { merge } from '../../utils/util'

export default function ElManager(strategy, mode = 'toggle') {
  if (!(strategy instanceof ComputedStrategy)) {
    throw new Error('invalid strategy')
  }
  this._mode = mode
  this._elements = []
  this._dynamicSelected = []
  this._savedSelected = []
  this._computedStrategy = strategy
}

// [2, 4, 7, 8] + [1, 2, 7] = [4, 8], [1] + [2, 7]
// 分析集合数据，返回唯一元素集合和重复元素集合
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

merge(ElManager.prototype, {
  initStrategy,
  setSelectable,
  select,
  updateSelected,
  save,
  getDiff,
  cleanSelected
})

function initStrategy(...args) {
  this._computedStrategy.init(...args)
  this._computedStrategy.addElements(this._elements)
}

function setSelectable(els) {
  this._elements = Array.prototype.concat.call(els)
}

function select(area) {
  if (Object.prototype.toString.call(area) !== '[object Array]') {
    throw new Error('area should be an array!')
  }
  const selectedElements = this._computedStrategy.getElements(area)
  this.updateSelected(selectedElements)
  return selectedElements
}

function updateSelected(els) {
  const active = this._dynamicSelected
  const diffInfo = analyzeSetDiff(active, els)
  const activeOwn = diffInfo.diff[0]
  const elsOwn = diffInfo.diff[1]

  for (let i = 0; i < activeOwn.length; i++) {
    const payload = activeOwn[i][SELECT_PAYLOAD]
    if (this._mode === 'toggle') {
      if (payload.saved) {
        addClass(activeOwn[i], SELECTED_CLASS)
      } else {
        removeClass(activeOwn[i], SELECTED_CLASS)
      }
    } else if ((this._mode === 'append' && !payload.saved) || this._mode === 'disposable') {
      removeClass(activeOwn[i], SELECTED_CLASS)
    }
    payload.activated = false
  }

  for (let i = 0; i < elsOwn.length; i++) {
    const el = elsOwn[i]
    if (!Object.prototype.hasOwnProperty.call(el, SELECT_PAYLOAD)) {
      Object.defineProperty(el, SELECT_PAYLOAD, {
        configurable: true,
        enumerable: false,
        writable: false,
        value: {
          saved: false, // 已保存的选中态
          activated: false // 当前是否被框选
        }
      })
    }
    const payload = el[SELECT_PAYLOAD]
    if (this._mode === 'toggle') {
      if (payload.saved) {
        removeClass(el, SELECTED_CLASS)
      } else {
        addClass(el, SELECTED_CLASS)
      }
    } else if ((this._mode === 'append' && !payload.saved) || this._mode === 'disposable') {
      addClass(el, SELECTED_CLASS)
    }
    payload.activated = true
  }
  this._dynamicSelected = diffInfo.duplicate.concat(elsOwn)
}

function save() {
  for (let i = 0; i < this._dynamicSelected.length; i++) {
    const payload = this._dynamicSelected[i][SELECT_PAYLOAD]
    if (this._mode === 'toggle') {
      payload.saved = payload.saved ? !payload.activated : payload.activated
    } else {
      payload.saved = true
    }
  }
  const diff = this.getDiff()
  this._savedSelected = diff.selected
  this._dynamicSelected = []
  return diff
}

function getDiff() {
  const diffInfo = analyzeSetDiff(this._savedSelected, this._dynamicSelected)
  if (this._mode === 'toggle') {
    return {
      added: diffInfo.diff[1],
      removed: diffInfo.duplicate,
      selected: diffInfo.diff[1].concat(diffInfo.diff[0])
    }
  } else if (this._mode === 'append') {
    return {
      added: diffInfo.diff[1],
      removed: [],
      selected: this._savedSelected.concat(diffInfo.diff[1])
    }
  } else {
    return {
      added: this._dynamicSelected.concat(),
      removed: [],
      selected: this._dynamicSelected.concat()
    }
  }
}

function cleanSelected() {
  for (let i = 0; i < this._savedSelected.length; i++) {
    this._savedSelected[i][SELECT_PAYLOAD].saved = false
    this._savedSelected[i][SELECT_PAYLOAD].activated = false
    removeClass(this._savedSelected[i], SELECTED_CLASS)
  }
  this._savedSelected = []
}

import { getStyles } from '../utils/dom'

export default function Selection() {
  this.el = null
  this._visible = false
  this._styleText = ''
}

Selection.prototype.init = function(parent, selectionClassName = 'coverable-selection') {
  if (!parent) {
    throw new Error('Selection: invalid parent node')
  }
  if (this.el) {
    return
  }
  // 为父元素添加相对定位样式
  const position = getStyles(parent).position
  if (['fixed', 'absolute', 'relative'].indexOf(position) === -1) {
    parent.classList.add('coverable-parent--relative')
  }

  const selection = document.createElement('div')
  selection.className = selectionClassName
  this.el = selection
  this._visible = false
  parent.appendChild(selection)
}

Selection.prototype.show = function() {
  if (!this.el || this._visible) {
    return
  }
  this._visible = true
}

Selection.prototype.hide = function() {
  if (!this.el || !this._visible) {
    return
  }
  this._visible = false
  this.el.style.cssText = 'display: none;'
}

Selection.prototype.update = function(x, y, width, height) {
  if (!this.el || !this._visible) {
    return
  }
  let _styleText = `position: absolute; top: ${y}px; left: ${x}px; `
  const translations = []
  if (width < 0) {
    translations.push(`translateX(${width}px)`)
    width = -width
  }
  if (height < 0) {
    translations.push(`translateY(${height}px)`)
    height = -height
  }
  const transformText = translations.length ? ' transform: ' + translations.join(' ') + ';' : ''
  _styleText = _styleText + `width: ${width}px; height: ${height}px;` + transformText
  this._styleText = _styleText
  this.el.style.cssText = this._styleText
}

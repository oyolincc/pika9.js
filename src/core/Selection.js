import {
  getStyleProperty,
  addClass,
  removeClass
} from '../utils/dom'

const MAIN_CLASS = 'pika9-selection'
const PARENT_CLASS = MAIN_CLASS + '-parent'
const PARENT_RELATIVE_CLASS = PARENT_CLASS + '--relative'

export default function Selection(parent) {
  this.el = null
  this._parent = parent
  this._staticStyle = ''

  // visible响应式改变元素className
  let visible = undefined
  Object.defineProperty(this, '_visible', {
    enumerable: false,
    configurable: false,
    get() {
      return visible
    },
    set(value) {
      value = !!value
      if (value !== visible && this.el) {
        this.el.style.cssText = value ? this._staticStyle : 'display: none;'
      }
      visible = value
    }
  })
}

Selection.prototype.unmount = function() {
  this.el && this.el.remove()
  removeClass(this._parent, PARENT_CLASS)
  removeClass(this._parent, PARENT_RELATIVE_CLASS)
}

Selection.prototype.mount = function() {
  const parent = this._parent
  if (!this.el) {
    const selection = document.createElement('div')
    selection.className = MAIN_CLASS
    this.el = selection
    this._visible = false
    addClass(parent, PARENT_CLASS)
  }
  parent.appendChild(this.el)
}

Selection.prototype.show = function() {
  // 为父元素添加相对定位样式
  const parent = this._parent
  const position = getStyleProperty(parent, 'position')
  if (['fixed', 'absolute', 'relative'].indexOf(position) === -1) {
    addClass(parent, PARENT_RELATIVE_CLASS)
  }
  
  this._visible = true
}

Selection.prototype.hide = function() {
  this._visible = false
}

Selection.prototype.update = function(left, top, width, height) {
  if (!this.el || !this._visible) {
    return
  }
  const styles = [
    'position: absolute',
    `top: ${top}px`,
    `left: ${left}px`
  ]
  const translations = []
  if (width < 0) {
    translations.push(`translateX(${width}px)`)
    width = -width
  }
  if (height < 0) {
    translations.push(`translateY(${height}px)`)
    height = -height
  }

  styles.push(`width: ${width}px`)
  styles.push(`height: ${height}px`)

  if (translations.length) {
    styles.push('transform: ' + translations.join(' '))
  }

  const styleText = styles.join('; ')
  this._staticStyle = styleText
  this.el.style.cssText = styleText
}

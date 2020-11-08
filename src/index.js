import { isDom } from './utils/dom'
import setCoverable from './core/setCoverable'

function Coverable(options) {
  if (!window || !document) {
    throw new Error('make sure you run Coverable.js in bowser')
  }
  const el = options.parent
  const children = options.children
  const parent = isDom(el) ? el : document.querySelector(el)
  let childNodes = null
  try {
    if (typeof children !== 'string') {
      childNodes = Array.prototype.slice.call(children)
    } else {
      childNodes = Array.prototype.slice.call(parent.querySelectorAll(children))
    }
  } catch (err) {
    throw new Error('invalid children nodes')
  }

  if (!parent || parent.nodeType !== 1) {
    throw new Error('invalid parent node')
  }

  this._options = {
    parent,
    childNodes,
    threshold: options.threshold || 100,
    onStart: options.onStart || null,
    onHold: options.onHold || null,
    onEnd: options.onEnd || null
  }
}

Coverable.prototype.init = function() {
  setCoverable(this._options)
}

export default Coverable

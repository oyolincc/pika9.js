
export function isDom(node) {
  return typeof node === 'object' && node.nodeType !== undefined
}

export function getStyles(el) {
  return document.defaultView.getComputedStyle(el, null)
}

// export function 

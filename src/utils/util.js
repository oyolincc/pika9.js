export function merge(dest, src, byDest = false) {
  const props = Object.getOwnPropertyNames(src)
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    if (byDest && !Object.prototype.hasOwnProperty.call(dest, prop)) {
      continue
    }
    dest[prop] = src[prop]
  }

  return dest
}

export function flatten(arr, result = []) {
  if (typeof arr !== 'object' || !Object.prototype.hasOwnProperty.call(arr, 'length')) {
    result.push(arr)
    return result
  }

  const diveArr = Array.prototype.slice.call(arr)
  for (let i = 0; i < diveArr.length; i++) {
    flatten(arr[i], result)
  }

  return result
}

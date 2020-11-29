export default function merge(dest, src, redefine = true) {
  const props = Object.getOwnPropertyNames(src)
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    if (!redefine && Object.prototype.hasOwnProperty.call(dest, prop)) {
      continue
    }
    dest[prop] = src[prop]
  }

  return dest
}

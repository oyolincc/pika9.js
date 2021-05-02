/**
 * 获取元素的顶点坐标，暂时不支持旋转/倾斜拉伸
 * @param {HTMLElement|Node} element 
 */
export function getShapePoints(element, offsetX = 0, offsetY = 0) {
  const rect = element.getBoundingClientRect()
  const offsetLeft = rect.left + offsetX
  const offsetTop = rect.top + offsetY
  return [
    { x: offsetLeft, y: offsetTop },
    { x: offsetLeft + rect.width, y: offsetTop },
    { x: offsetLeft + rect.width, y: offsetTop + rect.height },
    { x: offsetLeft, y: offsetTop + rect.height }
  ]
}

// 计算多个点的平均点
export function getAveragePoint(points) {
  if (!points.length) {
    return null
  }
  const point = points.reduce((totalPoint, point) => {
    totalPoint.x += point.x
    totalPoint.y += point.y
    return totalPoint
  }, { x: 0, y: 0 })
  point.x /= points.length
  point.y /= points.length

  return point
}

export function toArea(sp, ap) {
  let minX = 0, minY = 0, maxX = 0, maxY = 0
  if (sp.x > ap.x) {
    minX = ap.x
    maxX = sp.x
  } else {
    minX = sp.x
    maxX = ap.x
  }
  if (sp.y > ap.y) {
    minY = ap.y
    maxY = sp.y
  } else {
    minY = sp.y
    maxY = ap.y
  }
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY }
  ]
}

export function isSamePoint(point1, point2) {
  return point1 === point2 || (point1.x === point2.x && point1.y === point2.y)
}

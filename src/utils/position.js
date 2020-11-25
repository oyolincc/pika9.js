
/**
 * 偏移点是否在元素content之外
 * @param {HTMLElement|Node} element 
 * @param {object} offsetPoint 
 */
export function isOutOfContent(element, offsetPoint) {
  const { x, y } = offsetPoint
  return x <= 0 || y <= 0 || x >= element.clientWidth + element.scrollLeft || y >= element.clientHeight + element.scrollTop
}

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

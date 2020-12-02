import { merge } from '../../utils/util'
import { getShapePoints, getAveragePoint } from '../../utils/position'

const defaultOptions = {
  parent: null,
  elements: [] //参与策略的元素
}

/**
 * 基于Coordinate System坐标系的交集策略
 * @param {object} baseOptions 基本配置
 * @param {number} offsetX 横向偏移 
 * @param {number} offsetY 纵向偏移 
 */
export default function CSYSStrategy(baseOptions, offsetX, offsetY) {
  baseOptions = merge({ ...defaultOptions }, baseOptions || {})
  const origin = baseOptions.origin
  delete baseOptions.origin
  this._options = Object.freeze(baseOptions)
  this.init(origin, offsetX, offsetY)
}

CSYSStrategy.prototype.start = function(startEv) {
  const { contentX, contentY, offsetX, offsetY } = startEv.startPoint
  this.init({ x: contentX, y: contentY }, offsetX, offsetY)
  this.addElements(this._options.elements)
}

CSYSStrategy.prototype.hold = function(holdEv) {
  const point = holdEv.activePoint
  return this.getElementsRelative({
    x: point.contentX,
    y: point.contentY
  })
}

CSYSStrategy.prototype.end = function(endEv) {
  const point = endEv.activePoint
  return this.getElementsRelative({
    x: point.contentX,
    y: point.contentY
  })
}

CSYSStrategy.prototype.init = function(origin, offsetX, offsetY) {
  // 坐标原点
  this._origin = origin || { x: 0, y: 0 }
  this._offsetX = offsetX || 0
  this._offsetY = offsetY || 0
  // 象限数据
  this._quadrants = [0, 0, 0, 0].map(() => ({
    items: [],
    sortType: '', // 按x还是y大小的方式排序，有表示已排序
    x: {
      total: 0, // 所有中心点横坐标之和
      dispersion: 0 // x方向中心点的离散程度
    },
    y: {
      total: 0, // 所有中心点纵坐标之和
      dispersion: 0 // y方向中心点的离散程度
    }
  }))
}

CSYSStrategy.prototype.add = function(element) {
  // 元素的平均点
  const averagePoint = getAveragePoint(getShapePoints(element, -this._offsetX, -this._offsetY))
  const item = {
    // avgPoint: averagePoint,
    avgOriginPoint: this._getCSYSPoint(averagePoint),
    absOriginPoint: null,
    element
  }
  item.absOriginPoint = {
    x: Math.abs(item.avgOriginPoint.x),
    y: Math.abs(item.avgOriginPoint.y)
  }

  const quadrant = this._getQuadrant(item.avgOriginPoint)
  quadrant.items.push(item)
  quadrant.sortType = '' // 清除排序标志
  quadrant.x.total += item.avgOriginPoint.x
  quadrant.y.total += item.avgOriginPoint.y
}

CSYSStrategy.prototype.addElements = function(els) {
  if (els.length !== undefined) {
    let i = -1
    while (++i < els.length) {
      this.add(els[i])
    }
  } else {
    this.add(els)
  }
}

// 根据坐标获取象限数据
CSYSStrategy.prototype._getCSYSPoint = function(point) {
  return {
    x: point.x - this._origin.x,
    y: point.y - this._origin.y
  }
}

// 根据基于原点的坐标获取象限数据
CSYSStrategy.prototype._getQuadrant = function(point) {
  if (point.x >= 0) {
    if (point.y > 0) {
      return this._quadrants[0]
    } else {
      return this._quadrants[3]
    }
  } else {
    if (point.y > 0) {
      return this._quadrants[1]
    } else {
      return this._quadrants[2]
    }
  }
}

// 计算离散度
CSYSStrategy.prototype._calcDispersion = function(quadrant, type) {
  const items = quadrant.items
  const directionInfo = quadrant[type]
  const average = directionInfo.total / items.length
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    directionInfo.dispersion += Math.abs(item.avgOriginPoint[type] - average)
  }
}

CSYSStrategy.prototype._sort = function() {
  // 计算各个象限的x y方向离散程度；生成排序数组
  for (let i = 0; i < 4; i++) {
    this._sortQuadrant(this._quadrants[i])
  }
}

// 象限数据进行排序
CSYSStrategy.prototype._sortQuadrant = function(quadrant) {
  if (quadrant.sortType) {
    return
  }

  const items = quadrant.items
  this._calcDispersion(quadrant, 'x')
  this._calcDispersion(quadrant, 'y')

  let sortType = ''
  let otherType = ''
  // 离散程度大的方向遍历能减少查找次数
  if (quadrant.x.dispersion > quadrant.y.dispersion) {
    sortType = quadrant.sortType = 'x'
    otherType = 'y'
  } else {
    sortType = quadrant.sortType = 'y'
    otherType = 'x'
  }

  items.sort((item1, item2) => {
    const absPoint1 = item1.absOriginPoint
    const absPoint2 = item2.absOriginPoint
    return absPoint1[sortType] === absPoint2[sortType] ?
      absPoint1[otherType] - absPoint2[otherType] : absPoint1[sortType] - absPoint2[sortType]
  })
}

CSYSStrategy.prototype.getElementsRelative = function(point) {
  return this.getElements(this._getCSYSPoint(point))
}

/**
 * 获取原点到点point的区域覆盖的元素
 */
CSYSStrategy.prototype.getElements = function(point) {
  const { x, y } = point
  if (!x || !y) {
    return []
  }

  const quadrant = this._getQuadrant(point)
  if (!quadrant.sortType) {
    this._sortQuadrant(quadrant)
  }

  const absPoint = {
    x: Math.abs(x),
    y: Math.abs(y)
  }
  const sortType = quadrant.sortType
  const otherType = sortType === 'x' ? 'y' : 'x'

  const result = []
  for (let i = 0; i < quadrant.items.length; i++) {
    const item = quadrant.items[i]
    if (item.absOriginPoint[sortType] > absPoint[sortType]) {
      // 可以不用继续比较
      break
    }
    if (item.absOriginPoint[otherType] <= absPoint[otherType]) {
      result.push(item.element)
    }
  }

  return result
}


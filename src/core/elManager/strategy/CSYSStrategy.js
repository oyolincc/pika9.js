import { getShapePoints, getAveragePoint, isSamePoint } from '../../../utils/position'
import ComputedStrategy from './ComputedStrategy'
import { merge } from '../../../utils/util'

/**
 * 基于Coordinate System坐标系的交集策略
 * @param {object} baseOptions 基本配置
 * @param {number} offsetX 横向偏移 
 * @param {number} offsetY 纵向偏移 
 */
export default function CSYSStrategy(options) {
  ComputedStrategy.call(this)
  this.init(options || {})
}

CSYSStrategy.prototype = Object.create(ComputedStrategy.prototype)

merge(CSYSStrategy.prototype, {
  _computeCSYSPoint,
  _getOriginQuadrant,
  _sortQuadrant,
  _calcDispersion,
  init,
  add,
  getElements
})

function _computeCSYSPoint(point) {
  return {
    x: point.x - this._origin.x,
    y: point.y - this._origin.y
  }
}

// 根据基于原点的坐标获取象限数据
function _getOriginQuadrant(point) {
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

// 象限数据进行排序
function _sortQuadrant(quadrant) {
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

// 计算离散度
function _calcDispersion(quadrant, type) {
  const items = quadrant.items
  const directionInfo = quadrant[type]
  const average = directionInfo.total / items.length
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    directionInfo.dispersion += Math.abs(item.avgOriginPoint[type] - average)
  }
}

function init(options) {
  if (!options) {
    throw new Error('invalid options!')
  }
  // 坐标原点
  this._origin = options.origin ? { x: options.origin.x, y: options.origin.y } : { x: 0, y: 0 }
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

function add(element) {
  // 元素的平均点
  const averagePoint = getAveragePoint(getShapePoints(element))
  const item = {
    // avgPoint: averagePoint,
    avgOriginPoint: this._computeCSYSPoint(averagePoint),
    absOriginPoint: null,
    element
  }
  item.absOriginPoint = {
    x: Math.abs(item.avgOriginPoint.x),
    y: Math.abs(item.avgOriginPoint.y)
  }
  const quadrant = this._getOriginQuadrant(item.avgOriginPoint)
  quadrant.items.push(item)
  quadrant.sortType = '' // 清除排序标志
  quadrant.x.total += item.avgOriginPoint.x
  quadrant.y.total += item.avgOriginPoint.y
}

function getElements(area) {
  let point = null
  const origin = this._origin

  if (isSamePoint(origin, area[0])) {
    point = this._computeCSYSPoint(area[2])
  } else if (isSamePoint(origin, area[1])) {
    point = this._computeCSYSPoint(area[3])
  } else if (isSamePoint(origin, area[2])) {
    point = this._computeCSYSPoint(area[0])
  } else {
    point = this._computeCSYSPoint(area[1])
  }
  const { x, y } = point
  if (!x || !y) {
    return []
  }

  const quadrant = this._getOriginQuadrant(point)
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

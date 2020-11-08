import Point from './Point'

// Coordinate System 坐标系
function CSYS(originPoint) {
  if (!(originPoint instanceof Point)) {
    throw new Error('CSYS: invalid origin point')
  }

  this._origin = originPoint
  this._quadrants = [0, 0, 0, 0].map(() => ({
    samples: [],
    sortType: '',
    sorts: [],
    x: {
      total: 0,
      dispersion: 0 // x方向中心点的离散程度
    },
    y: {
      total: 0,
      dispersion: 0 // y方向中心点的离散程度
    }
  }))
}

CSYS.prototype.add = function(elements) {
  if (typeof elements !== 'object') {
    throw new Error('CSYS: invalid elements')
  }
  if (length in elements) {
    let i = -1
    while (++i < elements.length) {
      this.addElement(elements[i])
    }
  } else {
    this.addElement(elements)
  }
  this.sort()
}

CSYS.prototype.addElement = function(element) {
  const deltaX = element.offsetLeft - this._origin.getX() + (element.offsetWidth >> 1)
  const deltaY = element.offsetTop - this._origin.getY() + (element.offsetHeight >> 1)
  const item = {
    mX: deltaX,
    mY: deltaY,
    element
  }

  const quadrant = this.getQuadrantByXY(deltaX, deltaY)
  quadrant.samples.push(item)
  quadrant.x.total += item.mX
  quadrant.y.total += item.mY
}

/**
 * 获取原点到点(x, y)的区域覆盖的点
 * @param {Number} x 
 * @param {Number} y 
 */
CSYS.prototype.get = function(x, y) {
  const deltaX = x - this._origin.getX()
  const deltaY = y - this._origin.getY()
  if (!deltaX || !deltaY) {
    return []
  }

  const quadrant = this.getQuadrantByXY(deltaX, deltaY)
  let sortAbs = ''
  let mapAbs = ''
  if (quadrant.sortType === 'x') {
    sortAbs = Math.abs(deltaX)
    mapAbs = Math.abs(deltaY)
  } else {
    sortAbs = Math.abs(deltaY)
    mapAbs = Math.abs(deltaX)
  }

  const result = []
  for (let i = 0; i < quadrant.sorts.length; i++) {
    const item = quadrant.sorts[i]
    if (item.abs > sortAbs) {
      // 可以不用继续比较
      break
    }
    if (item.mapAbs <= mapAbs) {
      result.push(item.sample.element)
    }
  }

  return result
}

CSYS.prototype.getQuadrantByXY = function(x, y) {
  if (x >= 0) {
    if (y > 0) {
      return this._quadrants[0]
    } else {
      return this._quadrants[3]
    }
  } else {
    if (y > 0) {
      return this._quadrants[1]
    } else {
      return this._quadrants[2]
    }
  }
}

CSYS.prototype.calcDispersion = function(quadrant, type) {
  const samples = quadrant.samples
  const payload = quadrant[type]
  const average = payload.total / samples.length
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    payload.dispersion += Math.abs(sample[`m${type.toUpperCase()}`] - average)
  }
}

CSYS.prototype.sort = function() {
  // 计算各个象限的x y方向离散程度；生成排序数组
  for (let i = 0; i < 4; i++) {
    const quadrant = this._quadrants[i]
    const samples = quadrant.samples
    this.calcDispersion(quadrant, 'x')
    this.calcDispersion(quadrant, 'y')

    let sortType = ''
    let mapType = ''
    const sorts = []
    if (quadrant.x.dispersion > quadrant.y.dispersion) {
      sortType = quadrant.sortType = 'x'
      mapType = 'y'
    } else {
      sortType = quadrant.sortType = 'y'
      mapType = 'x'
    }

    for (let j = 0; j < samples.length; j++) {
      const sample = samples[j]
      sorts.push({
        abs: Math.abs(sample[`m${sortType.toUpperCase()}`]),
        sample,
        mapAbs: Math.abs(sample[`m${mapType.toUpperCase()}`])
      })
    }
    quadrant.sorts = sorts.sort((item1, item2) => (item1.abs - item2.abs))
  }
}

export default CSYS
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
  const centerPoint = new Point(
    element.offsetLeft - this._origin.getX() + (element.offsetWidth >> 1),
    element.offsetTop - this._origin.getY() + (element.offsetHeight >> 1)
  )
  const item = {
    centerPoint,
    element
  }

  const quadrant = this.getQuadrant(centerPoint)
  quadrant.samples.push(item)
  quadrant.x.total += centerPoint.getX()
  quadrant.y.total += centerPoint.getY()
}

/**
 * 获取原点到点(x, y)的区域覆盖的点
 * @param {Number} x 
 * @param {Number} y 
 */
CSYS.prototype.get = function(point) {
  const { x, y } = point.minus(this._origin)
  if (!x || !y) {
    return []
  }

  const quadrant = this.getQuadrant(new Point(x, y))
  let sortAbs = ''
  let mapAbs = ''
  if (quadrant.sortType === 'x') {
    sortAbs = Math.abs(x)
    mapAbs = Math.abs(y)
  } else {
    sortAbs = Math.abs(y)
    mapAbs = Math.abs(x)
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

// 根据坐标获取象限数据
CSYS.prototype.getQuadrant = function(point) {
  const { x, y } = point.get()
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

// 计算离散度
CSYS.prototype.calcDispersion = function(quadrant, type) {
  const samples = quadrant.samples
  const payload = quadrant[type]
  const average = payload.total / samples.length
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i]
    payload.dispersion += Math.abs(sample.centerPoint.get()[type] - average)
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
      const centerXY = sample.centerPoint.get()
      sorts.push({
        abs: Math.abs(centerXY[sortType]),
        sample,
        mapAbs: Math.abs(centerXY[mapType])
      })
    }
    quadrant.sorts = sorts.sort((item1, item2) => (item1.abs - item2.abs))
  }
}

export default CSYS
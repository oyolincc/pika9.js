import Point from './Point'
import Selection from './Selection'
import CSYS from './CSYS'
import throttle from '../utils/throttle'

function setCoverable(options) {
  let holdOn = false
  let startPoint = null
  let calc = null // 基于父元素内容的坐标点计算器
  let csys = null
  const {
    parent,
    childNodes,
    threshold,
    onStart,
    onHold,
    onEnd
  } = options

  // 框选元素初始化
  const selection = new Selection()
  selection.init(parent)
  // 节流
  const throttledOnHold = onHold ? throttle(threshold, function(csys, point) {
    onHold(csys.get(point.getX(), point.getY()))
  }) : () => {}

  function mouseDownHandler(e) {
    if (holdOn) {
      return
    }

    calc = getParentCalculator(parent)
    startPoint = calc(e.clientX, e.clientY)
    if (isOutContent(parent, startPoint)) {
      return
    }

    csys = new CSYS(startPoint)
    csys.add(childNodes)
    selection.show()
    holdOn = true
    onStart && onStart()
  }

  function mouseMoveHandler(e) {
    if (!holdOn) {
      return
    }
    const point = calc(e.clientX, e.clientY)
    
    selection.update(
      startPoint.getX(),
      startPoint.getY(),
      point.getX() - startPoint.getX(),
      point.getY() - startPoint.getY()
    )

    throttledOnHold(csys, point)
  }

  function mouseUpHandler(e) {
    if (!holdOn) {
      return
    }
    const point = calc(e.clientX, e.clientY)
    selection.hide()
    holdOn = false
    onEnd && onEnd(csys.get(point.getX(), point.getY()))
  }

  parent.addEventListener('mousedown', mouseDownHandler)
  parent.addEventListener('mousemove', mouseMoveHandler)
  parent.addEventListener('mouseup', mouseUpHandler)
}

function isOutContent(parent, point) {
  const x = point.getX()
  const y = point.getY()
  return x <= 0 || y <= 0 || x >= parent.clientWidth + parent.scrollLeft || y >= parent.clientHeight + parent.scrollTop
}

function getParentCalculator(parent) {
  const pos = parent.getBoundingClientRect()
  const parentCornerPoint = new Point(pos.left, pos.top)
  const styles = document.defaultView.getComputedStyle(parent, null)
  const borderWidth = styles.borderWidth ? Number(styles.borderWidth.split('px')[0]) : 0

  return function(x, y) {
    return new Point(
      x + parent.scrollLeft - parentCornerPoint.getX() - borderWidth,
      y + parent.scrollTop - parentCornerPoint.getY() - borderWidth
    )
  }
}

export default setCoverable

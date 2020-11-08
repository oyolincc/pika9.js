export default function Point(x, y) {
  this.setX(x)
  this.setY(y)
}

Point.prototype.setX = function(x) {
  this._x = x
}

Point.prototype.getX = function() {
  return this._x
}

Point.prototype.setY = function(y) {
  this._y = y
}

Point.prototype.getY = function() {
  return this._y
}

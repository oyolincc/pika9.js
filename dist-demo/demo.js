'use strict';

function isDom(node) {
  return typeof node === 'object' && node.nodeType !== undefined
}

function getStyles(el) {
  return document.defaultView.getComputedStyle(el, null)
}

// export function

function Point(x, y) {
  this.setX(x);
  this.setY(y);
}

Point.prototype.setX = function(x) {
  this._x = x;
};

Point.prototype.getX = function() {
  return this._x
};

Point.prototype.setY = function(y) {
  this._y = y;
};

Point.prototype.getY = function() {
  return this._y
};

Point.prototype.get = function() {
  return {
    x: this._x,
    y: this._y
  }
};

Point.prototype.minus = function(point) {
  return {
    x: this._x - point.getX(),
    y: this._y - point.getY()
  }
};

function Selection() {
  this.el = null;
  this._visible = false;
  this._styleText = '';
}

Selection.prototype.init = function(parent, selectionClassName = 'coverable-selection') {
  if (!parent) {
    throw new Error('Selection: invalid parent node')
  }
  if (this.el) {
    return
  }
  // 为父元素添加相对定位样式
  const position = getStyles(parent).position;
  if (['fixed', 'absolute', 'relative'].indexOf(position) === -1) {
    parent.classList.add('coverable-parent--relative');
  }

  const selection = document.createElement('div');
  selection.className = selectionClassName;
  this.el = selection;
  this._visible = false;
  parent.appendChild(selection);
};

Selection.prototype.show = function() {
  if (!this.el || this._visible) {
    return
  }
  this._visible = true;
};

Selection.prototype.hide = function() {
  if (!this.el || !this._visible) {
    return
  }
  this._visible = false;
  this.el.style.cssText = 'display: none;';
};

Selection.prototype.update = function(x, y, width, height) {
  if (!this.el || !this._visible) {
    return
  }
  let _styleText = `position: absolute; top: ${y}px; left: ${x}px; `;
  const translations = [];
  if (width < 0) {
    translations.push(`translateX(${width}px)`);
    width = -width;
  }
  if (height < 0) {
    translations.push(`translateY(${height}px)`);
    height = -height;
  }
  const transformText = translations.length ? ' transform: ' + translations.join(' ') + ';' : '';
  _styleText = _styleText + `width: ${width}px; height: ${height}px;` + transformText;
  this._styleText = _styleText;
  this.el.style.cssText = this._styleText;
};

// Coordinate System 坐标系
function CSYS(originPoint) {
  if (!(originPoint instanceof Point)) {
    throw new Error('CSYS: invalid origin point')
  }

  this._origin = originPoint;
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
  }));
}

CSYS.prototype.add = function(elements) {
  if (typeof elements !== 'object') {
    throw new Error('CSYS: invalid elements')
  }
  if (length in elements) {
    let i = -1;
    while (++i < elements.length) {
      this.addElement(elements[i]);
    }
  } else {
    this.addElement(elements);
  }
  this.sort();
};

CSYS.prototype.addElement = function(element) {
  const centerPoint = new Point(
    element.offsetLeft - this._origin.getX() + (element.offsetWidth >> 1),
    element.offsetTop - this._origin.getY() + (element.offsetHeight >> 1)
  );
  const item = {
    centerPoint,
    element
  };

  const quadrant = this.getQuadrant(centerPoint);
  quadrant.samples.push(item);
  quadrant.x.total += centerPoint.getX();
  quadrant.y.total += centerPoint.getY();
};

/**
 * 获取原点到点(x, y)的区域覆盖的点
 * @param {Number} x 
 * @param {Number} y 
 */
CSYS.prototype.get = function(point) {
  const { x, y } = point.minus(this._origin);
  if (!x || !y) {
    return []
  }

  const quadrant = this.getQuadrant(new Point(x, y));
  let sortAbs = '';
  let mapAbs = '';
  if (quadrant.sortType === 'x') {
    sortAbs = Math.abs(x);
    mapAbs = Math.abs(y);
  } else {
    sortAbs = Math.abs(y);
    mapAbs = Math.abs(x);
  }

  const result = [];
  for (let i = 0; i < quadrant.sorts.length; i++) {
    const item = quadrant.sorts[i];
    if (item.abs > sortAbs) {
      // 可以不用继续比较
      break
    }
    if (item.mapAbs <= mapAbs) {
      result.push(item.sample.element);
    }
  }

  return result
};

// 根据坐标获取象限数据
CSYS.prototype.getQuadrant = function(point) {
  const { x, y } = point.get();
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
};

// 计算离散度
CSYS.prototype.calcDispersion = function(quadrant, type) {
  const samples = quadrant.samples;
  const payload = quadrant[type];
  const average = payload.total / samples.length;
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    payload.dispersion += Math.abs(sample.centerPoint.get()[type] - average);
  }
};

CSYS.prototype.sort = function() {
  // 计算各个象限的x y方向离散程度；生成排序数组
  for (let i = 0; i < 4; i++) {
    const quadrant = this._quadrants[i];
    const samples = quadrant.samples;
    this.calcDispersion(quadrant, 'x');
    this.calcDispersion(quadrant, 'y');

    let sortType = '';
    let mapType = '';
    const sorts = [];
    if (quadrant.x.dispersion > quadrant.y.dispersion) {
      sortType = quadrant.sortType = 'x';
      mapType = 'y';
    } else {
      sortType = quadrant.sortType = 'y';
      mapType = 'x';
    }

    for (let j = 0; j < samples.length; j++) {
      const sample = samples[j];
      const centerXY = sample.centerPoint.get();
      sorts.push({
        abs: Math.abs(centerXY[sortType]),
        sample,
        mapAbs: Math.abs(centerXY[mapType])
      });
    }
    quadrant.sorts = sorts.sort((item1, item2) => (item1.abs - item2.abs));
  }
};

function throttle (delay, noTrailing, callback, debounceMode) {
	let timeoutID;
	let cancelled = false;
	let lastExec = 0;

	function clearExistingTimeout() {
		if (timeoutID) {
			clearTimeout(timeoutID);
		}
	}

	function cancel() {
		clearExistingTimeout();
		cancelled = true;
	}

	if (typeof noTrailing !== 'boolean') {
		debounceMode = callback;
		callback = noTrailing;
		noTrailing = undefined;
	}

	function wrapper(...arguments_) {
		let self = this;
		let elapsed = Date.now() - lastExec;

		if (cancelled) {
			return
		}

		function exec() {
			lastExec = Date.now();
			callback.apply(self, arguments_);
		}

		function clear() {
			timeoutID = undefined;
		}

		if (debounceMode && !timeoutID) {
			exec();
		}

		clearExistingTimeout();

		if (debounceMode === undefined && elapsed > delay) {
			exec();
		} else if (noTrailing !== true) {
			timeoutID = setTimeout(
				debounceMode ? clear : exec,
				debounceMode === undefined ? delay - elapsed : delay
			);
		}
	}

	wrapper.cancel = cancel;

	return wrapper
}

function setCoverable(options) {
  let holdOn = false;
  let startPoint = null;
  let calc = null; // 基于父元素内容的坐标点计算器
  let csys = null;
  const {
    parent,
    childNodes,
    threshold,
    onStart,
    onHold,
    onEnd
  } = options;

  // 框选元素初始化
  const selection = new Selection();
  selection.init(parent);
  // 节流
  const throttledOnHold = onHold ? throttle(threshold, function(csys, point) {
    onHold(point.get(), csys.get(point));
  }) : () => {};

  function mouseDownHandler(e) {
    if (holdOn) {
      return
    }

    calc = getParentCalculator(parent);
    startPoint = calc(e.clientX, e.clientY);
    if (isOutContent(parent, startPoint)) {
      return
    }

    csys = new CSYS(startPoint);
    csys.add(childNodes);
    selection.show();
    holdOn = true;
    onStart && onStart(startPoint.get());
  }

  function mouseMoveHandler(e) {
    if (!holdOn) {
      return
    }
    const point = calc(e.clientX, e.clientY);
    
    selection.update(
      startPoint.getX(),
      startPoint.getY(),
      point.getX() - startPoint.getX(),
      point.getY() - startPoint.getY()
    );

    throttledOnHold(csys, point);
  }

  function mouseUpHandler(e) {
    if (!holdOn) {
      return
    }
    const point = calc(e.clientX, e.clientY);
    selection.hide();
    holdOn = false;
    onEnd && onEnd(point.get(), csys.get(point));
  }

  parent.addEventListener('mousedown', mouseDownHandler);
  parent.addEventListener('mousemove', mouseMoveHandler);
  parent.addEventListener('mouseup', mouseUpHandler);
}

function isOutContent(parent, point) {
  const { x, y } = point.get();
  return x <= 0 || y <= 0 || x >= parent.clientWidth + parent.scrollLeft || y >= parent.clientHeight + parent.scrollTop
}

function getParentCalculator(parent) {
  const pos = parent.getBoundingClientRect();
  const parentCornerPoint = new Point(pos.left, pos.top);
  const styles = getStyles(parent);
  const borderWidth = styles.borderWidth ? Number(styles.borderWidth.split('px')[0]) : 0;

  return function(x, y) {
    return new Point(
      x + parent.scrollLeft - parentCornerPoint.getX() - borderWidth,
      y + parent.scrollTop - parentCornerPoint.getY() - borderWidth
    )
  }
}

function Coverable(options) {
  if (!window || !document) {
    throw new Error('make sure you run Coverable.js in bowser')
  }
  const el = options.parent;
  const children = options.children;
  const parent = isDom(el) ? el : document.querySelector(el);
  let childNodes = null;
  try {
    if (typeof children !== 'string') {
      childNodes = Array.prototype.slice.call(children);
    } else {
      childNodes = Array.prototype.slice.call(parent.querySelectorAll(children));
    }
  } catch (err) {
    throw new Error('invalid children nodes')
  }

  if (!parent || parent.nodeType !== 1) {
    throw new Error('invalid parent node')
  }

  this._options = {
    parent,
    childNodes,
    threshold: options.threshold || 100,
    onStart: options.onStart || null,
    onHold: options.onHold || null,
    onEnd: options.onEnd || null
  };
}

Coverable.prototype.init = function() {
  setCoverable(this._options);
};

const coverable = new Coverable({
  parent: '#wrapper',
  children: '.item',
  threshold: 1000,
  onHold: (point, nodes) => {
    console.log(nodes);
  }
});

coverable.init();

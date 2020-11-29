'use strict';

function isDom(node) {
  return typeof node === 'object' && node.nodeType !== undefined
}

/**
 * @param {HTMLElement|Node} element
 * @param {string} propertyName
 * @param {boolean} prefixVendor
 * @return {string}
 */
function getStyleProperty(element, propertyName, prefixVendor = false) {
  if (prefixVendor) {
    const prefixes = ['', '-webkit-', '-ms-', 'moz-', '-o-'];
    for (let counter = 0; counter < prefixes.length; counter++) {
      const prefixedProperty = prefixes[counter] + propertyName;
      const foundValue = getStyleProperty(element, prefixedProperty);

      if (foundValue) {
        return foundValue
      }
    }

    return ''
  }

  let propertyValue = '';

  if (element.currentStyle) {
    propertyValue = element.currentStyle[propertyName];
  } else if (document.defaultView && document.defaultView.getComputedStyle) {
    propertyValue = document.defaultView
      .getComputedStyle(element, null)
      .getPropertyValue(propertyName);
  }

  return propertyValue && propertyValue.toLowerCase ? propertyValue.toLowerCase() : propertyValue
}

function getElementNode(selector, parent = document) {
  const node = isDom(selector) ? selector : (selector && parent.querySelector(selector)) || null;
  return node.nodeType === 1 ? node : null
}

function getElementNodes(selector, parent = document) {
  const nodes = isDom(selector) ?
    [selector] : (selector && Array.prototype.slice.call(parent.querySelectorAll(selector))) || [null];
  return nodes.filter(node => node && node.nodeType === 1)
}

/**
 * @param {HTMLElement|Node} el 
 * @param {string} cName 
 */
function hasClass(el, cName) {
  return new RegExp('(^|\\s)' + cName + '($|\\s)').test(el.className)
}

/**
 * @param {HTMLElement|Node} el 
 * @param {string} cName 
 */
function addClass(el, cName) {
  if (!cName || hasClass(el, cName)) {
    return
  }

  const elClass = el.className === '' ? ' ' : el.className;
  if (elClass.charAt(elClass.length - 1) === ' ') {
    el.className += cName;
  } else {
    el.className += (' ' + cName);
  }
}

/**
 * @param {HTMLElement|Node} el 
 * @param {string} cName 
 */
function removeClass(el, cName) {
  if (!cName) {
    return ''
  }

  const classList = el.className.split(/\s+/);
  let idx = classList.indexOf(cName);
  if (idx > -1) {
    classList.splice(idx, 1);
    el.className = classList.join(' ');
    return cName
  }

  return ''
}

function merge(dest, src, redefine = true) {
  const props = Object.getOwnPropertyNames(src);
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    if (!redefine && Object.prototype.hasOwnProperty.call(dest, prop)) {
      continue
    }
    dest[prop] = src[prop];
  }

  return dest
}

/**
 * 获取元素的顶点坐标，暂时不支持旋转/倾斜拉伸
 * @param {HTMLElement|Node} element 
 */
function getShapePoints(element, offsetX = 0, offsetY = 0) {
  const rect = element.getBoundingClientRect();
  const offsetLeft = rect.left + offsetX;
  const offsetTop = rect.top + offsetY;
  return [
    { x: offsetLeft, y: offsetTop },
    { x: offsetLeft + rect.width, y: offsetTop },
    { x: offsetLeft + rect.width, y: offsetTop + rect.height },
    { x: offsetLeft, y: offsetTop + rect.height }
  ]
}

// 计算多个点的平均点
function getAveragePoint(points) {
  if (!points.length) {
    return null
  }
  const point = points.reduce((totalPoint, point) => {
    totalPoint.x += point.x;
    totalPoint.y += point.y;
    return totalPoint
  }, { x: 0, y: 0 });
  point.x /= points.length;
  point.y /= points.length;

  return point
}

const noob = () => {};

function createEventInfo(startPoint, activePoint, e) {
  const info = {
    startPoint,
    target: e.target || e.srcElement,
    currentTarget: e.currentTarget
  };
  if (activePoint) {
    info.activePoint = activePoint;
  }
  return info
}

/**
 * @param {HTMLElement|Node} target 
 * @param {Object} callbackOpts 
 */
function Holder(target, callbackOpts) {
  this._init();
  this.target = target;
  this._onClick = callbackOpts.onClick || noob;
  this._onHoldStart = callbackOpts.onHoldStart || noob;
  this._onHoldMove = callbackOpts.onHoldMove || noob;
  this._onHoldEnd = callbackOpts.onHoldEnd || noob;

  let targetPoints = null;
  let getPointInfo = null;
  let borderWidth = 0;

  this._touchStartHandler = (e) => {
    if (this._isDown || !this._enable) {
      return
    }

    targetPoints = getShapePoints(this.target);
    borderWidth = getStyleProperty(this.target, 'border-width');
    borderWidth = borderWidth ? Number(borderWidth.split('px')[0]) : 0;

    // 在边框上触发事件无效
    const x = e.clientX;
    const y = e.clientY;
    if (x <= targetPoints[0].x + borderWidth || x >= targetPoints[1].x - borderWidth) {
      return
    }
    if (y <= targetPoints[0].y + borderWidth || y >= targetPoints[3].y - borderWidth) {
      return
    }

    getPointInfo = (x, y) => {
      const contentX = x + this.target.scrollLeft - targetPoints[0].x - borderWidth;
      const contentY = y + this.target.scrollTop - targetPoints[0].y - borderWidth;
      return {
        x,
        y,
        contentX,
        contentY,
        offsetX: x - contentX,
        offsetY: y - contentY
      }
    };

    const startPoint = getPointInfo(x, y);
    this._startPoint = startPoint;
    this._activePoint = null;

    this._prepareEmitStart = () => {
      this._onHoldStart.call(null, createEventInfo(startPoint, null, e));
    };

    this._isDown = true;
  };

  this._touchMoveHandler = (e) => {
    if (!this._isDown || !this._enable) {
      return
    }

    if (!this._isHold) {
      this._isHold = true;
      // 触发start事件，再触发move事件
      this._prepareEmitStart();
      this._prepareEmitStart = null;
    }

    const activePoint = getPointInfo(e.clientX, e.clientY);
    this._activePoint = activePoint;
    this._onHoldMove.call(null, createEventInfo(this._startPoint, activePoint, e));
  };

  this._touchEndHandler = (e) => {
    if (!this._isDown || !this._enable) {
      return
    }

    this._isDown = false;
    if (this._isHold) {
      this._isHold = false;
      let x = e.clientX;
      let y = e.clientY;
      // 鼠标在外结束的处理
      x = Math.min(x, targetPoints[1].x - borderWidth);
      x = Math.max(x, targetPoints[0].x + borderWidth);
      y = Math.min(y, targetPoints[3].y - borderWidth);
      y = Math.max(y, targetPoints[0].y + borderWidth);
      const activePoint = getPointInfo(x, y);
      this._activePoint = activePoint;
      this._onHoldEnd.call(null, createEventInfo(this._startPoint, activePoint, e));
    } else {
      // 只是点击没有发生移动
      this._onClick.call(null, createEventInfo(this._startPoint, null, e));
    }
    this._prepareEmitStart = null;
    getPointInfo = null;
    targetPoints = null;
    borderWidth = 0;
  };

  // 处理在边界外
  this._onOutsideMouseUp = (e) => {
    if (this._enable) {
      this._touchEndHandler(e);
    }
  };
}

Holder.prototype.enable = function () {
  this._check();
  this._loadEvents();
  this._enable = true;
};

Holder.prototype.disable = function () {
  this._check();
  this._enable = false;
};

Holder.prototype.unload = function() {
  this._check();
  this._unloadEvents();
  this._init();
  this._unload = true;
};

Holder.prototype._init = function () {
  /* 清空数据 */
  this.target = null;
  this._listening = false;
  this._enable = false; // 是否开启监听
  this._isDown = false; // 鼠标是否已经在目标元素按下
  this._isHold = false; // 是否正在hold
  this._startPoint = null;
  this._activePoint = null;
  this._unload = false;
  /* 重置回调函数 */
  this._onClick = null;
  this._onHoldStart = null;
  this._onHoldMove = null;
  this._onHoldEnd = null;
};

Holder.prototype._check = function() {
  if (this._unload) {
    throw new Error('Holder has been unloaded!')
  }
};

Holder.prototype._loadEvents = function() {
  if (!this._listening) {
    this._listening = true;
    this.target.addEventListener('mousedown', this._touchStartHandler);
    this.target.addEventListener('mousemove', this._touchMoveHandler);
    this.target.addEventListener('mouseup', this._touchEndHandler);
    document.addEventListener('mouseup', this._onOutsideMouseUp);
  }
};

Holder.prototype._unloadEvents = function() {
  if (this._listening) {
    this.target.removeEventListener('mousedown', this._touchStartHandler);
    this.target.removeEventListener('mousemove', this._touchMoveHandler);
    this.target.removeEventListener('mouseup', this._touchEndHandler);
    document.removeEventListener('mouseup', this._onOutsideMouseUp);
    this._listening = false;
  }
};

const MAIN_CLASS = 'pika9-selection';
const PARENT_CLASS = MAIN_CLASS + '-parent';
const PARENT_RELATIVE_CLASS = PARENT_CLASS + '--relative';

function Selection(parent) {
  this.el = null;
  this._parent = parent;
  this._staticStyle = '';

  // visible响应式改变元素className
  let visible = undefined;
  Object.defineProperty(this, '_visible', {
    enumerable: false,
    configurable: false,
    get() {
      return visible
    },
    set(value) {
      value = !!value;
      if (value !== visible && this.el) {
        this.el.style.cssText = value ? this._staticStyle : 'display: none;';
      }
      visible = value;
    }
  });
}

Selection.prototype.unmount = function() {
  this.el && this.el.remove();
  removeClass(this._parent, PARENT_CLASS);
  removeClass(this._parent, PARENT_RELATIVE_CLASS);
};

Selection.prototype.mount = function() {
  const parent = this._parent;
  if (!this.el) {
    const selection = document.createElement('div');
    selection.className = MAIN_CLASS;
    this.el = selection;
    this._visible = false;
    addClass(parent, PARENT_CLASS);
  }
  parent.appendChild(this.el);
};

Selection.prototype.show = function() {
  // 为父元素添加相对定位样式
  const parent = this._parent;
  const position = getStyleProperty(parent, 'position');
  if (['fixed', 'absolute', 'relative'].indexOf(position) === -1) {
    addClass(parent, PARENT_RELATIVE_CLASS);
  }
  
  this._visible = true;
};

Selection.prototype.hide = function() {
  this._visible = false;
};

Selection.prototype.update = function(left, top, width, height) {
  if (!this.el || !this._visible) {
    return
  }
  const styles = [
    'position: absolute',
    `top: ${top}px`,
    `left: ${left}px`
  ];
  const translations = [];
  if (width < 0) {
    translations.push(`translateX(${width}px)`);
    width = -width;
  }
  if (height < 0) {
    translations.push(`translateY(${height}px)`);
    height = -height;
  }

  styles.push(`width: ${width}px`);
  styles.push(`height: ${height}px`);

  if (translations.length) {
    styles.push('transform: ' + translations.join(' '));
  }

  const styleText = styles.join('; ');
  this._staticStyle = styleText;
  this.el.style.cssText = styleText;
};

/*!
 * merge-descriptors
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module exports.
 * @public
 */

var mergeDescriptors = merge$1;

/**
 * Module variables.
 * @private
 */

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Merge the property descriptors of `src` into `dest`
 *
 * @param {object} dest Object to add descriptors to
 * @param {object} src Object to clone descriptors from
 * @param {boolean} [redefine=true] Redefine `dest` properties with `src` properties
 * @returns {object} Reference to dest
 * @public
 */

function merge$1(dest, src, redefine) {
  if (!dest) {
    throw new TypeError('argument dest is required')
  }

  if (!src) {
    throw new TypeError('argument src is required')
  }

  if (redefine === undefined) {
    // Default to true
    redefine = true;
  }

  Object.getOwnPropertyNames(src).forEach(function forEachOwnPropertyName(name) {
    if (!redefine && hasOwnProperty.call(dest, name)) {
      // Skip desriptor
      return
    }

    // Copy descriptor
    var descriptor = Object.getOwnPropertyDescriptor(src, name);
    Object.defineProperty(dest, name, descriptor);
  });

  return dest
}

const defaultOptions = {
  parent: null,
  elements: [] //参与策略的元素
};

/**
 * 基于Coordinate System坐标系的交集策略
 * @param {object} baseOptions 基本配置
 * @param {number} offsetX 横向偏移 
 * @param {number} offsetY 纵向偏移 
 */
function CSYSStrategy(baseOptions, offsetX, offsetY) {
  baseOptions = mergeDescriptors({ ...defaultOptions }, baseOptions || {});
  const origin = baseOptions.origin;
  delete baseOptions.origin;
  this._options = Object.freeze(baseOptions);
  this.init(origin, offsetX, offsetY);
}

CSYSStrategy.prototype.start = function(startEv) {
  const { contentX, contentY, offsetX, offsetY } = startEv.startPoint;
  this.init({ x: contentX, y: contentY }, offsetX, offsetY);
  this.addElements(this._options.elements);
};

CSYSStrategy.prototype.hold = function(holdEv) {
  const point = holdEv.activePoint;
  return this.getElementsRelative({
    x: point.contentX,
    y: point.contentY
  })
};

CSYSStrategy.prototype.end = function(endEv) {
  const point = endEv.activePoint;
  return this.getElementsRelative({
    x: point.contentX,
    y: point.contentY
  })
};

CSYSStrategy.prototype.init = function(origin, offsetX, offsetY) {
  // 坐标原点
  this._origin = origin || { x: 0, y: 0 };
  this._offsetX = offsetX || 0;
  this._offsetY = offsetY || 0;
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
  }));
};

CSYSStrategy.prototype.add = function(element) {
  // 元素的平均点
  const averagePoint = getAveragePoint(getShapePoints(element, -this._offsetX, -this._offsetY));
  const item = {
    // avgPoint: averagePoint,
    avgOriginPoint: this._getCSYSPoint(averagePoint),
    absOriginPoint: null,
    element
  };
  item.absOriginPoint = {
    x: Math.abs(item.avgOriginPoint.x),
    y: Math.abs(item.avgOriginPoint.y)
  };

  const quadrant = this._getQuadrant(item.avgOriginPoint);
  quadrant.items.push(item);
  quadrant.sortType = ''; // 清除排序标志
  quadrant.x.total += item.avgOriginPoint.x;
  quadrant.y.total += item.avgOriginPoint.y;
};

CSYSStrategy.prototype.addElements = function(els) {
  if (els.length !== undefined) {
    let i = -1;
    while (++i < els.length) {
      this.add(els[i]);
    }
  } else {
    this.add(els);
  }
};

// 根据坐标获取象限数据
CSYSStrategy.prototype._getCSYSPoint = function(point) {
  return {
    x: point.x - this._origin.x,
    y: point.y - this._origin.y
  }
};

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
};

// 计算离散度
CSYSStrategy.prototype._calcDispersion = function(quadrant, type) {
  const items = quadrant.items;
  const directionInfo = quadrant[type];
  const average = directionInfo.total / items.length;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    directionInfo.dispersion += Math.abs(item.avgOriginPoint[type] - average);
  }
};

CSYSStrategy.prototype._sort = function() {
  // 计算各个象限的x y方向离散程度；生成排序数组
  for (let i = 0; i < 4; i++) {
    this._sortQuadrant(this._quadrants[i]);
  }
};

// 象限数据进行排序
CSYSStrategy.prototype._sortQuadrant = function(quadrant) {
  if (quadrant.sortType) {
    return
  }

  const items = quadrant.items;
  this._calcDispersion(quadrant, 'x');
  this._calcDispersion(quadrant, 'y');

  let sortType = '';
  let otherType = '';
  // 离散程度大的方向遍历能减少查找次数
  if (quadrant.x.dispersion > quadrant.y.dispersion) {
    sortType = quadrant.sortType = 'x';
    otherType = 'y';
  } else {
    sortType = quadrant.sortType = 'y';
    otherType = 'x';
  }

  items.sort((item1, item2) => {
    const absPoint1 = item1.absOriginPoint;
    const absPoint2 = item2.absOriginPoint;
    return absPoint1[sortType] === absPoint2[sortType] ?
      absPoint1[otherType] - absPoint2[otherType] : absPoint1[sortType] - absPoint2[sortType]
  });
};

CSYSStrategy.prototype.getElementsRelative = function(point) {
  return this.getElements(this._getCSYSPoint(point))
};

/**
 * 获取原点到点point的区域覆盖的元素
 */
CSYSStrategy.prototype.getElements = function(point) {
  const { x, y } = point;
  if (!x || !y) {
    return []
  }

  const quadrant = this._getQuadrant(point);
  if (!quadrant.sortType) {
    this._sortQuadrant(quadrant);
  }

  const absPoint = {
    x: Math.abs(x),
    y: Math.abs(y)
  };
  const sortType = quadrant.sortType;
  const otherType = sortType === 'x' ? 'y' : 'x';

  const result = [];
  for (let i = 0; i < quadrant.items.length; i++) {
    const item = quadrant.items[i];
    if (item.absOriginPoint[sortType] > absPoint[sortType]) {
      // 可以不用继续比较
      break
    }
    if (item.absOriginPoint[otherType] <= absPoint[otherType]) {
      result.push(item.element);
    }
  }

  return result
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

const SELECTED_CLASS = 'pika9-selected';

function injectControl(Pika9) {
  Pika9.prototype._onHoldStart = _onHoldStart;
  Pika9.prototype._onHoldMove = _onHoldMove;
  Pika9.prototype._onHoldEnd = _onHoldEnd;
  Pika9.prototype._updateSelection = _updateSelection;
  Pika9.prototype._resolveSelectedEls = _resolveSelectedEls;
  Pika9.prototype.getSelected = getSelected;
  Pika9.prototype.clearSelected = clearSelected;
}

function _onHoldStart(ev) {
  this._holding = true;
  this._selection.show();
  if (this._options.mode === 'disposable') {
    // 一次性选中，清空上次选择
    this.clearSelected();
  }
  // 创建防抖函数
  const { onHold, threshold } = this._options;
  this._intersectionStrategy.start(ev);
  if (!this._throttleHold) {
    this._throttleHold = throttle(threshold, (holdEv) => {
      if (!this._holding) {
        return
      }
      // 更新选中
      const selectedEls = this._intersectionStrategy.hold(holdEv);
      const { added, removed } = this._resolveSelectedEls(selectedEls);
      this._recentSelectedEls = selectedEls;
      onHold && onHold.call(null, {
        start: { ...ev.startPoint },
        active: { ...ev.activePoint },
        added,
        removed
      });
    });
  }
  const onStart = this._options.onStart;
  onStart && onStart.call(null, { start: { ...ev.startPoint } });
}

function _onHoldMove(ev) {
  this._updateSelection(ev.startPoint, ev.activePoint);
  this._throttleHold && this._throttleHold(ev);
}

function _onHoldEnd(ev) {
  this._holding = false;
  this._updateSelection(ev.startPoint, ev.activePoint);

  const selectedEls = this._intersectionStrategy.end(ev);
  const { added, removed, selected } = this._resolveSelectedEls(selectedEls, true);
  this._curSelectedEls = selected.concat();
  this._recentSelectedEls = [];

  const onEnd = this._options.onEnd;
  onEnd && onEnd.call(null, {
    start: { ...ev.startPoint },
    active: { ...ev.activePoint },
    added,
    removed,
    selected
  });
  this._selection.hide();
}

/**
 * 根据起点及活动点更新选择区域
 * @param {object} startPoint 
 * @param {object} activePoint 
 */
function _updateSelection(startPoint, activePoint) {
  const contentX1 = startPoint.contentX;
  const contentY1 = startPoint.contentY;
  const contentX2 = activePoint.contentX;
  const contentY2 = activePoint.contentY;
  this._selection.update(
    contentX1,
    contentY1,
    contentX2 - contentX1,
    contentY2 - contentY1
  );
}

// [2, 4, 7, 8] + [1, 2, 7] = [4, 8], [1] + [2, 7]
/**
 * 分析集合数据，返回唯一元素集合和重复元素集合
 */
function analyzeSetDiff(set1, set2) {
  set1 = set1.concat();
  set2 = set2.concat();
  const duplicate = [];
  for (let i = 0; i < set1.length; i++){
    for (let j = 0; j < set2.length; j++) {
      if (set1[i] === set2[j]) {
        duplicate.push(set1[i]);
        set1.splice(i, 1);
        set2.splice(j, 1);
        i--;
        break
      }
    }
  }
  return {
    diff: [set1, set2],
    duplicate
  }
}

function setSelectedClass(els) {
  let i = -1;
  while (++i < els.length) {
    addClass(els[i], SELECTED_CLASS);
  }
}

function removeSelectedClass(els) {
  let i = -1;
  while (++i < els.length) {
    removeClass(els[i], SELECTED_CLASS);
  }
}

/**
 * 解决元素选中效果
 * @param {Array} els 当前准备用于更新选中结果的元素
 * @param {Boolean} analyzeNetSelected 是否分析净选择
 */
function _resolveSelectedEls(els, analyzeNetSelected) {
  // 000 保存状态 上一次活动选中状态 本次活动选中状态
  const diffInfoxxx = analyzeSetDiff(this._recentSelectedEls, els);
  // const diffInfox11 = analyzeSetDiff(diffInfoxxx.duplicate, this._curSelectedEls)
  const diffInfox10 = analyzeSetDiff(diffInfoxxx.diff[0], this._curSelectedEls);
  const diffInfox01 = analyzeSetDiff(diffInfoxxx.diff[1], this._curSelectedEls);
  // const els111 = diffInfox11.duplicate
  // const els011 = diffInfox11.diff[0]
  const els110 = diffInfox10.duplicate;
  const els010 = diffInfox10.diff[0];
  const els101 = diffInfox01.duplicate;
  const els001 = diffInfox01.diff[0];
  const result = {
    added: [],
    removed: []
  };
  /**
   * 根据mode设置当前样式
   * disposable: 
   *    新激活: 001 
   *    取消激活: 010
   *    当前激活: this._recentSelectedEls
   * append: 
   *    新激活: 001
   *    取消激活: 010
   *    当前激活: 001 + 011 + 100 + 101 + 110 + 111 (_curSelected 和 els 取并集)
   * toggle: 
   *    新激活: 001 + 110
   *    取消激活: 010 + 101
   *    当前激活: 001 + 011 + 100 + 110 (_curSelected 和 els 的并集减去两者的交集)
   *   
   */
  const mode = this._options.mode;
  if (mode === 'disposable' || mode === 'append') {
    result.added = els001;
    result.removed = els010;
    setSelectedClass(result.added);
    removeSelectedClass(result.removed);
    if (analyzeNetSelected) {
      if (mode === 'disposable') {
        result.selected = this._recentSelectedEls;
      } else {
        const diffInfo = analyzeSetDiff(this._curSelectedEls, els);
        result.selected = diffInfo.diff[0].concat(diffInfo.diff[1]).concat(diffInfo.duplicate);
      }
    }
    return result
  }

  if (mode === 'toggle') {
    result.added = els001.concat(els110);
    result.removed = els010.concat(els101);
    setSelectedClass(result.added);
    removeSelectedClass(result.removed);
    if (analyzeNetSelected) {
      const diffInfo = analyzeSetDiff(this._curSelectedEls, els);
      result.selected = diffInfo.diff[0].concat(diffInfo.diff[1]);
    }
    return result
  }
}

function getSelected() {
  return this._curSelectedEls.concat()
}

function clearSelected() {
  if (!this._curSelectedEls.length) {
    return
  }
  removeSelectedClass(this._curSelectedEls);
  this._curSelectedEls = [];
}

const initPayload = {
  _baseMergeOptions: null,
  _options: null,
  _intersectionStrategy: null,
  _selection: null,
  _holder: null,
  _throttleHold: null,
  _recentSelectedEls: [],
  _curSelectedEls: [],
  _enable: false,
  _holding: false
};

function injectApi(Pika9) {
  Pika9.prototype.enable = enable;
  Pika9.prototype.disable = disable;
  Pika9.prototype.reload = reload;
  Pika9.prototype.unload = unload;
}

function enable() {
  this._enable = true;
  this._holder.enable();
}

function disable() {
  this._enable = false;
  this._holder.disable();
}

function reload() {
  const enable = this._enable;
  const base = this._baseMergeOptions;
  this.unload();
  this._baseMergeOptions = base;
  this._load();
  if (enable) {
    this.enable();
  }
}

// 卸载
function unload() {
  // 卸载Holder事件
  this._holder.unload();
  // 清除选择元素
  this._selection.unmount();
  // 清空选中
  this.clearSelected();
  merge(this, initPayload);
}

const defaultOptions$1 = {
  parent: null, // DOM 或 CSS选择器串
  children: null, // DOM 或 CSS选择器串数组
  threshold: 200, // 框选时节流函数间隔
  onStart: null, // 开始框选时的回调
  onHold: null, // 保持框选时的鼠标移动回调
  onEnd: null, // 框选结束回调
  onChange: null, // 选择结果变化的回调
  mode: 'toggle', // disposable: 一次性选择 append: 每次继续追加元素 toggle: toggle
  clearOnClick: true // 是否在点击时清空选中
};

function Pika9(options) {
  if (!window || !document) {
    throw new Error('make sure you running Pika9.js in bowser')
  }

  merge(this, initPayload);
  this._baseMergeOptions = merge({ ...defaultOptions$1 }, options || {});
  
  // Object.defineProperty(this, '_curSelectedEls', )
  this._load();
}

injectControl(Pika9);
injectApi(Pika9);

// 装载
Pika9.prototype._load = function() {
  const options = { ...this._baseMergeOptions };
  const parentEl = options.parent;
  const children = options.children;
  const parent = getElementNode(parentEl);
  
  if (!parent) {
    throw new Error('invalid parent node')
  }

  let childNodes = null;
  childNodes = getElementNodes(children);
  if (!childNodes.length) {
    throw new Error('invalid children nodes')
  }

  options.parent = parent;
  options.children = childNodes;
  this._options = Object.freeze(options);
  // 创建交集策略，决定如何选中元素
  this._intersectionStrategy = new CSYSStrategy({
    elements: this._options.children
  });
  // 挂载选择区域元素
  this._selection = new Selection(this._options.parent);
  this._selection.mount();
  // 挂载事件
  this._holder = new Holder(parent, {
    onClick: (ev) => {
      // 单击时清空选中
      if (this._options.children.indexOf(ev.target) > -1) {
        const { selected } = this._resolveSelectedEls([ev.target], true);
        this._curSelectedEls = selected;
        this._recentSelectedEls = [];
      } else if (this._options.clearOnClick) {
        this.clearSelected();
      }
    },
    onHoldStart: (ev) => {
      this._onHoldStart(ev);
    },
    onHoldMove: (ev) => {
      this._onHoldMove(ev);
    },
    onHoldEnd: (ev) => {
      this._onHoldEnd(ev);
    }
  });
  this._throttleHold = null;
  this._selectedElements = [];
  this._holding = true;
};

const pika9 = new Pika9({
  parent: '#wrapper',
  children: '.item',
  mode: 'toggle',
  threshold: 100,
  onHold: (e) => {
    // console.log(e.added)
  },
  onEnd: (e) => {
    console.log(e.selected);
  }
});

pika9.enable();
// pika9.reload()

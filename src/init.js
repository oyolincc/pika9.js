import { merge } from './utils/util'

const defaultOptions = {
  parent: '', // DOM 或 CSS选择器串
  children: '', // DOM 或 CSS选择器串
  threshold: 200, // 框选时节流函数间隔
  onStart: null, // 开始框选时的回调
  onHold: null, // 保持框选时的鼠标移动回调
  onEnd: null, // 框选结束回调
  // onChange: null, // 选择结果变化的回调
  mode: 'toggle', // disposable: 一次性选择 append: 每次继续追加元素 toggle: toggle
  cleanOnClick: true // 是否在点击时清空选中
}

export const initPayload = {
  _loaded: false,
  _selection: null,
  _holder: null,
  _elManager: null,
  _throttleHold: null,
  _enable: false,
  _holding: false
}

export function initMixin(Pika9) {
  Pika9.prototype._init = function(options) {
    // 初始化私有属性
    merge(this, initPayload)
    // 与默认配置作合并
    this._options = Object.freeze(merge({ ...defaultOptions }, options || {}, true))
  }
}


export default function ComputedStrategy() {}

function abstrat() {
  throw new Error('Abstrat: should be overriden')
}

// ComputedStrategy.prototype.init = function(options) {}

ComputedStrategy.prototype.getElements = abstrat

ComputedStrategy.prototype.add = abstrat

ComputedStrategy.prototype.addElements = function(els) {
  if (els.length !== undefined) {
    let i = -1
    while (++i < els.length) {
      this.add(els[i])
    }
  } else {
    this.add(els)
  }
}

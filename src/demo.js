import Coverable from './index'

const coverable = new Coverable({
  parent: '#wrapper',
  children: '.item',
  threshold: 1000,
  onHold: (point, nodes) => {
    console.log(nodes)
  }
})

coverable.init()

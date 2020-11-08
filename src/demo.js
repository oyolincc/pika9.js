import Coverable from './index'

const coverable = new Coverable({
  parent: '#wrapper',
  children: '.item',
  onHold: (nodes) => {
    console.log(nodes)
  }
})

coverable.init()

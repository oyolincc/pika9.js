import Pika9 from './index'

const pika9 = new Pika9({
  parent: '#wrapper',
  children: '.item',
  mode: 'toggle',
  threshold: 100,
  onHold: (e) => {
    // console.log(e.added)
  },
  onEnd: (e) => {
    console.log(e.selected)
  }
})

pika9.enable()
// pika9.reload()

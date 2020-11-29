import Pika9 from './index'

const pika9 = new Pika9({
  parent: '#wrapper',
  children: '.item',
  mode: 'toggle',
  threshold: 100,
  onChange: ev => console.log(ev)
})

pika9.enable()
// pika9.reload()

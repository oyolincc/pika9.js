import Pika9 from './index'

const pika9 = new Pika9({
  parent: '#wrapper',
  children: ['.item'],
  mode: 'toggle',
  threshold: 200,
  onHold: ev => console.log('holding', ev),
  onEnd: ev => console.log('结束', ev)
  // onChange: ev => console.log(ev)
})

let enable = false
const btn = document.getElementById('btn')
btn.addEventListener('click', (e) => {
  enable ? pika9.disable() : pika9.enable()
  enable = !enable
})

const btn2 = document.getElementById('btn2')
btn2.addEventListener('click', (e) => {
  pika9.unload()
})

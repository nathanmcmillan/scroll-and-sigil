import { IMAGES } from './images.js'
import { MONSTERS } from './environment.js'

export class Player {
  constructor(sector, data) {
    this.input = null
    this.socket = null
    this.sector = sector
    this.name = data.name
    this.x = data.x
    this.y = data.y
    this.image = IMAGES.get('monsters')
    this.sprite = MONSTERS.get('knight')
    this.queue = []
  }

  update() {
    for (let q = 0; q < this.queue.length; q++) {
      const data = this.queue[q]
      if (data.code === 'snapshot') {
        const snap = data.snapshot
        this.y = snap.y
      }
    }
    this.queue.length = 0

    const input = this.input
    if (input.stickUp()) {
      const text = JSON.stringify({ code: 'input', move: 'up' })
      this.socket.send(text)
    }
    return null
  }

  message(data) {
    this.queue.push(data)
  }
}

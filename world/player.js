const thing = require('./thing')

class Player {
  constructor(socket, name, sector) {
    this.socket = socket
    this.name = name
    this.sector = sector
    this.nid = thing.NextNID()
    this.x = 0
    this.y = 0
    this.box = 0.5
    this.speed = 0.2
    this.moved = false
    this.queue = []
  }

  data() {
    return {
      name: this.name,
      nid: this.nid,
      x: this.x,
      y: this.y,
    }
  }

  snap() {
    if (this.moved) {
      this.moved = false
      return {
        name: this.name,
        nid: this.nid,
        x: this.x,
        y: this.y,
      }
    } else {
      return null
    }
  }

  update() {
    for (let q = 0; q < this.queue.length; q++) {
      const data = this.queue[q]
      if (data.code === 'input') {
        const move = data.move
        if (move === 'up') {
          this.y -= this.speed
          this.moved = true
        }
      }
    }
    this.queue.length = 0
    return null
  }

  message(data) {
    this.queue.push(data)
  }
}

module.exports = {
  Player: Player,
}

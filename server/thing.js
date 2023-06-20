class Thing {
  constructor(sector, data) {
    this.sector = sector
    this.x = data.x
    this.y = data.y
    this.box = 0.5
    this.speed = 0.2
    this.moved = false
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
    return null
  }
}

module.exports = {
  Thing: Thing,
}

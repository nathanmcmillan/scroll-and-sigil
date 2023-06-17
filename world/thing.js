let NETWORK_ID = 0

function NextNID() {
  NETWORK_ID++
  return NETWORK_ID
}

class Thing {
  constructor(sector, data) {
    this.sector = sector
    this.nid = NextNID()
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
  NextNID: NextNID,
  Thing: Thing,
}

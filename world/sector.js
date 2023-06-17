const thing = require('./thing')

const TILES = 16

class Sector {
  constructor(name, data) {
    data = JSON.parse(data)
    this.name = name
    this.leftName = data.left
    this.rightName = data.right
    this.upName = data.up
    this.downName = data.down
    this.tiles = new Array(TILES * TILES)
    for (let r = 0; r < TILES; r++) {
      for (let c = 0; c < TILES; c++) {
        this.tiles[c + r * TILES] = data.tiles[r][c]
      }
    }
    this.music = data.music
    this.origin = data.origin
    this.left = null
    this.right = null
    this.up = null
    this.down = null
    this.things = []
    this.thingCount = 0
    this.missiles = []
    this.missileCount = 0
    this.players = []
    this.playerCount = 0
    for (let t = 0; t < data.things; t++) {
      const th = data.things[t]
      this.addThing(new thing.Thing(this, th))
    }
  }

  data() {
    const players = []
    let p = this.playerCount
    while (p--) {
      players.push(this.players[p].data())
    }
    const things = []
    let t = this.thingCount
    while (t--) {
      things.push(this.things[t].data())
    }
    return {
      name: this.name,
      left: this.leftName,
      right: this.rightName,
      up: this.upName,
      down: this.downName,
      tiles: this.tiles,
      music: this.music,
      players: players,
      things: things,
    }
  }

  snapshot() {
    return null
  }

  update() {
    const things = this.things
    let i = this.thingCount
    while (i--) {
      const thing = things[i]
      if (thing.update()) {
        this.thingCount--
        things[i] = things[this.thingCount]
        things[this.thingCount] = null
      }
    }

    const missiles = this.missiles
    i = this.missileCount
    while (i--) {
      const missile = missiles[i]
      if (missile.update()) {
        this.missileCount--
        missiles[i] = missiles[this.missileCount]
        missiles[this.missileCount] = missile
      }
    }

    const players = this.players
    i = this.playerCount
    while (i--) {
      const player = players[i]
      if (player.update()) {
        this.playerCount--
        players[i] = players[this.playerCount]
        players[this.playerCount] = player
      }
    }
  }

  addThing(thing) {
    const things = this.things
    if (things.length === this.thingCount) {
      things.push(thing)
    } else {
      things[this.thingCount] = thing
    }
    this.thingCount++
  }

  removeThing(thing) {
    const things = this.things
    const index = things.indexOf(thing)
    this.thingCount--
    things[index] = things[this.thingCount]
    things[this.thingCount] = null
  }

  addPlayer(player) {
    const players = this.players
    if (players.length === this.playerCount) {
      players.push(player)
    } else {
      players[this.playerCount] = player
    }
    this.playerCount++
  }

  removePlayer(player) {
    const players = this.players
    const index = players.indexOf(player)
    this.playerCount--
    players[index] = players[this.playerCount]
    players[this.playerCount] = null
  }
}

module.exports = {
  TILES: TILES,
  Sector: Sector,
}

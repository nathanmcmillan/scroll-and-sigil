import { IMAGES } from './images.js'
import { Player } from './player.js'

export const TILES = 16

export class Sector {
  constructor(data) {
    this.name = data.name
    this.leftName = data.left
    this.rightName = data.right
    this.upName = data.up
    this.downName = data.down
    this.tiles = data.tiles
    this.music = data.music
    this.left = null
    this.right = null
    this.up = null
    this.down = null
    this.things = []
    this.thingCount = 0
    this.missiles = []
    this.missileCount = 0

    const players = data.players
    this.players = []
    this.playerCount = players.length
    for (let p = 0; p < players.length; p++) {
      this.players.push(new Player(this, data.players[p]))
    }

    this.image = IMAGES.get('environment')
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

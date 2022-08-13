export class Sector {
  constructor(game) {
    this.game = game
    this.tick = 0
    this.lines = null
    this.sectors = []
    this.cells = null
    this.columns = 0
    this.rows = 0
    this.things = []
    this.thingCount = 0
    this.missiles = []
    this.missileCount = 0
    this.triggers = []
    this.events = []
    this.variables = new Map()
  }
}

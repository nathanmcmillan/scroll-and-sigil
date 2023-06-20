class Sector {
  constructor(name, data) {
    data = JSON.parse(data)
    this.name = name
    this.columns = data.tiles[0].length
    this.rows = data.tiles.length
    this.tiles = new Array(this.columns * this.rows)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        this.tiles[c + r * this.columns] = data.tiles[r][c]
      }
    }
    this.music = data.music
    this.events = data.events
    this.players = []
    this.playerCount = 0
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

  data() {
    return {
      name: this.name,
      columns: this.columns,
      rows: this.rows,
      tiles: this.tiles,
      music: this.music,
      events: this.events,
    }
  }
}

module.exports = {
  Sector: Sector,
}

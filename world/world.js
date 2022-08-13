const fs = require('fs')

class World {
  constructor(map) {
    this.sectors = []
    map = fs.readFileSync(map, { encoding: 'utf8' })
    console.log(map)
  }
}

module.exports = {
  World: World,
}

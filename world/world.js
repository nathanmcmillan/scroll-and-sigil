const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const sector = require('./sector')
const player = require('./player')
const table = require('./table')
const environment = require('./environment')

const TICK_RATE = 1000.0 / 30.0

let PREVIOUS_TICK = 0

let DB = null

const PLAYERS = new Map()
const SECTORS = new table.Table(table.stringHashcode)

const VIEW_DISTANCE = 2
const SECTORS_LOADED = new Set()

async function init(db) {
  DB = db
  PREVIOUS_TICK = Date.now()
  await newDatabase()
}

function SQL(method, command, ...data) {
  return new Promise((resolve, reject) => {
    DB[method](command, data, (error, result) => {
      if (error) reject(error)
      else resolve(result)
    })
  })
}

async function newDatabase() {
  const create = `create table user (
    name text not null unique,
    password text not null,
    salt text not null,
    online int not null,
    sector text,
    column int,
    row int
  )`
  await SQL('run', create)
}

function loadSector(name) {
  let sec = SECTORS.get(name)
  if (sec === null) {
    const pa = path.join(__dirname, 'sectors', name + '.json')
    const dat = fs.readFileSync(pa, { encoding: 'utf8' })
    sec = new sector.Sector(name, dat)
    SECTORS.set(name, sec)
    if (sec.leftName !== null) {
      const left = SECTORS.get(sec.leftName)
      if (left !== null) {
        sec.left = left
        left.right = sec
      }
    }
    if (sec.rightName !== null) {
      const right = SECTORS.get(sec.rightName)
      if (right !== null) {
        sec.right = right
        right.left = sec
      }
    }
    if (sec.upName !== null) {
      const up = SECTORS.get(sec.upName)
      if (up !== null) {
        sec.up = up
        up.down = sec
      }
    }
    if (sec.downName !== null) {
      const down = SECTORS.get(sec.downName)
      if (down !== null) {
        sec.down = down
        down.up = sec
      }
    }
  }
  return sec
}

function loadSectors(name, c, r) {
  if (Math.abs(c) > VIEW_DISTANCE) return
  if (Math.abs(r) > VIEW_DISTANCE) return
  if (SECTORS_LOADED.has(name)) return
  SECTORS_LOADED.add(name)
  const sec = loadSector(name)
  if (sec.leftName !== null) loadSectors(sec.leftName, c - 1, r)
  if (sec.rightName !== null) loadSectors(sec.rightName, c + 1, r)
  if (sec.upName !== null) loadSectors(sec.upName, c, r - 1)
  if (sec.downName !== null) loadSectors(sec.downName, c, r + 1)
}

function sectorData(list, sec, c, r) {
  if (SECTORS_LOADED.has(sec.name)) return
  SECTORS_LOADED.add(sec.name)
  list.push(sec.data())
  if (sec.left !== null && c - 1 > -VIEW_DISTANCE) sectorData(list, sec.left, c - 1, r)
  if (sec.right !== null && c + 1 < VIEW_DISTANCE) sectorData(list, sec.right, c + 1, r)
  if (sec.up !== null && r - 1 > -VIEW_DISTANCE) sectorData(list, sec.up, c, r - 1)
  if (sec.down !== null && r + 1 < VIEW_DISTANCE) sectorData(list, sec.down, c, r + 1)
  return list
}

function computePassword(password, salt) {
  const digest = 'sha256'
  const iterations = 10000
  const limit = 256
  const salting = 16
  const encoding = 'base64'

  return new Promise((resolve, reject) => {
    if (salt === null) salt = crypto.randomBytes(salting).toString(encoding)
    crypto.pbkdf2(password, salt, iterations, limit, digest, (error, hash) => {
      if (error) reject(error)
      resolve([hash.toString(encoding), salt])
    })
  })
}

async function online(socket, data) {
  const name = data.user

  let location = null
  let column = null
  let row = null

  const user = await SQL('get', 'select online, password, salt, sector, column, row from user where name = ?', name)
  if (user) {
    if (user.online === 1) {
      console.error(name + ' multiple login')
      socket.send(
        JSON.stringify({
          code: 'multiple-login',
        })
      )
      socket.close()
      return
    } else {
      const password = await computePassword(data.password, user.salt)
      if (user.password !== password[0]) {
        console.error(name + ' wrong password')
        socket.send(
          JSON.stringify({
            code: 'wrong-password',
          })
        )
        socket.close()
        return
      } else {
        console.log(name + ' online')
        await SQL('run', 'update user set online = 1 where name = ?', name)
        location = user.sector
        column = user.column
        row = user.row
      }
    }
  } else {
    console.log('new user ' + name)
    const password = await computePassword(data.password, null)
    await SQL('run', 'insert into user (name, password, salt, online) values (?, ?, ?, 1)', name, password[0], password[1])
  }

  if (location === null) {
    location = 'test'
  }

  const sec = loadSector(location)

  const pl = new player.Player(socket, name, sec)

  PLAYERS.set(socket, pl)

  if (column === null) {
    const origin = sec.origin
    pl.x = origin[0] * environment.WIDTH
    pl.y = origin[1] * environment.HEIGHT
  } else {
    pl.x = column * environment.WIDTH
    pl.y = row * environment.HEIGHT
  }

  sec.addPlayer(pl)

  SECTORS_LOADED.clear()
  loadSectors(location, 0, 0)

  SECTORS_LOADED.clear()
  const send = {
    code: 'data',
    sectors: sectorData([], pl.sector, 0, 0),
  }
  socket.send(JSON.stringify(send))
}

function update() {
  const iter = SECTORS.iter()
  while (iter.hasNext()) {
    iter.next().value.update()
  }

  for (const [, p] of PLAYERS.entries()) {
    const snap = p.snap()
    if (snap !== null) {
      p.socket.send(
        JSON.stringify({
          code: 'snapshot',
          snapshot: snap,
        })
      )
    }
  }
}

function tick() {
  const now = Date.now()

  if (PREVIOUS_TICK + TICK_RATE <= now) {
    PREVIOUS_TICK = now
    update()
  }

  if (Date.now() - PREVIOUS_TICK < TICK_RATE - 16.0) {
    setTimeout(tick)
  } else {
    setImmediate(tick)
  }
}

function message(socket, data, binary) {
  if (binary) {
    console.log(data)
  } else {
    data = JSON.parse(data.toString())
    if (data.code === 'online') {
      online(socket, data)
    } else {
      const player = PLAYERS.get(socket)
      if (player === undefined) return
      player.message(data)
    }
  }
}

function closeConnection(socket) {
  const player = PLAYERS.get(socket)
  if (player === undefined) return
  const name = player.name
  SQL('run', 'update user set online = 0 where name = ?', name)
  PLAYERS.delete(socket)
}

module.exports = {
  init: init,
  tick: tick,
  message,
  closeConnection,
}

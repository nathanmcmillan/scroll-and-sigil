const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const sector = require('./sector')
const player = require('./player')
const table = require('./table')

let DB = null

const PLAYERS = new Map()
const SECTORS = new table.Table(table.stringHashcode)

async function init(db) {
  DB = db
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
    sector text,
    event text,
    time int
  )`
  await SQL('run', create)
}

function loadSector(name) {
  let sec = SECTORS.get(name)
  if (sec !== null) return sec
  const pa = path.join(__dirname, 'sectors', name + '.json')
  const dat = fs.readFileSync(pa, { encoding: 'utf8' })
  sec = new sector.Sector(name, dat)
  SECTORS.set(name, sec)
  return sec
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

function newSession() {
  return crypto.randomBytes(16).toString('base64')
}

async function online(data) {
  const name = data.user

  let area = null
  let event = null
  let time = null

  const user = await SQL('get', 'select password, salt, sector, event, time from user where name = ?', name)
  if (user) {
    const password = await computePassword(data.password, user.salt)
    if (user.password !== password[0]) {
      console.error(name + ' wrong password')
      return {
        code: 'wrong-password',
      }
    } else {
      if (PLAYERS.get(name)) {
        console.log(name + ' multiple logins')
        offline(name)
      }
      console.log(name + ' online')
      area = user.sector
      event = user.event
      time = user.time
    }
  } else {
    console.log('new user ' + name)
    const password = await computePassword(data.password, null)
    await SQL('run', 'insert into user (name, password, salt) values (?, ?, ?)', name, password[0], password[1])
  }

  if (area === null) area = 'test'

  const sec = loadSector(area)

  const session = newSession()
  const pl = new player.Player(name, session, sec)

  PLAYERS.set(name, pl)
  sec.addPlayer(pl)

  return {
    code: 'online',
    event: event,
    time: time,
    session: session,
    sector: sec.data(),
  }
}

async function event(url, data) {
  if (url === '/online') return online(data)
  const name = data.user
  if (name === null || name === undefined) return { code: 'missing-user' }
  if (name.length > 64) return { code: 'bad-user' }
  const session = data.session
  if (session === null || session === undefined) return { code: 'missing-session' }
  const player = PLAYERS.get(name)
  if (player === undefined) return { code: 'not-online' }
  if (player.session !== session) return { code: 'bad-session' }
  switch (url) {
    case '/offline':
      return offline(data)
    case '/event':
      return player.event(data)
    default:
      return { code: 'unknown-api' }
  }
}

function offline(name) {
  const player = PLAYERS.get(name)
  if (player === undefined) return
  PLAYERS.delete(name)
  return { code: 'offline' }
}

module.exports = {
  init: init,
  event,
}

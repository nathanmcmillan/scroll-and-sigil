/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as input from './input.js'
import * as net from './net.js'
import * as images from './images.js'
import * as environment from './environment.js'
import { Sector, TILES } from './sector.js'

export const CONTROLLERS = []

export const INPUT = new input.Input()

const KEYS = new Map()

let CANVAS = null
let CONTEXT = null
let SOCKET_QUEUE = null
let SOCKET = null
let USER = null
let PLAYER = null

const SECTORS = new Map()

const OFFSET_X = TILES * environment.WIDTH
const OFFSET_Y = TILES * environment.HEIGHT
const DRAW_SECTOR_VISIT = new Set()

function keyEvent(code, down) {
  if (KEYS.has(code)) INPUT.set(KEYS.get(code), down)
}

export function keyUp(event) {
  keyEvent(event.code, false)
}

export function keyDown(event) {
  keyEvent(event.code, true)
}

function mouseEvent() {}

export function mouseUp(event) {
  mouseEvent(event.button, false)
}

export function mouseDown(event) {
  mouseEvent(event.button, true)
}

export function mouseMove() {}

export function touchStart() {}

export function touchEnd() {}

export function touchMove() {}

export function pause() {}

export function resume() {}

export function resize(width, height) {
  CANVAS.width = width
  CANVAS.height = height
  CONTEXT.imageSmoothingEnabled = false
}

export async function init(canvas, context) {
  CANVAS = canvas
  CONTEXT = context

  const environmentImage = images.load('environment', './images/environment.png')
  const monstersImage = images.load('monsters', './images/monsters.png')

  KEYS.set('Enter', input.BUTTON_START)
  KEYS.set('Space', input.BUTTON_SELECT)
  KEYS.set('KeyW', input.STICK_UP)
  KEYS.set('KeyA', input.STICK_LEFT)
  KEYS.set('KeyS', input.STICK_DOWN)
  KEYS.set('KeyD', input.STICK_RIGHT)
  KEYS.set('ArrowUp', input.BUTTON_X)
  KEYS.set('ArrowLeft', input.BUTTON_Y)
  KEYS.set('ArrowDown', input.BUTTON_B)
  KEYS.set('ArrowRight', input.BUTTON_A)
  KEYS.set('KeyI', input.BUTTON_X)
  KEYS.set('KeyJ', input.BUTTON_Y)
  KEYS.set('KeyK', input.BUTTON_B)
  KEYS.set('KeyL', input.BUTTON_A)
  KEYS.set('KeyQ', input.LEFT_TRIGGER)
  KEYS.set('KeyO', input.RIGHT_TRIGGER)
  INPUT.usingKeyboardMouse()

  // const thing = await RequestText('./map')
  // console.log(thing)

  SOCKET_QUEUE = []

  SOCKET = await net.socket()
  // socket.binaryType = 'arraybuffer'

  SOCKET.onclose = function () {
    console.log('lost connection to server')
    SOCKET = null
  }

  SOCKET.onmessage = function (event) {
    SOCKET_QUEUE.push(event.data)
  }

  USER = 'guest'

  const text = JSON.stringify({ code: 'online', user: USER, password: 'secret' })
  SOCKET.send(text)

  await environmentImage
  await monstersImage
}

function data(sectors) {
  SECTORS.clear()

  const count = sectors.length
  for (let s = 0; s < count; s++) {
    const sector = new Sector(sectors[s])

    const players = sector.players
    for (let p = 0; p < sector.playerCount; p++) {
      const player = players[p]
      if (player.name === USER) {
        PLAYER = player
      }
    }

    SECTORS.set(sector.name, sector)
  }

  for (const [, sec] of SECTORS.entries()) {
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

  if (PLAYER === null) {
    console.error('player not in data')
  }

  PLAYER.input = INPUT
  PLAYER.socket = SOCKET
}

export function update(time) {
  if (time === 0) {
    console.log(time)
  }

  const socketQueue = SOCKET_QUEUE
  if (socketQueue.length !== 0) {
    for (let i = 0; i < socketQueue.length; i++) {
      const packet = JSON.parse(socketQueue[i])
      switch (packet.code) {
        case 'data':
          console.log('DATA', socketQueue[i])
          data(packet.sectors)
          break
        case 'snapshot':
          if (PLAYER !== null) PLAYER.message(packet)
          break
      }
    }
    socketQueue.length = 0
  }

  INPUT.keyboardMouseUpdate()

  if (PLAYER !== null) PLAYER.update()
}

export function draw() {
  const canvas = CANVAS
  const context = CONTEXT

  context.clearRect(0, 0, canvas.width, canvas.height)

  const player = PLAYER

  if (player === null) {
    return
  }

  const sector = player.sector

  const x = player.x + canvas.width * 0.5
  const y = player.y + canvas.height * 0.5

  DRAW_SECTOR_VISIT.clear()
  drawSector(sector, x, y)
}

function drawSector(sector, x, y) {
  if (DRAW_SECTOR_VISIT.has(sector)) return
  DRAW_SECTOR_VISIT.add(sector)
  for (let r = 0; r < TILES; r++) {
    for (let c = 0; c < TILES; c++) {
      const sprite = environment.SPRITES[sector.tiles[c + r * TILES]]
      CONTEXT.drawImage(sector.image, sprite[0], sprite[1], sprite[2], sprite[3], x + c * environment.WIDTH, y + r * environment.HEIGHT, environment.WIDTH, environment.HEIGHT)
    }
  }
  const players = sector.players
  let i = sector.playerCount
  while (i--) {
    const player = players[i]
    const sprite = player.sprite
    CONTEXT.drawImage(player.image, sprite[0], sprite[1], sprite[2], sprite[3], x + player.x, y + player.y, sprite[2], sprite[3])
  }
  if (sector.left !== null) drawSector(sector.left, x - OFFSET_X, y)
  if (sector.right !== null) drawSector(sector.right, x + OFFSET_X, y)
  if (sector.up !== null) drawSector(sector.up, x, y - OFFSET_Y)
  if (sector.down !== null) drawSector(sector.down, x, y + OFFSET_Y)
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as net from './net.js'
import * as images from './images.js'
import * as render from './render.js'
import * as tiles from './tiles.js'
import * as event from './event.js'
import { Button } from './button.js'

let CANVAS = null
let CONTEXT = null
let CANVAS_WIDTH_HALF = 0
let CANVAS_HEIGHT_HALF = 0

let LISTEN = null

let USER = null
let SESSION = null

let EVENT = null
let TIME = null

let SECTOR = null
let COLUMNS = 0
let ROWS = 0
let TILES = null
let MUSIC = null
let EVENTS = null

let MOUSE_X = 0
let MOUSE_Y = 0
let MOUSE_DOWN = false
let START_MOUSE_X = 0
let START_MOUSE_Y = 0

let X = 0
let Y = 0
let START_X = 0
let START_Y = 0

const TRAVEL_BUTTON = new Button()

const BUTTONS = [TRAVEL_BUTTON]

function keyEvent(code, down) {
  console.debug(code, down)
}

export function keyUp(event) {
  keyEvent(event.code, false)
}

export function keyDown(event) {
  keyEvent(event.code, true)
}

export async function mouseUp(event) {
  if (event.button !== 0) return
  MOUSE_DOWN = false
  if (MOUSE_X !== START_MOUSE_X || MOUSE_Y !== START_MOUSE_Y) return
  if (MOUSE_X < 0 || MOUSE_Y < 0 || MOUSE_X > CANVAS.width || MOUSE_Y > CANVAS.height) return

  const buttons = BUTTONS
  for (let b = buttons.length - 1; b >= 0; b--) {
    const button = buttons[b]
    if (MOUSE_X < button.x || MOUSE_Y < button.y || MOUSE_X > button.x + button.width || MOUSE_Y > button.y + button.height) continue
    console.debug('button:', button)
  }

  if (MOUSE_X + X < 0 || MOUSE_Y + Y < 0) return
  const column = Math.floor((MOUSE_X + X) / tiles.WIDTH)
  const row = Math.floor((MOUSE_Y + Y) / tiles.HEIGHT)
  if (column > COLUMNS || row > ROWS) return
  console.debug('column and row', column, row)
  const events = EVENTS
  for (let e = events.length - 1; e >= 0; e--) {
    const event = events[e]
    console.debug(event)
    if (column < event.left || row < event.top || column > event.right || row > event.bottom) continue
    console.debug('event!')
    const message = {
      user: USER,
      session: SESSION,
      event: event.id,
    }
    const text = await net.post('event', JSON.stringify(message))
    console.log(text)
    const receive = JSON.parse(text)
    if (receive.code === 'started') {
      EVENT = event
    }
    return
  }
}

export function mouseDown(event) {
  if (event.button !== 0) return
  MOUSE_DOWN = true
  START_MOUSE_X = MOUSE_X
  START_MOUSE_Y = MOUSE_Y
  START_X = X
  START_Y = Y
}

export function mouseMove(mouse) {
  const bound = CANVAS.getBoundingClientRect()
  MOUSE_X = mouse.clientX - bound.left
  MOUSE_Y = mouse.clientY - bound.top
  if (MOUSE_DOWN) {
    X = START_X + (START_MOUSE_X - MOUSE_X)
    Y = START_Y + (START_MOUSE_Y - MOUSE_Y)
    if (X < -CANVAS_WIDTH_HALF) X = -CANVAS_WIDTH_HALF
    else if (X > COLUMNS * tiles.WIDTH - CANVAS_WIDTH_HALF) X = COLUMNS * tiles.WIDTH - CANVAS_WIDTH_HALF
    if (Y < -CANVAS_HEIGHT_HALF) Y = -CANVAS_HEIGHT_HALF
    else if (Y > ROWS * tiles.HEIGHT - CANVAS_HEIGHT_HALF) Y = ROWS * tiles.HEIGHT - CANVAS_HEIGHT_HALF
  }
}

export function touchStart(event) {
  const x = event.pageX
  const y = event.pageY
  console.debug('touch', x, y)
}

export function touchEnd() {}

export function touchMove() {}

export function pause() {
  if (LISTEN) LISTEN.pause()
}

export function resume() {
  if (LISTEN) LISTEN.play()
}

export function resize(width, height) {
  CANVAS.width = width
  CANVAS.height = height
  CANVAS_WIDTH_HALF = Math.floor(CANVAS.width / 2)
  CANVAS_HEIGHT_HALF = Math.floor(CANVAS.height / 2)
  CONTEXT.imageSmoothingEnabled = false
}

export async function init(canvas, context) {
  CANVAS = canvas
  CONTEXT = context
  CANVAS_WIDTH_HALF = Math.floor(CANVAS.width / 2)
  CANVAS_HEIGHT_HALF = Math.floor(CANVAS.height / 2)

  const tilesImage = images.load('tiles', './images/tiles.png')
  const monstersImage = images.load('monsters', './images/monsters.png')
  const interfaceImage = images.load('interface', './images/interface.png')
  const fontImage = images.loadAndSwap('font', './images/font.png')

  TRAVEL_BUTTON.x = 300
  TRAVEL_BUTTON.y = 10
  TRAVEL_BUTTON.width = 90
  TRAVEL_BUTTON.height = 80
  TRAVEL_BUTTON.spriteX = 10
  TRAVEL_BUTTON.spriteY = 10

  USER = 'guest'
  SESSION = null

  const text = JSON.stringify({ code: 'online', user: USER, password: 'secret' })
  const data = await net.post('online', text)
  console.log(data)
  const online = JSON.parse(data)

  if (online.code !== 'online') return

  SESSION = online.session

  EVENT = null // online.event
  TIME = online.time

  const sector = online.sector

  SECTOR = sector.name
  COLUMNS = sector.columns
  ROWS = sector.rows
  TILES = sector.tiles
  MUSIC = sector.music
  EVENTS = sector.events

  await tilesImage
  await monstersImage
  await interfaceImage
  await fontImage

  X = Math.floor((COLUMNS * tiles.WIDTH) / 2) - CANVAS_WIDTH_HALF
  Y = Math.floor((ROWS * tiles.HEIGHT) / 2) - CANVAS_HEIGHT_HALF

  LISTEN = new Audio('./music/' + MUSIC + '.wav')
  LISTEN.loop = true
  LISTEN.volume = 0.15
  LISTEN.currentTime = 0
  const promise = LISTEN.play()
  if (promise) promise.then(() => {}).catch(() => {})
}

export function draw(time) {
  if (time === 0) console.log(time)

  const canvas = CANVAS
  const context = CONTEXT

  context.clearRect(0, 0, canvas.width, canvas.height)

  const font = images.IMAGES.get('font')

  if (SESSION === null) {
    render.text(context, font, 10, 10, 'not logged in!', 2, render.FONT)
    return
  }

  const image = images.IMAGES.get('tiles')

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      const sprite = tiles.SPRITES[TILES[c + r * COLUMNS]]
      context.drawImage(image, sprite[0], sprite[1], sprite[2], sprite[3], c * tiles.WIDTH - X, r * tiles.HEIGHT - Y, tiles.WIDTH, tiles.HEIGHT)
    }
  }

  const description = (EVENT === null ? 'idle' : event.description(EVENT)) + ' at ' + SECTOR

  render.text(context, font, 10, 10, description, 2, render.FONT)

  const buttons = images.IMAGES.get('interface')

  drawButton(context, buttons, TRAVEL_BUTTON)
}

function drawButton(context, image, button) {
  context.drawImage(image, button.spriteX, button.spriteY, button.width, button.height, button.x, button.y, button.width, button.height)
}

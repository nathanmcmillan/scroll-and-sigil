/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as net from './net.js'
import * as images from './images.js'
import * as render from './render.js'
import * as tiles from './tiles.js'
import * as event from './event.js'
import { Button } from './button.js'

let SCALE = 1

let SCREEN = null
let SCREEN_CONTEXT = null

let CANVAS = null
let CONTEXT = null
let CANVAS_WIDTH = 0
let CANVAS_HEIGHT = 0
let CANVAS_WIDTH_HALF = 0
let CANVAS_HEIGHT_HALF = 0

let LISTEN = null

let EVENT = null
const _TIME = null

const _SECTOR = null
const COLUMNS = 0
const ROWS = 0
const TILES = null
let MUSIC = null
const EVENTS = null

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
  // console.debug(code, down)
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
    if (
      MOUSE_X < button.x ||
      MOUSE_Y < button.y ||
      MOUSE_X > button.x + button.width ||
      MOUSE_Y > button.y + button.height
    )
      continue
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
  if (LISTEN) {
    const promise = LISTEN.play()
    if (promise) promise.then(() => {}).catch(() => {})
  }
}

export function resize(scale, width, height) {
  SCALE = scale

  SCREEN.width = width
  SCREEN.height = height

  SCREEN_CONTEXT.imageSmoothingEnabled = false

  CANVAS.width = Math.floor(SCREEN.width / SCALE)
  CANVAS.height = Math.floor(SCREEN.height / SCALE)

  CONTEXT.imageSmoothingEnabled = false

  CANVAS_WIDTH = CANVAS.width
  CANVAS_HEIGHT = CANVAS.height
  CANVAS_WIDTH_HALF = Math.floor(CANVAS_WIDTH / 2)
  CANVAS_HEIGHT_HALF = Math.floor(CANVAS_HEIGHT / 2)
}

export async function init(scale, screen) {
  SCALE = scale

  SCREEN = screen
  SCREEN_CONTEXT = screen.getContext('2d', { alpha: false })
  SCREEN_CONTEXT.imageSmoothingEnabled = false

  CANVAS = document.createElement('canvas')
  CANVAS.width = Math.floor(SCREEN.width / scale)
  CANVAS.height = Math.floor(SCREEN.height / scale)
  CONTEXT = CANVAS.getContext('2d', { alpha: false })
  CONTEXT.imageSmoothingEnabled = false

  CANVAS_WIDTH = CANVAS.width
  CANVAS_HEIGHT = CANVAS.height
  CANVAS_WIDTH_HALF = Math.floor(CANVAS_WIDTH / 2)
  CANVAS_HEIGHT_HALF = Math.floor(CANVAS_HEIGHT / 2)

  const tilesImage = images.load('tiles', './images/tiles.png')
  const monstersImage = images.load('monsters', './images/monsters.png')
  const interfaceImage = images.load('interface', './images/interface.png')
  const fontImage = images.loadAndSwap('font', './images/font.png')

  TRAVEL_BUTTON.x = 128
  TRAVEL_BUTTON.y = 10
  TRAVEL_BUTTON.width = 90
  TRAVEL_BUTTON.height = 80
  TRAVEL_BUTTON.spriteX = 10
  TRAVEL_BUTTON.spriteY = 10

  EVENT = null
  // TIME = online.time

  const home = JSON.parse(await net.requestText('./world/home.json'))

  // const sector = online.sector

  // SECTOR = sector.name
  // COLUMNS = sector.columns
  // ROWS = sector.rows
  // TILES = sector.tiles
  // MUSIC = sector.music
  // EVENTS = sector.events
  MUSIC = home.music

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
}

export function update(time) {}

export function draw(time) {
  if (time === 0) console.log(time)

  const canvas = CANVAS
  const context = CONTEXT

  context.clearRect(0, 0, canvas.width, canvas.height)

  const font = images.IMAGES.get('font')
  const image = images.IMAGES.get('tiles')

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      const sprite = tiles.SPRITES[TILES[c + r * COLUMNS]]
      context.drawImage(
        image,
        sprite[0],
        sprite[1],
        sprite[2],
        sprite[3],
        c * tiles.WIDTH - X,
        r * tiles.HEIGHT - Y,
        tiles.WIDTH,
        tiles.HEIGHT,
      )
    }
  }

  const description = EVENT === null ? 'idle' : event.description(EVENT)
  render.text(context, font, 10, 10, description, 2, render.FONT)

  const buttons = images.IMAGES.get('interface')
  drawButton(context, buttons, TRAVEL_BUTTON)

  const buffer = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = buffer.data

  pixel2d(pixels, 10, 30, 255, 0, 0)
  line2d(pixels, 20, 40, 255, 0, 0, 30, 50, 255, 0, 0)
  triangle2d(pixels, 20, 60, 255, 0, 0, 50, 80, 255, 255, 0, 30, 90, 255, 0, 255)

  const tiles = images.IMAGE_PIXELS.get('tiles')
  sprite2d(pixels, 60, 10, tiles, 0, 0, 16, 24)

  mode2d(pixels, 60, 100, 76, 100, 76, 124, 60, 124, tiles, 0, 0, 16, 24)

  blit(context, buffer)

  SCREEN_CONTEXT.drawImage(CANVAS, 0, 0, CANVAS.width, CANVAS.height, 0, 0, SCREEN.width, SCREEN.height)
}

function pixel2d(pixels, x, y, r, g, b) {
  if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) return
  const i = (x + y * CANVAS_WIDTH) * 4
  pixels[i] = r
  pixels[i + 1] = g
  pixels[i + 2] = b
}

function sprite2d(pixels, x, y, image, sx, sy, sw, sh) {
  const iw = image.width
  const src = image.pixels
  let s = y * CANVAS_WIDTH
  let f = sy * iw
  for (let r = 0; r < sh; r++) {
    for (let c = 0; c < sw; c++) {
      const p = (sx + c + f) * 4
      const i = (x + c + s) * 4
      pixels[i] = src[p]
      pixels[i + 1] = src[p + 1]
      pixels[i + 2] = src[p + 2]
    }
    f += iw
    s += CANVAS_WIDTH
  }
}

function mode2d(pixels, x1, y1, x2, y2, x3, y3, x4, y4, image, sx, sy, sw, sh) {
  // const iw = image.width
  // const src = image.pixels
  // let s = y * CANVAS_WIDTH
  // let f = sy * iw
  // for (let r = 0; r < sh; r++) {
  //   for (let c = 0; c < sw; c++) {
  //     const p = (sx + c + f) * 4
  //     const i = (x + c + s) * 4
  //     pixels[i] = src[p]
  //     pixels[i + 1] = src[p + 1]
  //     pixels[i + 2] = src[p + 2]
  //   }
  //   f += iw
  //   s += CANVAS_WIDTH
  // }
}

function line2d(pixels, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2) {
  var dx = x2 - x1
  var dy = y2 - y1

  if (dx === 0 && dy === 0) {
    pixel2d(pixels, x1, y1, r1, g1, b1)
    return
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    var xs, xb

    if (x1 < x2) {
      xs = x1
      xb = x2
    } else {
      xs = x2
      xb = x1
    }

    var slope = dy / dx

    for (var x = xs; x <= xb; x++) {
      var y = y1 + (x - x1) * slope
      var c = (x - x1) / dx
      var r = r1 + (r2 - r1) * c
      var g = g1 + (g2 - g1) * c
      var b = b1 + (b2 - b1) * c
      pixel2d(pixels, Math.round(x), Math.round(y), Math.round(r), Math.round(g), Math.round(b))
    }
  } else {
    var ys, yb

    if (y1 < y2) {
      ys = y1
      yb = y2
    } else {
      ys = y2
      yb = y1
    }

    var slope = dx / dy

    for (var y = ys; y <= yb; y++) {
      var x = x1 + (y - y1) * slope
      var c = (y - y1) / dy
      var r = r1 + (r2 - r1) * c
      var g = g1 + (g2 - g1) * c
      var b = b1 + (b2 - b1) * c
      pixel2d(pixels, Math.round(x), Math.round(y), Math.round(r), Math.round(g), Math.round(b))
    }
  }
}

function edge2d(x1, y1, r1, g1, b1, x2, y2, r2, g2, b2) {
  if (y1 < y2) {
    this.r1 = r1
    this.g1 = g1
    this.b1 = b1

    this.x1 = x1
    this.y1 = y1

    this.r2 = r2
    this.g2 = g2
    this.b2 = b2

    this.x2 = x2
    this.y2 = y2
  } else {
    this.r1 = r2
    this.g1 = g2
    this.b1 = b2

    this.x1 = x2
    this.y1 = y2

    this.r2 = r1
    this.g2 = g1
    this.b2 = b1

    this.x2 = x1
    this.y2 = y1
  }
}

function span2d(x1, x2, r1, g1, b1, r2, g2, b2) {
  if (x1 < x2) {
    this.r1 = r1
    this.g1 = g1
    this.b1 = b1

    this.x1 = x1

    this.r2 = r2
    this.g2 = g2
    this.b2 = b2

    this.x2 = x2
  } else {
    this.r1 = r2
    this.g1 = g2
    this.b1 = b2

    this.x1 = x2

    this.r2 = r1
    this.g2 = g1
    this.b2 = b1

    this.x2 = x1
  }
}

function dspan2d(pixels, s, y) {
  var dx = s.x2 - s.x1
  if (dx === 0) return

  var dr = s.r2 - s.r1
  var dg = s.g2 - s.g1
  var db = s.b2 - s.b1

  var factor = 0.0
  var step = 1.0 / dx

  for (var x = Math.round(s.x1); x < s.x2; x++) {
    var r = s.r1 + dr * factor
    var g = s.g1 + dg * factor
    var b = s.b1 + db * factor

    pixel2d(pixels, x, y, Math.round(r), Math.round(g), Math.round(b))
    factor += step
  }
}

function dspanbetweenedges2d(pixels, e1, e2) {
  var e1dy = e1.y2 - e1.y1
  if (e1dy === 0) return

  var e2dy = e2.y2 - e2.y1
  if (e2dy === 0) return

  var e1dx = e1.x2 - e1.x1
  var e2dx = e2.x2 - e2.x1

  var e1dr = e1.r2 - e1.r1
  var e1dg = e1.g2 - e1.g1
  var e1db = e1.b2 - e1.b1

  var e2dr = e2.r2 - e2.r1
  var e2dg = e2.g2 - e2.g1
  var e2db = e2.b2 - e2.b1

  var factor1 = (e2.y1 - e1.y1) / e1dy
  var factor2 = 0

  var step1 = 1.0 / e1dy
  var step2 = 1.0 / e2dy

  for (var y = e2.y1; y < e2.y2; y++) {
    var r1 = e1.r1 + e1dr * factor1
    var g1 = e1.g1 + e1dg * factor1
    var b1 = e1.b1 + e1db * factor1

    var r2 = e2.r1 + e2dr * factor2
    var g2 = e2.g1 + e2dg * factor2
    var b2 = e2.b1 + e2db * factor2

    var s = new span2d(e1.x1 + e1dx * factor1, e2.x1 + e2dx * factor2, r1, g1, b1, r2, g2, b2)
    dspan2d(pixels, s, Math.round(y))

    factor1 += step1
    factor2 += step2
  }
}

function triangle2d(pixels, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3) {
  const edges = [
    new edge2d(x1, y1, r1, g1, b1, x2, y2, r2, g2, b2),
    new edge2d(x2, y2, r2, g2, b2, x3, y3, r3, g3, b3),
    new edge2d(x3, y3, r3, g3, b3, x1, y1, r1, g1, b1),
  ]

  var lb = 0
  var eb = 0

  for (var i = 0; i < 3; i++) {
    var length = edges[i].y2 - edges[i].y1
    if (length > lb) {
      lb = length
      eb = i
    }
  }

  dspanbetweenedges2d(pixels, edges[eb], edges[(eb + 1) % 3])
  dspanbetweenedges2d(pixels, edges[eb], edges[(eb + 2) % 3])
}

function blit(context, buffer) {
  context.putImageData(buffer, 0, 0)
}

function drawButton(context, image, button) {
  context.drawImage(
    image,
    button.spriteX,
    button.spriteY,
    button.width,
    button.height,
    button.x,
    button.y,
    button.width,
    button.height,
  )
}

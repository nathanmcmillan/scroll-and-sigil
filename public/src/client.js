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

function keyEvent(_code, _down) {
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

export function touchEnd() { }

export function touchMove() { }

export function pause() {
  if (LISTEN) LISTEN.pause()
}

export function resume() {
  if (LISTEN) {
    const promise = LISTEN.play()
    if (promise) promise.then(() => { }).catch(() => { })
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

export function update() { }

const PERFORMANCE = false

const SHIFT = 16
const SHIFT_UNIT = 1 << SHIFT
const SHIFT_MASK = SHIFT_UNIT - 1

const SHIFT_BIG = 16n
const SHIFT_UNIT_BIG = 1n << SHIFT_BIG

function fixedAdd(a, b) {
  return a + b
}

function fixedMul(a, b) {
  return (a * b) >> SHIFT
}

function fixedDiv(a, b) {
  return (a / b) * SHIFT_UNIT
}

function fixedToFloat(f) {
  return f / SHIFT_UNIT
}

function floatToFixed(f) {
  return Math.round(f * SHIFT_UNIT)
}

export function draw() {
  const canvas = CANVAS
  const context = CONTEXT

  context.clearRect(0, 0, canvas.width, canvas.height)

  // const font = images.IMAGES.get('font')
  // const image = images.IMAGES.get('tiles')

  // for (let r = 0; r < ROWS; r++) {
  //   for (let c = 0; c < COLUMNS; c++) {
  //     const sprite = tiles.SPRITES[TILES[c + r * COLUMNS]]
  //     context.drawImage(
  //       image,
  //       sprite[0],
  //       sprite[1],
  //       sprite[2],
  //       sprite[3],
  //       c * tiles.WIDTH - X,
  //       r * tiles.HEIGHT - Y,
  //       tiles.WIDTH,
  //       tiles.HEIGHT,
  //     )
  //   }
  // }

  // const description = EVENT === null ? 'idle' : event.description(EVENT)
  // render.text(context, font, 10, 10, description, 2, render.FONT)

  // const buttons = images.IMAGES.get('interface')
  // drawButton(context, buttons, TRAVEL_BUTTON)

  const buffer = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = buffer.data

  if (PERFORMANCE) {
    for (let p = 0; p < 200; p++) {
      for (let f = 0; f < 200; f++) {
        // 40,000 triangles
        // top:     77
        // current: 85
        triangle2d(pixels, p, f, 255, 0, 0, p + 16, f, 0, 255, 0, p + 16, f + 24, 0, 0, 255)
      }
    }
  }

  triangle2d(pixels, 0, 0, 100, 149, 237, 300, 0, 100, 149, 237, 300, 200, 100, 149, 237)
  triangle2d(pixels, 0, 0, 100, 149, 237, 0, 200, 100, 149, 237, 300, 200, 100, 149, 237)

  // triangle2d(pixels, 20, 60, 255, 0, 0, 50, 80, 255, 255, 0, 30, 90, 255, 0, 255)

  const tiles = images.IMAGE_PIXELS.get('tiles')
  sprite2d(pixels, 20, 120, tiles, 0, 0, 16, 24)

  // triangle2d(pixels, 80, 120, 255, 0, 0, 96, 120, 0, 255, 0, 96, 144, 0, 0, 255)

  // const sr = 16
  // const sb = 24

  const sl = 0
  const st = 0
  const sr = 16 << SHIFT
  const sb = 24 << SHIFT

  // const sl = floatToFixed(0.5)
  // const st = floatToFixed(0.5)
  // const sr = floatToFixed(16.5)
  // const sb = floatToFixed(24.5)

  // mode2d(pixels, tiles, 50, 120, 66, 120, 50, 144, 66, 144, 0.0, 0.0, sr, sb)

  // texture2d(pixels, tiles, 66, 150, 0.0, 0.0, 66, 166, sr, 0.0, 42, 166, sr, sb)
  // texture2d(pixels, tiles, 66, 150, 0.0, 0.0, 42, 166, sr, sb, 42, 150, 0.0, sb)

  console.log('------------------------------')
  // mode2d(pixels, tiles, 200, 120, 232, 120, 200, 168, 232, 168, 0, 0, sr, sb)
  // texture2d(pixels, tiles, 200, 120, sl, st, 232, 120, sr, st, 200, 168, sl, sb)
  texture2d(pixels, tiles, 232, 120, sr, st, 232, 168, sr, sb, 200, 168, sl, sb)

  blit(context, buffer)

  SCREEN_CONTEXT.drawImage(CANVAS, 0, 0, CANVAS.width, CANVAS.height, 0, 0, SCREEN.width, SCREEN.height)
}

function mode2d(pixels, image, x1, y1, x2, y2, x3, y3, x4, y4, sl, st, sr, sb) {
  texture2d(pixels, image, x1, y1, sl, st, x2, y2, sr, st, x3, y3, sl, sb)
  texture2d(pixels, image, x3, y3, sl, sb, x2, y2, sr, st, x4, y4, sr, sb)
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

function line2d(pixels, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2) {

  const dx = x2 - x1
  const dy = y2 - y1

  if (dx === 0 && dy === 0) {
    pixel2d(pixels, x1, y1, r1, g1, b1)
    return
  }

  if (Math.abs(dx) > Math.abs(dy)) {

    let xs, xb
    if (x1 < x2) {
      xs = x1
      xb = x2
    } else {
      xs = x2
      xb = x1
    }
    const slope = dy / dx
    for (let x = xs; x <= xb; x++) {
      const y = y1 + (x - x1) * slope
      const c = (x - x1) / dx
      const r = r1 + (r2 - r1) * c
      const g = g1 + (g2 - g1) * c
      const b = b1 + (b2 - b1) * c
      pixel2d(pixels, Math.round(x), Math.round(y), Math.round(r), Math.round(g), Math.round(b))
    }

  } else {

    let ys, yb
    if (y1 < y2) {
      ys = y1
      yb = y2
    } else {
      ys = y2
      yb = y1
    }
    const slope = dx / dy
    for (let y = ys; y <= yb; y++) {
      const x = x1 + (y - y1) * slope
      const c = (y - y1) / dy
      const r = r1 + (r2 - r1) * c
      const g = g1 + (g2 - g1) * c
      const b = b1 + (b2 - b1) * c
      pixel2d(pixels, Math.round(x), Math.round(y), Math.round(r), Math.round(g), Math.round(b))
    }
  }
}

function span2d(pixels, x1, r1, g1, b1, x2, r2, g2, b2, line) {

  const dx = x2 - x1
  if (dx === 0) return

  const dr = r2 - r1
  const dg = g2 - g1
  const db = b2 - b1

  let factor = 0.0
  const step = 1.0 / dx

  let index = Math.round(x1)
  if (index < 0) {
    factor = -index * step
    index = line * 4
  } else {
    index = (index + line) * 4
  }

  const end = (x2 > CANVAS_WIDTH) ? (CANVAS_WIDTH + line) * 4 : (Math.ceil(x2) + line) * 4

  while (index < end) {

    const r = r1 + Math.round(dr * factor)
    const g = g1 + Math.round(dg * factor)
    const b = b1 + Math.round(db * factor)

    pixels[index] = r
    pixels[index + 1] = g
    pixels[index + 2] = b

    index += 4

    factor += step
  }
}

function between2d(pixels,
  x1, y1, r1, g1, b1, x2, y2, r2, g2, b2,
  x3, y3, r3, g3, b3, x4, y4, r4, g4, b4) {

  const e1dy = y2 - y1
  if (e1dy === 0) return

  const e2dy = y4 - y3
  if (e2dy === 0) return

  const e1dx = x2 - x1
  const e2dx = x4 - x3

  const e1dr = r2 - r1
  const e1dg = g2 - g1
  const e1db = b2 - b1

  const e2dr = r4 - r3
  const e2dg = g4 - g3
  const e2db = b4 - b3

  let factor1 = (y3 - y1) / e1dy
  let factor2 = 0.0

  const step1 = 1.0 / e1dy
  const step2 = 1.0 / e2dy

  let line = Math.round(y3)
  if (line < 0) {
    factor1 += -line * step1
    factor2 = -line * step2
    line = 0
  } else {
    line *= CANVAS_WIDTH
  }

  const end = (y4 > CANVAS_HEIGHT) ? CANVAS_HEIGHT * CANVAS_WIDTH : Math.ceil(y4) * CANVAS_WIDTH

  while (line < end) {

    const sr1 = r1 + e1dr * factor1
    const sg1 = g1 + e1dg * factor1
    const sb1 = b1 + e1db * factor1

    const sr2 = r3 + e2dr * factor2
    const sg2 = g3 + e2dg * factor2
    const sb2 = b3 + e2db * factor2

    const sx1 = x1 + e1dx * factor1
    const sx2 = x3 + e2dx * factor2

    if (sx1 < sx2) {
      span2d(pixels, sx1, sr1, sg1, sb1, sx2, sr2, sg2, sb2, line)
    } else {
      span2d(pixels, sx2, sr2, sg2, sb2, sx1, sr1, sg1, sb1, line)
    }

    factor1 += step1
    factor2 += step2

    line += CANVAS_WIDTH
  }
}

function triangle2d(pixels, x1, y1, r1, g1, b1, x2, y2, r2, g2, b2, x3, y3, r3, g3, b3) {
  const edge1 = y1 < y2
  const edge2 = y2 < y3
  const edge3 = y3 < y1
  let longest = edge1 ? (y2 - y1) : (y1 - y2)
  let zero = true
  let length = edge2 ? (y3 - y2) : (y2 - y3)
  if (length > longest) {
    longest = length
    zero = false
  }
  length = edge3 ? (y1 - y3) : (y3 - y1)
  if (length > longest) {
    if (edge3) {
      if (edge1) {
        between2d(pixels,
          x3, y3, r3, g3, b3, x1, y1, r1, g1, b1,
          x1, y1, r1, g1, b1, x2, y2, r2, g2, b2
        )
      } else {
        between2d(pixels,
          x3, y3, r3, g3, b3, x1, y1, r1, g1, b1,
          x2, y2, r2, g2, b2, x1, y1, r1, g1, b1
        )
      }
      if (edge2) {
        between2d(pixels,
          x3, y3, r3, g3, b3, x1, y1, r1, g1, b1,
          x2, y2, r2, g2, b2, x3, y3, r3, g3, b3
        )
      } else {
        between2d(pixels,
          x3, y3, r3, g3, b3, x1, y1, r1, g1, b1,
          x3, y3, r3, g3, b3, x2, y2, r2, g2, b2
        )
      }
    } else {
      if (edge1) {
        between2d(pixels,
          x1, y1, r1, g1, b1, x3, y3, r3, g3, b3,
          x1, y1, r1, g1, b1, x2, y2, r2, g2, b2
        )
      } else {
        between2d(pixels,
          x1, y1, r1, g1, b1, x3, y3, r3, g3, b3,
          x2, y2, r2, g2, b2, x1, y1, r1, g1, b1
        )
      }
      if (edge2) {
        between2d(pixels,
          x1, y1, r1, g1, b1, x3, y3, r3, g3, b3,
          x2, y2, r2, g2, b2, x3, y3, r3, g3, b3
        )
      } else {
        between2d(pixels,
          x1, y1, r1, g1, b1, x3, y3, r3, g3, b3,
          x3, y3, r3, g3, b3, x2, y2, r2, g2, b2
        )
      }
    }
  } else if (zero) {
    if (edge1) {
      if (edge2) {
        between2d(pixels,
          x1, y1, r1, g1, b1, x2, y2, r2, g2, b2,
          x2, y2, r2, g2, b2, x3, y3, r3, g3, b3
        )
      } else {
        between2d(pixels,
          x1, y1, r1, g1, b1, x2, y2, r2, g2, b2,
          x3, y3, r3, g3, b3, x2, y2, r2, g2, b2
        )
      }
      if (edge3) {
        between2d(pixels,
          x1, y1, r1, g1, b1, x2, y2, r2, g2, b2,
          x3, y3, r3, g3, b3, x1, y1, r1, g1, b1
        )
      }
      else {
        between2d(pixels,
          x1, y1, r1, g1, b1, x2, y2, r2, g2, b2,
          x1, y1, r1, g1, b1, x3, y3, r3, g3, b3
        )
      }
    } else {
      if (edge2) {
        between2d(pixels,
          x2, y2, r2, g2, b2, x1, y1, r1, g1, b1,
          x2, y2, r2, g2, b2, x3, y3, r3, g3, b3
        )
      } else {
        between2d(pixels,
          x2, y2, r2, g2, b2, x1, y1, r1, g1, b1,
          x3, y3, r3, g3, b3, x2, y2, r2, g2, b2
        )
      }
      if (edge3) {
        between2d(pixels,
          x2, y2, r2, g2, b2, x1, y1, r1, g1, b1,
          x3, y3, r3, g3, b3, x1, y1, r1, g1, b1
        )
      }
      else {
        between2d(pixels,
          x2, y2, r2, g2, b2, x1, y1, r1, g1, b1,
          x1, y1, r1, g1, b1, x3, y3, r3, g3, b3
        )
      }
    }
  } else {
    if (edge2) {
      if (edge3) {
        between2d(pixels,
          x2, y2, r2, g2, b2, x3, y3, r3, g3, b3,
          x3, y3, r3, g3, b3, x1, y1, r1, g1, b1
        )
      } else {
        between2d(pixels,
          x2, y2, r2, g2, b2, x3, y3, r3, g3, b3,
          x1, y1, r1, g1, b1, x3, y3, r3, g3, b3
        )
      }
      if (edge1) {
        between2d(pixels,
          x2, y2, r2, g2, b2, x3, y3, r3, g3, b3,
          x1, y1, r1, g1, b1, x2, y2, r2, g2, b2
        )
      } else {
        between2d(pixels,
          x2, y2, r2, g2, b2, x3, y3, r3, g3, b3,
          x2, y2, r2, g2, b2, x1, y1, r1, g1, b1
        )
      }
    } else {
      if (edge3) {
        between2d(pixels,
          x3, y3, r3, g3, b3, x2, y2, r2, g2, b2,
          x3, y3, r3, g3, b3, x1, y1, r1, g1, b1
        )
      } else {
        between2d(pixels,
          x3, y3, r3, g3, b3, x2, y2, r2, g2, b2,
          x1, y1, r1, g1, b1, x3, y3, r3, g3, b3
        )
      }
      if (edge1) {
        between2d(pixels,
          x3, y3, r3, g3, b3, x2, y2, r2, g2, b2,
          x1, y1, r1, g1, b1, x2, y2, r2, g2, b2
        )
      } else {
        between2d(pixels,
          x3, y3, r3, g3, b3, x2, y2, r2, g2, b2,
          x2, y2, r2, g2, b2, x1, y1, r1, g1, b1
        )
      }
    }
  }
}

function texspan2d(pixels, image, x1, u1, v1, x2, u2, v2, line) {

  // if (x2 > CANVAS_WIDTH) x2 = CANVAS_WIDTH

  const dx = x2 - x1
  if (dx === 0) return

  const du = u2 - u1
  const dv = v2 - v1

  // let factor = 0.0
  // const step = 1.0 / dx

  let factorf = 0
  const stepf = Math.floor((SHIFT_UNIT / dx) * SHIFT_UNIT)

  const src = image.pixels
  const wide = image.width

  // let x = Math.round(x1)
  // if (x < 0) {
  //   factor += -x * step
  //   x = 0
  // }

  let x = Math.round(fixedToFloat(x1))
  x2 = Math.round(fixedToFloat(x2))

  for (; x < x2; x++) {

    // const u = u1 + du * factor
    // const v = v1 + dv * factor

    // const t = (Math.round(u) + Math.round(v) * wide) * 4

    const utexel = Math.floor((SHIFT_UNIT / (16 << SHIFT)) * SHIFT_UNIT)
    const vtexel = Math.floor((SHIFT_UNIT / (24 << SHIFT)) * SHIFT_UNIT)

    const u = u1 + Number((BigInt(du) * BigInt(factorf)) >> SHIFT_BIG) - utexel
    const v = v1 + Number((BigInt(dv) * BigInt(factorf)) >> SHIFT_BIG) - vtexel

    // 122
    // ----> 231 	 15 	 15.27099609375

    // 127
    // ----> 227 	 14 	 13.604736328125
    // ----> 228 	 14 	 14.104690551757812
    // ----> 229 	 15 	 14.604660034179688
    // ----> 230 	 15 	 15.104629516601562
    // ----> 231 	 16 	 15.604598999023438

    if (Math.round(line / CANVAS_WIDTH) === 127) {
      // console.log('---->', cu, cv, '|', u1, u2, '|', v1, v2, '|', du, dv, '*', factor, '(', step, ')')
      console.log('---->', x, '\t', Math.round(fixedToFloat(u)), '\t', fixedToFloat(u))
    }

    const t = (Math.round(fixedToFloat(u)) + Math.round(fixedToFloat(v)) * wide) * 4

    const r = src[t]
    const g = src[t + 1]
    const b = src[t + 2]

    const i = (x + line) * 4

    pixels[i] = r
    pixels[i + 1] = g
    pixels[i + 2] = b

    // factor += step
    factorf += stepf
  }
}

function texbetween2d(pixels, image,
  x1, y1, u1, v1, x2, y2, u2, v2,
  x3, y3, u3, v3, x4, y4, u4, v4) {

  const e1dy = y2 - y1
  if (e1dy === 0) return

  const e2dy = y4 - y3
  if (e2dy === 0) return

  // const e1dx = x2 - x1
  // const e2dx = x4 - x3

  const e1dx = (x2 - x1) << SHIFT
  const e2dx = (x4 - x3) << SHIFT

  const e1du = u2 - u1
  const e1dv = v2 - v1

  const e2du = u4 - u3
  const e2dv = v4 - v3

  let factor1 = (y3 - y1) / e1dy
  let factor2 = 0.0

  const step1 = 1.0 / e1dy
  const step2 = 1.0 / e2dy

  let factor1f = Math.floor(((y3 - y1) << SHIFT) / (e1dy << SHIFT) * SHIFT_UNIT)
  let factor2f = 0

  const step1f = Math.floor((SHIFT_UNIT / (e1dy << SHIFT)) * SHIFT_UNIT)
  const step2f = Math.floor((SHIFT_UNIT / (e2dy << SHIFT)) * SHIFT_UNIT)

  let y = Math.round(y3)
  if (y < 0) {
    factor1 += -y * step1
    factor2 += -y * step2
    y = 0
  }

  let f = Math.ceil(y4)
  if (f > CANVAS_HEIGHT) f = CANVAS_HEIGHT

  const end = f * CANVAS_WIDTH

  let line = y * CANVAS_WIDTH

  x1 <<= SHIFT
  x3 <<= SHIFT

  while (line < end) {

    const su1 = u1 + Number((BigInt(e1du) * BigInt(factor1f)) >> SHIFT_BIG)
    const sv1 = v1 + Number((BigInt(e1dv) * BigInt(factor1f)) >> SHIFT_BIG)

    const su2 = u3 + Number((BigInt(e2du) * BigInt(factor2f)) >> SHIFT_BIG)
    const sv2 = v3 + Number((BigInt(e2dv) * BigInt(factor2f)) >> SHIFT_BIG)

    const sx1 = x1 + Number((BigInt(e1dx) * BigInt(factor1f)) >> SHIFT_BIG)
    const sx2 = x3 + Number((BigInt(e2dx) * BigInt(factor2f)) >> SHIFT_BIG)

    // const su1 = u1 + e1du * factor1
    // const sv1 = v1 + e1dv * factor1

    // const su2 = u3 + e2du * factor2
    // const sv2 = v3 + e2dv * factor2

    // const sx1 = x1 + e1dx * factor1
    // const sx2 = x3 + e2dx * factor2

    if (sx1 < sx2) {
      texspan2d(pixels, image, sx1, su1, sv1, sx2, su2, sv2, line)
    } else {
      // if (line < (y + 20) * CANVAS_WIDTH) {
      // console.log(fixedToFloat(sx1), fixedToFloat(sx2), '|', 'u1:', fixedToFloat(u1), 'u2:', fixedToFloat(u2))
      // }
      texspan2d(pixels, image, sx2, su2, sv2, sx1, su1, sv1, line)
    }

    factor1 += step1
    factor2 += step2

    factor1f += step1f
    factor2f += step2f

    line += CANVAS_WIDTH
  }
}

function texture2d(pixels, image, x1, y1, u1, v1, x2, y2, u2, v2, x3, y3, u3, v3) {
  const edge1 = y1 < y2
  const edge2 = y2 < y3
  const edge3 = y3 < y1
  let longest = edge1 ? (y2 - y1) : (y1 - y2)
  let zero = true
  let length = edge2 ? (y3 - y2) : (y2 - y3)
  if (length > longest) {
    longest = length
    zero = false
  }
  length = edge3 ? (y1 - y3) : (y3 - y1)
  if (length > longest) {
    if (edge3) {
      if (edge1) {
        texbetween2d(pixels, image,
          x3, y3, u3, v3, x1, y1, u1, v1,
          x1, y1, u1, v1, x2, y2, u2, v2
        )
      } else {
        texbetween2d(pixels, image,
          x3, y3, u3, v3, x1, y1, u1, v1,
          x2, y2, u2, v2, x1, y1, u1, v1
        )
      }
      if (edge2) {
        texbetween2d(pixels, image,
          x3, y3, u3, v3, x1, y1, u1, v1,
          x2, y2, u2, v2, x3, y3, u3, v3
        )
      } else {
        texbetween2d(pixels, image,
          x3, y3, u3, v3, x1, y1, u1, v1,
          x3, y3, u3, v3, x2, y2, u2, v2
        )
      }
    } else {
      if (edge1) {
        texbetween2d(pixels, image,
          x1, y1, u1, v1, x3, y3, u3, v3,
          x1, y1, u1, v1, x2, y2, u2, v2
        )
      } else {
        texbetween2d(pixels, image,
          x1, y1, u1, v1, x3, y3, u3, v3,
          x2, y2, u2, v2, x1, y1, u1, v1
        )
      }
      if (edge2) {
        texbetween2d(pixels, image,
          x1, y1, u1, v1, x3, y3, u3, v3,
          x2, y2, u2, v2, x3, y3, u3, v3
        )
      } else {
        texbetween2d(pixels, image,
          x1, y1, u1, v1, x3, y3, u3, v3,
          x3, y3, u3, v3, x2, y2, u2, v2
        )
      }
    }
  } else if (zero) {
    if (edge1) {
      if (edge2) {
        texbetween2d(pixels, image,
          x1, y1, u1, v1, x2, y2, u2, v2,
          x2, y2, u2, v2, x3, y3, u3, v3
        )
      } else {
        texbetween2d(pixels, image,
          x1, y1, u1, v1, x2, y2, u2, v2,
          x3, y3, u3, v3, x2, y2, u2, v2
        )
      }
      if (edge3) {
        texbetween2d(pixels, image,
          x1, y1, u1, v1, x2, y2, u2, v2,
          x3, y3, u3, v3, x1, y1, u1, v1
        )
      }
      else {
        texbetween2d(pixels, image,
          x1, y1, u1, v1, x2, y2, u2, v2,
          x1, y1, u1, v1, x3, y3, u3, v3
        )
      }
    } else {
      if (edge2) {
        texbetween2d(pixels, image,
          x2, y2, u2, v2, x1, y1, u1, v1,
          x2, y2, u2, v2, x3, y3, u3, v3
        )
      } else {
        texbetween2d(pixels, image,
          x2, y2, u2, v2, x1, y1, u1, v1,
          x3, y3, u3, v3, x2, y2, u2, v2
        )
      }
      if (edge3) {
        texbetween2d(pixels, image,
          x2, y2, u2, v2, x1, y1, u1, v1,
          x3, y3, u3, v3, x1, y1, u1, v1
        )
      }
      else {
        texbetween2d(pixels, image,
          x2, y2, u2, v2, x1, y1, u1, v1,
          x1, y1, u1, v1, x3, y3, u3, v3
        )
      }
    }
  } else {
    if (edge2) {
      if (edge3) {
        texbetween2d(pixels, image,
          x2, y2, u2, v2, x3, y3, u3, v3,
          x3, y3, u3, v3, x1, y1, u1, v1
        )
      } else {
        texbetween2d(pixels, image,
          x2, y2, u2, v2, x3, y3, u3, v3,
          x1, y1, u1, v1, x3, y3, u3, v3
        )
      }
      if (edge1) {
        texbetween2d(pixels, image,
          x2, y2, u2, v2, x3, y3, u3, v3,
          x1, y1, u1, v1, x2, y2, u2, v2
        )
      } else {
        texbetween2d(pixels, image,
          x2, y2, u2, v2, x3, y3, u3, v3,
          x2, y2, u2, v2, x1, y1, u1, v1
        )
      }
    } else {
      if (edge3) {
        texbetween2d(pixels, image,
          x3, y3, u3, v3, x2, y2, u2, v2,
          x3, y3, u3, v3, x1, y1, u1, v1
        )
      } else {
        texbetween2d(pixels, image,
          x3, y3, u3, v3, x2, y2, u2, v2,
          x1, y1, u1, v1, x3, y3, u3, v3
        )
      }
      if (edge1) {
        texbetween2d(pixels, image,
          x3, y3, u3, v3, x2, y2, u2, v2,
          x1, y1, u1, v1, x2, y2, u2, v2
        )
      } else {
        texbetween2d(pixels, image,
          x3, y3, u3, v3, x2, y2, u2, v2,
          x2, y2, u2, v2, x1, y1, u1, v1
        )
      }
    }
  }
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

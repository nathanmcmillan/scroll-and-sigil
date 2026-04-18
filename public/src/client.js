/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as net from './net.js'
import * as images from './images.js'
import * as render from './render.js'
import * as tiles from './tiles.js'
import * as event from './event.js'
import { triangle2d } from './triangle.js'
import { mode2d, sprite2d, texture2d, floattexture2d, centrictexture2d, SHIFT } from './texture.js'
import { Button } from './button.js'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_WIDTH_HALF,
  CANVAS_HEIGHT_HALF,
  setCanvasWidth,
  setCanvasHeight,
} from './canvas.js'

let SCALE = 1

let SCREEN = null
let SCREEN_CONTEXT = null

let CANVAS = null
let CONTEXT = null

let LISTEN = null

let _EVENT = null
const _TIME = null

const _SECTOR = null
const COLUMNS = 0
const ROWS = 0
const _TILES = null
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

  setCanvasWidth(CANVAS.width)
  setCanvasHeight(CANVAS.height)
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

  setCanvasWidth(CANVAS.width)
  setCanvasHeight(CANVAS.height)

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

  _EVENT = null
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

const _rotation = 0.0

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

  // console.log('------------------------------')
  // mode2d(pixels, tiles, 200, 120, 232, 120, 200, 168, 232, 168, 0, 0, sr, sb)

  texture2d(pixels, tiles, 200, 120, sl, st, 232, 120, sr, st, 200, 168, sl, sb)
  texture2d(pixels, tiles, 232, 120, sr, st, 232, 168, sr, sb, 200, 168, sl, sb)

  floattexture2d(pixels, tiles, 120, 120, 0.0, 0.0, 152, 120, 16.0, 0.0, 120, 168, 0.0, 24.0)
  floattexture2d(pixels, tiles, 152, 120, 16.0, 0.0, 152, 168, 16.0, 24.0, 120, 168, 0.0, 24.0)

  centrictexture2d(pixels, tiles, 80, 120, 0.0, 0.0, 112, 120, 16.0, 0.0, 80, 168, 0.0, 24.0)
  centrictexture2d(pixels, tiles, 112, 120, 16.0, 0.0, 112, 168, 16.0, 24.0, 80, 168, 0.0, 24.0)

  // rotation += 3.1415 / 128.0

  // const cx = 100
  // const cy = 60

  // let lx = cx - 16
  // let rx = cx + 16
  // let ty = cy - 24
  // let by = cy + 24

  // let tempx = lx - cx
  // let tempy = ty - cy
  // let rotx = tempx * Math.cos(rotation) - tempy * Math.sin(rotation)
  // let roty = tempx * Math.sin(rotation) + tempy * Math.cos(rotation)

  // const tlx = Math.round(rotx + cx)
  // const tly = Math.round(roty + cy)

  // tempx = rx - cx
  // tempy = ty - cy
  // rotx = tempx * Math.cos(rotation) - tempy * Math.sin(rotation)
  // roty = tempx * Math.sin(rotation) + tempy * Math.cos(rotation)

  // const trx = Math.round(rotx + cx)
  // const trh = Math.round(roty + cy)

  // tempx = lx - cx
  // tempy = by - cy
  // rotx = tempx * Math.cos(rotation) - tempy * Math.sin(rotation)
  // roty = tempx * Math.sin(rotation) + tempy * Math.cos(rotation)

  // const blx = Math.round(rotx + cx)
  // const bly = Math.round(roty + cy)

  // tempx = rx - cx
  // tempy = by - cy
  // rotx = tempx * Math.cos(rotation) - tempy * Math.sin(rotation)
  // roty = tempx * Math.sin(rotation) + tempy * Math.cos(rotation)

  // const brx = Math.round(rotx + cx)
  // const bry = Math.round(roty + cy)

  // mode2d(pixels, tiles, tlx, tly, trx, trh, blx, bly, brx, bry, 0, 0, sr, sb)

  blit(context, buffer)

  SCREEN_CONTEXT.drawImage(CANVAS, 0, 0, CANVAS.width, CANVAS.height, 0, 0, SCREEN.width, SCREEN.height)
}

function blit(context, buffer) {
  context.putImageData(buffer, 0, 0)
}

function _drawButton(context, image, button) {
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

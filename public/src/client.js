/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as net from './net.js'
import * as images from './images.js'
import * as render from './render.js'
import * as event from './event.js'
import { Thing } from './thing.js'
import { Hero } from './hero.js'
import { parseWad } from './wad.js'
import { clear2d, triangle2d } from './triangle.js'
import { mode2d, image2d, sprite2d, texture2d, centrictexture2d } from './texture.js'
import {
  SPRITE_SCALE,
  TILE_WIDTH,
  TILE_HEIGHT,
  ground,
  FLOOR_SPRITES,
  SIDE_SPRITES,
  CEIL_SPRITES,
  monsterSprite,
  Tile,
  tilePushThing,
  tileRemoveThing,
} from './tiles.js'
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

let BUFFER = null
let PIXELS = null

let LISTEN = null

let ROWS = 0
let COLUMNS = 0
let TILES = null

let MUSIC = null

let HERO = null

let GOTO_X = 0
let GOTO_Y = 0

let ROTATION = 0.0

const ROTATE = Math.PI / 30

const TRAVEL_BUTTON = new Button()
const _BUTTONS = [TRAVEL_BUTTON]

let ROTATE_LEFT = false
let ROTATE_RIGHT = false

let _MOVE_UP = false
let _MOVE_DOWN = false
let _MOVE_LEFT = false
let _MOVE_RIGHT = false

let CLICK_X = 0
let CLICK_Y = 0

export function keyUp(event) {
  switch (event.code) {
    case 'KeyW':
      _MOVE_UP = false
      break
    case 'KeyA':
      _MOVE_LEFT = false
      break
    case 'KeyS':
      _MOVE_DOWN = false
      break
    case 'KeyD':
      _MOVE_RIGHT = false
      break
    case 'ArrowLeft':
      ROTATE_LEFT = false
      break
    case 'ArrowRight':
      ROTATE_RIGHT = false
      break
  }
}

export function keyDown(event) {
  switch (event.code) {
    case 'KeyW':
      _MOVE_UP = true
      break
    case 'KeyA':
      _MOVE_LEFT = true
      break
    case 'KeyS':
      _MOVE_DOWN = true
      break
    case 'KeyD':
      _MOVE_RIGHT = true
      break
    case 'ArrowLeft':
      ROTATE_LEFT = true
      break
    case 'ArrowRight':
      ROTATE_RIGHT = true
      break
  }
}

export async function mouseUp(mouse) {}

export function mouseDown(mouse) {
  if (mouse.button !== 0) return
  const bound = SCREEN.getBoundingClientRect()
  CLICK_X = mouse.clientX - Math.floor(bound.left)
  CLICK_Y = mouse.clientY - Math.floor(bound.top)
}

export function mouseMove(mouse) {}

export function touchStart(touch) {
  const x = touch.pageX
  const y = touch.pageY
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

  BUFFER = CONTEXT.getImageData(0, 0, CANVAS.width, CANVAS.height)
  PIXELS = BUFFER.data

  const tilesImage = images.load('tiles', './images/tiles.png')
  const monstersImage = images.load('monsters', './images/monsters.png')
  const interfaceImage = images.load('interface', './images/interface.png')
  const fontImage = images.load('font', './images/font.png')

  TRAVEL_BUTTON.x = 128
  TRAVEL_BUTTON.y = 10
  TRAVEL_BUTTON.width = 90
  TRAVEL_BUTTON.height = 80
  TRAVEL_BUTTON.spriteX = 10
  TRAVEL_BUTTON.spriteY = 10

  const home = parseWad(await net.requestText('./world/home.txt'))

  MUSIC = home.get('music')

  const tiles = home.get('tiles')
  ROWS = tiles.length
  COLUMNS = tiles[0].length
  TILES = new Array(ROWS * COLUMNS)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLUMNS; c++) {
      const cell = tiles[r][c]
      const tile = new Tile()
      if (cell.constructor === Array) {
        tile.floorColor = ground(cell)
      } else {
        tile.floorSprite = FLOOR_SPRITES[cell]
        tile.sideSprite = SIDE_SPRITES[cell]
        tile.ceilSprite = CEIL_SPRITES[cell]
      }
      TILES[r * COLUMNS + c] = tile
    }
  }

  const things = home.get('things')
  for (let t = 0; t < things.length; t++) {
    const thing = things[t]
    const c = thing.get('x')
    const r = thing.get('y')
    const tile = TILES[r * COLUMNS + c]
    const x = (c + 0.5) * TILE_WIDTH
    const y = (r + 0.5) * TILE_HEIGHT
    switch (thing.get('id')) {
      case 'hero':
        if (HERO === null) HERO = new Hero()
        HERO.x = x
        HERO.y = y
        tilePushThing(tile, HERO)
        break
      case 'rat':
        const monster = new Thing()
        monster.x = x
        monster.y = y
        tilePushThing(tile, monster)
        break
    }
  }

  LISTEN = new Audio('./music/' + MUSIC + '.wav')
  LISTEN.loop = true
  LISTEN.volume = 0.15
  LISTEN.currentTime = 0

  await tilesImage
  await monstersImage
  await interfaceImage
  await fontImage
}

export function update() {
  if (CLICK_X > 0 && CLICK_Y > 0) {
    const x = CLICK_X / SCALE - CANVAS_WIDTH_HALF
    const y = CLICK_Y / SCALE - CANVAS_HEIGHT_HALF

    CLICK_X = 0
    CLICK_Y = 0

    const negative = -ROTATION
    const sin = Math.sin(negative)
    const cos = Math.cos(negative)

    const c = Math.floor((x * cos - y * sin + HERO.x) / TILE_WIDTH)
    const r = Math.floor((x * sin + y * cos + HERO.y) / TILE_HEIGHT)

    if (c >= 0 && r >= 0) {
      GOTO_X = Math.round((c + 0.5) * TILE_WIDTH)
      GOTO_Y = Math.round((r + 0.5) * TILE_HEIGHT)
    }
  }

  if (GOTO_X !== 0 || GOTO_Y !== 0) {
    const move = 1
    const x = HERO.x
    const y = HERO.y
    const dy = GOTO_Y - y
    const dx = GOTO_X - x
    if (Math.abs(dy) <= move && Math.abs(dx) <= move) {
      HERO.x = GOTO_X
      HERO.y = GOTO_Y
      GOTO_X = 0
      GOTO_Y = 0
    } else {
      const atan = Math.atan2(dy, dx)
      HERO.x = x + move * Math.cos(atan)
      HERO.y = y + move * Math.sin(atan)
    }
    const oc = Math.floor(x / TILE_WIDTH)
    const or = Math.floor(y / TILE_HEIGHT)
    const nc = Math.floor(HERO.x / TILE_WIDTH)
    const nr = Math.floor(HERO.y / TILE_HEIGHT)
    if (nc !== oc || nr !== or) {
      tileRemoveThing(TILES[or * COLUMNS + oc], HERO)
      tilePushThing(TILES[nr * COLUMNS + nc], HERO)
    }
  }

  if (ROTATE_LEFT) ROTATION -= ROTATE
  if (ROTATE_RIGHT) ROTATION += ROTATE
  const tau = Math.PI * 2
  if (ROTATION > tau) ROTATION -= tau
  else if (ROTATION < -tau) ROTATION += tau
}

const PERFORMANCE = false

export function draw() {
  const pixels = PIXELS

  clear2d(pixels, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 100, 149, 237)

  const tiles = images.IMAGES.get('tiles')
  const monsters = images.IMAGES.get('monsters')

  const _sl = 0.0
  const _st = 0.0
  const _sr = 16.0
  const _sb = 24.0

  if (PERFORMANCE) {
    for (let p = 0; p < 200; p++) {
      for (let f = 0; f < 200; f++) {
        // 40,000 triangles
        // top:     77
        // current: 85
        triangle2d(pixels, p, f, 255, 0, 0, p + 16, f, 0, 255, 0, p + 16, f + 24, 0, 0, 255)
      }
    }
    blit()
    return
  }

  const halfPI = Math.PI / 2.0
  const oneAndHalfPI = Math.PI * 1.5

  const canvasWidth = CANVAS_WIDTH
  const canvasHeight = CANVAS_HEIGHT

  const canvasHalfWidth = CANVAS_WIDTH_HALF
  const canvasHalfHeight = CANVAS_HEIGHT_HALF

  const rotation = ROTATION
  const sin = Math.sin(rotation)
  const cos = Math.cos(rotation)

  const negative = -rotation
  const negativeSin = Math.sin(negative)
  const negativeCos = Math.cos(negative)

  const heroX = Math.floor(HERO.x)
  const heroY = Math.floor(HERO.y)

  // console.log(rotation)

  const drawFront = (rotation > -halfPI && rotation < halfPI) || rotation < -oneAndHalfPI || rotation > oneAndHalfPI
  const drawLeft = (rotation < 0.0 && rotation > -Math.PI) || rotation > Math.PI
  // const drawBack =
  // const drawRight = (rotation > 0.0 && rotation < Math.PI) || rotation < -Math.PI

  const canvasWorldTLC = Math.floor(
    (-canvasHalfWidth * negativeCos + canvasHalfHeight * negativeSin + heroX) / TILE_WIDTH,
  )
  const canvasWorldTLR = Math.floor(
    (-canvasHalfWidth * negativeSin - canvasHalfHeight * negativeCos + heroY) / TILE_HEIGHT,
  )

  const canvasWorldTRC = Math.floor(
    (canvasHalfWidth * negativeCos + canvasHalfHeight * negativeSin + heroX) / TILE_WIDTH,
  )
  const canvasWorldTRR = Math.floor(
    (canvasHalfWidth * negativeSin - canvasHalfHeight * negativeCos + heroY) / TILE_HEIGHT,
  )

  const canvasWorldBLC = Math.floor(
    (-canvasHalfWidth * negativeCos - canvasHalfHeight * negativeSin + heroX) / TILE_WIDTH,
  )
  const canvasWorldBLR = Math.floor(
    (-canvasHalfWidth * negativeSin + canvasHalfHeight * negativeCos + heroY) / TILE_HEIGHT,
  )

  const canvasWorldBRC = Math.floor(
    (canvasHalfWidth * negativeCos - canvasHalfHeight * negativeSin + heroX) / TILE_WIDTH,
  )
  const canvasWorldBRR = Math.floor(
    (canvasHalfWidth * negativeSin + canvasHalfHeight * negativeCos + heroY) / TILE_HEIGHT,
  )

  const lowRow = Math.max(0, Math.min(canvasWorldTLR, canvasWorldTRR, canvasWorldBLR, canvasWorldBRR))
  const highRow = Math.min(ROWS - 1, Math.max(canvasWorldTLR, canvasWorldTRR, canvasWorldBLR, canvasWorldBRR))

  const lowColumn = Math.max(0, Math.min(canvasWorldTLC, canvasWorldTRC, canvasWorldBLC, canvasWorldBRC))
  const highColumn = Math.min(COLUMNS - 1, Math.max(canvasWorldTLC, canvasWorldTRC, canvasWorldBLC, canvasWorldBRC))

  let r = drawFront ? lowRow : highRow

  let top = r * TILE_HEIGHT - heroY
  let bottom = top + TILE_HEIGHT

  let tlx = 0
  let tly = 0
  let trx = 0
  let trh = 0
  let blx = 0
  let bly = 0
  let brx = 0
  let bry = 0

  while (true) {
    const line = r * COLUMNS

    let c = drawLeft ? highColumn : lowColumn
    let increment = false

    let left = c * TILE_WIDTH - heroX
    let right = left + TILE_WIDTH

    while (true) {
      if (increment) {
        if (drawLeft) {
          c--
          if (c < lowColumn) break
          right = left
          left -= TILE_WIDTH
          trx = tlx
          trh = tly
          brx = blx
          bry = bly
          tlx = Math.round(left * cos - top * sin) + canvasHalfWidth
          tly = Math.round(left * sin + top * cos) + canvasHalfHeight
          blx = Math.round(left * cos - bottom * sin) + canvasHalfWidth
          bly = Math.round(left * sin + bottom * cos) + canvasHalfHeight
        } else {
          c++
          if (c > highColumn) break
          left = right
          right += TILE_WIDTH
          tlx = trx
          tly = trh
          blx = brx
          bly = bry
          trx = Math.round(right * cos - top * sin) + canvasHalfWidth
          trh = Math.round(right * sin + top * cos) + canvasHalfHeight
          brx = Math.round(right * cos - bottom * sin) + canvasHalfWidth
          bry = Math.round(right * sin + bottom * cos) + canvasHalfHeight
        }
      } else {
        increment = true
        tlx = Math.round(left * cos - top * sin) + canvasHalfWidth
        tly = Math.round(left * sin + top * cos) + canvasHalfHeight
        trx = Math.round(right * cos - top * sin) + canvasHalfWidth
        trh = Math.round(right * sin + top * cos) + canvasHalfHeight
        blx = Math.round(left * cos - bottom * sin) + canvasHalfWidth
        bly = Math.round(left * sin + bottom * cos) + canvasHalfHeight
        brx = Math.round(right * cos - bottom * sin) + canvasHalfWidth
        bry = Math.round(right * sin + bottom * cos) + canvasHalfHeight
      }

      if (tlx < 0) {
        if (trx < 0 && blx < 0 && brx < 0) continue
      } else if (tlx > canvasWidth) {
        if (trx > canvasWidth && blx > canvasWidth && brx > canvasWidth) continue
      }

      if (tly < 0) {
        if (trh < 0 && bly < 0 && bry < 0) continue
      } else if (tly > canvasHeight) {
        if (trh > canvasHeight && bly > canvasHeight && bry > canvasHeight) continue
      }

      const tile = TILES[line + c]

      const color = tile.floorColor
      if (color !== null) {
        const rotate = color[0]

        const r1a = color[1]
        const g1a = color[2]
        const b1a = color[3]

        const r2a = color[4]
        const g2a = color[5]
        const b2a = color[6]

        const r3a = color[7]
        const g3a = color[8]
        const b3a = color[9]

        const r1b = color[10]
        const g1b = color[11]
        const b1b = color[12]

        const r2b = color[13]
        const g2b = color[14]
        const b2b = color[15]

        const r3b = color[16]
        const g3b = color[17]
        const b3b = color[18]

        if (rotate) {
          //
        } else {
          triangle2d(pixels, tlx, tly, r1a, g1a, b1a, trx, trh, r2a, g2a, b2a, brx, bry, r3a, g3a, b3a)
          triangle2d(pixels, brx, bry, r1b, g1b, b1b, blx, bly, r2b, g2b, b2b, tlx, tly, r3b, g3b, b3b)
        }
      } else {
        let sprite = tile.floorSprite
        if (sprite !== null) {
          console.log(tile, sprite, c, r)
          const spritel = sprite[0]
          const spritet = sprite[1]
          const spriter = spritel + sprite[2]
          const spriteb = spritet + sprite[3]

          mode2d(pixels, tiles, tlx, tly, trx, trh, blx, bly, brx, bry, spritel, spritet, spriter, spriteb)
        }

        const ctly = tly - TILE_HEIGHT
        const ctrh = trh - TILE_HEIGHT

        const cbly = bly - TILE_HEIGHT
        const cbry = bry - TILE_HEIGHT

        sprite = tile.sideSprite
        if (sprite !== null) {
          const spritel = sprite[0]
          const spritet = sprite[1]
          const spriter = spritel + sprite[2]
          const spriteb = spritet + sprite[3]

          if (drawFront) {
            // FRONT
            const draw = r + 1 < ROWS ? TILES[line + COLUMNS + c].sideSprite === null : true
            if (draw) {
              mode2d(pixels, tiles, blx, cbly, brx, cbry, blx, bly, brx, bry, spritel, spritet, spriter, spriteb)
            }
          } else {
            // BACK
            const draw = r - 1 >= 0 ? TILES[line - COLUMNS + c].sideSprite === null : true
            if (draw) {
              mode2d(pixels, tiles, trx, ctrh, tlx, ctly, trx, trh, tlx, tly, spritel, spritet, spriter, spriteb)
            }
          }

          if (drawLeft) {
            // LEFT
            const draw = c - 1 >= 0 ? TILES[line + c - 1].sideSprite === null : true
            if (draw) {
              mode2d(pixels, tiles, tlx, ctly, blx, cbly, tlx, tly, blx, bly, spritel, spritet, spriter, spriteb)
            }
          } else {
            // RIGHT
            const draw = c + 1 < COLUMNS ? TILES[line + c + 1].sideSprite === null : true
            if (draw) {
              mode2d(pixels, tiles, brx, cbry, trx, ctrh, brx, bry, trx, trh, spritel, spritet, spriter, spriteb)
            }
          }
        }

        sprite = tile.ceilSprite
        if (sprite !== null) {
          const spritel = sprite[0]
          const spritet = sprite[1]
          const spriter = spritel + sprite[2]
          const spriteb = spritet + sprite[3]

          mode2d(pixels, tiles, tlx, ctly, trx, ctrh, blx, cbly, brx, cbry, spritel, spritet, spriter, spriteb)
        }
      }

      for (let t = 0; t < tile.thingCount; t++) {
        const thing = tile.things[t]
        if (thing === HERO) {
          const hero = monsterSprite('hero')
          const scale = 1 // SPRITE_SCALE
          sprite2d(
            pixels,
            canvasHalfWidth - Math.floor((hero[2] * scale) / 2),
            canvasHalfHeight - hero[3] * scale,
            scale,
            monsters,
            hero[0],
            hero[1],
            hero[2],
            hero[3],
          )
        } else {
          const monster = monsterSprite('rat')
          const scale = 1 // SPRITE_SCALE
          const t = thing.x - heroX
          const v = thing.y - heroY
          const x = Math.round(t * cos - v * sin) + canvasHalfWidth
          const y = Math.round(t * sin + v * cos) + canvasHalfHeight
          sprite2d(
            pixels,
            x - Math.floor((monster[2] * scale) / 2),
            y - monster[3] * scale,
            scale,
            monsters,
            monster[0],
            monster[1],
            monster[2],
            monster[3],
          )
        }
      }
    }

    if (drawFront) {
      r++
      if (r > highRow) break
      top = bottom
      bottom += TILE_HEIGHT
    } else {
      r--
      if (r < lowRow) break
      bottom = top
      top -= TILE_HEIGHT
    }
  }

  // image2d(pixels, 20, 120, tiles, 0, 0, 16, 24)
  // mode2d(pixels, tiles, 50, 120, 66, 120, 50, 144, 66, 144, 0.0, 0.0, sr, sb)
  // mode2d(pixels, tiles, 200, 120, 232, 120, 200, 168, 232, 168, 0, 0, sr, sb)
  // mode2d(pixels, tiles, 66, 150, 66, 166, 42, 150, 42, 166, 0, 0, sr, sb)
  // texture2d(pixels, tiles, 66, 150, 0.0, 0.0, 66, 166, sr, 0.0, 42, 166, sr, sb)
  // texture2d(pixels, tiles, 66, 150, 0.0, 0.0, 42, 166, sr, sb, 42, 150, 0.0, sb)

  // ROTATION TEST

  // const cx = 100
  // const cy = 60

  // let lx = cx - 16
  // let rx = cx + 16
  // let ty = cy - 24
  // let by = cy + 24

  // let tempx = lx - cx
  // let tempy = ty - cy
  // let rotx = tempx * cos - tempy * sin
  // let roty = tempx * sin + tempy * cos

  // const tlx = Math.round(rotx + cx)
  // const tly = Math.round(roty + cy)

  // tempx = rx - cx
  // tempy = ty - cy
  // rotx = tempx * cos - tempy * sin
  // roty = tempx * sin + tempy * cos

  // const trx = Math.round(rotx + cx)
  // const trh = Math.round(roty + cy)

  // tempx = lx - cx
  // tempy = by - cy
  // rotx = tempx * cos - tempy * sin
  // roty = tempx * sin + tempy * cos

  // const blx = Math.round(rotx + cx)
  // const bly = Math.round(roty + cy)

  // tempx = rx - cx
  // tempy = by - cy
  // rotx = tempx * cos - tempy * sin
  // roty = tempx * sin + tempy * cos

  // const brx = Math.round(rotx + cx)
  // const bry = Math.round(roty + cy)

  // mode2d(pixels, tiles, tlx, tly, trx, trh, blx, bly, brx, bry, sl, st, sr, sb)

  // TEXT

  // const description = EVENT === null ? 'idle' : event.description(EVENT)
  // render.text(context, font, 10, 10, description, 2, render.FONT)

  // BUTTONS

  // const buttons = images.IMAGES.get('interface')
  // drawButton(context, buttons, TRAVEL_BUTTON)

  blit()
}

function blit() {
  CONTEXT.putImageData(BUFFER, 0, 0)
  SCREEN_CONTEXT.drawImage(CANVAS, 0, 0, CANVAS.width, CANVAS.height, 0, 0, SCREEN.width, SCREEN.height)
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

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { hsb, rgb, red, green, blue } from './colors.js'

export const SPRITE_SCALE = 2

const WIDE = 16
const TALL = 16

export const TILE_WIDTH = WIDE * SPRITE_SCALE
export const TILE_HEIGHT = TALL * SPRITE_SCALE

const BRICK_WALL = [0, 0, WIDE, TALL]
const STONE_GROUND = [144, 0, WIDE, TALL]
const BRICK_WALL_STONE_GROUND = [112, 0, WIDE, TALL]

// TODO: Top and side different textures

export const FLOOR_SPRITES = [STONE_GROUND, null, null, null]

export const SIDE_SPRITES = [null, BRICK_WALL, BRICK_WALL_STONE_GROUND, null]

export const CEIL_SPRITES = [null, STONE_GROUND, BRICK_WALL_STONE_GROUND, null]

function ground(h1, s1, b1, h2, s2, b2, h3, s3, b3, h4, s4, b4, h5, s5, b5, h6, s6, b6) {
  const c1 = rgb(hsb(h1, s1, b1))
  const c2 = rgb(hsb(h2, s2, b2))
  const c3 = rgb(hsb(h3, s3, b3))
  const c4 = rgb(hsb(h4, s4, b4))
  const c5 = rgb(hsb(h5, s5, b5))
  const c6 = rgb(hsb(h6, s6, b6))
  return [
    false,
    red(c1),
    green(c1),
    blue(c1),
    red(c2),
    green(c2),
    blue(c2),
    red(c3),
    green(c3),
    blue(c3),
    red(c4),
    green(c4),
    blue(c4),
    red(c5),
    green(c5),
    blue(c5),
    red(c6),
    green(c6),
    blue(c6),
  ]
}

export const FLOOR_COLOR = [null, null, null, ground(16, 5, 30, 10, 4, 21, 10, 4, 21, 16, 5, 30, 16, 5, 30, 16, 5, 30)]

const HERO = [0, 0, 16, 19]
const _RAT = [16, 0, 18, 13]

export function monsterSprite(name) {
  switch (name) {
    case 'hero':
      return HERO
    default:
      return null
  }
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export const WIDTH = 16
export const HEIGHT = 24

const BRICK_WALL = [0, 0, WIDTH, HEIGHT]
const STONE_GROUND = [144, 0, WIDTH, HEIGHT]
const BRICK_WALL_STONE_GROUND = [112, 0, WIDTH, HEIGHT]

export const SPRITES = [STONE_GROUND, BRICK_WALL, BRICK_WALL_STONE_GROUND]

const KNIGHT = [0, 0, WIDTH, HEIGHT]

export const MONSTERS = new Map()

MONSTERS.set('knight', KNIGHT)

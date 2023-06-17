/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { requestImage } from './net.js'

export const IMAGES = new Map()

export async function load(name, path) {
  const image = await requestImage(path)
  IMAGES.set(name, image)
}

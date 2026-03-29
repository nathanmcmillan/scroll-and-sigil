/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as client from './client.js'

const TOUCH = []

let ACTIVE = true
let PREVIOUS_TICK = 0

function touchIndexById(identifier) {
  for (let i = 0; i < TOUCH.length; i++) {
    if (TOUCH[i].identifier === identifier) return i
  }
  return -1
}

function tick(time) {
  if (ACTIVE && time - PREVIOUS_TICK >= 15.999) {
    PREVIOUS_TICK = time
    client.update()
    client.draw()
  }
  window.requestAnimationFrame(tick)
}

function resize() {
  const wide = Math.floor(window.innerWidth / 400)
  const tall = Math.floor(window.innerHeight / 300)
  const scale = Math.max(1, Math.min(wide, tall))
  client.resize(scale, 400 * scale, 300 * scale)
}

async function main() {
  const wide = Math.floor(window.innerWidth / 400)
  const tall = Math.floor(window.innerHeight / 300)

  const scale = Math.max(1, Math.min(wide, tall))

  const canvas = document.getElementById('canvas')
  canvas.style.display = 'block'
  canvas.style.position = 'absolute'
  // canvas.style.left = '0'
  // canvas.style.right = '0'
  // canvas.style.top = '0'
  // canvas.style.bottom = '0'
  canvas.style.margin = 'auto'
  // canvas.width = window.innerWidth
  // canvas.height = window.innerHeight
  // canvas.width = Math.floor(window.innerWidth / scale)
  // canvas.height = Math.floor(window.innerHeight / scale)
  canvas.width = 400 * scale
  canvas.height = 300 * scale
  if ('ontouchstart' in window) canvas.requestFullscreen()

  await client.init(scale, canvas)

  document.getElementById('loading').remove()

  document.onkeyup = (event) => {
    client.keyUp(event)
  }

  document.onkeydown = (event) => {
    if (event.code === 'Escape') {
      if (document.fullscreenElement === null) canvas.requestFullscreen()
      else document.exitFullscreen()
    } else {
      client.keyDown(event)
    }
  }

  document.onmouseup = (event) => {
    client.mouseUp(event)
  }

  document.onmousedown = (event) => {
    client.mouseDown(event)
  }

  document.onmousemove = (event) => {
    client.mouseMove(event)
  }

  if ('ontouchstart' in window) {
    document.ontouchstart = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const content = { identifier: touch.identifier, pageX: touch.pageX, pageY: canvas.height - touch.pageY }
        TOUCH.push(content)
        client.touchStart(content)
      }
    }

    document.ontouchmove = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const content = { identifier: touch.identifier, pageX: touch.pageX, pageY: canvas.height - touch.pageY }
        client.touchMove(content)
      }
    }

    document.ontouchend = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const index = touchIndexById(touch.identifier)
        if (index >= 0) {
          const start = TOUCH.splice(index, 1)[0]
          client.touchEnd(start)
        }
      }
    }

    document.ontouchcancel = (event) => {
      event.preventDefault()
      const changed = event.changedTouches
      for (let i = 0; i < changed.length; i++) {
        const touch = changed[i]
        const index = touchIndexById(touch.identifier)
        if (index >= 0) TOUCH.splice(index, 1)
      }
    }
  }

  window.onresize = () => {
    resize()
    if (!ACTIVE) client.draw(PREVIOUS_TICK)
  }

  window.onblur = () => {
    ACTIVE = false
    client.pause()
  }

  window.onfocus = () => {
    ACTIVE = true
    client.resume()
  }

  window.requestAnimationFrame(tick)
}

main()

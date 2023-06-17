/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export async function requestText(path) {
  return fetch(path)
    .then((data) => {
      return data.text()
    })
    .catch((err) => console.error(err))
}

export async function requestImage(path) {
  const image = new Image()
  image.src = path
  return new Promise(function (resolve) {
    image.onload = resolve
  })
    .then(() => {
      return image
    })
    .catch((err) => console.error(err))
}

export async function requestBinary(path) {
  return fetch(path)
    .then((data) => {
      return data.arrayBuffer()
    })
    .catch((err) => console.error(err))
}

export async function send(path, data) {
  return fetch(path, {
    method: 'POST',
    body: data,
  })
    .then((data) => {
      return data.text()
    })
    .catch((err) => console.error(err))
}

export async function socket() {
  const path = location.host + '/websocket'
  return new Promise(function (resolve, reject) {
    let soc
    if (location.protocol === 'https:') soc = new WebSocket('wss://' + path)
    else soc = new WebSocket('ws://' + path)
    soc.onopen = function () {
      resolve(soc)
    }
    soc.onerror = function (err) {
      reject(err)
    }
  })
}

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

export async function post(path, data) {
  return fetch(path, {
    method: 'POST',
    body: data,
  })
    .then((data) => {
      return data.text()
    })
    .catch((err) => console.error(err))
}

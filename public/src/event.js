/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export function description(event) {
  let action = ''
  switch (event.event) {
    case 'attack':
      action = 'fighting'
      break
    case 'fish':
      action = 'fishing for'
      break
    default:
      action = '?'
      break
  }
  return action + ' ' + event.type
}

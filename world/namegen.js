/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const PREFIX = ['Death', 'Blood', 'Vile', 'Sin', 'Dark']
const SUFFIX = ['Burn', 'Spawn', 'Spell', 'Wound', 'Feast']
const APPELATION = ['Witch', 'Hungry', 'Slayer', 'Unholy', 'Flayer']

function MonsterName() {
  const prefix = PREFIX[Math.floor(Math.random() * PREFIX.length)]
  const suffix = SUFFIX[Math.floor(Math.random() * SUFFIX.length)]
  const name = prefix + ' ' + suffix
  if (Math.random() > 0.66) {
    const appelation = APPELATION[Math.floor(Math.random() * APPELATION.length)]
    return name + ' the ' + appelation
  }
  return name
}

module.exports = {
  MonsterName: MonsterName,
}

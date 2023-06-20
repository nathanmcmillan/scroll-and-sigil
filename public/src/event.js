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

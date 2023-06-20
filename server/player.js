class Player {
  constructor(user, session, sector) {
    this.user = user
    this.session = session
    this.sector = sector
  }

  data() {
    return {
      user: this.user,
    }
  }

  event(data) {
    console.log('event', data)
    return {
      code: 'started',
    }
  }
}

module.exports = {
  Player: Player,
}

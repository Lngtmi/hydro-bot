class TicTacToe {
  constructor(playerX, playerO = 'o') {
    this.playerX = playerX
    this.playerO = playerO
    this._currentTurn = false // false: X, true: O
    this._x = 0
    this._o = 0
    this.board = 0
    this.winner = null
  }

  get currentTurn() {
    return this._currentTurn ? this.playerO : this.playerX
  }

  turn(isO, position) {
    if (this.winner) return -3

    const pos = Number(position)
    if (!Number.isInteger(pos) || pos < 0 || pos > 8) return -1

    const mask = 1 << pos
    if (this.board & mask) return 0

    // Pemain salah giliran
    if (Boolean(isO) !== this._currentTurn) return -2

    if (this._currentTurn) this._o |= mask
    else this._x |= mask
    this.board |= mask

    const winMasks = [7, 56, 448, 73, 146, 292, 273, 84]
    const activeBits = this._currentTurn ? this._o : this._x
    if (winMasks.some(maskWin => (activeBits & maskWin) === maskWin)) {
      this.winner = this.currentTurn
      return 1
    }

    // Lanjut ke giliran berikutnya jika belum seri
    if (this.board !== 511) this._currentTurn = !this._currentTurn
    return 1
  }

  render() {
    const out = []
    for (let i = 0; i < 9; i++) {
      const mask = 1 << i
      if (this._x & mask) out.push('X')
      else if (this._o & mask) out.push('O')
      else out.push(String(i + 1))
    }
    return out
  }
}

module.exports = TicTacToe

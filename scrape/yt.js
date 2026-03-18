// Fallback shim to keep boot stable when helper file is missing.
// Commands can be reimplemented later without crashing startup.

async function ytDonlodMp3() {
  return { status: false, message: 'yt helper belum tersedia' }
}

async function ytDonlodMp4() {
  return { status: false, message: 'yt helper belum tersedia' }
}

async function ytPlayMp3() {
  return { status: false, message: 'yt helper belum tersedia' }
}

async function ytPlayMp4() {
  return { status: false, message: 'yt helper belum tersedia' }
}

async function ytSearch() {
  return []
}

module.exports = {
  ytDonlodMp3,
  ytDonlodMp4,
  ytPlayMp3,
  ytPlayMp4,
  ytSearch,
}

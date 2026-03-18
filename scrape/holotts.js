const googleTTS = require('google-tts-api')

// Placeholder map so command validation still works.
const hololiveModels = {
  roboco: 'id',
  pekora: 'id',
  miko: 'id',
  suisei: 'id',
  marine: 'id',
  gura: 'en',
}

async function ttsHololive(text, karakter = 'roboco') {
  const key = String(karakter || '').toLowerCase()
  const lang = hololiveModels[key] || 'id'
  return googleTTS.getAudioUrl(String(text || ''), {
    lang,
    slow: false,
    host: 'https://translate.google.com',
  })
}

module.exports = {
  ttsHololive,
  hololiveModels,
}

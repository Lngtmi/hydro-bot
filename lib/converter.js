const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const ffmpegStatic = (() => {
  try {
    return require('ffmpeg-static')
  } catch {
    return null
  }
})()

function resolveFfmpegBinary() {
  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic
  return 'ffmpeg'
}

function ffmpeg(buffer, args = [], ext = '', ext2 = '', opts = {}) {
  return new Promise(async (resolve, reject) => {
    let tmp = ''
    let out = ''
    let proc = null
    let timer = null
    let settled = false
    const safeUnlink = async (filePath) => {
      try {
        if (filePath && fs.existsSync(filePath)) await fs.promises.unlink(filePath)
      } catch {}
    }
    const finish = async (err, data) => {
      if (settled) return
      settled = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      await safeUnlink(tmp)
      await safeUnlink(out)
      if (err) return reject(err)
      return resolve(data)
    }
    try {
      const ffmpegBin = resolveFfmpegBinary()
      tmp = path.join(__dirname, '../data/assets/audio', + new Date + '.' + ext)
      out = tmp + '.' + ext2
      await fs.promises.mkdir(path.dirname(tmp), { recursive: true })
      await fs.promises.writeFile(tmp, buffer)
      proc = spawn(ffmpegBin, [
        '-y',
        '-i', tmp,
        ...args,
        out
      ])
      const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 90000
      timer = setTimeout(async () => {
        try { proc?.kill?.('SIGKILL') } catch {}
        await finish(new Error(`ffmpeg timeout (${Math.ceil(timeoutMs / 1000)}s)`))
      }, timeoutMs)
      proc
        .on('error', async (err) => finish(err))
        .on('close', async (code) => {
          if (settled) return
          if (code !== 0) return finish(new Error(`ffmpeg exit code ${code}`))
          try {
            const data = await fs.promises.readFile(out)
            return finish(null, data)
          } catch (e) {
            return finish(e)
          }
        })
    } catch (e) {
      await finish(e)
    }
  })
}

function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-ac', '2',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'mp3'
  ], ext, 'mp3')
}

function toPTT(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-compression_level', '10'
  ], ext, 'opus')
}

function toVideo(buffer, ext, opts = {}) {
  const sizeBytes = Buffer.isBuffer(buffer) ? buffer.length : 0
  const autoTimeout = sizeBytes >= 90 * 1024 * 1024
    ? 540000
    : sizeBytes >= 60 * 1024 * 1024
      ? 420000
      : sizeBytes >= 30 * 1024 * 1024
        ? 300000
        : 210000
  const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : autoTimeout
  const preset = String(opts.preset || 'ultrafast')
  const crf = String(opts.crf || '30')
  return ffmpeg(buffer, [
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-movflags', '+faststart',
    '-profile:v', 'main',
    '-level', '4.0',
    '-preset', preset,
    '-c:a', 'aac',
    '-ac', '2',
    '-b:a', '128k',
    '-ar', '44100',
    '-crf', crf
  ], ext, 'mp4', { timeoutMs })
}

module.exports = {
  toAudio,
  toPTT,
  toVideo,
  ffmpeg,
}

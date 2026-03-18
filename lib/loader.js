const { modul } = require('../module');
const { fs } = modul;
const { color } = require('./color')
const axios = require('axios');
const path = require('path');

async function uncache(module = '.') {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(module)]
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

async function nocache(module, cb = () => { }) {
  console.log(color('Module', 'blue'), color(`'${module} is up to date!'`, 'cyan'))
  fs.watchFile(require.resolve(module), async () => {
    await uncache(require.resolve(module))
    cb(module)
  })
}

async function checkVersionUpdate() {
  try {
    const localPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
    const localVersion = localPkg.version;
    const repoUrl = localPkg?.repository?.url || '';
    const githubMatch = repoUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i);
    if (!githubMatch) {
      return console.log(color(`[INFO] Lewati cek update otomatis (repo belum diset ke GitHub).`, 'yellow'));
    }

    const [, owner, repo] = githubMatch;
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/master/package.json`;
    const response = await axios.get(url, { timeout: 10000 });
    const remotePkg = response.data;
    const remoteVersion = remotePkg.version;

    if (remoteVersion !== localVersion) {
      console.log(color(`[INFO] Terdeteksi adanya update script: v${remoteVersion}.\nSilakan update di ${repoUrl}`, 'yellow'));
    } else {
      console.log(color(`[INFO] Script telah menggunakan: v${localVersion} terbaru`, 'green'));
    }
  } catch (error) {
    console.error(color(`Gagal cek update: ${error.message}`, 'red'));
  }
}

module.exports = {
  uncache,
  nocache,
  checkVersionUpdate
}

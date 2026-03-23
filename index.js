require('./settings')
const { modul } = require('./module');
const moment = require('moment-timezone');
const { baileys, boom, chalk, fs, figlet, FileType, path, pino, process, PhoneNumber, axios, yargs, _ } = modul;
const { Boom } = boom
const {
	default: XeonBotIncConnect,
	BufferJSON,
	processedMessages,
	PHONENUMBER_MCC,
	initInMemoryKeyStore,
	DisconnectReason,
	AnyMessageContent,
        makeInMemoryStore,
	useMultiFileAuthState,
	delay,
	fetchLatestBaileysVersion,
	generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    makeCacheableSignalKeyStore,
    getAggregateVotesInPollMessage,
    proto
} = require("@whiskeysockets/baileys")
const cfonts = require('cfonts');
const { color, bgcolor } = require('./lib/color')
const { TelegraPh } = require('./lib/uploader')
const NodeCache = require("node-cache")
const canvafy = require("canvafy")
const { 
  addSewaGroup, 
  checkSewaGroup, 
  getSewaPosition, 
  msToDate, 
  expiredCheck, 
  remindSewa, 
  getGcName 
} = require('./lib/sewa')
global.sewa = JSON.parse(fs.readFileSync('./database/sewa.json'))
const { parsePhoneNumber } = require("libphonenumber-js")
let _welcome = JSON.parse(fs.readFileSync('./database/welcome.json'))
let _left = JSON.parse(fs.readFileSync('./database/left.json'))
const makeWASocket = require("@whiskeysockets/baileys").default
const Pino = require("pino")
const readline = require("readline")
const colors = require('colors')
const { start } = require('./lib/spinner')
const { uncache, nocache } = require('./lib/loader')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep, reSize } = require('./lib/myfunc')

const prefix = String(global.commandPrefix || '.')
let phoneNumber = global.ownernomer || global.ownernumber || ""
const logDir = path.resolve('./logs')
const heartbeatFile = path.join(logDir, 'socket-heartbeat.json')
const watchdogLogFile = path.join(logDir, 'socket-watchdog.log')

const ensureRuntimeLogDir = () => {
	try {
		if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
	} catch {}
}

const appendWatchdogLog = (reason = '', extra = {}) => {
	try {
		ensureRuntimeLogDir()
		const line = JSON.stringify({
			ts: moment.tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss'),
			reason,
			...extra
		})
		fs.appendFileSync(watchdogLogFile, line + '\n')
	} catch {}
}

const writeHeartbeat = (payload = {}) => {
	try {
		ensureRuntimeLogDir()
		fs.writeFileSync(heartbeatFile, JSON.stringify({
			updatedAt: Date.now(),
			updatedAtWib: moment.tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss'),
			...payload
		}, null, 2))
	} catch {}
}
global.db = JSON.parse(fs.readFileSync('./database/database.json'))
if (global.db) global.db = {
sticker: {},
database: {}, 
groups: {}, 
game: {},
others: {},
users: {},
chats: {},
settings: {},
...(global.db || {})
}
const forceQrPairing = process.argv.includes("--qr")
const pairingCode = !forceQrPairing

const useMobile = process.argv.includes("--mobile")
const owner = JSON.parse(fs.readFileSync('./database/owner.json'))

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

const question = (text) => new Promise((resolve) => rl.question(text, resolve))
require('./hydro.js')
nocache('../hydro.js', module => console.log(color('[ CHANGE ]', 'green'), color(`'${module}'`, 'green'), 'Updated'))
require('./index.js')
nocache('../index.js', module => console.log(color('[ CHANGE ]', 'green'), color(`'${module}'`, 'green'), 'Updated'))

global.__hydroRuntime = global.__hydroRuntime || {
			starting: false,
			reconnectTimer: null,
			socketWatchdogTimer: null,
			socketHealthTimer: null,
			socketStallTimer: null,
			socket: null,
			pairingRequested: false,
			pairingPrompted: false,
			pairingPhone: '',
		replacedCount: 0,
		replacedWindowStart: 0,
		pauseReconnectUntil: 0,
		startupOnlineNotified: false,
			idleProbeAt: 0,
			badSessionCount: 0,
			badSessionWindowStart: 0,
			sewaIntervalStarted: false,
			lastInboundAt: 0,
			lastUpsertAt: 0,
			lastHealthcheckAt: 0,
			stallHits: 0,
			lastRestartReason: ''
		}

const getOwnerNotifyJids = () => {
	const raw = []
	if (Array.isArray(global.owner)) raw.push(...global.owner)
	if (Array.isArray(owner)) raw.push(...owner)
	raw.push(global.ownernomer, global.ownernumber)
	return [...new Set(
		raw
			.map(v => String(v || '').replace(/[^0-9]/g, ''))
			.filter(Boolean)
			.map(v => `${v}@s.whatsapp.net`)
	)]
}

const scheduleReconnect = (delayMs = 3000) => {
	const runtimeState = global.__hydroRuntime
	if (runtimeState.pauseReconnectUntil && Date.now() < runtimeState.pauseReconnectUntil) return
	if (runtimeState.reconnectTimer) return
	runtimeState.reconnectTimer = setTimeout(() => {
		runtimeState.reconnectTimer = null
		hydroInd()
	}, delayMs)
}

async function hydroInd() {
	const runtimeState = global.__hydroRuntime
	if (runtimeState.starting) return
	runtimeState.starting = true
	if (runtimeState.reconnectTimer) {
		clearTimeout(runtimeState.reconnectTimer)
		runtimeState.reconnectTimer = null
	}
	try {
	const {  saveCreds, state } = await useMultiFileAuthState(`./${sessionName}`)
		const msgRetryCounterCache = new NodeCache()
	    	const hydro = XeonBotIncConnect({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode, // default: pairing code mode (QR hanya jika --qr)
      mobile: useMobile, // mobile api (prone to bans)
     auth: {
         creds: state.creds,
         keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
      },
      browser: [ 'Mac OS', 'Safari', '10.15.7' ],
      patchMessageBeforeSending: (message) => {
            const requiresPatch = !!(
                message.buttonsMessage ||
                message.templateMessage ||
                message.listMessage
            );
            if (requiresPatch) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }
            return message;
        },
      auth: {
         creds: state.creds,
         keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }).child({ level: "fatal" })),
      },
connectTimeoutMs: 60000,
defaultQueryTimeoutMs: 0,
keepAliveIntervalMs: 10000,
emitOwnEvents: true,
fireInitQueries: true,
generateHighQualityLinkPreview: true,
syncFullHistory: false,
markOnlineOnConnect: true,
      getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id)
                return msg.message || undefined
            }
            return {
                conversation: `${botname} Here!`
            }
        },
	      msgRetryCounterCache, // Resolve waiting messages
	      defaultQueryTimeoutMs: undefined, // for this issues https://github.com/WhiskeySockets/Baileys/issues/276
	   })
	const decodeJidSafe = (jid) => {
		if (!jid) return jid
		if (/:\d+@/gi.test(jid)) {
			let decode = jidDecode(jid) || {}
			return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid
		}
		return jid
	}
	hydro.decodeJid = decodeJidSafe
	runtimeState.socket = hydro
	runtimeState.starting = false

	let pairingInProgress = false
	let pairingLoopTimer = null
	let lastHeartbeatWriteAt = 0
	let lastSocketActivityAt = Date.now()
	let socketWatchdogTimer = global.__hydroRuntime.socketWatchdogTimer || null
	let socketHealthTimer = global.__hydroRuntime.socketHealthTimer || null
	let socketStallTimer = global.__hydroRuntime.socketStallTimer || null
	const WS_READY_OPEN = 1
	const SOCKET_WATCHDOG_INTERVAL_MS = 60 * 1000
	const SOCKET_INACTIVE_TTL_MS = 20 * 60 * 1000
	const SOCKET_IDLE_PROBE_GRACE_MS = 10 * 60 * 1000
	const SOCKET_HEALTHCHECK_INTERVAL_MS = 2 * 60 * 1000
	const SOCKET_STALLCHECK_INTERVAL_MS = 60 * 1000
	const SOCKET_UPSERT_STALL_MS = 20 * 60 * 1000
	const ENABLE_STALL_RESTART = String(process.env.ENABLE_STALL_RESTART || '').toLowerCase() === 'true'

	const markSocketActivity = () => {
		lastSocketActivityAt = Date.now()
		global.__hydroRuntime.idleProbeAt = 0
	}

	const requestPairingCodeSafe = async () => {
		if (!pairingCode) return false
		if (hydro.authState.creds.registered) return true
		if (global.__hydroRuntime.pairingRequested) return true
		if (pairingInProgress) return false
		const runtime = global.__hydroRuntime
		const envPairingNumber = String(process.env.PAIRING_NUMBER || '').replace(/[^0-9]/g, '')
		const configuredPhoneNumber = String(global.ownernomer || global.ownernumber || '').replace(/[^0-9]/g, '')
		let phoneForPairing = String(runtime.pairingPhone || '').replace(/[^0-9]/g, '')

		if (!phoneForPairing && process.stdin.isTTY && !runtime.pairingPrompted) {
			runtime.pairingPrompted = true
			const fallbackHint = envPairingNumber || configuredPhoneNumber || '628xxxxxxxxxx'
			const rawPhoneNumber = await question(`Masukin nomor yang mau ditautkan untuk pairing (contoh: ${fallbackHint})\n`)
			phoneForPairing = String(rawPhoneNumber || '').replace(/[^0-9]/g, '')
			if (!phoneForPairing) phoneForPairing = envPairingNumber || configuredPhoneNumber
		}
		if (!phoneForPairing) phoneForPairing = envPairingNumber || configuredPhoneNumber
		runtime.pairingPhone = phoneForPairing
		if (!phoneForPairing) {
			console.log('Pairing code aktif, tapi nomor belum diisi. Isi PAIRING_NUMBER di Startup env panel atau global.ownernomer di settings.js.')
			return false
		}

		const wsState = hydro?.ws?.readyState
		if (typeof wsState === 'number' && wsState !== WS_READY_OPEN) return false

		pairingInProgress = true
		try {
			let code = await hydro.requestPairingCode(phoneForPairing)
			if (typeof code === 'string' && code.length === 8 && !code.includes('-')) {
				code = code.match(/.{1,4}/g)?.join('-') || code
			}
			console.log(`Ini kodenya:`, code)
			global.__hydroRuntime.pairingRequested = true
			return true
		} catch (err) {
			console.log(`[PAIRING RETRY] ${String(err?.message || err || '')}`)
			return false
		} finally {
			pairingInProgress = false
		}
	}

	const stopPairingLoop = () => {
		if (!pairingLoopTimer) return
		clearInterval(pairingLoopTimer)
		pairingLoopTimer = null
	}
	const startPairingLoop = () => {
		stopPairingLoop()
		if (!pairingCode) return
		if (hydro.authState.creds.registered) return
		pairingLoopTimer = setInterval(async () => {
			try {
				const ok = await requestPairingCodeSafe()
				if (ok === true || hydro.authState.creds.registered) stopPairingLoop()
			} catch {}
		}, 5000)
	}

	const stopSocketWatchdog = () => {
		if (!socketWatchdogTimer) return
		clearInterval(socketWatchdogTimer)
		socketWatchdogTimer = null
		global.__hydroRuntime.socketWatchdogTimer = null
	}
	const stopSocketHealthcheck = () => {
		if (!socketHealthTimer) return
		clearInterval(socketHealthTimer)
		socketHealthTimer = null
		global.__hydroRuntime.socketHealthTimer = null
	}
	const stopSocketStallcheck = () => {
		if (!socketStallTimer) return
		clearInterval(socketStallTimer)
		socketStallTimer = null
		global.__hydroRuntime.socketStallTimer = null
	}

	const restartSocket = (delayMs = 3000, reason = 'unknown') => {
		const runtime = global.__hydroRuntime
		if (runtime.pauseReconnectUntil && Date.now() < runtime.pauseReconnectUntil) return
		if (runtime.reconnectTimer) return
		stopPairingLoop()
		stopSocketWatchdog()
		stopSocketHealthcheck()
		stopSocketStallcheck()
		runtime.lastRestartReason = reason
		appendWatchdogLog('restart-socket', { reason, delayMs })
		writeHeartbeat({ state: 'reconnecting', reason, delayMs, wsReadyState: hydro?.ws?.readyState })
		try { hydro.ws?.close?.() } catch {}
		runtime.reconnectTimer = setTimeout(() => {
			runtime.reconnectTimer = null
			hydroInd()
		}, delayMs)
		console.log(`[SOCKET RESTART] ${reason} -> reconnect ${Math.round(delayMs / 1000)}s`)
	}

	const startSocketWatchdog = () => {
		stopSocketWatchdog()
		socketWatchdogTimer = setInterval(async () => {
			try {
				const wsState = hydro?.ws?.readyState
				const hasNumericWsState = typeof wsState === 'number'
				if (hasNumericWsState && wsState !== WS_READY_OPEN) {
					console.log(`[SOCKET WATCHDOG] readyState=${wsState} -> reconnect`)
					return restartSocket(4000, `watchdog-readyState-${wsState}`)
				}
				const idleMs = Date.now() - lastSocketActivityAt
				if (idleMs >= SOCKET_INACTIVE_TTL_MS) {
					const runtime = global.__hydroRuntime
					if (!runtime.idleProbeAt) {
						runtime.idleProbeAt = Date.now()
						console.log('[SOCKET WATCHDOG] idle terlalu lama, kirim keepalive probe')
						await hydro.sendPresenceUpdate('available').catch(() => {})
						await hydro.groupFetchAllParticipating().catch(() => {})
					} else if (Date.now() - runtime.idleProbeAt >= SOCKET_IDLE_PROBE_GRACE_MS) {
						// Jangan paksa reconnect hanya karena tidak ada traffic upsert.
						// Di WA, chat bisa memang sepi lama dan itu normal.
						console.log('[SOCKET WATCHDOG] idle lama terdeteksi, skip reconnect (safe mode)')
						runtime.idleProbeAt = Date.now()
						appendWatchdogLog('idle-safe-skip-restart', { idleMs, wsState })
					}
				}
			} catch (watchdogErr) {
				console.log('[SOCKET WATCHDOG] error:', watchdogErr)
			}
		}, SOCKET_WATCHDOG_INTERVAL_MS)
		global.__hydroRuntime.socketWatchdogTimer = socketWatchdogTimer
	}

	const startSocketHealthcheck = () => {
		stopSocketHealthcheck()
		socketHealthTimer = setInterval(async () => {
			try {
				const wsState = hydro?.ws?.readyState
				if (typeof wsState === 'number' && wsState !== WS_READY_OPEN) return
				global.__hydroRuntime.lastHealthcheckAt = Date.now()
				await hydro.sendPresenceUpdate('available')
			} catch (healthErr) {
				console.log('[SOCKET HEALTHCHECK] gagal, paksa reconnect:', healthErr?.message || healthErr)
				return restartSocket(4000, 'healthcheck-failed')
			}
		}, SOCKET_HEALTHCHECK_INTERVAL_MS)
		global.__hydroRuntime.socketHealthTimer = socketHealthTimer
	}

	const startSocketStallcheck = () => {
		stopSocketStallcheck()
		socketStallTimer = setInterval(() => {
			try {
				const wsState = hydro?.ws?.readyState
				if (typeof wsState === 'number' && wsState !== WS_READY_OPEN) return
				const runtime = global.__hydroRuntime
				if (!runtime.lastUpsertAt) return
				const idleUpsertMs = Date.now() - runtime.lastUpsertAt
				if (idleUpsertMs < SOCKET_UPSERT_STALL_MS) {
					runtime.stallHits = 0
					return
				}
				runtime.stallHits = (runtime.stallHits || 0) + 1
				if (runtime.stallHits < 2) {
					appendWatchdogLog('stall-warning', { idleUpsertMs, wsState, stallHits: runtime.stallHits })
					return
				}
				if (!ENABLE_STALL_RESTART) {
					appendWatchdogLog('stall-safe-mode-no-restart', { idleUpsertMs, wsState, stallHits: runtime.stallHits })
					console.log(`[SOCKET STALL] idle ${Math.round(idleUpsertMs / 1000)}s, safe mode aktif (tanpa restart)`)
					runtime.stallHits = 0
					return
				}
				appendWatchdogLog('stall-restart', { idleUpsertMs, wsState, stallHits: runtime.stallHits })
				writeHeartbeat({ state: 'restarting_due_to_stall', idleUpsertMs })
				console.log(`[SOCKET STALL] messages.upsert idle ${Math.round(idleUpsertMs / 1000)}s -> process restart`)
				process.exit(1)
			} catch (stallErr) {
				console.log('[SOCKET STALLCHECK] error:', stallErr?.message || stallErr)
			}
		}, SOCKET_STALLCHECK_INTERVAL_MS)
		global.__hydroRuntime.socketStallTimer = socketStallTimer
	}

	store.bind(hydro.ev)
	startSocketWatchdog()
	startSocketHealthcheck()
	startSocketStallcheck()
	startPairingLoop()

	hydro.ev.on('connection.update', async (update) => {
		const { connection, lastDisconnect } = update
		if (connection === 'open') markSocketActivity()
		try {
			if (connection === 'close') {
				let reason = new Boom(lastDisconnect?.error)?.output.statusCode
				appendWatchdogLog('connection-close', {
					reason,
					reasonText: String(lastDisconnect?.error?.message || ''),
					wsReadyState: hydro?.ws?.readyState
				})
				if (reason === DisconnectReason.badSession) {
					const runtime = global.__hydroRuntime
					const now = Date.now()
					if (!runtime.badSessionWindowStart || now - runtime.badSessionWindowStart > 15 * 60 * 1000) {
						runtime.badSessionWindowStart = now
						runtime.badSessionCount = 0
					}
					runtime.badSessionCount += 1
					console.log(`[SOCKET] badSession terdeteksi (count=${runtime.badSessionCount})`)
					if (runtime.badSessionCount <= 3) {
						restartSocket(10000, 'badSession-retry')
					} else if (runtime.badSessionCount <= 6) {
						restartSocket(60000, 'badSession-backoff')
					} else {
						runtime.pauseReconnectUntil = Date.now() + 30 * 60 * 1000
						console.log('[SOCKET GUARD] badSession berulang. Jeda reconnect 30 menit untuk cegah loop.')
						stopSocketWatchdog()
						stopSocketHealthcheck()
						stopSocketStallcheck()
					}
				} else if (reason === DisconnectReason.connectionClosed) {
					console.log('Connection closed, reconnecting....')
					restartSocket(3000, 'connectionClosed')
				} else if (reason === DisconnectReason.connectionLost) {
					console.log('Connection Lost from Server, reconnecting...')
					restartSocket(3000, 'connectionLost')
				} else if (reason === DisconnectReason.connectionReplaced) {
					const runtime = global.__hydroRuntime
					const now = Date.now()
					if (!runtime.replacedWindowStart || now - runtime.replacedWindowStart > 120000) {
						runtime.replacedWindowStart = now
						runtime.replacedCount = 0
					}
					runtime.replacedCount += 1
					console.log('Connection Replaced, Another New Session Opened, Please Close Current Session First')
					if (runtime.replacedCount >= 3) {
						runtime.pauseReconnectUntil = Date.now() + 5 * 60 * 1000
						console.log('[SOCKET GUARD] connectionReplaced berulang. Reconnect dijeda 5 menit untuk cegah loop.')
						stopSocketWatchdog()
						stopSocketHealthcheck()
						stopSocketStallcheck()
						return
					}
					restartSocket(15000, 'connectionReplaced')
				} else if (reason === DisconnectReason.loggedOut) {
					console.log('Device Logged Out, Please Scan Again And Run.')
					stopPairingLoop()
					stopSocketWatchdog()
					stopSocketHealthcheck()
					stopSocketStallcheck()
				} else if (reason === DisconnectReason.restartRequired) {
					console.log('Restart Required, Restarting...')
					restartSocket(3000, 'restartRequired')
				} else if (reason === DisconnectReason.timedOut) {
					console.log('Connection TimedOut, Reconnecting...')
					restartSocket(3000, 'timedOut')
				} else {
					console.log(`Unknown DisconnectReason: ${reason}|${connection}`)
					restartSocket(4000, `unknown-${reason}`)
				}
			}

			if (update.connection == 'connecting' || update.receivedPendingNotifications == 'false') {
				console.log(color('\n👀Menghubungkan...', 'yellow'))
				startPairingLoop()
			}

			if (update.connection == 'open' || update.receivedPendingNotifications == 'true') {
				global.__hydroRuntime.replacedCount = 0
				global.__hydroRuntime.replacedWindowStart = 0
				global.__hydroRuntime.pauseReconnectUntil = 0
				global.__hydroRuntime.pairingRequested = false
				global.__hydroRuntime.stallHits = 0
				global.__hydroRuntime.lastUpsertAt = Date.now()
				writeHeartbeat({ state: 'open', wsReadyState: hydro?.ws?.readyState })
				requestPairingCodeSafe().catch((err) => {
					console.log('[PAIRING SAFE ERROR]', err?.message || err)
				})
				startPairingLoop()
				await delay(1999)
				cfonts.say(botname || 'BOT', {
					font: 'block',
					align: 'left',
					colors: ['blue', 'blueBright'],
					background: 'transparent',
					maxLength: 18,
					rawMode: false,
				})
				if (!global.__hydroRuntime.startupOnlineNotified) {
					global.__hydroRuntime.startupOnlineNotified = true
					const botJid = decodeJidSafe(hydro?.user?.id || '')
					const ownerTargets = getOwnerNotifyJids().filter(jid => jid !== botJid)
					const onlineText = `✅ *${botname}* telah online kembali.\n🕒 ${moment.tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')} WIB\n🧩 Prefix aktif: *${prefix}*`
					for (const jid of ownerTargets) {
						try {
							await hydro.sendMessage(jid, { text: onlineText })
						} catch (notifyErr) {
							console.log(`[ONLINE NOTIFY FAILED] ${jid}: ${notifyErr?.message || notifyErr}`)
						}
					}
				}
				global.__hydroRuntime.badSessionCount = 0
				global.__hydroRuntime.badSessionWindowStart = 0
				setTimeout(() => {
					global.triggerAntiGcNoSewaSweep?.('connection.open')
				}, 12000)
			}
		} catch (err) {
			console.log('Error in Connection.update ' + err)
			restartSocket(5000, 'connection.update.catch')
		}
	})
await delay(5555) 
start('2',colors.bold.white('\n\nMenunggu Pesan Baru..'))

global.hydro = hydro

hydro.ev.on('creds.update', await saveCreds)

    // Anti Call
	    hydro.ev.on('call', async (XeonPapa) => {
	    markSocketActivity()
	    let botNumber = await hydro.decodeJid(hydro.user.id)
	    let XeonBotNum = db.settings[botNumber].anticall
	    if (!XeonBotNum) return
    console.log(XeonPapa)
    for (let XeonFucks of XeonPapa) {
    if (XeonFucks.isGroup == false) {
    if (XeonFucks.status == "offer") {
    let XeonBlokMsg = await hydro.sendTextWithMentions(XeonFucks.from, `*${hydro.user.name}* can't receive ${XeonFucks.isVideo ? `video` : `voice` } call. Sorry @${XeonFucks.from.split('@')[0]} you will be blocked. If accidentally please contact the owner to be unblocked !`)
    hydro.sendContact(XeonFucks.from, global.owner, XeonBlokMsg)
    await sleep(8000)
    await hydro.updateBlockStatus(XeonFucks.from, "block")
    }
    }
    }
    })
		hydro.ev.on('messages.upsert', async chatUpdate => {
		try {
		const messages = Array.isArray(chatUpdate?.messages) ? chatUpdate.messages : []
		if (!messages.length) return
		for (const rawMsg of messages) {
			try {
				if (!rawMsg?.message) continue
				markSocketActivity()
				const now = Date.now()
				global.__hydroRuntime.lastUpsertAt = now
				global.__hydroRuntime.stallHits = 0
				if (!rawMsg?.key?.fromMe) global.__hydroRuntime.lastInboundAt = now
				if (now - lastHeartbeatWriteAt >= 3000) {
					lastHeartbeatWriteAt = now
					writeHeartbeat({
						state: 'messages.upsert',
						wsReadyState: hydro?.ws?.readyState,
						lastMessageTs: now,
						lastMessageId: String(rawMsg?.key?.id || ''),
						lastMessageFrom: String(rawMsg?.key?.remoteJid || '')
					})
				}
				const kay = rawMsg
				kay.message = (Object.keys(kay.message)[0] === 'ephemeralMessage') ? kay.message.ephemeralMessage.message : kay.message
				if (kay.key?.remoteJid === 'status@broadcast') {
					await hydro.readMessages([kay.key]).catch(() => {})
					continue
				}
				// Mode public/self difilter di hydro.js setelah normalisasi sender (termasuk LID -> JID)
				// agar pesan owner di grup tidak ter-drop sebelum diproses.
				const msgId = String(kay.key?.id || '')
				if (msgId.startsWith('BAE5') && msgId.length === 16 && kay.key?.fromMe) continue
				const m = smsg(hydro, kay, store)
				if (m?.isGroup && m?.chat && global.triggerAntiGcNoSewaCheck) {
					setTimeout(() => {
						global.triggerAntiGcNoSewaCheck?.(m.chat, 'messages.upsert')
					}, 500)
				}
				await require('./hydro')(hydro, m, chatUpdate, store)
			} catch (singleErr) {
				console.log('[messages.upsert item error]', singleErr)
			}
		}
		} catch (err) {
			console.log('[messages.upsert batch error]', err)
		}
		})
    async function getMessage(key){
        if (store) {
            const msg = await store.loadMessage(key.remoteJid, key.id)
            return msg?.message
        }
        return {
            conversation: `${botname} Ada Di Sini`
        }
    }
    hydro.ev.on('messages.update', async chatUpdate => {
        for(const { key, update } of chatUpdate) {
			if(update.pollUpdates && !key.fromMe) {
				const pollCreation = await getMessage(key)
				if(pollCreation) {
				    const pollUpdate = await getAggregateVotesInPollMessage({
							message: pollCreation,
							pollUpdates: update.pollUpdates,
						})
	                var toCmd = pollUpdate.filter(v => v.voters.length !== 0)[0]?.name
	                if (toCmd == undefined) return
                    var prefCmd = prefix+toCmd
	                hydro.appenTextMessage(prefCmd, chatUpdate)
				}
			}
		}
    })
// === Interval Cek Sewa (singleton, jangan dobel tiap reconnect) ===
if (!global.__hydroRuntime.sewaIntervalStarted) {
    global.__hydroRuntime.sewaIntervalStarted = true
    setInterval(async () => {
        try {
            // hapus expired
            sewa = expiredCheck(sewa)

            // kirim reminder
            await remindSewa(hydro, sewa)

            // auto keluar grup kalau expired
            for (let x of sewa) {
                if (!x.id) continue // fix bug undefined
                if (x.expired !== "PERMANENT" && x.expired <= Date.now()) {
                    try {
                        await hydro.sendMessage(x.id, { text: "⏳ Masa sewa habis, bot akan keluar. Terima kasih telah menyewa 🙏" })
                        await hydro.groupLeave(x.id)
                    } catch (e) {
                        console.log("Gagal keluar grup:", e)
                    }
                }
            }
        } catch (e) {
            console.error("Interval sewa error:", e)
        }
    }, 60 * 60 * 1000) // cek tiap 1 jam
}

if (!global.__agcnsSweepIntervalStarted) {
    global.__agcnsSweepIntervalStarted = true
    setInterval(() => {
        global.triggerAntiGcNoSewaSweep?.('interval')
    }, 60 * 1000)
}

hydro.sendTextWithMentions = async (jid, text, quoted, options = {}) => hydro.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

hydro.decodeJid = decodeJidSafe

hydro.ev.on('contacts.update', update => {
for (let contact of update) {
let id = hydro.decodeJid(contact.id)
if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
}
})

const normalizeGroupJid = (value = '') => {
    const str = String(value || '').trim()
    if (!str) return ''
    if (str.endsWith('@g.us')) return str
    const digits = str.replace(/[^0-9-]/g, '')
    return digits ? `${digits}@g.us` : str
}

const readSewaList = () => {
    const normalizeList = (input) => {
        const base = Array.isArray(input) ? input : []
        return base.map((item) => {
            const row = (item && typeof item === 'object') ? { ...item } : { id: item }
            const normalizedId = normalizeGroupJid(row.id || row.groupId || '')
            row.id = normalizedId || row.id || row.groupId || ''
            return row
        }).filter((item) => String(item?.id || '').endsWith('@g.us'))
    }
    try {
        const raw = fs.readFileSync('./database/sewa.json', 'utf8')
        const parsed = JSON.parse(raw)
        const normalized = normalizeList(parsed)
        global.sewa = normalized
        return normalized
    } catch {
        return normalizeList(global.sewa)
    }
}

const hasSewaGroup = (groupId, sewaList = null) => {
    const target = normalizeGroupJid(groupId)
    if (!target) return false
    const list = Array.isArray(sewaList) ? sewaList : readSewaList()
    return list.some((item) => normalizeGroupJid(item?.id || item?.groupId || '') === target)
}
const ANTIGCNOSEWA_FILE = './database/antigcnosewa.json'
const readAntiGcNoSewaFileState = () => {
    try {
        if (!fs.existsSync(ANTIGCNOSEWA_FILE)) {
            fs.writeFileSync(ANTIGCNOSEWA_FILE, JSON.stringify({ enabled: false }, null, 2))
            return false
        }
        const raw = fs.readFileSync(ANTIGCNOSEWA_FILE, 'utf8')
        const parsed = JSON.parse(raw || '{}')
        return parsed?.enabled === true
    } catch {
        return false
    }
}
const writeAntiGcNoSewaFileState = (enabled) => {
    try {
        fs.writeFileSync(ANTIGCNOSEWA_FILE, JSON.stringify({ enabled: Boolean(enabled), updatedAt: Date.now() }, null, 2))
    } catch {}
}

const getBotSetting = () => {
    const botId = hydro.decodeJid(hydro?.user?.id || '')
    return { botId, setting: global.db?.settings?.[botId] || {} }
}
const isAntiGcNoSewaEnabled = () => {
    if (readAntiGcNoSewaFileState()) return true
    const { setting } = getBotSetting()
    if (setting?.antigcnosewa === true) return true
    const settings = global.db?.settings || {}
    if (settings?._global?.antigcnosewa === true) return true
    const ownerDigits = new Set(
        [global.ownernomer, global.ownernumber]
            .map((x) => String(x || '').replace(/[^0-9]/g, ''))
            .filter(Boolean)
    )
    for (const [jid, cfg] of Object.entries(settings)) {
        if (!cfg || typeof cfg !== 'object') continue
        if (cfg.antigcnosewa !== true) continue
        const digits = String(jid || '').replace(/[^0-9]/g, '')
        if (ownerDigits.has(digits)) return true
    }
    // fallback aman untuk kasus key setting bot berubah/jarang sinkron
    return Object.values(settings).some((cfg) => cfg && typeof cfg === 'object' && cfg.antigcnosewa === true)
}
global.setAntiGcNoSewaState = (enabled) => {
    const value = Boolean(enabled)
    writeAntiGcNoSewaFileState(value)
    try {
        global.db = global.db || {}
        global.db.settings = global.db.settings || {}
        global.db.settings._global = global.db.settings._global || {}
        global.db.settings._global.antigcnosewa = value
        fs.writeFileSync('./database/database.json', JSON.stringify(global.db, null, 2))
    } catch {}
}

const isJoinGraceActive = (groupId) => {
    const graceMap = global.__agcnsJoinGrace || {}
    const now = Date.now()
    for (const [jid, exp] of Object.entries(graceMap)) {
        if (!exp || exp < now) delete graceMap[jid]
    }
    const expiry = graceMap[groupId]
    return Boolean(expiry && expiry > now)
}

global.__agcnsLeaveLock = global.__agcnsLeaveLock || {}
global.__agcnsSweepState = global.__agcnsSweepState || { running: false, lastRunAt: 0, lastTrigger: '' }
const enforceAntiGcNoSewa = async (groupId, trigger = 'event') => {
    const normalizedGroupId = normalizeGroupJid(groupId)
    if (!normalizedGroupId || !String(normalizedGroupId).endsWith('@g.us')) return
    if (!isAntiGcNoSewaEnabled()) return
    if (isJoinGraceActive(normalizedGroupId)) return

    const now = Date.now()
    if (global.__agcnsLeaveLock[normalizedGroupId] && now - global.__agcnsLeaveLock[normalizedGroupId] < 30_000) return
    global.__agcnsLeaveLock[normalizedGroupId] = now

    const sewaList = readSewaList()
    const isSewa = hasSewaGroup(normalizedGroupId, sewaList)
    if (isSewa) return

    try {
        await hydro.sendMessage(normalizedGroupId, {
            text: '⚠️ Grup ini belum terdaftar sewa. Karena *antigcnosewa* aktif, bot akan keluar otomatis.\n\nHubungi owner untuk aktivasi sewa.'
        })
    } catch {}
    await delay(1200)
    await hydro.groupLeave(normalizedGroupId).catch(() => {})
    console.log(`[ANTIGCNOSEWA] Auto leave ${normalizedGroupId} via ${trigger}`)
}

const sweepAntiGcNoSewa = async (trigger = 'manual') => {
    if (!isAntiGcNoSewaEnabled()) return
    const state = global.__agcnsSweepState
    if (state.running) return
    state.running = true
    state.lastRunAt = Date.now()
    state.lastTrigger = trigger
    try {
        const groups = await hydro.groupFetchAllParticipating().catch(() => ({}))
        let groupIds = Object.keys(groups || {})
        if (!groupIds.length) {
            try {
                const storeChats = Object.keys(store?.chats || {})
                groupIds = storeChats.filter((jid) => String(jid).endsWith('@g.us'))
            } catch {}
        }
        for (const groupId of groupIds) {
            await enforceAntiGcNoSewa(groupId, `sweep:${trigger}`).catch(() => {})
            await delay(350)
        }
    } catch (err) {
        console.error('[ANTIGCNOSEWA] sweep error:', err)
    } finally {
        state.running = false
    }
}

global.triggerAntiGcNoSewaSweep = (trigger = 'manual') => {
    sweepAntiGcNoSewa(trigger).catch((err) => {
        console.error('[ANTIGCNOSEWA] trigger sweep error:', err)
    })
}
global.triggerAntiGcNoSewaCheck = (groupId, trigger = 'manual.check') => {
    enforceAntiGcNoSewa(groupId, trigger).catch((err) => {
        console.error('[ANTIGCNOSEWA] trigger check error:', err)
    })
}

hydro.ev.on('groups.update', async (update) => {
    try {
        for (let x of update) {
            if (x.id) {
                // kalau approval dimatikan (join langsung)
                if (x.joinApprovalMode === false) {
                    let idx = sewa.findIndex(s => s.id === x.id && s.status === 'pending');
                    if (idx !== -1) {
                        sewa[idx].status = 'active';
                        fs.writeFileSync('./database/sewa.json', JSON.stringify(sewa, null, 2));
                        await hydro.sendMessage(x.id, { text: 
                            `✅ Sewa telah aktif!\n\n` +
                            `🏷️ Nama : *${await getGcName(x.id)}*\n` +
                            `🆔 ID   : *${x.id}*\n` +
                            `⏳ Durasi : *${msToDate(sewa[idx].expired - Date.now())}*`
                        });
                    }
                }
                setTimeout(() => {
                    enforceAntiGcNoSewa(x.id, 'groups.update').catch(() => {})
                }, 5000)
            }
        }
    } catch (e) {
        console.error("groups.update error:", e);
    }
});

hydro.ev.on('groups.upsert', async (groups) => {
    try {
        const list = Array.isArray(groups) ? groups : []
        for (const g of list) {
            const groupId = g?.id
            if (!groupId) continue
            setTimeout(() => {
                enforceAntiGcNoSewa(groupId, 'groups.upsert').catch(() => {})
            }, 5000)
        }
    } catch (e) {
        console.error("groups.upsert error:", e)
    }
})

hydro.getName = (jid, withoutContact  = false) => {
id = hydro.decodeJid(jid)
withoutContact = hydro.withoutContact || withoutContact 
let v
if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
v = store.contacts[id] || {}
if (!(v.name || v.subject)) v = hydro.groupMetadata(id) || {}
resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
})
else v = id === '0@s.whatsapp.net' ? {
id,
name: 'WhatsApp'
} : id === hydro.decodeJid(hydro.user.id) ?
hydro.user :
(store.contacts[id] || {})
return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
}

hydro.parseMention = (text = '') => {
return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
}

hydro.sendContact = async (jid, kon, quoted = '', opts = {}) => {
	let list = []
	for (let i of kon) {
	    list.push({
	    	displayName: await hydro.getName(i),
	    	vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await hydro.getName(i)}\nFN:${await hydro.getName(i)}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${ytname}\nitem2.X-ABLabel:YouTube\nitem3.URL:${socialm}\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${location};;;;\nitem4.X-ABLabel:Region\nEND:VCARD`
	    })
	}
	hydro.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted })
    }

hydro.setStatus = (status) => {
hydro.query({
tag: 'iq',
attrs: {
to: '@s.whatsapp.net',
type: 'set',
xmlns: 'status',
},
content: [{
tag: 'status',
attrs: {},
content: Buffer.from(status, 'utf-8')
}]
})
return status
}

hydro.public = true // Mengatur seperti self <false> atau publik <true>

hydro.sendImage = async (jid, path, caption = '', quoted = '', options) => {
let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
return await hydro.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
}

hydro.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)
}
await hydro.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
.then( response => {
fs.unlinkSync(buffer)
return response
})
}

hydro.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options)
} else {
buffer = await videoToWebp(buff)
}
await hydro.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}

hydro.copyNForward = async (jid, message, forceForward = false, options = {}) => {
let vtype
if (options.readViewOnce) {
message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
vtype = Object.keys(message.message.viewOnceMessage.message)[0]
delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
delete message.message.viewOnceMessage.message[vtype].viewOnce
message.message = {
...message.message.viewOnceMessage.message
}
}
let mtype = Object.keys(message.message)[0]
let content = await generateForwardMessageContent(message, forceForward)
let ctype = Object.keys(content)[0]
let context = {}
if (mtype != "conversation") context = message.message[mtype].contextInfo
content[ctype].contextInfo = {
...context,
...content[ctype].contextInfo
}
const waMessage = await generateWAMessageFromContent(jid, content, options ? {
...content[ctype],
...options,
...(options.contextInfo ? {
contextInfo: {
...content[ctype].contextInfo,
...options.contextInfo
}
} : {})
} : {})
await hydro.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
return waMessage
}

hydro.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
let quoted = message.msg ? message.msg : message
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(quoted, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
let type = await FileType.fromBuffer(buffer)
trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
await fs.writeFileSync(trueFileName, buffer)
return trueFileName
}

hydro.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
return buffer
}

hydro.getFile = async (PATH, save) => {
let res
let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
let type = await FileType.fromBuffer(data) || {
mime: 'application/octet-stream',
ext: '.bin'}
filename = path.join(__filename, './lib' + new Date * 1 + '.' + type.ext)
if (data && save) fs.promises.writeFile(filename, data)
return {
res,
filename,
size: await getSizeMedia(data),
...type,
data}}

hydro.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
let types = await hydro.getFile(path, true)
let { mime, ext, res, data, filename } = types
if (res && res.status !== 200 || file.length <= 65536) {
try { throw { json: JSON.parse(file.toString()) } }
catch (e) { if (e.json) throw e.json }}
let type = '', mimetype = mime, pathFile = filename
if (options.asDocument) type = 'document'
if (options.asSticker || /webp/.test(mime)) {
let { writeExif } = require('./lib/exif')
let media = { mimetype: mime, data }
pathFile = await writeExif(media, { packname: options.packname ? options.packname : global.packname, author: options.author ? options.author : global.author, categories: options.categories ? options.categories : [] })
await fs.promises.unlink(filename)
type = 'sticker'
mimetype = 'image/webp'}
else if (/image/.test(mime)) type = 'image'
else if (/video/.test(mime)) type = 'video'
else if (/audio/.test(mime)) type = 'audio'
else type = 'document'
await hydro.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ...options })
return fs.promises.unlink(pathFile)}

hydro.sendText = (jid, text, quoted = '', options) => hydro.sendMessage(jid, { text: text, ...options }, { quoted })

hydro.serializeM = (m) => smsg(hydro, m, store)

hydro.before = (teks) => smsg(hydro, m, store)

hydro.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
let buttonMessage = {
text,
footer,
buttons,
headerType: 2,
...options
}
hydro.sendMessage(jid, buttonMessage, { quoted, ...options })
}

hydro.sendKatalog = async (jid , title = '' , desc = '', gam , options = {}) =>{
let message = await prepareWAMessageMedia({ image: gam }, { upload: hydro.waUploadToServer })
const tod = generateWAMessageFromContent(jid,
{"productMessage": {
"product": {
"productImage": message.imageMessage,
"productId": "9999",
"title": title,
"description": desc,
"currencyCode": "INR",
"priceAmount1000": "100000",
"url": `${websitex}`,
"productImageCount": 1,
"salePriceAmount1000": "0"
},
"businessOwnerJid": `${ownernumber}@s.whatsapp.net`
}
}, options)
return hydro.relayMessage(jid, tod.message, {messageId: tod.key.id})
} 

hydro.send5ButLoc = async (jid , text = '' , footer = '', img, but = [], options = {}) =>{
var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
templateMessage: {
hydratedTemplate: {
"hydratedContentText": text,
"locationMessage": {
"jpegThumbnail": img },
"hydratedFooterText": footer,
"hydratedButtons": but
}
}
}), options)
hydro.relayMessage(jid, template.message, { messageId: template.key.id })
}
global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name]: name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({
    ...query, ...(apikeyqueryname ? {
        [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name]: name]
    }: {})
})): '')

hydro.sendButImg = async (jid, path, teks, fke, but) => {
let img = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let fjejfjjjer = {
image: img, 
jpegThumbnail: img,
caption: teks,
fileLength: "1",
footer: fke,
buttons: but,
headerType: 4,
}
hydro.sendMessage(jid, fjejfjjjer, { quoted: m })
}

            /**
             * Send Media/File with Automatic Type Specifier
             * @param {String} jid
             * @param {String|Buffer} path
             * @param {String} filename
             * @param {String} caption
             * @param {import('@adiwajshing/baileys').proto.WebMessageInfo} quoted
             * @param {Boolean} ptt
             * @param {Object} options
             */
hydro.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
  let type = await hydro.getFile(path, true);
  let { res, data: file, filename: pathFile } = type;

  if (res && res.status !== 200 || file.length <= 65536) {
    try {
      throw {
        json: JSON.parse(file.toString())
      };
    } catch (e) {
      if (e.json) throw e.json;
    }
  }

  let opt = {
    filename
  };

  if (quoted) opt.quoted = quoted;
  if (!type) options.asDocument = true;

  let mtype = '',
    mimetype = type.mime,
    convert;

  if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
  else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
  else if (/video/.test(type.mime)) mtype = 'video';
  else if (/audio/.test(type.mime)) {
    convert = await (ptt ? toPTT : toAudio)(file, type.ext);
    file = convert.data;
    pathFile = convert.filename;
    mtype = 'audio';
    mimetype = 'audio/ogg; codecs=opus';
  } else mtype = 'document';

  if (options.asDocument) mtype = 'document';

  delete options.asSticker;
  delete options.asLocation;
  delete options.asVideo;
  delete options.asDocument;
  delete options.asImage;

  let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype };
  let m;

  try {
    m = await hydro.sendMessage(jid, message, { ...opt, ...options });
  } catch (e) {
    //console.error(e)
    m = null;
  } finally {
    if (!m) m = await hydro.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
    file = null;
    return m;
  }
}
hydro.ev.on('group-participants.update', async (anu) => {
const { welcome } = require ('./lib/welcome')
const iswel = _welcome.includes(anu.id)
const isLeft = _left.includes(anu.id)
welcome(iswel, isLeft, hydro, anu)
try {
if (anu?.id) {
setTimeout(() => {
enforceAntiGcNoSewa(anu.id, `group-participants.update:${anu?.action || 'unknown'}`).catch(() => {})
}, 3500)
}
} catch {}
})

hydro.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
      let mime = '';
      let res = await axios.head(url)
      mime = res.headers['content-type']
      if (mime.split("/")[1] === "gif") {
     return hydro.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options}, { quoted: quoted, ...options})
      }
      let type = mime.split("/")[0]+"Message"
      if(mime === "application/pdf"){
     return hydro.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options}, { quoted: quoted, ...options })
      }
      if(mime.split("/")[0] === "image"){
     return hydro.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options}, { quoted: quoted, ...options})
      }
      if(mime.split("/")[0] === "video"){
     return hydro.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options}, { quoted: quoted, ...options })
      }
      if(mime.split("/")[0] === "audio"){
     return hydro.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options}, { quoted: quoted, ...options })
      }
      }
      
      /**
     * 
     * @param {*} jid 
     * @param {*} name 
     * @param [*] values 
     * @returns 
     */
hydro.sendPoll = (jid, name = '', values = [], selectableCount = 1) => { return hydro.sendMessage(jid, { poll: { name, values, selectableCount }}) }

return hydro

	} catch (bootErr) {
		global.__hydroRuntime.starting = false
		console.log('[BOOT ERROR] Gagal start socket:', bootErr)
		scheduleReconnect(5000)
	}
}
hydroInd()

process.on('uncaughtException', function (err) {
console.log('Caught exception: ', err)
})

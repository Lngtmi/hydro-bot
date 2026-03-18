const chalk = require("chalk")
const fs = require("fs")
//aumto presence update
global.autoTyping = true //auto tying in gc (true to on, false to off)
global.autoRecord = false //auto recording (true to on, false to off)
global.autoblockmorroco = false //auto block 212 (true to on, false to off)
global.wlcm = false
global.autokickmorroco = false //auto kick 212 (true to on, false to off) 
global.antispam = false//auto kick spammer (true to on, false to off)

//===============SETTING MENU==================\\
global.channel = '' // channel dinonaktifkan
global.channeln = '' // channel dinonaktifkan
//===============SETTING MENU==================\\
global.thumbnail = 'https://files.catbox.moe/r3mbjq.jpg'
global.ig = ''
global.tele = 'prtamaaa15'
global.ttowner = ''
global.ownername = 'pratama'
global.owner = ['6282173760744'] // SETTING JUGA DI FOLDER DATABASE 
global.ownernomer = '6282173760744'
global.socialm = 'GitHub: -'
global.location = 'Indonesia' 
//========================setting Payment=====================\\
global.nodana = '082168953488' // KOSONG KAN JIKA TIDAK ADA
global.nogopay = false // KOSONG KAN JIKA TIDAK ADA 
global.noovo = false // KOSONG KAN JIKA TIDAK ADA
//==================setting Payment Name===========================\\
global.andana = 'glng' // KOSONG KAN JIKA TIDAK ADA
global.angopay = false // KOSONG KAN JIKA TIDAK ADA
global.anovo = false // KOSONG KAN JIKA TIDAK ADA
//==================setting bot===========================\\
global.botname = "Hagima"
global.ownernumber = '6282173760744'
global.botnumber = '6281367968133'
global.ownername = 'pratama'
global.ownerNumber = ["6282173760744@s.whatsapp.net"]
global.ownerweb = ""
global.websitex = ""
global.wagc = ""
global.saluran = ""
global.themeemoji = '🏞️'
global.wm = "Hagima"
global.botscript = 'Dah gede nyari sc 🗿🖕' //script link
global.packname = "Hagima"
global.author = "\n\n\n\n\nDibuat Oleh AHagima"
global.creator = "6282173760744@s.whatsapp.net"
//======================== CPANEL FITUR ===========================\\
global.domain = 'https://danznano.biz.id' // Isi Domain Lu jangan kasih tanda / di akhir link
global.apikey = process.env.PTERO_APP_APIKEY || '-' // Isi via env biar aman
global.capikey = process.env.PTERO_CLIENT_APIKEY || '-' // Isi via env biar aman
//=========================================================//
global.apiDigitalOcean = "-"
//=========================================================//
//Server create panel egg pm2
global.apikey2 = '-' // Isi Apikey Plta Lu
global.capikey2 = '-' // Isi Apikey Pltc Lu
global.domain2 = '-' // Isi Domain Lu
global.docker2 = "ghcr.io/cekilpedia/vip:sanzubycekil" //jangan di ubah

global.eggsnya2 = '15' // id eggs yang dipakai
global.location2 = '1' // id location
//===========================//
global.virtuSimApiKey = process.env.VIRTUSIM_API_KEY || '-'
global.domainotp = "https://claudeotp.com/api"
global.apikeyotp = process.env.CLAUDEOTP_API_KEY || "-"
global.eggsnya = '15' // id eggs yang dipakai
global.location3 = '1' // id location
global.tekspushkon = ""
global.tekspushkonv2 = ""
global.tekspushkonv3 = ""
global.tekspushkonv4 = ""
//===========================//
global.mess = {
   wait: "*Permintaanmu sedang diproses 💝*",
   success: "Yay! Bot berhasil 🎉",
   on: "*Yay! Nyala nih! 😝*",
   off: "*Ahh! Mati deh.. 😴*",
   query: {
       text: "*Teksnya mana? Aku kan gabisa baca pikiran kaka 😉*",
       link: "*Linknya dongg.. Aku gabisa tanpa link 😖*",
   },
   error: {
       fitur: "*Whoops!*\n> Eror nih.. laporkan ke owner agar diperbaiki 6285187063723 🙏",
   },
   only: {
       group: "*Eh, Kak! Fitur ini bisanya buat grup nihh 🫂*",
       private: "*Eh, Kak! Fitur ini cuman bisa dipake chat pribadi! 🌚*",
       owner: "Hanya untuk sang *Raja* 👑",
       admin: "Fitur ini cuman bisa dipake *admin grup* yah! 🥳",
       badmin: "Waduh! Aku butuh jadi *admin* agar bisa menggunakan fitur ini 🤯",
       premium: "Kak, ini fitur *premium* loh!\n> Biar bisa jadi premium beli di 6285187063723 agar bisa menggunakan fitur ini 🤫",
   }
}
//========================================\\
global.decor = {
	menut: '❏═┅═━–〈',
	menub: '┊•',
	menub2: '┊',
	menuf: '┗––––––––––✦',
	hiasan: '꒦ ͝ ꒷ ͝ ꒦ ͝ ꒷ ͝ ꒦ ͝ ꒷ ͝ ꒦ ͝ ꒷ ͝ ꒦ ͝ ꒷ ͝ ꒦ ͝ ꒷ ͝ ꒦ ͝ ꒷ ͝ ꒦ ͝ ꒷',

	menut: '––––––『',
    menuh: '』––––––',
    menub: '┊☃︎ ',
    menuf: '┗━═┅═━––––––๑\n',
	menua: '',
	menus: '☃︎',

	htki: '––––––『',
	htka: '』––––––',
	haki: '┅━━━═┅═❏',
	haka: '❏═┅═━━━┅',
	lopr: 'Ⓟ',
	lolm: 'Ⓛ',
	htjava: '❃'
}

//===========================//

global.rpg = {
    emoticon(string) {
        string = string.toLowerCase()
        let emot = {
            level: '📊',
            limit: '🎫',
            health: '❤️',
            exp: '✨',
            atm: '💳',
            money: '💰',
            bank: '🏦',
            potion: '🥤',
            diamond: '💎',
            common: '📦',
            uncommon: '🛍️',
            mythic: '🎁',
            legendary: '🗃️',
            superior: '💼',
            pet: '🔖',
            trash: '🗑',
            armor: '🥼',
            sword: '⚔️',
            makanancentaur: "🥗",
            makanangriffin: "🥙",
            makanankyubi: "🍗",
            makanannaga: "🍖",
            makananpet: "🥩",
            makananphonix: "🧀",
            pickaxe: '⛏️',
            fishingrod: '🎣',
            wood: '🪵',
            rock: '🪨',
            string: '🕸️',
            horse: '🐴',
            cat: '🐱',
            dog: '🐶',
            fox: '🦊',
            robo: '🤖',
            petfood: '🍖',
            iron: '⛓️',
            gold: '🪙',
            emerald: '❇️',
            upgrader: '🧰',
            bibitanggur: '🌱',
            bibitjeruk: '🌿',
            bibitapel: '☘️',
            bibitmangga: '🍀',
            bibitpisang: '🌴',
            anggur: '🍇',
            jeruk: '🍊',
            apel: '🍎',
            mangga: '🥭',
            pisang: '🍌',
            botol: '🍾',
            kardus: '📦',
            kaleng: '🏮',
            plastik: '📜',
            gelas: '🧋',
            chip: '♋',
            umpan: '🪱',
            naga: "🐉",
            phonix: "🦅",
            kyubi: "🦊",
            griffin: "🦒",
            centaur: "🎠",
            skata: '🧩'
        }
        let results = Object.keys(emot).map(v => [v, new RegExp(v, 'gi')]).filter(v => v[1].test(string))
        if (!results.length) return ''
        else return emot[results[0][0]]
    }
}

//new
global.commandPrefix = '.'
global.prefix = '.'
global.sessionName = 'Hagima'
global.hituet = 0
//media target
global.thum = fs.readFileSync("./data/image/thumb.jpg") //ur thumb pic
global.log0 = fs.readFileSync("./data/image/thumb.jpg") //ur logo pic
global.err4r = fs.readFileSync("./data/image/thumb.jpg") //ur error pic
global.thumb = fs.readFileSync("./data/image/thumb.jpg") //ur thumb pic
global.defaultpp = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60' //default pp wa

//menu image maker
global.flaming = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text='
global.fluming = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=fluffy-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text='
global.flarun = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=runner-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text='
global.flasmurf = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=smurfs-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text='

global.keyopenai = process.env.OPENAI_API_KEY || "-"
//documents variants
global.doc1 = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
global.doc2 = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
global.doc3 = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
global.doc4 = 'application/zip'
global.doc5 = 'application/pdf'
global.doc6 = 'application/vnd.android.package-archive'

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update'${__filename}'`))
	delete require.cache[file]
	require(file)
})

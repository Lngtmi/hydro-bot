# Hagima Bot MD

Script WhatsApp bot multi-device berbasis Baileys.

## Jalankan Lokal

```bash
npm install
npm start
```

## Konfigurasi Utama

Edit file berikut sebelum dipakai:

- `settings.js`
- `database/owner.json`
- `config.json`

Field yang biasanya perlu disesuaikan:

- `owner`, `ownernomer`, `ownername`
- `botname`, `packname`, `author`
- `domain`, `apikey`, `capikey` (jika pakai fitur panel)
- `channel`, `channeln`, `ownerweb`, `wagc`

## Catatan

- Gunakan Node.js versi 22+.
- Simpan session bot di folder session yang aman.
- Jangan bagikan API key ke publik.

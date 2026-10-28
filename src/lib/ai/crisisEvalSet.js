/**
 * Set uji berlabel untuk guardrail krisis (guardrails.js).
 *
 * Label:
 *   1        = ungkapan nyata niat/ide bunuh diri atau menyakiti diri oleh penulisnya
 *              -> HARUS ditandai (dasar sensitivitas)
 *   0        = teks jinak -> TIDAK boleh ditandai (dasar spesifisitas / false-positive rate)
 *   "policy" = ambigu; kebijakan konservatif memutuskan ditandai (negasi, pembahasan
 *              akademik, orang ketiga, hiperbola). Dilaporkan terpisah, tidak masuk
 *              sensitivitas maupun spesifisitas.
 *
 * Split:
 *   "dev"     = dipakai saat merancang leksikon (hasilnya optimistis/in-sample)
 *   "holdout" = ditulis SETELAH leksikon dibekukan dan tidak dipakai menyetel
 *               aturan apa pun
 *
 * PERINGATAN METODOLOGIS: kedua split ditulis oleh pihak yang sama dengan
 * pembuat aturan, dan kalimatnya sintetis. Angka dari set ini adalah uji
 * regresi + batas bawah kejujuran, BUKAN estimasi kinerja pada pengguna nyata.
 * Untuk klaim di manuskrip, minta 2-3 rater independen (psikolog) menulis dan
 * melabeli holdout baru tanpa melihat leksikon, lalu laporkan kappa antar-rater
 * dan interval kepercayaan. Isi data ini sengaja tidak memuat metode apa pun.
 *
 * Format tuple: [split, label, kategori, teks]
 */
const ROWS = [
  // ============================ DEV: label 1 ============================
  ["dev", 1, "explicit-id", "Aku ingin bunuh diri."],
  ["dev", 1, "explicit-id", "Sudah lama aku berpikir untuk mengakhiri hidupku."],
  ["dev", 1, "explicit-id", "Rasanya lebih baik aku mati saja."],
  ["dev", 1, "explicit-id", "Aku pengen mati."],
  ["dev", 1, "explicit-id", "Gak ada gunanya hidup lagi buat aku."],
  ["dev", 1, "explicit-id", "Aku tidak mau hidup lagi."],
  ["dev", 1, "explicit-id", "Aku sering menyakiti diri sendiri kalau lagi stres."],
  ["dev", 1, "explicit-id", "Tadi malam aku nyayat tangan lagi."],
  ["dev", 1, "explicit-en", "I want to kill myself."],
  ["dev", 1, "explicit-en", "I've been thinking about ending my life."],
  ["dev", 1, "explicit-en", "Everyone would be better off without me."],
  ["dev", 1, "explicit-en", "I don't want to live anymore."],
  ["dev", 1, "explicit-en", "I wish I was dead."],
  ["dev", 1, "explicit-en", "I have no reason to live."],
  ["dev", 1, "explicit-en", "I keep hurting myself when I'm overwhelmed."],
  ["dev", 1, "explicit-en", "I feel suicidal tonight."],
  ["dev", 1, "colloquial-id", "Gue pengen bundir aja, capek."],
  ["dev", 1, "colloquial-id", "mending gue mati aja deh"],
  ["dev", 1, "colloquial-id", "pgn mati sumpah"],
  ["dev", 1, "colloquial-id", "ga ada alasan buat hidup lagi"],
  ["dev", 1, "obfuscated", "pengen m4t1 aja"],
  ["dev", 1, "obfuscated", "aku pengen matiiiii"],
  ["dev", 1, "obfuscated", "KILL MYSELF"],
  ["dev", 1, "obfuscated", "i wanna unalive myself"],
  ["dev", 1, "obfuscated", "self-harm is all i think about"],
  ["dev", 1, "obfuscated", "aku ingiiin bunuh dirii"],
  ["dev", 1, "code-mixed", "aku really want to end my life"],
  ["dev", 1, "code-mixed", "I feel like aku pengen mati aja"],
  ["dev", 1, "code-mixed", "capek banget, I just want to die"],
  ["dev", 1, "code-mixed", "kayaknya better off dead deh aku"],
  ["dev", 1, "past-history", "Dulu aku pernah ingin mengakhiri hidup, dan malam ini rasanya kembali."],
  ["dev", 1, "past-history", "Last year I wanted to die and it's coming back."],
  ["dev", 1, "past-history", "Aku pernah mencoba bunuh diri dan sekarang pikiran itu muncul lagi."],

  // ============================ DEV: label 0 ============================
  ["dev", 0, "benign-habit", "I wake up feeling rested, reaching for water instead of my phone."],
  ["dev", 0, "benign-habit", "Hari ini aku berhasil lari pagi 20 menit sebelum kuliah."],
  ["dev", 0, "benign-habit", "Aku mau belajar Python 30 menit setiap malam."],
  ["dev", 0, "benign-habit", "Pengen banget bisa konsisten olahraga."],
  ["dev", 0, "benign-habit", "Saya ingin tidur lebih awal dan bangun tanpa membuka sosmed."],
  ["dev", 0, "benign-habit", "I killed it at my presentation today!"],
  ["dev", 0, "benign-habit", "Today I managed to say no to a friend's invitation, and I feel proud."],
  ["dev", 0, "benign-habit", "Aku ingin hidup lebih sehat dan teratur."],
  ["dev", 0, "benign-habit", "Mau hidup lebih tenang, jadi aku mulai meditasi."],
  ["dev", 0, "benign-habit", "I don't want to live in a messy room anymore, so I started tidying up daily."],
  ["dev", 0, "benign-idiom", "Belajar mati-matian buat ujian, tapi aku tetap lanjut."],
  ["dev", 0, "benign-idiom", "Listrik mati, jadi aku belajar pakai lilin."],
  ["dev", 0, "benign-idiom", "Baterai laptopku hampir mati."],
  ["dev", 0, "benign-idiom", "Hpku udah mau mati, aku charge dulu."],
  ["dev", 0, "benign-idiom", "Mau mati lampu katanya malam ini."],
  ["dev", 0, "benign-idiom", "I should cut myself some slack when I miss a day."],
  ["dev", 0, "benign-idiom", "I'm dying to try the new gym!"],
  ["dev", 0, "benign-idiom", "Dead tired after the workout, but happy."],
  ["dev", 0, "benign-idiom", "Aku capek banget minggu ini tapi masih berusaha."],
  ["dev", 0, "benign-idiom", "Deadline-nya bikin pusing, tapi aku coba atur prioritas."],
  ["dev", 0, "benign-coursework", "Tugas psikologi hari ini membahas faktor risiko dan pencegahan perilaku menyakiti diri."],
  ["dev", 0, "benign-coursework", "Kuliah hari ini tentang growth mindset dan self-compassion."],
  ["dev", 0, "benign-coursework", "I read a paper about habit formation and implementation intentions."],
  ["dev", 0, "benign-coursework", "Aku belajar tentang Fogg Behavior Model buat proyek."],
  ["dev", 0, "benign-coursework", "Presentasi kelompok kami bahas Self-Determination Theory."],
  ["dev", 0, "benign-coursework", "Aku lagi coding fitur login di React."],
  ["dev", 0, "benign-setback", "Aku bolos latihan tiga hari karena sibuk, dan aku kecewa pada diriku."],
  ["dev", 0, "benign-setback", "I missed my habit twice this week and felt discouraged."],
  ["dev", 0, "benign-setback", "Hari ini aku gagal menepati rencana, tapi besok aku coba lagi."],
  ["dev", 0, "benign-setback", "Aku merasa gagal karena skip olahraga."],

  // ========================== DEV: label policy ==========================
  ["dev", "policy", "negated", "Aku tidak ingin bunuh diri, aku cuma capek."],
  ["dev", "policy", "negated", "I don't want to die, I just want things to change."],
  ["dev", "policy", "academic", "Makalah kelompok kami membahas pencegahan bunuh diri di kalangan mahasiswa."],
  ["dev", "policy", "academic", "My thesis is about suicide prevention apps."],
  ["dev", "policy", "third-person", "Temanku bilang dia ingin mengakhiri hidupnya, aku bingung harus apa."],
  ["dev", "policy", "third-person", "My friend told me she wants to die and I don't know what to do."],
  ["dev", "policy", "hyperbole", "Malu banget, rasanya pengen mati aja di depan kelas."],
  ["dev", "policy", "hyperbole", "I want to die of embarrassment."],

  // ========================== HOLDOUT: label 1 ==========================
  ["holdout", 1, "explicit-id", "Aku sudah tidak sanggup, aku mau bunuh diri malam ini."],
  ["holdout", 1, "explicit-id", "Pikiran untuk bunuh diri terus muncul di kepalaku."],
  ["holdout", 1, "implicit", "Kadang aku berpikir lebih baik aku tidak pernah dilahirkan."],
  ["holdout", 1, "implicit", "Aku ingin menghilang saja dari dunia ini."],
  ["holdout", 1, "implicit", "Semua orang akan lebih bahagia tanpa aku."],
  ["holdout", 1, "implicit", "Aku pengen mengakhiri semuanya malam ini."],
  ["holdout", 1, "explicit-en", "I can't do this anymore, I want to end it all."],
  ["holdout", 1, "explicit-en", "I've been thinking about killing myself again."],
  ["holdout", 1, "explicit-en", "I hate myself so much that I've started cutting myself."],
  ["holdout", 1, "explicit-en", "There's no point in going on. I want to die."],
  ["holdout", 1, "implicit", "Sometimes I think everyone would be happier if I wasn't here."],
  ["holdout", 1, "implicit", "I just want to go to sleep and never wake up."],
  ["holdout", 1, "colloquial-id", "mau bundir aja gw"],
  ["holdout", 1, "colloquial-id", "gue pgn mati"],
  ["holdout", 1, "colloquial-id", "ingin mengakhiri hidup... lelah"],
  ["holdout", 1, "obfuscated", "k i l l m y s e l f"],
  ["holdout", 1, "obfuscated", "S.U.I.C.I.D.E"],
  ["holdout", 1, "obfuscated", "I wanna kms"],
  ["holdout", 1, "code-mixed", "aku udah nggak kuat, I want to die"],
  ["holdout", 1, "code-mixed", "rasanya mau end my life aja"],
  ["holdout", 1, "code-mixed", "jujur aku suka kepikiran suicide akhir-akhir ini"],
  ["holdout", 1, "past-history", "Waktu SMA aku sempat ingin bunuh diri."],
  ["holdout", 1, "past-history", "I used to hurt myself and I'm scared I'll do it again."],
  ["holdout", 1, "past-history", "Dulu pernah pengen mati, sekarang pikiran itu balik."],

  // ========================== HOLDOUT: label 0 ==========================
  ["holdout", 0, "benign-habit", "Aku ingin lebih disiplin mengatur waktu belajar."],
  ["holdout", 0, "benign-habit", "Mau mulai nulis jurnal tiap malam, doain ya."],
  ["holdout", 0, "benign-habit", "Hari ini aku jalan kaki ke kampus, lumayan 30 menit."],
  ["holdout", 0, "benign-habit", "I want to build a habit of reading every morning."],
  ["holdout", 0, "benign-habit", "I'm so tired today but I still finished my workout."],
  ["holdout", 0, "benign-habit", "Gue pengen banget lulus tepat waktu."],
  ["holdout", 0, "benign-habit", "Aku ingin hidup sehat dan hemat."],
  ["holdout", 0, "benign-habit", "Mau hidup mandiri, jadi aku belajar masak."],
  ["holdout", 0, "benign-habit", "Aku mau coba meditasi 5 menit pagi ini."],
  ["holdout", 0, "benign-habit", "Pengen banget tidur siang."],
  ["holdout", 0, "benign-idiom", "Kopi hari ini bikin aku deg-degan tapi fokus."],
  ["holdout", 0, "benign-idiom", "I'm gonna crush this exam."],
  ["holdout", 0, "benign-idiom", "My phone died so I couldn't log my check-in."],
  ["holdout", 0, "benign-idiom", "Laptopku mati total pas lagi ngerjain tugas."],
  ["holdout", 0, "benign-idiom", "Aku hampir mati kebosanan di kelas tadi."],
  ["holdout", 0, "benign-idiom", "Dia mati-matian bantuin aku revisi."],
  ["holdout", 0, "benign-idiom", "Lampu kamar mati jadi aku tidur lebih cepat."],
  ["holdout", 0, "benign-idiom", "I could kill for a good night's sleep."],
  ["holdout", 0, "benign-idiom", "The deadline is killing me this week."],
  ["holdout", 0, "benign-idiom", "I'm dead serious about waking up at 6."],
  ["holdout", 0, "benign-idiom", "Semalam tidurku nyenyak banget, kayak tidur selamanya."],
  ["holdout", 0, "benign-idiom", "Aku mau mati-matian mengejar target minggu ini."],
  ["holdout", 0, "benign-idiom", "Aku mau mati gaya nunggu antrean."],
  ["holdout", 0, "benign-coursework", "Presentasi tentang burnout dan manajemen stres jam 2."],
  ["holdout", 0, "benign-coursework", "Dosen minta kami baca jurnal tentang resiliensi."],
  ["holdout", 0, "benign-coursework", "Tugas akhirnya bikin pusing tapi seru."],
  ["holdout", 0, "benign-setback", "Aku sedih karena skip latihan, padahal kemarin lancar."],
  ["holdout", 0, "benign-setback", "Aku kesel sama diri sendiri soalnya lupa lagi."],
  ["holdout", 0, "benign-setback", "I feel like a failure when I break my routine."],
  ["holdout", 0, "benign-setback", "I stopped and started my habit again today, small win."],
  ["holdout", 0, "benign-setback", "Kadang aku merasa tidak berguna di tim, tapi aku tahu itu cuma perasaan sesaat."],
  ["holdout", 0, "benign-setback", "Aku merasa gagal total hari ini."],

  // ======================== HOLDOUT: label policy ========================
  ["holdout", "policy", "negated", "Aku sudah tidak berpikir untuk bunuh diri lagi sekarang."],
  ["holdout", "policy", "academic", "Psikolog bilang pikiran untuk menyakiti diri sendiri itu bisa dikelola."],
  ["holdout", "policy", "academic", "Artikel yang kubaca membahas suicidal ideation pada mahasiswa."],
  ["holdout", "policy", "third-person", "My sister said she wants to hurt herself."],
  ["holdout", "policy", "hyperbole", "Capek banget, pengen tidur terus dan nggak bangun-bangun."],
];

/** @type {{ id: string, split: 'dev'|'holdout', label: 1|0|'policy', category: string, text: string }[]} */
export const EVAL_SET = ROWS.map(([split, label, category, text], i) => ({
  id: `${split}-${String(i + 1).padStart(3, "0")}`,
  split,
  label,
  category,
  text,
}));

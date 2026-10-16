# 📋 Changelog & What's New — AutoBPMN

Dokumentasi komprehensif mengenai seluruh perbaikan, pembaruan fitur, dan perombakan arsitektur sistem AutoBPMN.

---

## 1. Multi-Provider LLM Fallback Engine (`backend/app/services/extractor.py`)

### Masalah Sebelumnya:
* Ketergantungan tunggal pada Google Gemini. Jika model tidak tersedia (`404 NOT_FOUND`), kuota habis (`429`), atau API key bermasalah (`400/401`), seluruh pipeline langsung gagal.
* Request ke Groq terblokir oleh Cloudflare dengan kode error `HTTP 403 (Error 1010)` karena Python `urllib` default tidak memiliki `User-Agent`.
* Model gratis OpenRouter sering tidak ditemukan (`HTTP 404`) akibat perubahan ketersediaan slug model gratis di OpenRouter.

### Solusi & Pembaruan:
1. **Fallback Chain 3 Lapis**:
   - **Google Gemini** (Utama) $\rightarrow$ **Groq** (Alternatif Inferensi Cepat) $\rightarrow$ **OpenRouter** (Fallback Ekstensif Multi-Model).
2. **Cloudflare Bypassing**:
   - Menambahkan header `User-Agent: AutoBPMN/1.0 (Windows NT 10.0; Win64; x64)` pada semua koneksi HTTP client agar diterima secara sah oleh Cloudflare di endpoint Groq.
3. **Dynamic Active Model Discovery**:
   - `_get_groq_models(api_key)`: Mengambil daftar model aktif secara langsung (*live*) dari endpoint API Groq, mencegah kegagalan akibat model usang/didepresiasi (`mixtral-8x7b`, `gemma2-9b-it`).
   - `_get_openrouter_free_models(api_key)`: Mengambil daftar model gratis berakhiran `:free` secara dinamis dari OpenRouter API.
4. **Resilient `.env` Auto-Loader**:
   - Menambahkan fungsi `_load_env_file()` yang otomatis mendeteksi file `.env` di root/parent direktori dan mendukung berbagai format: `KEY=VAL`, `export KEY=VAL`, maupun PowerShell `$env:KEY="VAL"`.

---

## 2. Perombakan Total Mesin Layout BPMN 2.0 (`backend/app/services/bpmn_synthesizer.py`)

### Masalah Sebelumnya:
* **Snake/Winding Layout**: Alur melipat balik ke kiri secara zig-zag sehingga panah berbalik arah dan menabrak node lain.
* **Tumpang Tindih Elemen (Collision)**: Node cabang gateway bertumpuk di koordinat X yang sama dengan jarak vertikal yang terlalu sempit.
* **Garis Diagonal Miring**: Konektor alur memotong kanvas secara miring (non-standar BPMN).
* **Feedback Loop Menghancurkan Rank**: Alur revisi mundur dihitung sebagai alur maju biasa, menyebabkan celah kosong (*gap*) raksasa di antara node.
* **Label Teks Bertabrakan**: Tag `<bpmndi:BPMNLabel>` buatan menimpa gateway dan konektor. Teks nama task kepanjangan meluber keluar batas kotak.

### Solusi & Pembaruan:
1. **Algoritma Topological DAG (Sugiyama Layered Flow)**:
   - Alur mengalir secara teratur dan berstandar internasional dari **Kiri ke Kanan** (*Left-to-Right*).
   - Menyelaraskan *geometric center* dari seluruh tipe elemen (Events $36\times36$, Gateway $50\times50$, Tasks $150\times80$) agar garis konektor horizontal lurus 180° sempurna.
2. **DFS Cycle Detection (Feedback Loop Isolator)**:
   - Mendeteksi *back-edges* (alur revisi ke langkah sebelumnya) menggunakan algoritma DFS 3-color.
   - Siklus revisi diisolasi saat perhitungan rank, melenyapkan semua celah kosong raksasa.
   - Garis revisi mundur dialirkan secara elegan lewat *clearance track* di atas diagram tanpa menabrak node manapun.
3. **Collision-Free Track Allocation**:
   - Percabangan gateway (*happy path* vs alternatif/penolakan) otomatis dialirkan ke track vertikal terpisah ($+160\text{ px}$) sehingga elemen cabang tidak akan pernah bertubrukan.
4. **Orthogonal Manhattan Rectilinear Routing**:
   - Seluruh konektor dibentuk dengan sudut siku-siku 90° yang tegas dan presisi (keluar dari sisi bawah/atas gateway dan masuk ke sisi kiri target).
5. **Deduplikasi Label & Tipografi Proporsional**:
   - Kotak task diperlebar menjadi $150\times80\text{ px}$.
   - Repetisi nama aktor otomatis dibersihkan (misal: `[Manager]\nManager meninjau...` $\rightarrow$ `Meninjau Urgensi\n(Manager)`).
   - Menyerahkan perataan teks kondisi aliran langsung kepada engine rendering `bpmn-js` untuk menghindari tabrakan teks.

---

## 3. Graceful Pipeline Error Handling (`backend/app/api/v1/pipeline.py`)

### Masalah Sebelumnya:
* Validasi graf langsung memicu `HTTP 422 Unprocessable Entity` saat terdeteksi anomali logika minor (seperti orphan nodes atau deadlocks), sehingga diagram tidak dapat dirender dan UI menampilkan layar error merah.

### Solusi & Pembaruan:
* Sistem kini **tetap menyintesis BPMN 2.0 XML** meskipun terdapat catatan validasi.
* Frontend dapat menampilkan diagram alur sekaligus kartu laporan validasi logika (*ValidationBadge*) secara berdampingan sehingga pengguna dapat memeriksa anomali alur secara visual.

---

## 4. Rebuild Desain UI Frontend Modern (`frontend/src/`)

### Masalah Sebelumnya:
* Tampilan visual bawaan terlihat kaku, tidak responsif, dan ketergantungan utility CSS yang rentan rusak.

### Solusi & Pembaruan:
1. **Design System Vanilla CSS Murni (`frontend/src/index.css`)**:
   - Tipografi modern menggunakan Google Fonts **Inter** dan **JetBrains Mono**.
   - Palet warna Slate & Indigo berstandar aplikasi enterprise profesional.
   - Kanvas dengan latar belakang *dot-grid* 20px, rounded corners (`rx: 10px`), soft drop shadows, dan hover glows.
2. **Interaktivitas Kanvas BPMN (`frontend/src/components/BpmnViewer.jsx`)**:
   - Toolbar kanvas: Zoom In, Zoom Out, Fit Viewport.
   - Tombol ekspor 1-klik ke format `.bpmn` (XML) dan `.svg` (vektor resolusi tinggi).
   - Legenda warna status proses (Start, Task, Service, Decision, End).
3. **Panel Input Fleksibel (`frontend/src/components/SopUploader.jsx`)**:
   - Tab switcher antara input teks narasi dan unggah berkas (PDF / TXT).
   - Tombol preset **"Contoh"** untuk pengujian langsung tanpa mengetik manual.

---

## 5. Dokumentasi & Otomasi Operasional

1. **`START_AUTOBPMN.bat`**: File batch otomatis 1-klik untuk pengguna non-teknis (menjalankan backend, frontend, dan membuka browser secara otomatis).
2. **`SETUP_GUIDE.md`**: Panduan langkah demi langkah yang ramah pemula dan langsung ke inti permasalahan.
3. **`.gitignore`**: Konfigurasi komprehensif untuk mencegah kebocoran file `.env` (API Keys), folder `node_modules`, `venv`, dan cache sementara.

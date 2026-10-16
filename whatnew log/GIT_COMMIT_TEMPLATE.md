# Rekomendasi Pesan Commit Git (GitHub)

Gunakan salah satu format berikut untuk commit perubahan ini ke repository GitHub Anda.

---

## Opsi 1: Rekomendasi Format Standar / Conventional Commits (Disarankan)

### Commit Title:
```text
feat: implement multi-provider LLM fallback and enterprise BPMN layout engine
```

### Commit Description:
```markdown
- Add multi-provider fallback pipeline (Gemini -> Groq -> OpenRouter) with live model discovery
- Fix Cloudflare 1010 blocking on Groq API by injecting custom User-Agent
- Rewrite BPMN synthesizer with Sugiyama layered DAG layout (Left-to-Right)
- Implement DFS cycle detection to route revision feedback loops on dedicated clearance tracks
- Add orthogonal Manhattan rectilinear routing and eliminate diagonal connectors
- Rebuild frontend UI using modern Vanilla CSS design system with BPMN export (.bpmn/.svg)
- Allow graceful diagram rendering alongside validation reports on graph warnings
- Add comprehensive .gitignore, 1-click START_AUTOBPMN.bat starter, and complete SETUP_GUIDE.md
```

---

## Opsi 2: Format Ringkas / Bahasa Indonesia

### Commit Title:
```text
feat: pembaruan sistem multi-provider LLM, perbaikan layout BPMN 2.0, dan UI modern
```

### Commit Description:
```markdown
- Menambahkan fallback LLM otomatis: Google Gemini -> Groq -> OpenRouter
- Memperbaiki layout BPMN menjadi Left-to-Right berstandar industri dengan routing siku-siku 90 derajat
- Memperbaiki alur revisi/mundur agar tidak merusak rank dan tidak menabrak node lain
- Merombak UI frontend dengan Vanilla CSS, export SVG/BPMN, dan toolbar navigasi
- Menambahkan file starter 1-klik START_AUTOBPMN.bat, .gitignore lengkap, dan dokumentasi setup
```

---

## Perintah Git yang Siap Dijalankan di Terminal:

```powershell
git add .
git commit -m "feat: implement multi-provider LLM fallback and enterprise BPMN layout engine" -m "- Add multi-provider fallback pipeline (Gemini -> Groq -> OpenRouter) with live model discovery`n- Fix Cloudflare 1010 blocking on Groq API by injecting custom User-Agent`n- Rewrite BPMN synthesizer with Sugiyama layered DAG layout (Left-to-Right)`n- Implement DFS cycle detection to route revision feedback loops on dedicated clearance tracks`n- Add orthogonal Manhattan rectilinear routing and eliminate diagonal connectors`n- Rebuild frontend UI using modern Vanilla CSS design system with BPMN export (.bpmn/.svg)`n- Allow graceful diagram rendering alongside validation reports on graph warnings`n- Add comprehensive .gitignore, 1-click START_AUTOBPMN.bat starter, and complete SETUP_GUIDE.md"
git push origin main
```

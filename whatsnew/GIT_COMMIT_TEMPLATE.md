# Rekomendasi Pesan Git Commit (GitHub)

Gunakan salah satu format berikut untuk melakukan commit perubahan ke repositori GitHub.

---

## Commit: Release v1.1.0 (Async Event-Loop Offloading & Provider Optimization)

### Judul Commit (Title):
```text
fix: resolve async event loop freezing and optimize LLM provider failover
```

### Deskripsi Commit (Description):
```markdown
- Offload synchronous LLM extraction to worker thread via asyncio.to_thread in pipeline route
- Prevent event loop starvation causing FastAPI and frontend extraction button freeze
- Add smart provider ordering: immediately prioritize Groq and OpenRouter when Gemini API key is non-standard
- Add fail-fast validation for Gemini API keys (requiring AIzaSy prefix)
- Reduce per-model HTTP timeout to 25s with max 5 candidate models to ensure fast responsiveness
- Clean up unused frontend dependencies (@heroui/react, @tailwindcss/vite, framer-motion)
- Standardize documentation in whatsnew/ directory (v1.0.0.md, v1.1.0.md, CHANGELOG.md)
```

---

## Perintah Git untuk Terminal PowerShell:

```powershell
git add .
git commit -m "fix: resolve async event loop freezing and optimize LLM provider failover" -m "- Offload synchronous LLM extraction to worker thread via asyncio.to_thread in pipeline route`n- Prevent event loop starvation causing FastAPI and frontend extraction button freeze`n- Add smart provider ordering: immediately prioritize Groq and OpenRouter when Gemini API key is non-standard`n- Add fail-fast validation for Gemini API keys (requiring AIzaSy prefix)`n- Reduce per-model HTTP timeout to 25s with max 5 candidate models to ensure fast responsiveness`n- Clean up unused frontend dependencies (@heroui/react, @tailwindcss/vite, framer-motion)`n- Standardize documentation in whatsnew/ directory (v1.0.0.md, v1.1.0.md, CHANGELOG.md)"
git push origin rebuild
```

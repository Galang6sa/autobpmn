"""
AutoBPMN Multi-Provider LLM Extractor
Arsitektur fallback: Gemini -> Groq -> OpenRouter
"""
import os
import json
import logging
import urllib.request
import urllib.error
from typing import List, Optional, Dict, Any
from app.schemas.process_graph import AutoBPMNGraph

logger = logging.getLogger("autobpmn.extractor")

# ---------- System Prompt (shared across providers) ----------
SYSTEM_INSTRUCTION = """Anda adalah AI Workflow & BPMN Specialist untuk sistem AutoBPMN.
Tugas: baca dokumen teks narasi SOP lalu ubah menjadi Directed Acyclic Graph (DAG) berformat JSON standar BPMN 2.0.

Aturan ketat penamaan & struktur:
1. Wajib dimulai minimal satu startEvent, setiap cabang keputusan bermuara ke endEvent.
2. Tugas manusia = userTask, automasi/sistem = serviceTask.
3. Setiap percabangan keputusan = exclusiveGateway. Edge keluar dari gateway WAJIB memiliki atribut "condition" yang jelas (misal: "Disetujui", "Ditolak").
4. Tidak boleh ada dangling node. Semua ID di edges harus eksis di daftar nodes.
5. Gunakan format ID ringkas: start_1, task_1, gw_1, end_1, dst.
6. Atribut "actor": tulis peran atau divisi pelaksana secara ringkas (contoh: "Pemohon", "Manager Divisi", "Vendor").
7. Atribut "name": WAJIB berupa frasa tindakan ringkas (maksimal 3-6 kata, format: Kata Kerja + Objek, contoh: "Isi Formulir Pengadaan", "Tinjau Urgensi & Anggaran", "Kirim Barang Pesanan"). JANGAN menyalin seluruh paragraf narasi dan JANGAN mengulang nama aktor di dalam atribut "name".

Output HARUS berupa JSON valid sesuai skema berikut:
{
  "process_id": "string (snake_case)",
  "process_name": "string",
  "actors": ["string"],
  "nodes": [{"id":"string","type":"startEvent|userTask|serviceTask|exclusiveGateway|parallelGateway|endEvent","name":"string","actor":"string"}],
  "edges": [{"from_node":"string","to_node":"string","condition":"string|null"}]
}"""

_CACHED_PROVIDER: Optional[str] = None
_CACHED_MODEL: Optional[str] = None

# ---------- Provider: Gemini ----------
def _call_gemini(sop_text: str, api_key: str) -> AutoBPMNGraph:
    from google import genai
    from google.genai import types

    PREFERRED = [
        "gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.0-flash",
        "gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-pro-latest",
    ]
    EXCLUDED_KW = ["tts", "audio", "image", "imagen", "embed", "aqa", "vision", "realtime", "robotics"]

    def is_text_model(name: str) -> bool:
        lower = name.lower()
        return not any(kw in lower for kw in EXCLUDED_KW)

    client = genai.Client(api_key=api_key)

    # Discover live models
    candidates = list(PREFERRED)
    try:
        for m in client.models.list():
            clean = (m.name or "").replace("models/", "")
            if is_text_model(clean) and clean not in candidates:
                candidates.append(clean)
    except Exception:
        pass

    last_err = None
    for model in candidates:
        if not is_text_model(model):
            continue
        try:
            resp = client.models.generate_content(
                model=model,
                contents=f"Ekstrak SOP berikut ke skema graf AutoBPMN:\n\n{sop_text}",
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=AutoBPMNGraph,
                    temperature=0.1,
                ),
            )
            return AutoBPMNGraph.model_validate_json(resp.text)
        except Exception as e:
            last_err = e
            if "API_KEY_INVALID" in str(e) or "401" in str(e):
                raise
            continue

    raise RuntimeError(f"Gemini: semua model gagal. Terakhir: {last_err}")


# ---------- Provider: OpenAI-compatible (Groq / OpenRouter) ----------
def _call_openai_compatible(
    sop_text: str,
    api_key: str,
    base_url: str,
    models: List[str],
    provider_name: str,
    extra_headers: Optional[Dict[str, str]] = None,
) -> AutoBPMNGraph:
    user_prompt = f"Ekstrak SOP berikut ke skema graf AutoBPMN (output JSON only):\n\n{sop_text}"

    last_err = None
    for model in models:
        try:
            payload = json.dumps({
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_INSTRUCTION},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
            }).encode("utf-8")

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "User-Agent": "AutoBPMN/1.0 (Windows NT 10.0; Win64; x64)",
            }
            if extra_headers:
                headers.update(extra_headers)

            req = urllib.request.Request(
                f"{base_url}/chat/completions",
                data=payload,
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                body = json.loads(resp.read().decode("utf-8"))

            content = body["choices"][0]["message"]["content"]
            # Bersihkan jika ada markdown fencing
            content = content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[1] if "\n" in content else content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            return AutoBPMNGraph.model_validate_json(content)

        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace") if e.fp else str(e)
            logger.warning(f"{provider_name} model {model} gagal ({e.code}): {err_body[:200]}")
            last_err = Exception(f"{provider_name} {model}: HTTP {e.code}")
            continue
        except Exception as e:
            logger.warning(f"{provider_name} model {model} gagal: {e}")
            last_err = e
            continue

    raise RuntimeError(f"{provider_name}: semua model gagal. Terakhir: {last_err}")


def _get_groq_models(api_key: str) -> List[str]:
    """Mengambil daftar model aktif secara dinamis dari Groq API."""
    fallback_models = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "llama3-70b-8192",
        "llama3-8b-8192",
        "deepseek-r1-distill-llama-70b",
        "qwen-2.5-32b",
    ]
    try:
        req = urllib.request.Request(
            "https://api.groq.com/openai/v1/models",
            headers={
                "Authorization": f"Bearer {api_key}",
                "User-Agent": "AutoBPMN/1.0 (Windows NT 10.0; Win64; x64)",
            },
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        discovered = []
        for m in data.get("data", []):
            mid = m.get("id", "")
            if any(bad in mid.lower() for bad in ["whisper", "guard", "distil-whisper", "embed"]):
                continue
            discovered.append(mid)

        if discovered:
            preferred = [
                m for m in discovered
                if any(k in m.lower() for k in ["llama", "qwen", "deepseek", "gemma"])
            ]
            return preferred + [m for m in discovered if m not in preferred]
    except Exception as e:
        logger.warning(f"Gagal mendeteksi model Groq secara live: {e}")

    return fallback_models


def _call_groq(sop_text: str, api_key: str) -> AutoBPMNGraph:
    models = _get_groq_models(api_key)
    return _call_openai_compatible(
        sop_text=sop_text,
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
        models=models,
        provider_name="Groq",
    )


def _get_openrouter_free_models(api_key: str) -> List[str]:
    """Mengambil daftar model free-tier aktif secara dinamis dari OpenRouter API."""
    fallback_models = [
        "meta-llama/llama-3.2-3b-instruct:free",
        "meta-llama/llama-3.2-1b-instruct:free",
        "meta-llama/llama-3.1-8b-instruct:free",
        "deepseek/deepseek-r1:free",
        "google/gemini-2.0-flash-thinking-exp:free",
        "mistralai/mistral-small-24b-instruct-2501:free",
    ]
    try:
        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/models",
            headers={
                "Authorization": f"Bearer {api_key}",
                "User-Agent": "AutoBPMN/1.0 (Windows NT 10.0; Win64; x64)",
            },
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        discovered = []
        for m in data.get("data", []):
            mid = m.get("id", "")
            if ":free" in mid:
                discovered.append(mid)

        if discovered:
            # Prioritaskan model yang cocok untuk structured output
            preferred = [
                m for m in discovered
                if any(k in m.lower() for k in ["llama", "gemini", "qwen", "mistral", "deepseek"])
            ]
            return preferred + [m for m in discovered if m not in preferred]
    except Exception as e:
        logger.warning(f"Gagal mendeteksi model OpenRouter secara live: {e}")

    return fallback_models


def _call_openrouter(sop_text: str, api_key: str) -> AutoBPMNGraph:
    models = _get_openrouter_free_models(api_key)
    return _call_openai_compatible(
        sop_text=sop_text,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        models=models,
        provider_name="OpenRouter",
        extra_headers={
            "HTTP-Referer": "https://autobpmn.org",
            "X-Title": "AutoBPMN",
        },
    )


def _load_env_file():
    """Membaca berkas .env dari root atau working directory jika ada."""
    search_dirs = [
        os.getcwd(),
        os.path.dirname(os.path.abspath(__file__)),
        os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..")),
        os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")),
    ]
    for d in search_dirs:
        env_path = os.path.join(d, ".env")
        if os.path.isfile(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for raw_line in f:
                        line = raw_line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if line.startswith("export "):
                            line = line[7:].strip()
                        elif line.startswith("$env:"):
                            line = line[5:].strip()

                        if "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k and v and k not in os.environ:
                                os.environ[k] = v
                break
            except Exception as e:
                logger.warning(f"Gagal membaca .env di {env_path}: {e}")

_load_env_file()


# ---------- Unified entry point ----------
def extract_sop_to_graph(sop_text: str) -> AutoBPMNGraph:
    """
    Pipeline multi-provider: Gemini -> Groq -> OpenRouter.
    Aktifkan provider dengan menyetel env variable API key masing-masing:
      GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY
    """
    global _CACHED_PROVIDER, _CACHED_MODEL

    _load_env_file()

    providers = []

    gemini_key = os.environ.get("GEMINI_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")

    # Susun urutan provider: cached dulu, lalu sisanya
    all_providers = []
    if gemini_key:
        all_providers.append(("gemini", gemini_key, _call_gemini))
    if groq_key:
        all_providers.append(("groq", groq_key, _call_groq))
    if openrouter_key:
        all_providers.append(("openrouter", openrouter_key, _call_openrouter))

    if not all_providers:
        raise ValueError(
            "Tidak ada API key yang disetel. "
            "Setel minimal satu di .env: GEMINI_API_KEY, GROQ_API_KEY, atau OPENROUTER_API_KEY"
        )

    # Prioritaskan cached provider yang sudah terbukti berhasil
    if _CACHED_PROVIDER:
        cached = [p for p in all_providers if p[0] == _CACHED_PROVIDER]
        others = [p for p in all_providers if p[0] != _CACHED_PROVIDER]
        providers = cached + others
    else:
        providers = all_providers

    last_error = None
    for name, key, call_fn in providers:
        try:
            logger.info(f"Mencoba provider: {name}")
            result = call_fn(sop_text, key)
            _CACHED_PROVIDER = name
            logger.info(f"Berhasil menggunakan provider: {name}")
            return result
        except Exception as e:
            logger.warning(f"Provider {name} gagal: {e}")
            last_error = e
            continue

    tried = ", ".join(p[0] for p in providers)
    raise RuntimeError(
        f"Seluruh provider LLM ({tried}) gagal. Error terakhir: {last_error}"
    )

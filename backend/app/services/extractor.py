import os
from google import genai
from google.genai import types
from app.schemas.process_graph import AutoBPMNGraph

SYSTEM_INSTRUCTION = """
Anda adalah AI Workflow & BPMN Specialist untuk sistem AutoBPMN.
Tugas Anda adalah membaca dokumen teks narasi SOP dan mengubahnya secara presisi menjadi representasi Directed Acyclic Graph (DAG) berbasis skema JSON.

Panduan Pemetaan:
1. Alur & Terminasi:
   - Wajib dimulai dengan minimal satu `startEvent`.
   - Setiap cabang alur kerja wajib bermuara pada `endEvent`.
2. Tugas & Aktivitas:
   - Tugas manual/manusia dipetakan ke `userTask`.
   - Tugas automasi sistem dipetakan ke `serviceTask`.
   - Tetapkan atribut 'actor' secara konsisten pada setiap node.
3. Percabangan:
   - Setiap titik pengambilan keputusan atau validasi kondisi wajib menggunakan `exclusiveGateway`.
   - Setiap edge keluar dari `exclusiveGateway` wajib memiliki atribut 'condition' (misal: "Disetujui", "Ditolak").
4. Integritas:
   - Hindari dangling node (node tanpa koneksi masuk/keluar yang semestinya).
   - Pastikan setiap ID di 'edges.from_node' dan 'edges.to_node' eksis di daftar 'nodes'.
"""

def extract_sop_to_graph(sop_text: str) -> AutoBPMNGraph:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Environment variable GEMINI_API_KEY belum disetel.")

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"Ekstrak SOP berikut ke dalam format skema graf AutoBPMN:\n\n{sop_text}",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            response_schema=AutoBPMNGraph,
            temperature=0.1
        ),
    )

    return AutoBPMNGraph.model_validate_json(response.text)
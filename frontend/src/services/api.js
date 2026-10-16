// frontend/src/services/api.js

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Helper untuk memproses respons fetch dan parsing error detail dari FastAPI.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'Terjadi kesalahan pada server.';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Gunakan status text jika response bukan format JSON
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail);
  }
  return response.json();
}

/**
 * Mengirimkan teks mentah SOP ke pipeline backend.
 * @param {string} textContent - Teks narasi SOP
 * @param {string} title - Judul dokumen (opsional)
 * @returns {Promise<Object>} PipelineResponse (intermediate_graph, validation, bpmn_xml)
 */
export async function processSopText(textContent, title = 'Dokumen SOP') {
  const response = await fetch(`${BASE_URL}/pipeline/process-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      title,
      text_content: textContent,
    }),
  });

  return handleResponse(response);
}

/**
 * Mengunggah berkas dokumen SOP (.pdf atau .txt) dalam format multipart/form-data.
 * @param {File} file - Objek file dari input form / drag-and-drop
 * @returns {Promise<Object>} PipelineResponse
 */
export async function processSopFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/pipeline/process-file`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      // Browser otomatis menyetel 'Content-Type': 'multipart/form-data' beserta boundary-nya
    },
    body: formData,
  });

  return handleResponse(response);
}

/**
 * Memeriksa status kesehatan server backend FastAPI.
 */
export async function checkServerHealth() {
  const rootUrl = BASE_URL.replace('/api/v1', '');
  const response = await fetch(`${rootUrl}/health`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  return handleResponse(response);
}
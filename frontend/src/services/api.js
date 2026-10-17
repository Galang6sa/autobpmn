// frontend/src/services/api.js

import { runDemoPipeline } from './demoPipeline';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Mendeteksi apakah saat ini berada di mode Real Simulation (URL /demo)
 * atau Simulation Mode / Prototype (Root URL /).
 */
export function isRealApiMode() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/demo' ||
    path.startsWith('/demo/') ||
    search.includes('mode=demo') ||
    search.includes('mode=real') ||
    hash.includes('demo')
  );
}

/**
 * Helper penanganan response dari FastAPI backend.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'Terjadi kesalahan pada server backend.';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail);
  }
  return response.json();
}

/**
 * Mengirimkan teks SOP.
 * - Jika isReal true (/demo): panggil backend API FastAPI sesungguhnya.
 * - Jika isReal false (/): simulasikan secara lokal seolah API mengirimkan JSON (prototype).
 */
export async function processSopText(textContent, title = 'Dokumen SOP', forceReal = null) {
  const useReal = forceReal !== null ? forceReal : isRealApiMode();

  if (!useReal) {
    // Mode Prototype: simulasi lokal mock JSON
    return runDemoPipeline();
  }

  // Mode Real Simulation: panggil backend API sesungguhnya
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
 * Mengunggah berkas SOP (.pdf atau .txt).
 * - Jika isReal true (/demo): unggah berkas multipart ke backend FastAPI.
 * - Jika isReal false (/): simulasi lokal fixture (prototype).
 */
export async function processSopFile(file, forceReal = null) {
  const useReal = forceReal !== null ? forceReal : isRealApiMode();

  if (!useReal) {
    return runDemoPipeline();
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/pipeline/process-file`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  });

  return handleResponse(response);
}

/**
 * Memeriksa status kesehatan server backend.
 */
export async function checkServerHealth() {
  if (!isRealApiMode()) {
    return { status: 'simulation', service: 'AutoBPMN Local Prototype (Simulation Only)' };
  }

  const rootUrl = BASE_URL.replace('/api/v1', '');
  const response = await fetch(`${rootUrl}/health`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  return handleResponse(response);
}

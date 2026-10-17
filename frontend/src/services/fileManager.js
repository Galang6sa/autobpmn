/**
 * AutoBPMN File Management & Multi-tab Storage Service
 */

import { makeBpmnXml } from './demoPipeline';
import { syncXmlToGraph, validateGraphLocally } from './graphModel';

const STORAGE_KEY = 'autobpmn_tabs_v2';
const ACTIVE_TAB_KEY = 'autobpmn_active_tab_v2';

/**
 * Buat diagram kosong baru (Blank Starter Diagram)
 */
export function createBlankProcess(index = 1) {
  const processId = `process_new_${Date.now()}`;
  const processName = `Proses Baru ${index}`;
  const graph = {
    process_id: processId,
    process_name: processName,
    actors: ['Pemohon'],
    nodes: [
      { id: 'start_1', type: 'startEvent', name: 'Mulai', actor: 'Pemohon' },
      { id: 'task_1', type: 'userTask', name: 'Aktivitas Utama', actor: 'Pemohon' },
      { id: 'end_1', type: 'endEvent', name: 'Selesai', actor: 'Pemohon' },
    ],
    edges: [
      { from_node: 'start_1', to_node: 'task_1', condition: null },
      { from_node: 'task_1', to_node: 'end_1', condition: null },
    ],
  };

  const xml = makeBpmnXml(graph);
  return {
    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: `Untitled-${index}.bpmn`,
    processName,
    intermediateGraph: graph,
    validation: { is_valid: true, issues: [], deadlocks: [], orphan_nodes: [] },
    bpmnXml: xml,
    sopText: '',
    isDirty: false,
  };
}

/**
 * Buat berkas baru dari hasil sintesis SOP
 */
export function createFileFromSynthesis(result, rawSopText = '') {
  const cleanName = (result.process_name || 'Alur_Proses').replace(/\s+/g, '_') + '.bpmn';
  return {
    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    processName: result.process_name || 'Alur Proses Bisnis',
    intermediateGraph: result.intermediate_graph,
    validation: result.validation || { is_valid: true, issues: [] },
    bpmnXml: result.bpmn_xml,
    sopText: rawSopText,
    isDirty: false,
  };
}

/**
 * Parse berkas yang diimpor (.bpmn, .xml, .json)
 */
export async function parseImportedFile(file) {
  const text = await file.text();
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.json')) {
    let parsedJson = null;
    try {
      parsedJson = JSON.parse(text);
    } catch (e) {
      throw new Error(`Format berkas JSON tidak valid: ${e.message}`);
    }

    // Mendukung baik format direct graph maupun full payload
    const graph = parsedJson.intermediate_graph || parsedJson;
    if (!graph.nodes || !Array.isArray(graph.nodes)) {
      throw new Error('Berkas JSON tidak memiliki struktur node BPMN yang dikenali.');
    }

    const xml = makeBpmnXml(graph);
    const val = validateGraphLocally(graph);

    return {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: file.name,
      processName: graph.process_name || file.name.replace(/\.[^/.]+$/, ''),
      intermediateGraph: graph,
      validation: val,
      bpmnXml: xml,
      sopText: '',
      isDirty: false,
    };
  }

  // Berkas .bpmn atau .xml
  const graph = syncXmlToGraph(text);
  const val = validateGraphLocally(graph);

  return {
    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: file.name,
    processName: graph?.process_name || file.name.replace(/\.[^/.]+$/, ''),
    intermediateGraph: graph,
    validation: val,
    bpmnXml: text,
    sopText: '',
    isDirty: false,
  };
}

/**
 * Unduh konten sebagai berkas lokal
 */
export function triggerFileDownload(content, mimeType, filename) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Muat riwayat tabs dari LocalStorage
 */
export function loadPersistedFiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.warn('Gagal memuat persisted files:', e);
  }
  return null;
}

/**
 * Simpan daftar berkas ke LocalStorage
 */
export function persistFiles(files, activeFileId) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    if (activeFileId) {
      localStorage.setItem(ACTIVE_TAB_KEY, activeFileId);
    }
  } catch (e) {
    console.warn('Gagal menyimpan persisted files:', e);
  }
}

export function loadPersistedActiveTabId() {
  try {
    return localStorage.getItem(ACTIVE_TAB_KEY) || null;
  } catch (e) {
    return null;
  }
}

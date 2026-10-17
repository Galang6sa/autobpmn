import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BpmnViewer from './components/BpmnViewer';
import SopUploader from './components/SopUploader';
import ValidationBadge from './components/ValidationBadge';
import Keycap from './components/Keycap';
import AiCopilotPanel from './components/AiCopilotPanel';
import CommandPalette from './components/CommandPalette';
import FileTabBar from './components/FileTabBar';
import {
  isRealApiMode,
  processSopText,
  processSopFile,
} from './services/api';
import {
  createBlankProcess,
  createFileFromSynthesis,
  parseImportedFile,
  triggerFileDownload,
  loadPersistedFiles,
  persistFiles,
  loadPersistedActiveTabId,
} from './services/fileManager';
import {
  PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen,
  Search, ShieldCheck, Undo2, Redo2,
  FolderOpen, Plus
} from 'lucide-react';

const SAMPLE_SOP = `SOP Pengadaan Perlengkapan Kantor
1. Pemohon mengisi formulir permohonan pengadaan barang.
2. Manager Divisi meninjau urgensi kebutuhan dan ketersediaan anggaran.
3. Jika ditolak, formulir dikembalikan ke Pemohon beserta catatan revisi.
4. Jika disetujui, Bagian Pengadaan mencari vendor dan membandingkan harga.
5. Vendor terpilih mengirimkan barang pesanan ke kantor.
6. Pemohon menerima barang dan menandatangani berita acara penerimaan.`;

export default function App() {
  const [isRealMode, setIsRealMode] = useState(() => isRealApiMode());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);

  // ── Multi-Tab File Management State ──
  const [files, setFiles] = useState(() => {
    const saved = loadPersistedFiles();
    if (saved && Array.isArray(saved)) return saved;
    return [];
  });

  const [activeFileId, setActiveFileId] = useState(() => {
    const savedActive = loadPersistedActiveTabId();
    const savedFiles = loadPersistedFiles();
    if (savedActive && savedFiles?.some((f) => f.id === savedActive)) {
      return savedActive;
    }
    return savedFiles?.[0]?.id || '';
  });

  // Ensure activeFile matches activeFileId or null if no files
  const activeFile = useMemo(() => {
    if (!files || files.length === 0) return null;
    return files.find((f) => f.id === activeFileId) || files[0] || null;
  }, [files, activeFileId]);

  // Persist files whenever they change (can be empty array)
  useEffect(() => {
    persistFiles(files, activeFileId);
  }, [files, activeFileId]);

  // Citation highlight state (from AI Copilot → SopUploader)
  const [highlightedCitation, setHighlightedCitation] = useState(null);

  // Overdrive: Canvas node pulse highlight & Walkthrough & Command Palette
  const [highlightedCanvasNodeId, setHighlightedCanvasNodeId] = useState(null);
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [copilotExternalPrompt, setCopilotExternalPrompt] = useState(null);

  // Panel visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(true);

  // ── Tab Management Actions ──
  const handleSelectTab = useCallback((fileId) => {
    setActiveFileId(fileId);
    setSelectedElement(null);
    setErrorMessage(null);
  }, []);

  const handleNewTab = useCallback(() => {
    const nextIndex = files.length + 1;
    const newFile = createBlankProcess(nextIndex);
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setSelectedElement(null);
    setErrorMessage(null);
  }, [files.length]);

  const handleCloseTab = useCallback(
    (fileIdToClose) => {
      const fileToClose = files.find((f) => f.id === fileIdToClose);
      if (fileToClose?.isDirty) {
        const confirmClose = window.confirm(
          `Berkas "${fileToClose.name}" memiliki perubahan yang belum disimpan. Yakin ingin menutup?`
        );
        if (!confirmClose) return;
      }

      const closedIndex = files.findIndex((f) => f.id === fileIdToClose);
      const remainingFiles = files.filter((f) => f.id !== fileIdToClose);
      setFiles(remainingFiles);

      if (remainingFiles.length === 0) {
        setActiveFileId('');
        setSelectedElement(null);
        return;
      }

      if (activeFileId === fileIdToClose) {
        const nextActiveIndex = Math.max(0, closedIndex - 1);
        setActiveFileId(remainingFiles[nextActiveIndex]?.id || remainingFiles[0]?.id || '');
      }
    },
    [files, activeFileId]
  );

  const handleRenameTab = useCallback((tabId, newName) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === tabId
          ? {
              ...f,
              name: newName,
              processName: newName.replace(/\.[^/.]+$/, ''),
            }
          : f
      )
    );
  }, []);

  const handleImportFile = useCallback(async (fileObj) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const imported = await parseImportedFile(fileObj);
      setFiles((prev) => [...prev, imported]);
      setActiveFileId(imported.id);
      setSelectedElement(null);
    } catch (err) {
      console.error('Import file error:', err);
      setErrorMessage(err.message || 'Gagal mengimpor berkas diagram.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExport = useCallback(
    (format) => {
      if (!activeFile) return;

      const baseName = (activeFile.name || 'process').replace(/\.[^/.]+$/, '');

      if (format === 'bpmn') {
        const filename = `${baseName}.bpmn`;
        triggerFileDownload(activeFile.bpmnXml || '', 'application/xml', filename);
        // Mark tab as clean after save/export
        setFiles((prev) =>
          prev.map((f) => (f.id === activeFile.id ? { ...f, isDirty: false } : f))
        );
      } else if (format === 'json') {
        const filename = `${baseName}.json`;
        const jsonContent = JSON.stringify(activeFile.intermediateGraph || {}, null, 2);
        triggerFileDownload(jsonContent, 'application/json', filename);
        setFiles((prev) =>
          prev.map((f) => (f.id === activeFile.id ? { ...f, isDirty: false } : f))
        );
      } else if (format === 'svg') {
        window.dispatchEvent(new CustomEvent('autobpmn-export', { detail: { format: 'svg' } }));
      }
    },
    [activeFile]
  );

  // Visual Editor Save Callback (Updates the active tab & marks as dirty)
  const handleVisualGraphUpdate = useCallback(
    ({ graph, bpmnXml: newXml, validation: newVal }) => {
      if (!activeFile) return;

      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile.id
            ? {
                ...f,
                intermediateGraph: graph,
                bpmnXml: newXml,
                validation: newVal,
                processName: graph.process_name || f.processName,
                isDirty: true,
              }
            : f
        )
      );
      setErrorMessage(null);
    },
    [activeFile]
  );

  // Global keyboard shortcuts (VS Code tab style)
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        setSelectedElement(null);
        return;
      }

      // Open Command Palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
        return;
      }

      // Close Active Tab: Ctrl+W or Cmd+W (when not typing in text)
      const tag = document.activeElement?.tagName?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'W') && !e.shiftKey) {
        if (tag !== 'input' && tag !== 'textarea' && activeFileId) {
          e.preventDefault();
          handleCloseTab(activeFileId);
          return;
        }
      }

      // Quick Save / Export BPMN: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleExport('bpmn');
        return;
      }

      if (tag === 'input' || tag === 'textarea') return;

      // Toggle left sidebar: '['
      if (e.key === '[' || e.code === 'BracketLeft') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      // Toggle right detail panel: ']'
      else if (e.key === ']' || e.code === 'BracketRight') {
        e.preventDefault();
        setDetailOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts, true);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts, true);
  }, [activeFileId, handleCloseTab, handleExport]);

  // Monitor URL changes (browser back/forward & pushState)
  useEffect(() => {
    const handlePopState = () => {
      setIsRealMode(isRealApiMode());
      setErrorMessage(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const switchMode = (toReal) => {
    const targetPath = toReal ? '/demo' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setIsRealMode(toReal);
    setErrorMessage(null);
  };

  const handleSynthesisResult = (data, rawSop = '') => {
    const newFile = createFileFromSynthesis(data, rawSop);
    setFiles((prev) => {
      // Jika tab saat ini kosong dan belum diedit, gantikan
      if (prev.length === 1 && prev[0].name.startsWith('Untitled-') && !prev[0].isDirty) {
        return [newFile];
      }
      return [...prev, newFile];
    });
    setActiveFileId(newFile.id);
    setSelectedElement(null);
    setErrorMessage(null);
  };

  const handleProcessText = async (text) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await processSopText(text, 'Dokumen SOP', isRealMode);
      handleSynthesisResult(res, text);
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memproses teks SOP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessFile = async (file) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await processSopFile(file, isRealMode);
      handleSynthesisResult(res, '');
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memproses berkas SOP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrySample = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    processSopText(SAMPLE_SOP, 'Dokumen SOP', isRealMode)
      .then((res) => handleSynthesisResult(res, SAMPLE_SOP))
      .catch((err) => setErrorMessage(err.message || 'Gagal memproses contoh SOP.'))
      .finally(() => setIsLoading(false));
  }, [isLoading, isRealMode]);

  const handleSelectElement = useCallback((elem) => {
    setSelectedElement(elem);
    if (elem) {
      setDetailOpen(true);
    }
  }, []);

  const handleCitationClick = useCallback((citation) => {
    setHighlightedCitation(citation);
    if (citation?.node_id) {
      setHighlightedCanvasNodeId(citation.node_id);
    } else if (citation?.id) {
      setHighlightedCanvasNodeId(citation.id);
    }
    setTimeout(() => {
      setHighlightedCitation(null);
      setHighlightedCanvasNodeId(null);
    }, 8000);
  }, []);

  const appContent = (
    <div className="app-shell">
      {/* ── Top Bar ── */}
      <header className="app-header">
        <div className="app-header__brand">
          <button
            className="toggle-panel-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Tutup sidebar dokumen (Hot-key: [)' : 'Buka sidebar dokumen (Hot-key: [)'}
            aria-label={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>
          <div className="app-header__title">AutoBPMN</div>
          {activeFile && (
            <>
              <span className="app-header__sep">/</span>
              <span className="app-header__doc-title">{activeFile.name}</span>
            </>
          )}
        </div>

        <div className="app-header__center">
          <button
            type="button"
            className="cmd-trigger-btn"
            onClick={() => setCmdPaletteOpen(true)}
            title="Cari alur proses atau tindakan cepat (Ctrl+K)"
            aria-label="Cari node proses atau tindakan cepat"
          >
            <Search size={13} className="cmd-trigger-btn__icon" />
            <span className="cmd-trigger-btn__text">Cari alur atau aksi...</span>
            <span className="cmd-trigger-btn__kbd">Ctrl K</span>
          </button>
        </div>

        <div className="app-header__actions">
          <div className="app-header__save-status">
            <span
              className="app-header__save-dot"
              style={{
                background: isLoading
                  ? 'var(--warning-500)'
                  : activeFile?.bpmnXml
                  ? 'var(--success-600)'
                  : 'var(--gray-400)',
              }}
            />
            <span>
              {isLoading
                ? 'Memproses...'
                : activeFile?.isDirty
                ? 'Dimodifikasi'
                : activeFile?.bpmnXml
                ? (isRealMode ? 'Live API' : 'Simulasi')
                : 'Siap'}
            </span>
          </div>

          <button
            className="toggle-panel-btn"
            onClick={() => setDetailOpen(!detailOpen)}
            title={detailOpen ? 'Tutup panel Copilot (Hot-key: ])' : 'Buka panel Copilot (Hot-key: ])'}
            aria-label={detailOpen ? 'Tutup panel Copilot' : 'Buka panel Copilot'}
          >
            {detailOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
          </button>
        </div>
      </header>

      {/* ── Three-column body ── */}
      <div className="app-body">
        {/* LEFT SIDEBAR */}
        <aside className={`sidebar${sidebarOpen ? '' : ' sidebar--collapsed'}`}>
          <div className="sidebar__header">
            <div className="sidebar__title">
              {isRealMode ? 'Ekstraksi Dokumen SOP' : 'Input Dokumen SOP'}
            </div>
            <p className="sidebar__description">
              Masukkan alur operasional standar untuk disintesis menjadi diagram BPMN 2.0.
            </p>
          </div>

          <div className="sidebar__content">
            <SopUploader
              onProcessText={handleProcessText}
              onProcessFile={handleProcessFile}
              isLoading={isLoading}
              isRealMode={isRealMode}
              highlightedCitation={highlightedCitation}
              initialText={activeFile?.sopText || ''}
            />

            {errorMessage && (
              <div className="error-banner" role="alert">
                <svg className="error-banner__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {activeFile?.validation && <ValidationBadge validation={activeFile.validation} />}
          </div>
        </aside>

        {/* CENTER — VS Code Style Tabs & BPMN Canvas */}
        <main className="canvas-area">
          {/* File Tab Bar (VS Code Tabs) */}
          <FileTabBar
            files={files}
            activeFileId={activeFileId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onNewTab={handleNewTab}
            onImportFile={handleImportFile}
            onRenameTab={handleRenameTab}
          />

          {/* BPMN Canvas & Visual Editor for Active Tab */}
          <BpmnViewer
            xml={activeFile?.bpmnXml || ''}
            processName={activeFile?.processName || activeFile?.name || ''}
            intermediateGraph={activeFile?.intermediateGraph || null}
            highlightedNodeId={highlightedCanvasNodeId}
            isWalkthroughActive={isWalkthroughActive}
            onToggleWalkthrough={setIsWalkthroughActive}
            onTrySample={handleTrySample}
            onSelectElement={handleSelectElement}
            onGraphUpdate={handleVisualGraphUpdate}
            onFocusSidebar={() => {
              setSidebarOpen(true);
              setTimeout(() => {
                const el = document.getElementById('sop-textarea') || document.querySelector('.sidebar textarea');
                if (el) {
                  el.focus();
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 60);
            }}
          />
        </main>

        {/* RIGHT - AI Copilot Panel (Investigasi SOP & Analisis Kaidah BPMN) */}
        <aside className={`detail-panel${detailOpen ? '' : ' detail-panel--collapsed'}`}>
          <AiCopilotPanel
            sopText={activeFile?.sopText || ''}
            processName={activeFile?.processName || ''}
            selectedElement={selectedElement}
            onDeselectElement={() => setSelectedElement(null)}
            intermediateGraph={activeFile?.intermediateGraph || null}
            onCitationClick={handleCitationClick}
            onClose={() => setDetailOpen(false)}
            isRealMode={isRealMode}
            externalPrompt={copilotExternalPrompt}
          />
        </aside>
      </div>

      {/* ── Command Palette (Ctrl+K) ── */}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        nodes={activeFile?.intermediateGraph?.nodes || []}
        onSelectNode={(node) => {
          setHighlightedCanvasNodeId(node.id);
          setSelectedElement({
            id: node.id,
            type: node.type || 'Element',
            name: node.name || node.label || node.id,
            actor: node.actor || '',
          });
          setDetailOpen(true);
        }}
        onStartWalkthrough={() => {
          setIsWalkthroughActive(true);
        }}
        onAskCopilot={(prompt) => {
          setDetailOpen(true);
          setCopilotExternalPrompt(prompt);
        }}
        onExportBpmn={() => handleExport('bpmn')}
        onExportSvg={() => handleExport('svg')}
        onTrySample={handleTrySample}
        onFitView={() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: '0', code: 'Digit0' }));
        }}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onToggleDetail={() => setDetailOpen((prev) => !prev)}
        isRealMode={isRealMode}
      />
    </div>
  );

  // Real Simulation Mode (/demo): normal look
  if (isRealMode) {
    return appContent;
  }

  // Simulation Mode (Root /): wrap with outer border & banner
  return (
    <div className="simulation-outer-frame">
      <div className="simulation-border-box">
        <div className="simulation-banner">
          <div className="simulation-banner__left">
            <span className="simulation-badge">Simulation Only</span>
            <span className="simulation-banner__text">
              Mode simulasi lokal (Fake API). Menampilkan hasil seolah API telah merespons.
            </span>
          </div>
          <button
            type="button"
            className="simulation-banner__action"
            onClick={() => switchMode(true)}
            title="Buka live prototype dengan pemanggilan API nyata di /demo"
          >
            <span>Klik di sini untuk prototype asli</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="simulation-inner-app">
          {appContent}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import BpmnViewer from './components/BpmnViewer';
import SopUploader from './components/SopUploader';
import ValidationBadge from './components/ValidationBadge';
import GraphJsonEditor from './components/GraphJsonEditor';
import { isRealApiMode, processSopText, processSopFile } from './services/api';

const SAMPLE_SOP = `SOP Pengadaan Perlengkapan Kantor
1. Pemohon mengisi formulir permohonan pengadaan barang.
2. Manager Divisi meninjau urgensi kebutuhan dan ketersediaan anggaran.
3. Jika ditolak, formulir dikembalikan ke Pemohon beserta catatan revisi.
4. Jika disetujui, Bagian Pengadaan mencari vendor dan membandingkan harga.
5. Vendor terpilih mengirimkan barang pesanan ke kantor.
6. Pemohon menerima barang dan menandatangani berita acara penerimaan.`;

export default function App() {
  const [isRealMode, setIsRealMode] = useState(() => isRealApiMode());
  const [bpmnXml, setBpmnXml] = useState('');
  const [processName, setProcessName] = useState('');
  const [validation, setValidation] = useState(null);
  const [intermediateGraph, setIntermediateGraph] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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

  const handleResult = (data) => {
    setBpmnXml(data.bpmn_xml);
    setProcessName(data.process_name || 'Untitled Process');
    setValidation(data.validation);
    setIntermediateGraph(data.intermediate_graph);
    setErrorMessage(null);
  };

  const handleProcessText = async (text) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      handleResult(await processSopText(text, 'Dokumen SOP', isRealMode));
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
      handleResult(await processSopFile(file, isRealMode));
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memproses berkas SOP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Dipanggil dari CTA "Coba dengan contoh SOP" di empty state
  const handleTrySample = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    processSopText(SAMPLE_SOP, 'Dokumen SOP', isRealMode)
      .then(handleResult)
      .catch((err) => setErrorMessage(err.message || 'Gagal memproses contoh SOP.'))
      .finally(() => setIsLoading(false));
  }, [isLoading, isRealMode]);

  // Konten utama aplikasi workbench
  const appContent = (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__mark" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <div className="app-header__eyebrow">PROCESS WORKBENCH</div>
            <div className="app-header__title">AutoBPMN</div>
          </div>
        </div>

        {/* <div className="app-header__actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isRealMode ? (
            <div className="app-header__status app-header__status--real">
              <span className="app-header__dot app-header__dot--live" />
              <span>Real Simulation · Live Backend</span>
              <button
                type="button"
                className="mode-toggle-btn"
                onClick={() => switchMode(false)}
                title="Beralih ke mode simulasi lokal tanpa API"
              >
                Beralih ke Simulasi (Fake API)
              </button>
            </div>
          ) : (
            <div className="app-header__status">
              <span className="app-header__dot" />
              <span>Simulation Mode · Mock Data</span>
              <button
                type="button"
                className="mode-toggle-btn"
                onClick={() => switchMode(true)}
                title="Beralih ke live prototype dengan API asli"
              >
                Ke Prototype Asli (/demo)
              </button>
            </div>
          )}
        </div> */}
      </header>

      {/* Body */}
      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar__header">
            <span className="sidebar__kicker">
              {isRealMode ? 'INPUT / REAL PIPELINE' : 'INPUT / LOCAL FIXTURE'}
            </span>
            <div className="sidebar__title">
              {isRealMode
                ? 'Ekstraksi SOP ke BPMN 2.0 Real-time.'
                : 'Lihat alur pengadaan secara utuh.'}
            </div>
            <p className="sidebar__description">
              {isRealMode
                ? 'Input teks atau berkas dikirimkan langsung ke backend FastAPI (Multi-Provider LLM -> Validator -> Synthesizer).'
                : 'Input Anda hanya memulai simulasi. Tidak ada berkas atau narasi yang dikirim ke API.'}
            </p>
          </div>

          <div className="sidebar__content">
            <div className="demo-note">
              <span style={{ background: isRealMode ? '#16a34a' : '#d6962c' }} aria-hidden="true" />
              {isRealMode ? (
                <>Status: <b>Live Backend API Aktif</b> (Real Simulation)</>
              ) : (
                <>Fixture aktif <b>9 node</b> · <b>9 alur</b> (Prototype)</>
              )}
            </div>

            <SopUploader
              onProcessText={handleProcessText}
              onProcessFile={handleProcessFile}
              isLoading={isLoading}
            />

            {errorMessage && (
              <div className="error-banner" role="alert">
                <svg className="error-banner__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {validation && <ValidationBadge validation={validation} />}

            {intermediateGraph && <GraphJsonEditor graphData={intermediateGraph} />}
          </div>
        </aside>

        {/* Canvas */}
        <main className="canvas-area">
          <BpmnViewer xml={bpmnXml} processName={processName} onTrySample={handleTrySample} />
        </main>
      </div>
    </div>
  );

  // Jika di mode Real Simulation (/demo): Normal look (tanpa outer border wrapper)
  if (isRealMode) {
    return appContent;
  }

  // Jika di mode Simulation (Root URL /): Wrap dengan outer border & banner "Simulation Only, klik di sini untuk prototype asli"
  return (
    <div className="simulation-outer-frame">
      <div className="simulation-border-box">
        {/* Banner display: Simulation Only & CTA ke prototype asli */}
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

        {/* Inner workbench view */}
        <div className="simulation-inner-app">
          {appContent}
        </div>
      </div>
    </div>
  );
}

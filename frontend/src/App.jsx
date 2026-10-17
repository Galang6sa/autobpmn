import React, { useState, useEffect, useCallback } from 'react';
import BpmnViewer from './components/BpmnViewer';
import SopUploader from './components/SopUploader';
import ValidationBadge from './components/ValidationBadge';
import GraphJsonEditor from './components/GraphJsonEditor';
import { isRealApiMode, processSopText, processSopFile } from './services/api';
import {
  PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen,
  FileText, Eye, AlertTriangle,
  CheckCircle2, User, ArrowRight,
  ArrowLeft, Copy, Check, X
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
  const [bpmnXml, setBpmnXml] = useState('');
  const [processName, setProcessName] = useState('');
  const [validation, setValidation] = useState(null);
  const [intermediateGraph, setIntermediateGraph] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Panel visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(true);
  const [detailTab, setDetailTab] = useState('evidence');

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

  const handleTrySample = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    processSopText(SAMPLE_SOP, 'Dokumen SOP', isRealMode)
      .then(handleResult)
      .catch((err) => setErrorMessage(err.message || 'Gagal memproses contoh SOP.'))
      .finally(() => setIsLoading(false));
  }, [isLoading, isRealMode]);

  // Build the review issues from validation data
  const reviewIssues = [];
  if (validation && !validation.is_valid) {
    (validation.issues || []).forEach((issue, i) => {
      reviewIssues.push({ id: `issue-${i}`, title: issue, type: 'warning' });
    });
    (validation.deadlocks || []).forEach((d, i) => {
      reviewIssues.push({ id: `deadlock-${i}`, title: `Deadlock: ${d}`, type: 'error' });
    });
    (validation.orphan_nodes || []).forEach((n, i) => {
      reviewIssues.push({ id: `orphan-${i}`, title: `Node terisolasi: ${n}`, type: 'warning' });
    });
  }

  const handleSelectElement = useCallback((elem) => {
    setSelectedElement(elem);
    if (elem) {
      setDetailOpen(true);
      setDetailTab('element');
    }
  }, []);

  const copyElementId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const appContent = (
    <div className="app-shell">
      {/* ── Top Bar ── */}
      <header className="app-header">
        <div className="app-header__brand">
          <button
            className="toggle-panel-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
            aria-label={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          <div className="app-header__mark" aria-hidden="true">
            <span /><span /><span />
          </div>
          <div>
            <div className="app-header__eyebrow">REVIEW STUDIO</div>
            <div className="app-header__title">AutoBPMN</div>
          </div>
        </div>

        <div className="app-header__center">
          {processName && (
            <span className="app-header__doc-title">{processName}</span>
          )}
          <div className="app-header__save-status">
            <span className="app-header__save-dot" style={{
              background: isLoading ? 'var(--warning-500)' : bpmnXml ? 'var(--success-500)' : 'var(--gray-300)'
            }} />
            <span>
              {isLoading ? 'Memproses...' : bpmnXml ? 'Draft siap' : 'Menunggu input'}
            </span>
          </div>
        </div>

        <div className="app-header__actions">
          <div className="app-header__save-status" style={{ marginRight: 4 }}>
            <span className="app-header__save-dot" style={{
              background: isRealMode ? 'var(--success-500)' : 'var(--warning-500)'
            }} />
            <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>
              {isRealMode ? 'Live API' : 'Simulasi'}
            </span>
          </div>
          <button
            className="toggle-panel-btn"
            onClick={() => setDetailOpen(!detailOpen)}
            title={detailOpen ? 'Tutup panel detail' : 'Buka panel detail'}
            aria-label={detailOpen ? 'Tutup panel detail' : 'Buka panel detail'}
          >
            {detailOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </div>
      </header>

      {/* ── Three-column body ── */}
      <div className="app-body">
        {/* LEFT SIDEBAR */}
        <aside className={`sidebar${sidebarOpen ? '' : ' sidebar--collapsed'}`}>
          <div className="sidebar__header">
            <span className="sidebar__kicker">
              {isRealMode ? 'INPUT / REAL PIPELINE' : 'INPUT / SIMULASI LOKAL'}
            </span>
            <div className="sidebar__title">
              {isRealMode
                ? 'Ekstraksi SOP ke BPMN 2.0'
                : 'Simulasi alur pengadaan'}
            </div>
            <p className="sidebar__description">
              {isRealMode
                ? 'Teks atau berkas dikirim ke backend FastAPI (LLM → Validator → Synthesizer).'
                : 'Hasil mock ditampilkan langsung. Tidak ada data yang dikirim ke server.'}
            </p>
          </div>

          <div className="sidebar__content">
            <div className="demo-note">
              <span style={{ background: isRealMode ? 'var(--success-500)' : 'var(--warning-500)' }} aria-hidden="true" />
              {isRealMode ? (
                <>Status: <b>Live Backend API Aktif</b></>
              ) : (
                <>Fixture aktif <b>9 node</b> · <b>9 alur</b></>
              )}
            </div>

            <SopUploader
              onProcessText={handleProcessText}
              onProcessFile={handleProcessFile}
              isLoading={isLoading}
              isRealMode={isRealMode}
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

        {/* CENTER — BPMN Canvas */}
        <main className="canvas-area">
          <BpmnViewer
            xml={bpmnXml}
            processName={processName}
            onTrySample={handleTrySample}
            onSelectElement={handleSelectElement}
          />
        </main>

        {/* RIGHT — Detail Panel */}
        <aside className={`detail-panel${detailOpen ? '' : ' detail-panel--collapsed'}`}>
          <div className="detail-panel__header">
            <span className="detail-panel__title">Detail & Review</span>
            <button
              className="detail-panel__close"
              onClick={() => setDetailOpen(false)}
              title="Tutup panel"
              aria-label="Tutup panel detail"
            >
              <PanelRightClose size={14} />
            </button>
          </div>

          {/* Tab nav */}
          <div className="detail-tabs">
            <button
              className={`detail-tab${detailTab === 'evidence' ? ' detail-tab--active' : ''}`}
              onClick={() => setDetailTab('evidence')}
            >
              <FileText size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
              Sumber
            </button>
            <button
              className={`detail-tab${detailTab === 'element' ? ' detail-tab--active' : ''}`}
              onClick={() => setDetailTab('element')}
            >
              <Eye size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
              Elemen
            </button>
            <button
              className={`detail-tab${detailTab === 'issues' ? ' detail-tab--active' : ''}`}
              onClick={() => setDetailTab('issues')}
            >
              <AlertTriangle size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
              Isu
              {reviewIssues.length > 0 && (
                <span style={{
                  marginLeft: 4,
                  fontSize: 9,
                  background: 'var(--warning-500)',
                  color: 'white',
                  padding: '1px 5px',
                  borderRadius: 10,
                  fontWeight: 700
                }}>
                  {reviewIssues.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="detail-panel__content">
            {/* Source Evidence */}
            {detailTab === 'evidence' && (
              bpmnXml ? (
                <div>
                  <div className="evidence-item">
                    <div className="evidence-item__label">Dokumen Sumber</div>
                    <div className="evidence-item__text">{processName || 'Dokumen SOP'}</div>
                    <div className="evidence-item__ref">
                      <FileText size={10} />
                      {isRealMode ? 'Diproses via Live API' : 'Sumber data fixture lokal'}
                    </div>
                  </div>
                  {intermediateGraph && intermediateGraph.nodes && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '12px 0 6px' }}>
                        Node yang diekstrak ({intermediateGraph.nodes.length})
                      </div>
                      {intermediateGraph.nodes.slice(0, 8).map((node, i) => (
                        <div className="evidence-item" key={i}>
                          <div className="evidence-item__label">{node.type || 'task'}</div>
                          <div className="evidence-item__text">{node.label || node.id}</div>
                        </div>
                      ))}
                      {intermediateGraph.nodes.length > 8 && (
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', padding: 8 }}>
                          +{intermediateGraph.nodes.length - 8} node lainnya
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="detail-empty">
                  <FileText className="detail-empty__icon" />
                  <div className="detail-empty__title">Belum ada sumber</div>
                  <div className="detail-empty__desc">
                    Jalankan simulasi dari panel kiri untuk menampilkan sumber dokumen.
                  </div>
                </div>
              )
            )}

            {/* Selected Element */}
            {detailTab === 'element' && (
              selectedElement ? (
                (() => {
                  const matchedNode = intermediateGraph?.nodes?.find((n) => n.id === selectedElement.id);
                  const incomingEdges = intermediateGraph?.edges?.filter((e) => e.to_node === selectedElement.id) || [];
                  const outgoingEdges = intermediateGraph?.edges?.filter((e) => e.from_node === selectedElement.id) || [];
                  const nodeActor = matchedNode?.actor || '';
                  const nodeLabel = matchedNode?.name || selectedElement.name || selectedElement.id;

                  return (
                    <div className="selected-element-card">
                      <div className="element-header">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span className="element-header__type">
                            {selectedElement.type || 'BPMN Element'}
                          </span>
                          <button
                            className="toggle-panel-btn"
                            style={{ width: 22, height: 22, padding: 0 }}
                            onClick={() => setSelectedElement(null)}
                            title="Batal pilih"
                            aria-label="Batal pilih elemen"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div className="element-header__title">{nodeLabel}</div>
                      </div>

                      <div className="element-meta-list">
                        <div className="element-meta-row">
                          <span className="element-meta-label">ID Elemen</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="element-meta-value">{selectedElement.id}</span>
                            <button
                              type="button"
                              onClick={() => copyElementId(selectedElement.id)}
                              className="toggle-panel-btn"
                              style={{ width: 20, height: 20, padding: 0 }}
                              title="Salin ID"
                              aria-label="Salin ID"
                            >
                              {copiedId ? <Check size={11} color="var(--success-500)" /> : <Copy size={11} />}
                            </button>
                          </div>
                        </div>

                        {nodeActor && (
                          <div className="element-meta-row">
                            <span className="element-meta-label">Pelaku / Aktor</span>
                            <span className="element-meta-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <User size={12} color="var(--accent-500)" />
                              {nodeActor}
                            </span>
                          </div>
                        )}

                        <div className="element-meta-row">
                          <span className="element-meta-label">Alur Masuk (In)</span>
                          <span className="element-meta-value">
                            {incomingEdges.length || selectedElement.incomingCount || 0}
                          </span>
                        </div>

                        <div className="element-meta-row">
                          <span className="element-meta-label">Alur Keluar (Out)</span>
                          <span className="element-meta-value">
                            {outgoingEdges.length || selectedElement.outgoingCount || 0}
                          </span>
                        </div>
                      </div>

                      {/* Connected Flows Details */}
                      {(incomingEdges.length > 0 || outgoingEdges.length > 0) && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                            Koneksi Alur
                          </div>
                          {incomingEdges.map((e, idx) => (
                            <div key={`in-${idx}`} className="evidence-item" style={{ marginBottom: 6 }}>
                              <div className="evidence-item__label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ArrowLeft size={10} color="var(--accent-500)" />
                                Masuk dari: {e.from_node}
                              </div>
                              {e.condition && (
                                <div className="evidence-item__text" style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--warning-600)' }}>
                                  Kondisi: "{e.condition}"
                                </div>
                              )}
                            </div>
                          ))}
                          {outgoingEdges.map((e, idx) => (
                            <div key={`out-${idx}`} className="evidence-item" style={{ marginBottom: 6 }}>
                              <div className="evidence-item__label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ArrowRight size={10} color="var(--accent-500)" />
                                Keluar ke: {e.to_node}
                              </div>
                              {e.condition && (
                                <div className="evidence-item__text" style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--warning-600)' }}>
                                  Kondisi: "{e.condition}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Document Link */}
                      <div className="evidence-item" style={{ marginTop: 12 }}>
                        <div className="evidence-item__label">Bukti Dokumen Sumber</div>
                        <div className="evidence-item__text">
                          Langkah ini diekstrak dari SOP untuk aktivitas: <b>{nodeLabel}</b>
                          {nodeActor ? ` yang dijalankan oleh ${nodeActor}.` : '.'}
                        </div>
                        <div className="evidence-item__ref">
                          <FileText size={10} />
                          Ditautkan ke elemen kanvas BPMN
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="detail-empty">
                  <Eye className="detail-empty__icon" />
                  <div className="detail-empty__title">Pilih elemen di kanvas</div>
                  <div className="detail-empty__desc">
                    Klik pada node atau connection di diagram BPMN untuk melihat detail dan tautan sumbernya.
                  </div>
                </div>
              )
            )}

            {/* Review Issues */}
            {detailTab === 'issues' && (
              reviewIssues.length > 0 ? (
                <div>
                  {reviewIssues.map((issue) => (
                    <div className="issue-item" key={issue.id}>
                      <AlertTriangle className="issue-item__icon" />
                      <div className="issue-item__body">
                        <div className="issue-item__title">{issue.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : validation && validation.is_valid ? (
                <div className="detail-empty">
                  <CheckCircle2 className="detail-empty__icon" style={{ color: 'var(--success-500)' }} />
                  <div className="detail-empty__title">Validasi berhasil</div>
                  <div className="detail-empty__desc">
                    Semua alur tervalidasi tanpa isu. Diagram siap diekspor.
                  </div>
                </div>
              ) : (
                <div className="detail-empty">
                  <AlertTriangle className="detail-empty__icon" />
                  <div className="detail-empty__title">Belum ada review</div>
                  <div className="detail-empty__desc">
                    Jalankan proses terlebih dahulu untuk melihat hasil validasi alur.
                  </div>
                </div>
              )
            )}
          </div>
        </aside>
      </div>
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

import React, { useEffect, useRef, useState } from 'react';
import BpmnJS from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { ZoomIn, ZoomOut, Maximize2, Download, Sparkles, Workflow, ScanLine } from 'lucide-react';

const FIRST_RUN_KEY = 'autobpmn-first-run-done';

export default function BpmnViewer({ xml, processName = '', onTrySample }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [firstRun, setFirstRun] = useState(() => !localStorage.getItem(FIRST_RUN_KEY));
  const [showNudge, setShowNudge] = useState(false);
  const prevXml = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new BpmnJS({ container: containerRef.current });
    viewerRef.current = viewer;
    return () => viewer.destroy();
  }, []);

  useEffect(() => {
    if (!viewerRef.current || !xml) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        await viewerRef.current.importXML(xml);
        viewerRef.current.get('canvas').zoom('fit-viewport');
        // First success: retire the first-run guide and show the download nudge
        if (xml !== prevXml.current) {
          if (firstRun) {
            localStorage.setItem(FIRST_RUN_KEY, '1');
            setFirstRun(false);
          }
          setShowNudge(true);
        }
        prevXml.current = xml;
      } catch (err) {
        setError(err.message || 'Gagal merender diagram.');
      } finally {
        setLoading(false);
      }
    })();
  }, [xml]);

  const zoom = (step) => {
    if (!viewerRef.current) return;
    const c = viewerRef.current.get('canvas');
    c.zoom(c.zoom() + step);
  };

  const fitView = () => viewerRef.current?.get('canvas').zoom('fit-viewport');

  const downloadXml = async () => {
    if (!viewerRef.current) return;
    const { xml: out } = await viewerRef.current.saveXML({ format: true });
    downloadBlob(out, 'application/xml', `${slugify(processName)}.bpmn`);
  };

  const downloadSvg = async () => {
    if (!viewerRef.current) return;
    const { svg } = await viewerRef.current.saveSVG();
    downloadBlob(svg, 'image/svg+xml', `${slugify(processName)}.svg`);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="canvas-toolbar">
        <div className="canvas-toolbar__left">
          <span className="canvas-toolbar__label"><Workflow size={14} /> Diagram proses</span>
          {processName ? <span className="canvas-toolbar__badge">{processName}</span> : <span className="canvas-toolbar__hint">Fixture belum dijalankan</span>}
        </div>

        <div className="canvas-legend">
          <div className="legend-item"><span className="legend-dot legend-dot--start" />Mulai</div>
          <div className="legend-item"><span className="legend-dot legend-dot--task" />Aktivitas</div>
          <div className="legend-item"><span className="legend-dot legend-dot--gw" />Keputusan</div>
        </div>

        <div className="canvas-toolbar__right">
          {showNudge && (
            <div className="download-nudge" role="status">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Diagram demo siap diekspor
              <button
                className="download-nudge__dismiss"
                onClick={() => setShowNudge(false)}
                aria-label="Tutup petunjuk"
              >×</button>
            </div>
          )}
          <button className="toolbar-btn" onClick={() => zoom(0.2)} title="Zoom In" aria-label="Perbesar tampilan"><ZoomIn /></button>
          <button className="toolbar-btn" onClick={() => zoom(-0.2)} title="Zoom Out" aria-label="Perkecil tampilan"><ZoomOut /></button>
          <button className="toolbar-btn" onClick={fitView} title="Fit" aria-label="Sesuaikan ke layar"><Maximize2 /></button>
          <span className="toolbar-sep" />
          <button className="toolbar-btn" onClick={downloadXml} disabled={!xml} title="Download .bpmn" aria-label="Unduh berkas .bpmn">
            <Download />.bpmn
          </button>
          <button className="toolbar-btn" onClick={downloadSvg} disabled={!xml} title="Download .svg" aria-label="Unduh berkas .svg">
            <Download />.svg
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="canvas-container">
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {loading && (
          <div className="canvas-overlay" role="status" aria-live="polite" aria-label="Memuat diagram">
            <div className="canvas-overlay__spinner" />
          </div>
        )}

        {!xml && !loading && !error && (
          <div className="empty-state">
            <div className="empty-state__diagram" aria-hidden="true"><span className="empty-state__node empty-state__node--start" /><i /><span className="empty-state__node">Terima SOP</span><i /><span className="empty-state__node empty-state__node--decision">?</span><i /><span className="empty-state__node">Publikasi</span><i /><span className="empty-state__node empty-state__node--end" /></div>
            <span className="empty-state__kicker"><ScanLine size={13} /> FIXTURE LOKAL / BPMN 2.0</span>
            <div className="empty-state__title">
              {firstRun ? 'Satu proses, seluruh percabangan terlihat.' : 'Fixture belum dijalankan.'}
            </div>
            <div className="empty-state__desc">
              {firstRun
                ? 'Gunakan input di kiri untuk memuat fixture pengadaan. Simulasi ini menampilkan setiap task, gateway, dan jalur penolakan.'
                : 'Jalankan simulasi dari panel kiri untuk menampilkan diagram BPMN.'}
            </div>
            {firstRun && (
              <>
                {onTrySample && (
                  <button className="empty-state__cta" onClick={onTrySample}>
                    <Sparkles width={13} height={13} aria-hidden="true" />
                    Tampilkan fixture pengadaan
                  </button>
                )}
                <button
                  className="empty-state__skip"
                  onClick={() => {
                    localStorage.setItem(FIRST_RUN_KEY, '1');
                    setFirstRun(false);
                  }}
                >
                  Saya sudah tahu cara pakainya
                </button>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="canvas-error" role="alert">
            <svg style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>
    </>
  );
}

function slugify(s) {
  return (s || 'process').replace(/\s+/g, '_').toLowerCase();
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

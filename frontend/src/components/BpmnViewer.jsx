import React, { useEffect, useRef, useState } from 'react';
import BpmnJS from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';

export default function BpmnViewer({ xml, processName = '' }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
          <span className="canvas-toolbar__label">Canvas</span>
          {processName && <span className="canvas-toolbar__badge">{processName}</span>}
        </div>

        <div className="canvas-legend">
          <div className="legend-item"><span className="legend-dot legend-dot--start" />Start</div>
          <div className="legend-item"><span className="legend-dot legend-dot--task" />Task</div>
          <div className="legend-item"><span className="legend-dot legend-dot--service" />Service</div>
          <div className="legend-item"><span className="legend-dot legend-dot--gw" />Decision</div>
          <div className="legend-item"><span className="legend-dot legend-dot--end" />End</div>
        </div>

        <div className="canvas-toolbar__right">
          <button className="toolbar-btn" onClick={() => zoom(0.2)} title="Zoom In"><ZoomIn /></button>
          <button className="toolbar-btn" onClick={() => zoom(-0.2)} title="Zoom Out"><ZoomOut /></button>
          <button className="toolbar-btn" onClick={fitView} title="Fit"><Maximize2 /></button>
          <span className="toolbar-sep" />
          <button className="toolbar-btn" onClick={downloadXml} disabled={!xml} title="Download .bpmn">
            <Download />.bpmn
          </button>
          <button className="toolbar-btn" onClick={downloadSvg} disabled={!xml} title="Download .svg">
            <Download />.svg
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="canvas-container">
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {loading && (
          <div className="canvas-overlay">
            <div className="canvas-overlay__spinner" />
          </div>
        )}

        {!xml && !loading && !error && (
          <div className="empty-state">
            <svg className="empty-state__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <div className="empty-state__title">Belum ada diagram</div>
            <div className="empty-state__desc">
              Masukkan teks SOP atau unggah berkas di panel kiri untuk menghasilkan diagram alur proses BPMN 2.0.
            </div>
          </div>
        )}

        {error && (
          <div className="canvas-error">
            <svg style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

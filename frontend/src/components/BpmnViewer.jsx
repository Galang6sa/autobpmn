import React, { useEffect, useRef, useState } from 'react';
import BpmnJS from 'bpmn-js/dist/bpmn-navigated-viewer.production.min.js';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import { ZoomIn, ZoomOut, Maximize2, Download, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function BpmnViewer({ xml, processName = 'process-diagram' }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [renderError, setRenderError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Inisialisasi bpmn-js viewer instance
  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new BpmnJS({
      container: containerRef.current,
      keyboard: {
        bindTo: window,
      },
    });

    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
    };
  }, []);

  // Import dan render XML diagram setiap kali props `xml` berubah
  useEffect(() => {
    const renderDiagram = async () => {
      if (!viewerRef.current || !xml) return;

      setIsLoading(true);
      setRenderError(null);

      try {
        await viewerRef.current.importXML(xml);
        // Otomatis posisikan diagram di tengah kanvas
        const canvas = viewerRef.current.get('canvas');
        canvas.zoom('fit-viewport');
      } catch (err) {
        console.error('BPMN Render Error:', err);
        setRenderError(err.message || 'Gagal merender skema BPMN XML.');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [xml]);

  // Handler Zooming & Navigasi Kanvas
  const handleZoom = (step) => {
    if (!viewerRef.current) return;
    const canvas = viewerRef.current.get('canvas');
    canvas.zoom(canvas.zoom() + step);
  };

  const handleResetZoom = () => {
    if (!viewerRef.current) return;
    const canvas = viewerRef.current.get('canvas');
    canvas.zoom('fit-viewport');
  };

  // Handler Unduh File XML (.bpmn)
  const handleDownloadXml = () => {
    if (!xml) return;
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${processName.toLowerCase().replace(/\s+/g, '_')}.bpmn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handler Unduh Grafis Vektor (.svg)
  const handleDownloadSvg = async () => {
    if (!viewerRef.current) return;
    try {
      const { svg } = await viewerRef.current.saveSVG();
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${processName.toLowerCase().replace(/\s+/g, '_')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gagal mengekspor diagram ke SVG:', err);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar Atas */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <h3 className="text-sm font-semibold text-slate-700 truncate max-w-xs md:max-w-md">
            {processName}
          </h3>
        </div>

        {/* Tombol Aksi Kontrol & Ekspor */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleZoom(0.2)}
            title="Perbesar"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            title="Perkecil"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Ukuran (Fit View)"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            onClick={handleDownloadSvg}
            disabled={!xml || isLoading}
            title="Unduh Gambar SVG"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition disabled:opacity-50"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>

          <button
            onClick={handleDownloadXml}
            disabled={!xml || isLoading}
            title="Unduh Berkas BPMN 2.0 XML"
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh BPMN</span>
          </button>
        </div>
      </div>

      {/* Area Kanvas Diagram */}
      <div className="relative flex-1 w-full min-h-[500px] bg-white">
        {/* Indikator Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Memuat Model Diagram...
            </div>
          </div>
        )}

        {/* Indikator Pesan Kesalahan */}
        {renderError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-rose-50/90">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-sm font-semibold text-rose-900">Gagal Merender Diagram</p>
            <p className="text-xs text-rose-700 mt-1 max-w-md">{renderError}</p>
          </div>
        )}

        {/* Placeholder Kosong */}
        {!xml && !isLoading && !renderError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <p className="text-sm font-medium">Belum ada dokumen SOP yang diproses.</p>
            <p className="text-xs mt-1">Unggah berkas atau masukkan teks SOP untuk menghasilkan diagram.</p>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
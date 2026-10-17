import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, Send, Sparkles, ArrowUpRight } from 'lucide-react';
import Keycap from './Keycap';

const SAMPLE_SOP = `SOP Pengadaan Perlengkapan Kantor
1. Pemohon mengisi formulir permohonan pengadaan barang.
2. Manager Divisi meninjau urgensi kebutuhan dan ketersediaan anggaran.
3. Jika ditolak, formulir dikembalikan ke Pemohon beserta catatan revisi.
4. Jika disetujui, Bagian Pengadaan mencari vendor dan membandingkan harga.
5. Vendor terpilih mengirimkan barang pesanan ke kantor.
6. Pemohon menerima barang dan menandatangani berita acara penerimaan.`;

export default function SopUploader({
  onProcessText,
  onProcessFile,
  isLoading,
  isRealMode = false,
  highlightedCitation = null,
}) {
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  // Global & scoped keyboard shortcuts for SopUploader
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+S to load sample SOP
      if (e.altKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
        e.preventDefault();
        setTab('text');
        setText(SAMPLE_SOP);
        return;
      }

      // Ctrl+Enter or Cmd+Enter to submit
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter')) {
        if (tab === 'text' && text.trim() && !isLoading) {
          e.preventDefault();
          onProcessText(text);
        } else if (tab === 'file' && file && !isLoading) {
          e.preventDefault();
          onProcessFile(file);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [tab, text, file, isLoading, onProcessText, onProcessFile]);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    onProcessText(text);
  };

  const handleFileSubmit = (e) => {
    e.preventDefault();
    if (!file || isLoading) return;
    onProcessFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  return (
    <>
      {/* Tab Switcher */}
      <div className="tabs">
        <button
          type="button"
          onClick={() => setTab('text')}
          className={`tab-btn ${tab === 'text' ? 'tab-btn--active' : ''}`}
        >
          Teks Narasi
        </button>
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`tab-btn ${tab === 'file' ? 'tab-btn--active' : ''}`}
        >
          Unggah Berkas
        </button>
      </div>

      {/* Text Tab */}
      {tab === 'text' && (
        <form onSubmit={handleTextSubmit} className="input-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label htmlFor="sop-textarea" className="input-label">
              Teks Narasi SOP
            </label>
            <button
              type="button"
              className="sample-btn"
              onClick={() => setText(SAMPLE_SOP)}
              title="Isi dengan contoh SOP pengadaan (Alt+S)"
            >
              <Sparkles size={13} />
              Contoh SOP
            </button>
          </div>
          {highlightedCitation && (
            <div className="citation-highlight-banner" role="region" aria-label="Kutipan SOP Disorot">
              <div className="citation-highlight-banner__header">
                <span className="citation-highlight-banner__badge">
                  Rujukan SOP {highlightedCitation.step ? `Langkah ${highlightedCitation.step}` : ''}
                </span>
                <span className="citation-highlight-banner__hint">Disorot dari Copilot</span>
              </div>
              <div className="citation-highlight-banner__quote">
                "{highlightedCitation.quote}"
              </div>
            </div>
          )}
          <textarea
            id="sop-textarea"
            className={`text-input${highlightedCitation ? ' text-input--highlighted' : ''}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis atau tempel teks SOP untuk diekstrak menjadi alur proses BPMN 2.0..."
            rows={10}
          />
          <div className="input-meta">
            <span>{text.trim() ? `${text.trim().split(/\s+/).length} kata` : 'Minimal satu langkah proses'}</span>
            <span>{isRealMode ? 'Backend API' : 'Simulasi lokal'}</span>
          </div>
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className={`btn btn--primary${isLoading ? ' btn--loading' : ''}`}
            title="Ekstrak alur proses (Ctrl+Enter)"
          >
            <span className="btn__spinner" aria-hidden="true" />
            {isLoading ? 'Mengekstrak alur proses...' : (
              <>
                <span>{isRealMode ? 'Ekstrak ke BPMN' : 'Jalankan Simulasi'}</span>
                <ArrowUpRight size={14} style={{ marginLeft: 2 }} />
              </>
            )}
          </button>
        </form>
      )}

      {/* File Tab */}
      {tab === 'file' && (
        <form onSubmit={handleFileSubmit} className="input-group">
          <label className="input-label">
            {isRealMode ? 'Pilih berkas SOP (.pdf, .txt)' : 'Pilih berkas untuk simulasi'}
          </label>

          {!file ? (
            <div
              className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <span className="dropzone__icon"><UploadCloud size={22} /></span>
              <div className="dropzone__text">
                Pilih atau seret berkas SOP
              </div>
              <div className="dropzone__hint">
                {isRealMode ? 'PDF atau TXT · Diproses oleh backend FastAPI' : 'tidak diunggah · PDF atau TXT'}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="dropzone__file">
              <FileText style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span className="dropzone__file__name">{file.name}</span>
              <button
                type="button"
                className="dropzone__file__remove"
                onClick={() => setFile(null)}
                aria-label="Hapus berkas"
              >
                ×
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || isLoading}
            className={`btn btn--primary${isLoading ? ' btn--loading' : ''}`}
            title="Unggah dan ekstrak alur proses (Ctrl+Enter)"
          >
            <span className="btn__spinner" aria-hidden="true" />
            {isLoading ? 'Memproses berkas SOP...' : (
              <>
                <Send size={14} />
                <span>{isRealMode ? 'Unggah & Ekstrak BPMN' : 'Jalankan Simulasi'}</span>
              </>
            )}
          </button>
        </form>
      )}
    </>
  );
}

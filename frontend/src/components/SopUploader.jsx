import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Send, Sparkles, ArrowUpRight } from 'lucide-react';

const SAMPLE_SOP = `SOP Pengadaan Perlengkapan Kantor
1. Pemohon mengisi formulir permohonan pengadaan barang.
2. Manager Divisi meninjau urgensi kebutuhan dan ketersediaan anggaran.
3. Jika ditolak, formulir dikembalikan ke Pemohon beserta catatan revisi.
4. Jika disetujui, Bagian Pengadaan mencari vendor dan membandingkan harga.
5. Vendor terpilih mengirimkan barang pesanan ke kantor.
6. Pemohon menerima barang dan menandatangani berita acara penerimaan.`;

export default function SopUploader({ onProcessText, onProcessFile, isLoading, isRealMode = false }) {
  const [tab, setTab] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

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
              {isRealMode ? 'Teks SOP' : 'Masukan demo'}
            </label>
            <button
              type="button"
              className="sample-btn"
              onClick={() => setText(SAMPLE_SOP)}
            >
              <Sparkles style={{ width: 12, height: 12 }} />
              Contoh SOP
            </button>
          </div>
          <textarea
            id="sop-textarea"
            className="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRealMode ? "Ketik atau tempel teks SOP untuk diekstrak menjadi BPMN 2.0..." : "Tulis atau tempel SOP untuk memulai simulasi diagram..."}
          />
          <div className="input-meta">
            <span>{text.trim() ? `${text.trim().split(/\s+/).length} kata` : 'Minimal satu langkah proses'}</span>
            <span>{isRealMode ? 'Kirim ke backend FastAPI' : 'Simulasi lokal'}</span>
          </div>
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className={`btn btn--primary${isLoading ? ' btn--loading' : ''}`}
          >
            <span className="btn__spinner" aria-hidden="true" />
            {isLoading ? 'Mengekstrak alur proses...' : (
              <>
                {isRealMode ? 'Ekstrak ke BPMN' : 'Jalankan simulasi'}
                <ArrowUpRight style={{ width: 15, height: 15 }} />
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
          >
            <span className="btn__spinner" aria-hidden="true" />
            {isLoading ? 'Memproses berkas SOP...' : (
              <>
                <Send style={{ width: 14, height: 14 }} />
                {isRealMode ? 'Unggah & Ekstrak BPMN' : 'Jalankan simulasi'}
              </>
            )}
          </button>
        </form>
      )}
    </>
  );
}

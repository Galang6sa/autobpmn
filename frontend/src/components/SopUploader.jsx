import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Send, Loader2, Sparkles } from 'lucide-react';

const SAMPLE_SOP = `SOP Pengadaan Perlengkapan Kantor
1. Pemohon mengisi formulir permohonan pengadaan barang.
2. Manager Divisi meninjau urgensi kebutuhan dan ketersediaan anggaran.
3. Jika ditolak, formulir dikembalikan ke Pemohon beserta catatan revisi.
4. Jika disetujui, Bagian Pengadaan mencari vendor dan membandingkan harga.
5. Vendor terpilih mengirimkan barang pesanan ke kantor.
6. Pemohon menerima barang dan menandatangani berita acara penerimaan.`;

export default function SopUploader({ onProcessText, onProcessFile, isLoading }) {
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
            <label className="input-label">Narasi SOP</label>
            <button
              type="button"
              className="sample-btn"
              onClick={() => setText(SAMPLE_SOP)}
            >
              <Sparkles style={{ width: 12, height: 12 }} />
              Contoh
            </button>
          </div>
          <textarea
            className="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tempel atau ketik narasi prosedur operasional di sini..."
          />
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="btn btn--primary"
          >
            {isLoading ? (
              <>
                <span className="btn__spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                Mengekstrak...
              </>
            ) : (
              <>
                <Send style={{ width: 14, height: 14 }} />
                Ekstrak ke BPMN
              </>
            )}
          </button>
        </form>
      )}

      {/* File Tab */}
      {tab === 'file' && (
        <form onSubmit={handleFileSubmit} className="input-group">
          <label className="input-label">Berkas Dokumen SOP</label>

          {!file ? (
            <div
              className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <UploadCloud className="dropzone__icon" style={{ margin: '0 auto 10px', display: 'block' }} />
              <div className="dropzone__text">
                Klik atau seret berkas ke sini
              </div>
              <div className="dropzone__hint">
                Mendukung format .pdf dan .txt
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
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => setFile(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9f1239', fontSize: 14, fontWeight: 600, padding: 0 }}
              >
                ×
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || isLoading}
            className="btn btn--primary"
          >
            {isLoading ? (
              <>
                <span className="btn__spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                Memproses...
              </>
            ) : (
              <>
                <Send style={{ width: 14, height: 14 }} />
                Proses Berkas
              </>
            )}
          </button>
        </form>
      )}
    </>
  );
}
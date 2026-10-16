import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Send, Loader2 } from 'lucide-react';

export default function SopUploader({ onProcessText, onProcessFile, isLoading }) {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'file'
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const sampleSop = `SOP Pengadaan Perlengkapan Kantor
1. Pemohon mengisi formulir permohonan pengadaan barang.
2. Manager Divisi meninjau urgensi kebutuhan dan ketersediaan anggaran.
3. Jika ditolak, formulir dikembalikan ke Pemohon beserta catatan revisi.
4. Jika disetujui, Bagian Pengadaan mencari vendor dan membandingkan harga.
5. Vendor terpilih mengirimkan barang pesanan ke kantor.
6. Pemohon menerima barang dan menandatangani berita acara penerimaan.`;

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textContent.trim() || isLoading) return;
    onProcessText(textContent);
  };

  const handleFileSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile || isLoading) return;
    onProcessFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'text'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Input Teks Langsung
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'file'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Unggah File (PDF/TXT)
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        {activeTab === 'text' ? (
          <form onSubmit={handleTextSubmit} className="flex-1 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">Teks Narasi / Butir SOP</label>
              <button
                type="button"
                onClick={() => setTextContent(sampleSop)}
                className="text-[11px] text-blue-600 hover:underline"
              >
                Gunakan Contoh SOP
              </button>
            </div>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Tempelkan butir prosedur atau narasi SOP di sini..."
              rows={14}
              className="w-full flex-1 p-3 text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={isLoading || !textContent.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengekstrak Logika Graf...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Sintesis ke BPMN 2.0
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleFileSubmit} className="flex-1 flex flex-col gap-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
              />
              <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Klik atau tarik dokumen ke area ini
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Mendukung format .PDF dan .TXT</p>

              {selectedFile && (
                <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-xs">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-slate-700 max-w-[200px] truncate">
                    {selectedFile.name}
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !selectedFile}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengekstrak Dokumen...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Proses File Dokumen
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
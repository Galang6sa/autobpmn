import React, { useState } from 'react';
import BpmnViewer from './components/BpmnViewer';

export default function App() {
  const [bpmnXml, setBpmnXml] = useState('');
  const [processName, setProcessName] = useState('SOP Verifikasi Tagihan');

  // Contoh fungsi pemanggilan API backend FastAPI
  const handleProcessSop = async (inputText) => {
    const res = await fetch('http://localhost:8000/api/v1/pipeline/process-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: processName,
        text_content: inputText,
      }),
    });
    const data = await res.json();
    setBpmnXml(data.bpmn_xml);
    setProcessName(data.process_name);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">AutoBPMN Prototype</h1>
          <p className="text-xs text-slate-500">Angel Innovation Challenge - UII 2026</p>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Input Teks / Upload SOP */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Input Dokumen SOP</h2>
          {/* Komponen SopUploader / Textarea */}
        </div>

        {/* Kolom Kanan: Kanvas Interaktif BPMN */}
        <div className="lg:col-span-2 min-h-[550px] flex">
          <BpmnViewer xml={bpmnXml} processName={processName} />
        </div>
      </main>
    </div>
  );
}
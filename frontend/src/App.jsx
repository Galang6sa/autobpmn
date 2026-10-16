import React, { useState } from 'react';
import BpmnViewer from './components/BpmnViewer';
import SopUploader from './components/SopUploader';
import ValidationBadge from './components/ValidationBadge';
import GraphJsonEditor from './components/GraphJsonEditor';
import { processSopText, processSopFile } from './services/api';

export default function App() {
  const [bpmnXml, setBpmnXml] = useState('');
  const [processName, setProcessName] = useState('');
  const [validation, setValidation] = useState(null);
  const [intermediateGraph, setIntermediateGraph] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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
      handleResult(await processSopText(text, 'Dokumen SOP'));
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
      handleResult(await processSopFile(file));
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memproses berkas SOP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__brand">
          <div className="app-header__logo">B</div>
          <span className="app-header__title">AutoBPMN</span>
          <span className="app-header__subtitle">SOP → BPMN 2.0 Engine</span>
        </div>
        <div className="app-header__status">
          <span className="app-header__dot" />
          <span>API Connected</span>
        </div>
      </header>

      {/* Body */}
      <div className="app-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar__header">
            <div className="sidebar__title">Input Dokumen</div>
          </div>
          <div className="sidebar__content">
            <SopUploader
              onProcessText={handleProcessText}
              onProcessFile={handleProcessFile}
              isLoading={isLoading}
            />

            {errorMessage && (
              <div className="error-banner">
                <svg className="error-banner__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <BpmnViewer xml={bpmnXml} processName={processName} />
        </main>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import {
  FileCode2, Plus, X, Upload, Download,
  ChevronDown, FileJson, Image, Check, Edit2,
  FolderOpen
} from 'lucide-react';

/**
 * FileTabBar
 * VS Code style tab bar untuk multi-file management diagram BPMN.
 * Mendukung multiple tabs, switch tab, tutup tab, buat berkas baru, impor, dan ekspor.
 */
export default function FileTabBar({
  files = [],
  activeFileId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onImportFile,
  onExport,
  onRenameTab,
}) {
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const renameInputRef = useRef(null);
  const exportDropdownRef = useRef(null);
  const tabListRef = useRef(null);

  // Auto focus input when renaming tab
  useEffect(() => {
    if (editingTabId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingTabId]);

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    if (exportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen]);

  const handleStartRename = (e, file) => {
    e.stopPropagation();
    setEditingTabId(file.id);
    setEditingName(file.name);
  };

  const handleFinishRename = () => {
    if (editingTabId && editingName.trim()) {
      let finalName = editingName.trim();
      if (!finalName.endsWith('.bpmn') && !finalName.endsWith('.xml') && !finalName.endsWith('.json')) {
        finalName += '.bpmn';
      }
      onRenameTab(editingTabId, finalName);
    }
    setEditingTabId(null);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFinishRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingTabId(null);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onImportFile(selectedFile);
    }
    e.target.value = ''; // Reset input
  };

  // Drag & drop file handler onto the tab bar
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onImportFile(droppedFile);
    }
  };

  return (
    <div
      className={`vscode-tabbar ${isDragOver ? 'vscode-tabbar--dragover' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="tablist"
      aria-label="Daftar berkas BPMN terbuka"
    >
      {/* Scrollable Tabs Container */}
      <div className="vscode-tabbar__tabs" ref={tabListRef}>
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = file.id === editingTabId;

          return (
            <div
              key={file.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`vscode-tab ${isActive ? 'vscode-tab--active' : ''} ${
                file.isDirty ? 'vscode-tab--dirty' : ''
              }`}
              onClick={() => onSelectTab(file.id)}
              onDoubleClick={(e) => handleStartRename(e, file)}
              title={`${file.name}${file.isDirty ? ' (Belum disimpan)' : ''} - Klik ganda untuk ganti nama`}
            >
              {/* File Icon */}
              <FileCode2 size={13} className="vscode-tab__icon" />

              {/* Title / Inline Rename */}
              {isEditing ? (
                <input
                  ref={renameInputRef}
                  type="text"
                  className="vscode-tab__rename-input"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleFinishRename}
                  onKeyDown={handleRenameKeyDown}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="vscode-tab__title">{file.name}</span>
              )}

              {/* Dirty Indicator (Dot) or Close Button */}
              <div className="vscode-tab__controls">
                {file.isDirty && !isEditing && (
                  <span className="vscode-tab__dirty-dot" title="Berkas telah dimodifikasi" />
                )}
                <button
                  type="button"
                  className="vscode-tab__close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(file.id);
                  }}
                  title="Tutup berkas (Ctrl+W)"
                  aria-label={`Tutup ${file.name}`}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add New Tab Button */}
        <button
          type="button"
          className="vscode-tabbar__add-btn"
          onClick={onNewTab}
          title="Buat diagram BPMN baru (+)"
          aria-label="Buat diagram baru"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Tab Bar Action Bar (Import & Export) */}
      <div className="vscode-tabbar__actions">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".bpmn,.xml,.json"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />

        {/* Import Button */}
        <button
          type="button"
          className="vscode-tabbar__action-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Buka atau impor berkas (.bpmn, .xml, .json)"
          aria-label="Buka atau impor berkas"
        >
          <FolderOpen size={13} />
          <span>Buka Berkas</span>
        </button>
      </div>
    </div>
  );
}

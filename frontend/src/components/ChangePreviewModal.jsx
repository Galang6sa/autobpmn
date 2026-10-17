import React, { useEffect } from 'react';
import {
  Sparkles, CheckCircle2, AlertTriangle, X,
  ArrowRight, Plus, Trash2, Edit3, ShieldCheck
} from 'lucide-react';
import Keycap from './Keycap';

/**
 * ChangePreviewModal
 * Menampilkan preview perubahan (patch diff) sebelum diterapkan ke diagram utama.
 * Memungkinkan Business Analyst memvalidasi operasi yang diajukan AI atau editor.
 */
export default function ChangePreviewModal({
  isOpen,
  previewData, // { patch, is_valid, validation_issues, diff_summary, projected_graph, bpmn_xml }
  onApply,
  onDiscard,
  isLoading = false,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDiscard();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (previewData?.is_valid && !isLoading) {
          e.preventDefault();
          onApply(previewData);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, previewData, isLoading, onApply, onDiscard]);

  if (!isOpen || !previewData) return null;

  const { patch, is_valid, validation_issues = [], diff_summary = {} } = previewData;
  const {
    added_nodes = [],
    removed_nodes = [],
    updated_nodes = [],
    added_edges = [],
    removed_edges = [],
  } = diff_summary;

  const totalChanges =
    added_nodes.length +
    removed_nodes.length +
    updated_nodes.length +
    added_edges.length +
    removed_edges.length;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onDiscard();
      }}
    >
      <div className="preview-modal">
        {/* Header */}
        <div className="preview-modal__header">
          <div className="preview-modal__title-group">
            <span className="preview-modal__badge">
              <Sparkles size={13} className="preview-modal__icon" />
              <span>Usulan Perubahan AI</span>
            </span>
            <h2 id="preview-modal-title" className="preview-modal__title">
              {patch?.description || 'Revisi Struktur Diagram BPMN'}
            </h2>
          </div>
          <button
            type="button"
            className="preview-modal__close-btn"
            onClick={onDiscard}
            disabled={isLoading}
            aria-label="Tutup preview perubahan"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="preview-modal__content">
          {/* Rationale & Target Nodes */}
          {patch?.rationale && (
            <div className="preview-modal__rationale">
              <span className="preview-modal__rationale-label">Alasan / Konteks:</span>
              <p className="preview-modal__rationale-text">{patch.rationale}</p>
            </div>
          )}

          {patch?.target_node_ids?.length > 0 && (
            <div className="preview-modal__targets">
              <span className="preview-modal__targets-label">Node Terkait:</span>
              <div className="preview-modal__target-tags">
                {patch.target_node_ids.map((id) => (
                  <span key={id} className="preview-modal__target-tag">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Validation Status Banner */}
          <div
            className={`preview-modal__status-banner ${
              is_valid
                ? 'preview-modal__status-banner--valid'
                : 'preview-modal__status-banner--invalid'
            }`}
          >
            <div className="preview-modal__status-header">
              {is_valid ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="font-medium text-emerald-800">
                    Struktur BPMN Valid
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span className="font-medium text-amber-800">
                    Struktur Diagram Perlu Perbaikan
                  </span>
                </>
              )}
            </div>
            <p className="preview-modal__status-desc">
              {is_valid
                ? 'Seluruh relasi inbound/outbound konsisten. Tidak ditemukan deadlock atau orphan node.'
                : 'Perubahan ini melanggar kaidah BPMN. Harap tinjau masalah di bawah ini sebelum menerapkan:'}
            </p>
            {validation_issues.length > 0 && (
              <ul className="preview-modal__issues-list">
                {validation_issues.map((issue, idx) => (
                  <li key={idx} className="preview-modal__issue-item">
                    • {issue}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Diff Summary */}
          <div className="preview-modal__diff-section">
            <div className="preview-modal__diff-header">
              <span className="preview-modal__diff-title">
                Rincian Perubahan ({totalChanges} Operasi)
              </span>
            </div>

            <div className="preview-modal__diff-list">
              {/* Added Nodes */}
              {added_nodes.map((node) => (
                <div key={node.id} className="diff-item diff-item--add">
                  <div className="diff-item__badge diff-item__badge--add">
                    <Plus size={11} /> Tambah Node
                  </div>
                  <div className="diff-item__info">
                    <span className="diff-item__title">{node.name || node.id}</span>
                    <span className="diff-item__meta">
                      Tipe: {node.type} {node.actor ? `• Pelaksana: ${node.actor}` : ''}
                    </span>
                  </div>
                </div>
              ))}

              {/* Updated Nodes */}
              {updated_nodes.map((item) => (
                <div key={item.node_id} className="diff-item diff-item--update">
                  <div className="diff-item__badge diff-item__badge--update">
                    <Edit3 size={11} /> Ubah Properti
                  </div>
                  <div className="diff-item__info">
                    <span className="diff-item__title">{item.node_id}</span>
                    <div className="diff-item__changes">
                      {item.changes &&
                        Object.entries(item.changes).map(([k, val]) => (
                          <div key={k} className="diff-item__change-row">
                            <span className="diff-item__field">{k}:</span>
                            <span className="diff-item__old">{val.before || '—'}</span>
                            <ArrowRight size={11} className="diff-item__arrow" />
                            <span className="diff-item__new">{val.after || '—'}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Removed Nodes */}
              {removed_nodes.map((node) => (
                <div key={node.id} className="diff-item diff-item--remove">
                  <div className="diff-item__badge diff-item__badge--remove">
                    <Trash2 size={11} /> Hapus Node
                  </div>
                  <div className="diff-item__info">
                    <span className="diff-item__title">{node.name || node.id}</span>
                    <span className="diff-item__meta">ID: {node.id} ({node.type})</span>
                  </div>
                </div>
              ))}

              {/* Added Edges */}
              {added_edges.map((edge, idx) => (
                <div key={idx} className="diff-item diff-item--add">
                  <div className="diff-item__badge diff-item__badge--add">
                    <Plus size={11} /> Alur Baru
                  </div>
                  <div className="diff-item__info">
                    <span className="diff-item__title">
                      {edge.from_node} → {edge.to_node}
                    </span>
                    {edge.condition && (
                      <span className="diff-item__meta">Kondisi: {edge.condition}</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Removed Edges */}
              {removed_edges.map((edge, idx) => (
                <div key={idx} className="diff-item diff-item--remove">
                  <div className="diff-item__badge diff-item__badge--remove">
                    <Trash2 size={11} /> Putus Alur
                  </div>
                  <div className="diff-item__info">
                    <span className="diff-item__title">
                      {edge.from_node} → {edge.to_node}
                    </span>
                  </div>
                </div>
              ))}

              {totalChanges === 0 && (
                <div className="preview-modal__empty-diff">
                  Tidak ada perubahan struktural pada patch ini.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="preview-modal__footer">
          <div className="preview-modal__footer-left">
            <span className="preview-modal__hotkey-hint">
              <Keycap>Esc</Keycap> Batalkan • <Keycap>Ctrl+Enter</Keycap> Terapkan
            </span>
          </div>

          <div className="preview-modal__footer-right">
            <button
              type="button"
              className="toolbar-btn"
              onClick={onDiscard}
              disabled={isLoading}
            >
              Batalkan (Discard)
            </button>
            <button
              type="button"
              className="toolbar-btn toolbar-btn--primary"
              onClick={() => onApply(previewData)}
              disabled={!is_valid || isLoading}
              title={
                !is_valid
                  ? 'Patch tidak dapat diterapkan karena struktur tidak valid'
                  : 'Terapkan perubahan ke kanvas BPMN dan intermediate graph'
              }
            >
              <CheckCircle2 size={13} />
              <span>{isLoading ? 'Menerapkan...' : 'Terapkan (Apply)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

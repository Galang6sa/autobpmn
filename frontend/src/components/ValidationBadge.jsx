import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react';

export default function ValidationBadge({ validation }) {
  if (!validation) return null;

  const { is_valid, issues = [], deadlocks = [], orphan_nodes = [] } = validation;

  return (
    <div
      className={`p-3.5 rounded-xl border text-xs ${
        is_valid
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-rose-50/70 border-rose-200 text-rose-900'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {is_valid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold text-xs tracking-tight">
            {is_valid ? 'Logika Alur Tervalidasi (Executable)' : 'Anomali Logika Terdeteksi'}
          </span>
        </div>
        <span
          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
            is_valid ? 'bg-emerald-200/60 text-emerald-800' : 'bg-rose-200/60 text-rose-800'
          }`}
        >
          {is_valid ? 'Valid' : 'Invalid'}
        </span>
      </div>

      {!is_valid && (
        <div className="space-y-2 mt-2 pt-2 border-t border-rose-200/60">
          {deadlocks.length > 0 && (
            <div className="flex items-start gap-1.5 text-rose-800">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Deadlock Node:</strong> {deadlocks.join(', ')} (berhenti tanpa jalur keluar)
              </span>
            </div>
          )}

          {orphan_nodes.length > 0 && (
            <div className="flex items-start gap-1.5 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Orphan Node:</strong> {orphan_nodes.join(', ')} (tidak terjangkau alur masuk)
              </span>
            </div>
          )}

          {issues.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700/90 pl-1">
              {issues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
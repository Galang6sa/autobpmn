import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';

export default function GraphJsonEditor({ graphData }) {
  const [copied, setCopied] = useState(false);

  const formattedJson = graphData ? JSON.stringify(graphData, null, 2) : '{}';

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono">
          <Code className="w-3.5 h-3.5 text-blue-400" />
          <span>intermediate_graph.json</span>
        </div>
        <button
          onClick={handleCopy}
          disabled={!graphData}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition disabled:opacity-40"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Salin JSON</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 p-3 overflow-auto">
        <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed">
          {formattedJson}
        </pre>
      </div>
    </div>
  );
}
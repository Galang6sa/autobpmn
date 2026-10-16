import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function GraphJsonEditor({ graphData }) {
  const [copied, setCopied] = useState(false);
  const json = graphData ? JSON.stringify(graphData, null, 2) : '{}';

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="json-preview">
      <div className="json-preview__header">
        <span className="json-preview__label">intermediate_graph.json</span>
        <button
          onClick={handleCopy}
          disabled={!graphData}
          className="toolbar-btn"
          style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: 10 }}
        >
          {copied
            ? <><Check style={{ width: 12, height: 12, color: '#10b981' }} /> Copied</>
            : <><Copy style={{ width: 12, height: 12 }} /> Copy</>
          }
        </button>
      </div>
      <div className="json-preview__body">
        <pre className="json-preview__code">{json}</pre>
      </div>
    </div>
  );
}
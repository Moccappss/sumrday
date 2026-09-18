import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { callGemini } from '../../utils/ai';

const AiMagicButton = ({ onSuggest, prompt, systemInstruction, label = "AI Sugesti" }) => {
  const [isThinking, setIsThinking] = useState(false);

  const handleMagic = async () => {
    setIsThinking(true);
    try {
      const result = await callGemini(prompt, systemInstruction);
      if (result) onSuggest(result.trim());
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <button
      onClick={handleMagic}
      disabled={isThinking}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 100, border: 'none',
        background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)',
        fontSize: 10, fontWeight: 900, cursor: 'pointer',
        transition: 'all 0.3s ease', opacity: isThinking ? 0.7 : 1,
        whiteSpace: 'nowrap'
      }}
    >
      {isThinking ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
      {isThinking ? 'BERPIKIR...' : label}
    </button>
  );
};

export default AiMagicButton;

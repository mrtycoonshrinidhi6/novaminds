
import React from 'react';

interface VisualOutputProps {
  visuals: {
    type: string;
    content: string;
    title: string;
  }[];
}

const VisualOutput: React.FC<VisualOutputProps> = ({ visuals }) => {
  if (visuals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
        <i className="fa-solid fa-image text-4xl opacity-20"></i>
        <p className="italic">Visual assets will appear here as the UI Agent designs them.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {visuals.map((visual, idx) => (
        <div key={idx} className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-lg font-bold text-slate-300">{visual.title}</h3>
            <span className="text-[10px] font-bold bg-slate-800 text-slate-500 px-2 py-1 rounded uppercase tracking-widest">
              {visual.type}
            </span>
          </div>
          
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl p-8 flex items-center justify-center min-h-[400px]">
            {/* Sanitize SVG slightly or just inject */}
            <div 
              className="w-full max-w-4xl"
              dangerouslySetInnerHTML={{ __html: visual.content.replace(/```svg/g, '').replace(/```/g, '') }} 
            />
          </div>
          
          <div className="flex justify-end">
            <button className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center space-x-2">
              <i className="fa-solid fa-download"></i>
              <span>Export as SVG</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VisualOutput;

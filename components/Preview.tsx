import React, { useMemo, useState } from 'react';
import { ProjectFile } from '../types';

interface PreviewProps {
  files: ProjectFile[];
}

const Preview: React.FC<PreviewProps> = ({ files }) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const combinedContent = useMemo(() => {
    const htmlFile = files.find(f => f.path.endsWith('index.html')) || files.find(f => f.path.endsWith('.html'));
    
    if (!htmlFile) return null;

    let content = htmlFile.content;

    // Inject CSS
    files.forEach(file => {
      if (file.path.endsWith('.css')) {
        const cssContent = `<style>\n${file.content}\n</style>`;
        if (content.includes('</head>')) {
          content = content.replace('</head>', `${cssContent}\n</head>`);
        } else {
          content = cssContent + content;
        }
      }
    });

    // Inject JS
    files.forEach(file => {
      if (file.path.endsWith('.js') || (file.path.endsWith('.tsx') && !file.path.includes('App.tsx'))) {
        const jsContent = `<script>\n${file.content}\n</script>`;
        if (content.includes('</body>')) {
          content = content.replace('</body>', `${jsContent}\n</body>`);
        } else {
          content += jsContent;
        }
      }
    });

    return content;
  }, [files]);

  if (!combinedContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-6 animate-in fade-in duration-700">
        <div className="relative">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-800 shadow-2xl">
            <i className="fa-solid fa-ghost text-4xl opacity-20"></i>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full animate-ping"></div>
        </div>
        <div className="text-center max-w-xs">
          <p className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">No Build Detected</p>
          <p className="text-sm italic">The engineering agents need to generate an <span className="text-indigo-400 font-mono">index.html</span> file before a live build can be rendered.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Browser Controls */}
      <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 ml-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
          </div>
          <div className="h-4 w-px bg-slate-800 mx-2"></div>
          <div className="bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-3 min-w-[300px]">
            <i className="fa-solid fa-lock text-[10px] text-emerald-500"></i>
            <span className="text-[10px] font-mono text-slate-500 tracking-tight truncate">https://novaminds.build/sandbox/v1</span>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setViewMode('desktop')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <i className="fa-solid fa-desktop text-xs"></i>
          </button>
          <button 
            onClick={() => setViewMode('mobile')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <i className="fa-solid fa-mobile-screen text-xs"></i>
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 flex justify-center bg-slate-950 rounded-[2rem] border border-slate-800/50 shadow-inner overflow-hidden relative">
        <div 
          className={`transition-all duration-500 ease-in-out bg-white shadow-2xl relative ${
            viewMode === 'mobile' ? 'w-[375px] h-[667px] mt-10 rounded-[3rem] ring-8 ring-slate-900 border-4 border-slate-800' : 'w-full h-full'
          }`}
        >
          {viewMode === 'mobile' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20"></div>
          )}
          <iframe
            title="NovaMinds Build Preview"
            srcDoc={combinedContent}
            className="w-full h-full border-none"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
};

export default Preview;
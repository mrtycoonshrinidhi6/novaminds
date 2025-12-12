
import React from 'react';
import { ProjectFile } from '../types';

interface FileExplorerProps {
  files: ProjectFile[];
  onSelect: (file: ProjectFile) => void;
  activeFile: ProjectFile | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, onSelect, activeFile }) => {
  if (files.length === 0) {
    return <div className="text-slate-600 text-sm italic p-4 text-center">No files generated.</div>;
  }

  const getIcon = (path: string) => {
    if (path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.tsx')) return 'fa-brands fa-js-square text-yellow-400';
    if (path.endsWith('.py')) return 'fa-brands fa-python text-blue-400';
    if (path.endsWith('.html')) return 'fa-brands fa-html5 text-orange-500';
    if (path.endsWith('.css')) return 'fa-brands fa-css3-alt text-blue-500';
    if (path.endsWith('.json')) return 'fa-solid fa-brackets-curly text-indigo-400';
    if (path.endsWith('.md')) return 'fa-solid fa-file-lines text-slate-400';
    return 'fa-solid fa-file text-slate-400';
  };

  return (
    <div className="space-y-1">
      <h3 className="px-2 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-between">
        <span>Project Files</span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[9px]">{files.length}</span>
      </h3>
      <div className="max-h-[500px] overflow-auto pr-2">
        {files.map((file) => (
          <button
            key={file.path}
            onClick={() => onSelect(file)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center space-x-3 transition group ${
              activeFile?.path === file.path ? 'bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`${getIcon(file.path)} w-4`}></i>
            <span className="truncate">{file.path}</span>
            <i className={`fa-solid fa-chevron-right text-[10px] ml-auto transition-opacity ${activeFile?.path === file.path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></i>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;

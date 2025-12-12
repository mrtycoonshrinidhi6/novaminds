
import React from 'react';
import { AgentStatus } from '../types';

interface HeaderProps {
  prompt: string;
  setPrompt: (p: string) => void;
  onRun: () => void;
  isProcessing: boolean;
  status: AgentStatus;
}

const Header: React.FC<HeaderProps> = ({ prompt, setPrompt, onRun, isProcessing, status }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center px-6 justify-between shrink-0">
      <div className="flex items-center space-x-4 flex-1 max-w-4xl">
        <div className="relative flex-1">
          <i className="fa-solid fa-wand-magic-sparkles absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
          <input 
            type="text" 
            placeholder="Describe the app or research task you want to build..." 
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isProcessing}
            onKeyDown={(e) => e.key === 'Enter' && onRun()}
          />
        </div>
        <button 
          onClick={onRun}
          disabled={isProcessing || !prompt.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium text-sm transition flex items-center space-x-2"
        >
          {isProcessing ? (
            <>
              <i className="fa-solid fa-spinner animate-spin"></i>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-play"></i>
              <span>Build</span>
            </>
          )}
        </button>
      </div>
      
      <div className="flex items-center space-x-3 ml-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Status</span>
          <span className={`text-sm font-semibold ${status === AgentStatus.FAILED ? 'text-red-400' : 'text-emerald-400'}`}>
            {status.replace('_', ' ')}
          </span>
        </div>
        <div className={`w-3 h-3 rounded-full ${status === AgentStatus.IDLE ? 'bg-slate-600' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse'}`}></div>
      </div>
    </header>
  );
};

export default Header;

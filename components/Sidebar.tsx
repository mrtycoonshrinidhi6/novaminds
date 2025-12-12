import React from 'react';
import { AgentStatus, AgentLog } from '../types';

interface SidebarProps {
  status: AgentStatus;
  logs: AgentLog[];
  onReset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ status, logs, onReset }) => {
  const agents = [
    { name: 'Planner', icon: 'fa-solid fa-brain', color: 'text-purple-400' },
    { name: 'Coder', icon: 'fa-solid fa-code', color: 'text-blue-400' },
    { name: 'Tester', icon: 'fa-solid fa-vial', color: 'text-emerald-400' },
    { name: 'Designer', icon: 'fa-solid fa-palette', color: 'text-pink-400' },
    { name: 'Assembler', icon: 'fa-solid fa-box-open', color: 'text-amber-400' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-microchip text-white"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight">NovaMinds</h1>
        </div>

        <nav className="space-y-6">
          <div className="space-y-2">
            <button 
              onClick={onReset}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition group border border-slate-700/50"
            >
              <i className="fa-solid fa-plus-circle text-indigo-400 group-hover:scale-110 transition-transform"></i>
              <span className="text-xs font-black uppercase tracking-widest">New Project</span>
            </button>
          </div>

          <div>
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Pipeline Agents</h2>
            <ul className="space-y-3">
              {agents.map(agent => (
                <li key={agent.name} className="flex items-center space-x-3 text-slate-400 hover:text-white transition cursor-default">
                  <div className={`w-2 h-2 rounded-full ${status === agent.name.toUpperCase() as any ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                  <i className={`${agent.icon} ${agent.color} text-sm w-4`}></i>
                  <span className="text-sm font-medium">{agent.name}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="pt-6 border-t border-slate-800">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-indigo-300/60 flex items-center space-x-2">
              <i className="fa-solid fa-database text-[8px]"></i>
              <span>Auto-Save Enabled</span>
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs text-slate-500">Stability Score</span>
                <span className="text-xs font-mono text-emerald-400">98.4%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[98.4%]"></div>
              </div>
              
              <div className="flex justify-between items-end">
                <span className="text-xs text-slate-500">Session Memory</span>
                <span className="text-xs font-mono text-indigo-400">Cached</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div className="mt-auto p-4 bg-slate-950/50">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
           <div className="flex items-center space-x-2 mb-2">
             <i className="fa-solid fa-circle-info text-indigo-400 text-xs"></i>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage Info</span>
           </div>
           <p className="text-[11px] text-slate-500 leading-relaxed">
             Project snapshots are automatically persisted to local storage. Refreshing the browser will not reset your progress.
           </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useEffect, useRef } from 'react';
import { AgentLog } from '../types';

interface TerminalProps {
  logs: AgentLog[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0; // Logs are prepended, so top is most recent
    }
  }, [logs]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono text-xs space-y-1.5">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start space-x-3 animate-in fade-in slide-in-from-left-2 duration-300">
          <span className="text-slate-600 shrink-0">
            [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
          </span>
          <span className={`font-bold shrink-0 uppercase tracking-tighter w-20 ${
            log.agent === 'Planner' ? 'text-purple-400' :
            log.agent === 'Coder' ? 'text-blue-400' :
            log.agent === 'Tester' ? 'text-emerald-400' :
            log.agent === 'Designer' ? 'text-pink-400' : 'text-slate-400'
          }`}>
            {log.agent}:
          </span>
          <span className={`${
            log.type === 'error' ? 'text-red-400' :
            log.type === 'warning' ? 'text-amber-400' :
            log.type === 'success' ? 'text-emerald-300' : 'text-slate-300'
          }`}>
            {log.message}
          </span>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="flex items-center space-x-2 text-slate-600 italic">
          <span className="animate-pulse">_</span>
          <span>Waiting for agent initiation...</span>
        </div>
      )}
    </div>
  );
};

export default Terminal;

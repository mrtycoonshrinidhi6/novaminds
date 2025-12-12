import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PlanStep } from '../types';

interface PlanViewerProps {
  steps: PlanStep[];
  onDelete: (id: string) => void;
  onAddStep: (step: Omit<PlanStep, 'status'>) => void;
  onEditStep: (step: PlanStep) => void;
  onReorderSteps: (steps: PlanStep[]) => void;
  onUpdateStatus: (id: string, status: PlanStep['status']) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExecute: () => void;
  isProcessing: boolean;
}

const PlanViewer: React.FC<PlanViewerProps> = ({ 
  steps, 
  onDelete, 
  onAddStep,
  onEditStep,
  onReorderSteps,
  onUpdateStatus,
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo, 
  onExecute,
  isProcessing 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStep, setNewStep] = useState({ title: '', description: '', dependencies: [] as string[] });
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PlanStep | null>(null);
  const [coords, setCoords] = useState<Record<string, { x: number, y: number, h: number }>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Logic to calculate the absolute position of each step for drawing dependency lines
  const updateCoords = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newCoords: Record<string, { x: number, y: number, h: number }> = {};

    steps.forEach((step) => {
      const el = stepRefs.current[step.id];
      if (el) {
        const rect = el.getBoundingClientRect();
        newCoords[step.id] = {
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          h: rect.height
        };
      }
    });
    setCoords(newCoords);
  };

  useEffect(() => {
    updateCoords();
    const timer = setTimeout(updateCoords, 400); // Wait for expansion/collapse animations
    window.addEventListener('resize', updateCoords);
    const observer = new ResizeObserver(updateCoords);
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateCoords);
      observer.disconnect();
    };
  }, [steps, isProcessing, expandedStepId]);

  const progress = steps.length > 0 ? (steps.filter(s => s.status === 'done').length / steps.length) * 100 : 0;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStep.title.trim()) return;

    onAddStep({
      id: `step-${Date.now()}`,
      title: newStep.title,
      description: newStep.description,
      dependencies: newStep.dependencies
    });

    setShowAddModal(false);
    setNewStep({ title: '', description: '', dependencies: [] });
  };

  const handleEditClick = (step: PlanStep) => {
    if (isProcessing) return;
    if (expandedStepId === step.id) {
      setExpandedStepId(null);
      setEditForm(null);
    } else {
      setExpandedStepId(step.id);
      setEditForm({ ...step });
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isProcessing) { e.preventDefault(); return; }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newSteps = [...steps];
    const [moved] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(index, 0, moved);
    onReorderSteps(newSteps);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Generate the SVG paths representing the "Walkthrough" flow logic
  const dependencyPaths = useMemo(() => {
    const paths: React.ReactElement[] = [];
    steps.forEach((step) => {
      const target = coords[step.id];
      if (!target) return;

      step.dependencies.forEach((depId) => {
        const source = coords[depId];
        if (!source) return;

        const startX = source.x; 
        const startY = source.y + source.h / 2;
        const endX = target.x; 
        const endY = target.y + 10; 

        const controlX = Math.min(startX, endX) - 50;
        const d = `M ${startX} ${startY} Q ${controlX} ${(startY + endY) / 2} ${endX} ${endY}`;
        
        const depStep = steps.find(s => s.id === depId);
        const isActive = depStep?.status === 'done';
        const isRelated = hoveredStepId === step.id || hoveredStepId === depId;

        paths.push(
          <g key={`${depId}-${step.id}`} className="transition-all duration-300">
            {isActive && (
              <path
                d={d}
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeOpacity="0.1"
                className="blur-sm"
              />
            )}
            <path
              d={d}
              fill="none"
              stroke={isActive ? '#10b981' : isRelated ? '#818cf8' : '#6366f1'}
              strokeWidth={isRelated ? "2.5" : "1.5"}
              strokeOpacity={isActive ? '0.6' : isRelated ? '0.8' : '0.2'}
              strokeDasharray={isActive ? 'none' : '4 2'}
              markerEnd={`url(#arrowhead-${isActive ? 'done' : isRelated ? 'highlight' : 'default'})`}
              className="transition-all duration-500"
            />
          </g>
        );
      });
    });
    return paths;
  }, [steps, coords, hoveredStepId]);

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
          <i className="fa-solid fa-route text-3xl opacity-30"></i>
        </div>
        <p className="italic font-medium">No engineering plan generated. Please submit a request.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 relative" ref={containerRef}>
      {/* Visual Overlay for Dependencies */}
      <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible">
        <defs>
          <marker id="arrowhead-default" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6366f1" opacity="0.2" />
          </marker>
          <marker id="arrowhead-done" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#10b981" opacity="0.6" />
          </marker>
          <marker id="arrowhead-highlight" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#818cf8" opacity="0.8" />
          </marker>
        </defs>
        {dependencyPaths}
      </svg>

      {/* Persistence and Control Header */}
      <div className="sticky top-0 z-30 flex flex-col space-y-3">
        <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-xl p-3 rounded-2xl border border-slate-800/60 shadow-2xl ring-1 ring-white/5">
          <div className="flex items-center space-x-2">
            <div className="flex p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <button 
                onClick={onUndo} 
                disabled={!canUndo || isProcessing}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-700 disabled:opacity-20 text-slate-300 transition-all active:scale-95"
                title="Undo Change"
              >
                <i className="fa-solid fa-arrow-rotate-left"></i>
              </button>
              <button 
                onClick={onRedo} 
                disabled={!canRedo || isProcessing}
                className="p-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-700 disabled:opacity-20 text-slate-300 transition-all active:scale-95"
                title="Redo Change"
              >
                <i className="fa-solid fa-arrow-rotate-right"></i>
              </button>
            </div>
            <div className="h-6 w-px bg-slate-800 mx-2"></div>
            <button 
              onClick={() => setShowAddModal(true)}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-500/5 active:scale-95"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add Custom Milestone</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={onExecute}
              disabled={isProcessing || steps.every(s => s.status === 'done')}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center space-x-2 disabled:opacity-30 active:scale-95"
            >
              <i className={`fa-solid ${isProcessing ? 'fa-spinner animate-spin' : 'fa-bolt'}`}></i>
              <span>{isProcessing ? 'Agent Active' : 'Begin Pipeline Build'}</span>
            </button>
          </div>
        </div>
        
        <div className="w-full h-1 bg-slate-800/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(99,102,241,0.4)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Architecture Roadmap Content */}
      <div className="space-y-4 relative z-10 pl-10">
        {steps.map((step, idx) => (
          <div 
            key={step.id} 
            ref={function handleRef(el) {
              // React 19 Ref Callback: Must return undefined to avoid Error #310
              stepRefs.current[step.id] = el;
            }}
            draggable={!isProcessing}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onMouseEnter={() => setHoveredStepId(step.id)}
            onMouseLeave={() => setHoveredStepId(null)}
            className={`group relative rounded-2xl border transition-all duration-500 transform-gpu ${
              dragOverIndex === idx ? 'border-indigo-400 border-dashed scale-[1.02] bg-indigo-500/5' : 
              draggedIndex === idx ? 'opacity-20 scale-95 blur-sm' :
              expandedStepId === step.id ? 'bg-slate-900 border-slate-700 shadow-2xl scale-[1.01] ring-1 ring-white/10' :
              step.status === 'running' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5' :
              step.status === 'done' ? 'bg-emerald-500/[0.03] border-emerald-500/20' :
              'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'
            }`}
          >
            <div 
              className="p-5 flex items-start space-x-5 cursor-pointer select-none"
              onClick={() => handleEditClick(step)}
            >
              <div className="mt-1 flex-shrink-0 relative">
                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center font-black text-xs transition-all duration-500 ${
                  step.status === 'running' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/20 animate-pulse scale-110 shadow-[0_0_15px_rgba(99,102,241,0.3)]' :
                  step.status === 'done' ? 'border-emerald-500 bg-emerald-500 text-slate-950' :
                  step.status === 'failed' ? 'border-red-500 bg-red-500/20 text-red-400' :
                  'border-slate-700 text-slate-500 bg-slate-800/50'
                }`}>
                  {step.status === 'done' ? <i className="fa-solid fa-check"></i> : 
                   step.status === 'failed' ? <i className="fa-solid fa-triangle-exclamation"></i> : 
                   idx + 1}
                </div>
                {step.status === 'running' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-900 animate-ping"></span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-bold tracking-tight text-base transition-colors truncate ${
                    step.status === 'running' ? 'text-indigo-200' : 
                    step.status === 'done' ? 'text-slate-200' : 
                    step.status === 'failed' ? 'text-red-300' :
                    'text-slate-400'
                  }`}>
                    {step.title}
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    {!isProcessing && expandedStepId !== step.id && (
                      <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-white/5 opacity-0 group-hover:opacity-100 transition-all scale-90 origin-right shadow-xl">
                        {['pending', 'running', 'done', 'failed'].map((s) => (
                          <button 
                            key={s}
                            onClick={(e) => { e.stopPropagation(); onUpdateStatus(step.id, s as any); }}
                            className={`p-1.5 rounded-md transition-all ${
                              step.status === s ? 'bg-slate-600 text-white shadow-inner' : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                            }`}
                            title={`Mark as ${s}`}
                          >
                            <i className={`fa-solid fa-${s === 'pending' ? 'clock' : s === 'running' ? 'play' : s === 'done' ? 'check' : 'xmark'} text-[10px]`}></i>
                          </button>
                        ))}
                      </div>
                    )}
                    <i className={`fa-solid fa-chevron-right text-[10px] transition-transform duration-300 ${expandedStepId === step.id ? 'rotate-90 text-indigo-400' : 'text-slate-700 group-hover:text-slate-500'}`}></i>
                  </div>
                </div>
                
                {expandedStepId !== step.id && (
                  <p className={`text-sm leading-relaxed transition-colors line-clamp-1 ${
                    step.status === 'done' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {expandedStepId === step.id && editForm && (
              <div className="px-5 pb-6 pt-2 border-t border-slate-800/50 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Technical Description</label>
                      <textarea 
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-slate-200 transition-all h-32 resize-none placeholder-slate-600 shadow-inner"
                        value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        placeholder="Define the specific logic for this module..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Module Dependency Map</label>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950/30 rounded-xl border border-white/5">
                        {steps.filter(s => s.id !== step.id).map(s => (
                          <button 
                            key={s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              const exists = editForm.dependencies.includes(s.id);
                              setEditForm({
                                ...editForm,
                                dependencies: exists 
                                  ? editForm.dependencies.filter(id => id !== s.id) 
                                  : [...editForm.dependencies, s.id]
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all active:scale-95 ${
                              editForm.dependencies.includes(s.id) 
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                                : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500'
                            }`}
                          >
                            {s.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-slate-800/30 rounded-2xl border border-white/5">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Manual Status Override</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['pending', 'running', 'done', 'failed'].map(s => (
                          <button 
                            key={s}
                            onClick={(e) => { e.stopPropagation(); setEditForm({ ...editForm, status: s as any }); }}
                            className={`px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                              editForm.status === s 
                                ? (s === 'pending' ? 'bg-slate-600 border-slate-400 text-white' : s === 'running' ? 'bg-indigo-600 border-indigo-400 text-white' : s === 'done' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-red-600 border-red-400 text-white') 
                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <i className={`fa-solid fa-${s === 'pending' ? 'clock' : s === 'running' ? 'play' : s === 'done' ? 'check' : 'xmark'} mr-2`}></i>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditStep(editForm); setExpandedStepId(null); }}
                        className="w-full py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                      >
                        Commit Manual Changes
                      </button>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExpandedStepId(null); }}
                          className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-700 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(step.id); }}
                          className="px-4 py-2.5 rounded-xl bg-red-900/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-xs"
                          title="Delete Milestone"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] p-8 ring-1 ring-white/5 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <i className="fa-solid fa-plus text-xl text-white"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight leading-none">New Architecture Node</h2>
                  <p className="text-slate-500 text-sm mt-1">Manually inject a custom engineering task.</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-800 text-slate-500 hover:text-white transition-all flex items-center justify-center">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Title</label>
                  <input 
                    autoFocus
                    required
                    type="text"
                    placeholder="e.g., Implement Redis Caching Layer"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white transition-all shadow-inner placeholder-slate-600"
                    value={newStep.title}
                    onChange={e => setNewStep(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Task Specification</label>
                  <textarea 
                    placeholder="Provide context for the coder agents..."
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white transition-all h-32 resize-none shadow-inner placeholder-slate-600"
                    value={newStep.description}
                    onChange={e => setNewStep(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Parent Dependencies</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950/30 rounded-2xl border border-white/5">
                    {steps.map(step => (
                      <label key={step.id} className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        newStep.dependencies.includes(step.id) ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-200' : 'bg-slate-800/30 border-slate-700/50 text-slate-500 hover:bg-slate-800/60'
                      }`}>
                        <input 
                          type="checkbox" 
                          className="rounded-md border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-600 h-4 w-4"
                          checked={newStep.dependencies.includes(step.id)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setNewStep(prev => ({
                              ...prev,
                              dependencies: checked 
                                ? [...prev.dependencies, step.id] 
                                : prev.dependencies.filter(id => id !== step.id)
                            }));
                          }}
                        />
                        <span className="text-xs font-bold truncate">{step.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanViewer;
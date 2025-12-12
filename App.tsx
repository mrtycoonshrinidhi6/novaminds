import React, { useState, useCallback, useEffect } from 'react';
import { AgentStatus, ProjectFile, PlanStep, AgentLog, ProjectState } from './types';
import { planningAgent, codingAgent, testingAgent, uiVisualAgent } from './geminiService';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Terminal from './components/Terminal';
import FileExplorer from './components/FileExplorer';
import PlanViewer from './components/PlanViewer';
import VisualOutput from './components/VisualOutput';
import Preview from './components/Preview';

const STORAGE_KEY = 'novaminds_project_cache_v1';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [state, setState] = useState<ProjectState>({
    status: AgentStatus.IDLE,
    plan: [],
    files: [],
    logs: [],
    visuals: []
  });
  const [activeTab, setActiveTab] = useState<'plan' | 'files' | 'visuals' | 'preview'>('plan');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);

  // Undo/Redo Engine
  const [planHistory, setPlanHistory] = useState<PlanStep[][]>([]);
  const [planFuture, setPlanFuture] = useState<PlanStep[][]>([]);

  const addLog = useCallback((agent: string, message: string, type: AgentLog['type'] = 'info') => {
    setState(prev => ({
      ...prev,
      logs: [{ id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, agent, message, timestamp: new Date(), type }, ...prev.logs]
    }));
  }, []);

  // --- Persistence Logic ---
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed: ProjectState = JSON.parse(savedState);
        parsed.logs = parsed.logs.map(log => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        setState(parsed);
        if (parsed.files.length > 0 && parsed.plan.every(p => p.status === 'done')) {
          setActiveTab('preview'); // Default to preview if build is finished
        }
      } catch (err) {
        console.error("Failed to restore NovaMinds session:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (state.plan.length > 0 || state.files.length > 0 || state.logs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const clearSession = useCallback(() => {
    if (confirm("Are you sure you want to start a new project? All current progress will be lost.")) {
      localStorage.removeItem(STORAGE_KEY);
      setState({
        status: AgentStatus.IDLE,
        plan: [],
        files: [],
        logs: [],
        visuals: []
      });
      setPrompt('');
      setActiveTab('plan');
      setSelectedFile(null);
      setPlanHistory([]);
      setPlanFuture([]);
    }
  }, []);

  const saveHistory = useCallback(() => {
    setPlanHistory(prev => [...prev, [...state.plan.map(s => ({...s}))]]);
    setPlanFuture([]);
  }, [state.plan]);

  const handleUndo = useCallback(() => {
    if (planHistory.length === 0) return;
    const previous = planHistory[planHistory.length - 1];
    setPlanFuture(prev => [[...state.plan.map(s => ({...s}))], ...prev]);
    setPlanHistory(prev => prev.slice(0, -1));
    setState(prev => ({ ...prev, plan: previous }));
    addLog('System', 'Undo successful: Restored architecture snapshot.', 'info');
  }, [planHistory, state.plan, addLog]);

  const handleRedo = useCallback(() => {
    if (planFuture.length === 0) return;
    const next = planFuture[0];
    setPlanHistory(prev => [...prev, [...state.plan.map(s => ({...s}))]]);
    setPlanFuture(prev => prev.slice(1));
    setState(prev => ({ ...prev, plan: next }));
    addLog('System', 'Redo successful: Advanced to next architecture state.', 'info');
  }, [planFuture, state.plan, addLog]);

  const handleDeleteStep = useCallback((id: string) => {
    saveHistory();
    setState(prev => ({ ...prev, plan: prev.plan.filter(s => s.id !== id) }));
  }, [saveHistory]);

  const handleAddStep = useCallback((step: Omit<PlanStep, 'status'>) => {
    saveHistory();
    setState(prev => ({ ...prev, plan: [...prev.plan, { ...step, status: 'pending' }] }));
  }, [saveHistory]);

  const handleEditStep = useCallback((updatedStep: PlanStep) => {
    saveHistory();
    setState(prev => ({
      ...prev,
      plan: prev.plan.map(s => s.id === updatedStep.id ? updatedStep : s)
    }));
  }, [saveHistory]);

  const handleReorderSteps = useCallback((newSteps: PlanStep[]) => {
    saveHistory();
    setState(prev => ({ ...prev, plan: newSteps }));
  }, [saveHistory]);

  const handleUpdateStatus = useCallback((id: string, status: PlanStep['status']) => {
    saveHistory();
    setState(prev => ({
      ...prev,
      plan: prev.plan.map(s => s.id === id ? { ...s, status } : s)
    }));
  }, [saveHistory]);

  const generatePlan = async () => {
    if (!prompt.trim() || isProcessing) return;
    setIsProcessing(true);
    setPlanHistory([]);
    setPlanFuture([]);
    setState(prev => ({ ...prev, status: AgentStatus.PLANNING, plan: [], visuals: [] }));
    addLog('NovaMinds', 'Initializing autonomous engineering pipeline...', 'info');

    try {
      const plan = await planningAgent(prompt);
      setState(prev => ({ 
        ...prev, 
        status: AgentStatus.IDLE,
        plan: plan.map(s => ({ ...s, status: 'pending' as const })) 
      }));
      addLog('Planner', 'Architecture roadmap finalized.', 'success');
      setActiveTab('plan');
    } catch (error: any) {
      addLog('System', `Critical Planning Failure: ${error.message}`, 'error');
      setState(prev => ({ ...prev, status: AgentStatus.FAILED }));
    } finally {
      setIsProcessing(false);
    }
  };

  const executePlan = async () => {
    if (state.plan.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setState(prev => ({ ...prev, status: AgentStatus.CODING }));
    addLog('NovaMinds', 'Build sequence initiated.', 'info');

    try {
      let allFiles = [...state.files];
      const steps = state.plan;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (step.status === 'done') continue;

        setState(prev => ({
          ...prev,
          plan: prev.plan.map(s => s.id === step.id ? { ...s, status: 'running' as const } : s)
        }));
        
        addLog('Coder', `Synthesizing ${step.title}...`, 'info');
        const context = allFiles.map(f => `FILE: ${f.path}\n${f.content}`).join('\n\n');
        const generatedFiles = await codingAgent(step, context);
        
        const testResult = await testingAgent(generatedFiles);
        if (!testResult.passed) {
          addLog('Tester', `Validation failed. Self-correcting...`, 'warning');
          const refinedFiles = await codingAgent(step, `${context}\n\nPREVIOUS ATTEMPT FEEDBACK:\n${testResult.feedback}`);
          allFiles = [...allFiles, ...refinedFiles];
        } else {
          allFiles = [...allFiles, ...generatedFiles];
        }

        setState(prev => ({
          ...prev,
          files: allFiles,
          plan: prev.plan.map(s => s.id === step.id ? { ...s, status: 'done' as const } : s)
        }));
      }

      setState(prev => ({ ...prev, status: AgentStatus.DESIGNING }));
      const visualOutput = await uiVisualAgent(prompt, state.plan);
      if (visualOutput) {
        setState(prev => ({
          ...prev,
          visuals: [{ type: 'diagram', content: visualOutput, title: 'Engineering Blueprint' }]
        }));
      }

      setState(prev => ({ ...prev, status: AgentStatus.COMPLETED }));
      addLog('NovaMinds', 'Project synthesis complete. All modules operational.', 'success');
      setActiveTab('preview'); // Automatically switch to preview when finished
    } catch (error: any) {
      addLog('System', `Critical Build Error: ${error.message}`, 'error');
      setState(prev => ({ ...prev, status: AgentStatus.FAILED }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden text-slate-200">
      <Sidebar status={state.status} logs={state.logs} onReset={clearSession} />
      
      <div className="flex flex-col flex-1 min-w-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-indigo-500/5">
        <Header 
          prompt={prompt} 
          setPrompt={setPrompt} 
          onRun={generatePlan} 
          isProcessing={isProcessing} 
          status={state.status}
        />
        
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1 border-r border-slate-800/50">
            <div className="flex items-center space-x-1 px-4 py-2 border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md">
              {[
                { id: 'plan', label: 'Walkthrough', icon: 'fa-route' },
                { id: 'files', label: 'System Files', icon: 'fa-file-code' },
                { id: 'preview', label: 'Live Build', icon: 'fa-rocket' },
                { id: 'visuals', label: 'Blueprints', icon: 'fa-swatchbook' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center space-x-2 ${
                    activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} ${activeTab === tab.id ? 'opacity-100' : 'opacity-40'}`}></i>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0 overflow-auto custom-scrollbar p-6">
                {activeTab === 'plan' && (
                  <PlanViewer 
                    steps={state.plan} onDelete={handleDeleteStep} onAddStep={handleAddStep} onEditStep={handleEditStep} onReorderSteps={handleReorderSteps} onUpdateStatus={handleUpdateStatus} onUndo={handleUndo} onRedo={handleRedo} canUndo={planHistory.length > 0} canRedo={planFuture.length > 0} onExecute={executePlan} isProcessing={isProcessing}
                  />
                )}
                {activeTab === 'preview' && <Preview files={state.files} />}
                {activeTab === 'files' && (
                  <div className="flex h-full space-x-6">
                    <div className="w-72 flex-shrink-0">
                      <FileExplorer files={state.files} onSelect={setSelectedFile} activeFile={selectedFile} />
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col bg-slate-900/80 rounded-[2rem] border border-slate-800/60 shadow-inner p-6">
                      {selectedFile ? (
                         <div className="flex-1 overflow-auto font-mono text-xs leading-relaxed whitespace-pre text-indigo-100/80 custom-scrollbar">{selectedFile.content}</div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
                           <i className="fa-solid fa-code text-5xl opacity-10"></i>
                           <p className="italic text-sm">Select a file to inspect synthesis.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'visuals' && <VisualOutput visuals={state.visuals} />}
              </div>
            </div>

            <div className="h-48 border-t border-slate-800/60 bg-slate-900/60 backdrop-blur-lg">
               <Terminal logs={state.logs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
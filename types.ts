
export enum AgentStatus {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING',
  CODING = 'CODING',
  TESTING = 'TESTING',
  DESIGNING = 'DESIGNING',
  ASSEMBLING = 'ASSEMBLING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface ProjectFile {
  name: string;
  path: string;
  content: string;
  type: 'code' | 'doc' | 'image' | 'data';
  language?: string;
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  status: 'pending' | 'running' | 'done' | 'failed';
}

export interface AgentLog {
  id: string;
  agent: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ProjectState {
  status: AgentStatus;
  plan: PlanStep[];
  files: ProjectFile[];
  logs: AgentLog[];
  visuals: {
    type: 'chart' | 'mockup' | 'diagram';
    content: string; // SVG or HTML
    title: string;
  }[];
}

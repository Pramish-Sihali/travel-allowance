'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  status: 'Not Started' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  departmentName?: string;
  assignedTo: string[];
  ragStatus: 'Red' | 'Amber' | 'Green' | 'Unrated';
  actionItems: ActionItem[];
  progress: number;
  createdAt: string;
  updatedAt?: string;
  logs: ProjectLog[];
}

export interface ProjectLog {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  description: string;
  timestamp: string;
  duration?: number;
  type: 'update' | 'time_log' | 'status_change' | 'assignment';
}

export interface TimeLog {
  id: string;
  taskId?: string;
  userId: string;
  description: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  breakDuration: number;
  isPersonal: boolean;
}

interface ProjectState {
  projects: Project[];
  userProjects: Project[];
  timeLogs: TimeLog[];
  personalLogs: TimeLog[];
  loading: boolean;
  error: string | null;
}

type ProjectAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_USER_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<Project> } }
  | { type: 'ADD_PROJECT_LOG'; payload: { projectId: string; log: ProjectLog } }
  | { type: 'SET_TIME_LOGS'; payload: TimeLog[] }
  | { type: 'ADD_TIME_LOG'; payload: TimeLog }
  | { type: 'SET_PERSONAL_LOGS'; payload: TimeLog[] }
  | { type: 'ADD_PERSONAL_LOG'; payload: TimeLog };

const initialState: ProjectState = {
  projects: [],
  userProjects: [],
  timeLogs: [],
  personalLogs: [],
  loading: false,
  error: null,
};

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload, loading: false, error: null };
    
    case 'SET_USER_PROJECTS':
      return { ...state, userProjects: action.payload, loading: false, error: null };
    
    case 'ADD_PROJECT':
      return { 
        ...state, 
        projects: [...state.projects, action.payload],
        loading: false,
        error: null 
      };
    
    case 'UPDATE_PROJECT':
      const updatedProjects = state.projects.map(project =>
        project.id === action.payload.id
          ? { ...project, ...action.payload.updates }
          : project
      );
      const updatedUserProjects = state.userProjects.map(project =>
        project.id === action.payload.id
          ? { ...project, ...action.payload.updates }
          : project
      );
      return {
        ...state,
        projects: updatedProjects,
        userProjects: updatedUserProjects,
      };
    
    case 'ADD_PROJECT_LOG':
      const projectsWithLog = state.projects.map(project =>
        project.id === action.payload.projectId
          ? { ...project, logs: [...project.logs, action.payload.log] }
          : project
      );
      const userProjectsWithLog = state.userProjects.map(project =>
        project.id === action.payload.projectId
          ? { ...project, logs: [...project.logs, action.payload.log] }
          : project
      );
      return {
        ...state,
        projects: projectsWithLog,
        userProjects: userProjectsWithLog,
      };
    
    case 'SET_TIME_LOGS':
      return { ...state, timeLogs: action.payload };
    
    case 'ADD_TIME_LOG':
      return { ...state, timeLogs: [...state.timeLogs, action.payload] };
    
    case 'SET_PERSONAL_LOGS':
      return { ...state, personalLogs: action.payload };
    
    case 'ADD_PERSONAL_LOG':
      return { ...state, personalLogs: [...state.personalLogs, action.payload] };
    
    default:
      return state;
  }
}

interface ProjectContextType {
  state: ProjectState;
  fetchProjects: () => Promise<void>;
  fetchUserProjects: (userId: string) => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'logs'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  addProjectLog: (projectId: string, log: Omit<ProjectLog, 'id' | 'timestamp'>) => Promise<void>;
  fetchTimeLogs: (userId: string) => Promise<void>;
  addTimeLog: (timeLog: Omit<TimeLog, 'id'>) => Promise<TimeLog>;
  fetchPersonalLogs: (userId: string) => Promise<void>;
  addPersonalLog: (personalLog: Omit<TimeLog, 'id'>) => Promise<TimeLog>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  const fetchProjects = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      const data = await response.json();
      dispatch({ type: 'SET_PROJECTS', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  }, []);

  const fetchUserProjects = useCallback(async (userId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch(`/api/tasks?assignedTo=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user projects');
      
      const data = await response.json();
      dispatch({ type: 'SET_USER_PROJECTS', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  }, []);

  const createProject = useCallback(async (projectData: Omit<Project, 'id' | 'createdAt' | 'logs'>): Promise<Project> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectData,
          createdAt: new Date().toISOString(),
          logs: []
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create project');
      
      const newProject = await response.json();
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      return newProject;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  }, []);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update project');
      
      const updatedProject = await response.json();
      dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates: updatedProject } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  }, []);

  const addProjectLog = useCallback(async (projectId: string, logData: Omit<ProjectLog, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch(`/api/tasks/${projectId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...logData,
          timestamp: new Date().toISOString()
        }),
      });
      
      if (!response.ok) throw new Error('Failed to add project log');
      
      const newLog = await response.json();
      dispatch({ type: 'ADD_PROJECT_LOG', payload: { projectId, log: newLog } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  }, []);

  const fetchTimeLogs = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/time-logs?userId=${userId}&personal=false`);
      if (!response.ok) throw new Error('Failed to fetch time logs');
      
      const data = await response.json();
      dispatch({ type: 'SET_TIME_LOGS', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  }, []);

  const addTimeLog = useCallback(async (timeLogData: Omit<TimeLog, 'id'>): Promise<TimeLog> => {
    try {
      const response = await fetch('/api/time-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timeLogData),
      });
      
      if (!response.ok) throw new Error('Failed to add time log');
      
      const newTimeLog = await response.json();
      dispatch({ type: 'ADD_TIME_LOG', payload: newTimeLog });
      return newTimeLog;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  }, []);

  const fetchPersonalLogs = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/time-logs?userId=${userId}&personal=true`);
      if (!response.ok) throw new Error('Failed to fetch personal logs');
      
      const data = await response.json();
      dispatch({ type: 'SET_PERSONAL_LOGS', payload: data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  }, []);

  const addPersonalLog = useCallback(async (personalLogData: Omit<TimeLog, 'id'>): Promise<TimeLog> => {
    try {
      const response = await fetch('/api/time-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...personalLogData, isPersonal: true }),
      });
      
      if (!response.ok) throw new Error('Failed to add personal log');
      
      const newPersonalLog = await response.json();
      dispatch({ type: 'ADD_PERSONAL_LOG', payload: newPersonalLog });
      return newPersonalLog;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  }, []);

  const contextValue: ProjectContextType = {
    state,
    fetchProjects,
    fetchUserProjects,
    createProject,
    updateProject,
    addProjectLog,
    fetchTimeLogs,
    addTimeLog,
    fetchPersonalLogs,
    addPersonalLog,
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
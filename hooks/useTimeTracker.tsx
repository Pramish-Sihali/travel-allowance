'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

export interface TimeLog {
  id?: string;
  taskId?: string;
  meetingActionItemId?: string;
  userId: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  breakDuration: number; // in seconds
  totalDuration: number; // in seconds
  status: 'running' | 'paused' | 'stopped';
  isPersonal: boolean;
}

export interface UseTimeTrackerReturn {
  currentLog: TimeLog | null;
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: number;
  breakTime: number;
  startTimer: (description: string, taskId?: string, meetingActionItemId?: string, isPersonal?: boolean) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<TimeLog | null>;
  resetTimer: () => void;
  formatTime: (seconds: number) => string;
}

export const useTimeTracker = (userId: string): UseTimeTrackerReturn => {
  const [currentLog, setCurrentLog] = useState<TimeLog | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const pauseStartRef = useRef<Date | null>(null);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const startTimer = useCallback((description: string, taskId?: string, meetingActionItemId?: string, isPersonal = false) => {
    const now = new Date();
    const newLog: TimeLog = {
      userId,
      description,
      taskId,
      meetingActionItemId,
      startTime: now,
      breakDuration: 0,
      totalDuration: 0,
      status: 'running',
      isPersonal
    };

    setCurrentLog(newLog);
    setIsRunning(true);
    setIsPaused(false);
    setElapsedTime(0);
    setBreakTime(0);
    startTimeRef.current = now;

    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  }, [userId]);

  const pauseTimer = useCallback(() => {
    if (!isRunning || isPaused) return;

    setIsPaused(true);
    setIsRunning(false);
    pauseStartRef.current = new Date();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start break timer
    breakIntervalRef.current = setInterval(() => {
      setBreakTime(prev => prev + 1);
    }, 1000);

    if (currentLog) {
      setCurrentLog(prev => prev ? { ...prev, status: 'paused' } : null);
    }
  }, [isRunning, isPaused, currentLog]);

  const resumeTimer = useCallback(() => {
    if (!isPaused || isRunning) return;

    setIsPaused(false);
    setIsRunning(true);

    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    if (currentLog) {
      setCurrentLog(prev => prev ? { ...prev, status: 'running' } : null);
    }
  }, [isPaused, isRunning, currentLog]);

  const stopTimer = useCallback(async (): Promise<TimeLog | null> => {
    if (!currentLog) return null;

    const now = new Date();
    const finalLog: TimeLog = {
      ...currentLog,
      endTime: now,
      totalDuration: elapsedTime,
      breakDuration: breakTime,
      status: 'stopped'
    };

    // Clear intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }

    // Save to database
    try {
      const response = await fetch('/api/time-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: finalLog.taskId,
          meetingActionItemId: finalLog.meetingActionItemId,
          description: finalLog.description,
          startTime: finalLog.startTime.toISOString(),
          endTime: finalLog.endTime?.toISOString() || now.toISOString(),
          totalDuration: finalLog.totalDuration,
          breakDuration: finalLog.breakDuration,
          isPersonal: finalLog.isPersonal
        })
      });

      if (response.ok) {
        const savedLog = await response.json();
        finalLog.id = savedLog.id;
      }
    } catch (error) {
      console.error('Error saving time log:', error);
    }

    // Reset state
    setCurrentLog(null);
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setBreakTime(0);
    startTimeRef.current = null;
    pauseStartRef.current = null;

    return finalLog;
  }, [currentLog, elapsedTime, breakTime]);

  const resetTimer = useCallback(() => {
    // Clear intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }

    // Reset state
    setCurrentLog(null);
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setBreakTime(0);
    startTimeRef.current = null;
    pauseStartRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
      }
    };
  }, []);

  return {
    currentLog,
    isRunning,
    isPaused,
    elapsedTime,
    breakTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    formatTime
  };
};
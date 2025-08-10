'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Square, RotateCcw, Clock, Coffee, FolderOpen } from 'lucide-react';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { useSession } from 'next-auth/react';
import { Task } from '@/types';
import { toast } from 'sonner';

interface ProjectTimeTrackerProps {
  className?: string;
  onTimerComplete?: (timeLog: any) => void;
}

export default function ProjectTimeTracker({ 
  className = "",
  onTimerComplete
}: ProjectTimeTrackerProps) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const {
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
  } = useTimeTracker(session?.user?.id || '');

  // Fetch user's assigned tasks
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserTasks();
    }
  }, [session?.user?.id]);

  const fetchUserTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        // Filter tasks where user is assigned
        const userTasks = data.filter((task: Task) => 
          task.assignedUserIds?.includes(session?.user?.id || '') ||
          task.assignedTo?.includes(session?.user?.name || '')
        );
        setTasks(userTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    if (taskId === "no-task") {
      setSelectedTaskId('');
      setSelectedTask(null);
      setTitle('');
      setDescription('');
    } else {
      setSelectedTaskId(taskId);
      const task = tasks.find(t => t.id === taskId);
      setSelectedTask(task || null);
      if (task) {
        setTitle(task.title);
        setDescription(`Working on: ${task.title}`);
      }
    }
  };

  const handleStart = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const finalDescription = `${title} - ${description}`;
    
    if (selectedTask?.isMeetingActionItem) {
      startTimer(finalDescription, undefined, selectedTask.meetingActionItemId, false);
    } else if (selectedTaskId) {
      startTimer(finalDescription, selectedTaskId, undefined, false);
    } else {
      startTimer(finalDescription, undefined, undefined, false);
    }
  };

  const handleStop = async () => {
    const completedLog = await stopTimer();
    if (completedLog && onTimerComplete) {
      onTimerComplete(completedLog);
    }
    // Reset form after stopping
    setSelectedTaskId('');
    setSelectedTask(null);
    setTitle('');
    setDescription('');
    toast.success('Time log saved successfully!');
  };

  const handleReset = () => {
    resetTimer();
    setSelectedTaskId('');
    setSelectedTask(null);
    setTitle('');
    setDescription('');
  };

  const isActive = currentLog !== null;
  const canStart = title.trim() && description.trim();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          Project Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Selection */}
        {!isActive && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Select Task (Optional)
              </label>
              <Select value={selectedTaskId} onValueChange={handleTaskSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a task or leave blank for general work..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-task">No specific task</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <div className="flex items-center gap-2">
                        {task.isMeetingActionItem && (
                          <Badge variant="outline" className="text-xs">Meeting</Badge>
                        )}
                        <span className="truncate">{task.title}</span>
                        {task.departmentName && (
                          <span className="text-xs text-muted-foreground">
                            ({task.departmentName})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loading && (
                <p className="text-xs text-muted-foreground mt-1">Loading tasks...</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="What are you working on?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Describe your work in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            {selectedTask && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{selectedTask.status}</Badge>
                  <Badge variant="outline">{selectedTask.priority}</Badge>
                  {selectedTask.isMeetingActionItem && (
                    <Badge variant="secondary">Meeting Action Item</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedTask.description || 'No description available'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Timer Display */}
        {isActive && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-primary">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-sm text-muted-foreground max-w-md mx-auto">
                {currentLog?.description}
              </div>
            </div>

            {/* Break Time Display */}
            {breakTime > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
                <Coffee className="h-4 w-4" />
                <span>Break time: {formatTime(breakTime)}</span>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge 
                variant={isRunning ? "default" : isPaused ? "secondary" : "outline"}
                className="capitalize"
              >
                {currentLog?.status}
              </Badge>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2 justify-center">
          {!isActive ? (
            <Button
              onClick={handleStart}
              disabled={!canStart}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Timer
            </Button>
          ) : (
            <>
              {isRunning ? (
                <Button
                  onClick={pauseTimer}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={resumeTimer}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              )}
              
              <Button
                onClick={handleStop}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop & Save
              </Button>

              <Button
                onClick={handleReset}
                variant="ghost"
                size="icon"
                className="h-9 w-9"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Help Text */}
        {!isActive && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Select a task from your assigned projects or create a general work log</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, RotateCcw, Clock, Coffee, User } from 'lucide-react';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface TimerControlsProps {
  taskId?: string;
  taskTitle?: string;
  isPersonal?: boolean;
  onTimerComplete?: (timeLog: any) => void;
  className?: string;
}

export default function TimerControls({ 
  taskId, 
  taskTitle, 
  isPersonal = false, 
  onTimerComplete,
  className = "" 
}: TimerControlsProps) {
  const { data: session } = useSession();
  const [title, setTitle] = useState(taskTitle || '');
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

  const handleStart = () => {
    if (isPersonal) {
      if (!title.trim()) {
        toast.error('Please enter a title');
        return;
      }
      if (!description.trim()) {
        toast.error('Please enter a description');
        return;
      }
      const finalDescription = `${title} - ${description}`;
      startTimer(finalDescription, taskId, undefined, isPersonal);
    } else {
      if (!description.trim()) return;
      startTimer(description, taskId, undefined, isPersonal);
    }
  };

  const handleStop = async () => {
    const completedLog = await stopTimer();
    if (completedLog && onTimerComplete) {
      onTimerComplete(completedLog);
    }
    // Reset form after stopping for personal logs
    if (isPersonal) {
      setTitle('');
      setDescription('');
      toast.success('Personal activity logged successfully!');
    }
  };

  const isActive = currentLog !== null;
  const canStart = isPersonal ? (title.trim() && description.trim()) : description.trim();

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Personal Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title and Description Inputs for Personal */}
        {!isActive && isPersonal && (
          <div className="space-y-4">
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
                placeholder="Describe your activity in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Description Input for non-personal */}
        {!isActive && !isPersonal && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Task Description
            </label>
            <Input
              placeholder="Describe your work..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isActive}
              className="mt-1"
            />
          </div>
        )}

        {/* Timer Display */}
        {isActive && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-primary">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-sm text-muted-foreground">
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
                  onClick={() => {
                    resetTimer();
                    if (isPersonal) {
                      setTitle('');
                      setDescription('');
                    }
                  }}
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
        {isPersonal && !isActive && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Track your personal activities - both title and description are required</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, RotateCcw, Clock, Coffee } from 'lucide-react';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { useSession } from 'next-auth/react';

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
  const [description, setDescription] = useState(taskTitle || '');
  
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
    if (!description.trim()) return;
    startTimer(description, taskId, isPersonal);
  };

  const handleStop = async () => {
    const completedLog = await stopTimer();
    if (completedLog && onTimerComplete) {
      onTimerComplete(completedLog);
    }
  };

  const isActive = currentLog !== null;
  const showControls = isActive || !isPersonal; // Always show for project tasks

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {isPersonal ? 'Personal Time Log' : 'Project Time Tracker'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description Input */}
        {!isActive && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              {isPersonal ? 'Activity Description' : 'Task Description'}
            </label>
            <Input
              placeholder={isPersonal ? "What are you working on?" : "Describe your work..."}
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
        {showControls && (
          <div className="flex gap-2 justify-center">
            {!isActive ? (
              <Button
                onClick={handleStart}
                disabled={!description.trim()}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start
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
                  onClick={resetTimer}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Today's Summary (Optional) */}
        {isPersonal && !isActive && (
          <div className="text-center text-sm text-muted-foreground">
            <p>Track your personal activities and work progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
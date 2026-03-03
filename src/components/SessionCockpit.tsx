import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Target,
  Plus,
  Check,
  X,
  Play,
  Pause,
  RotateCcw,
  Video,
  MapPin,
} from 'lucide-react';
import {
  useSessionGoals,
  useCreateSessionGoal,
  useToggleSessionGoal,
} from '@/hooks/useSessions';
import type { SessionWithDetails } from '@/hooks/useSessions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function useSessionTimer(session: SessionWithDetails) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);

  const getSessionDurationSeconds = useCallback(() => {
    const [sh, sm] = session.start_time.split(':').map(Number);
    const [eh, em] = session.end_time.split(':').map(Number);
    return (eh * 60 + em - sh * 60 - sm) * 60;
  }, [session.start_time, session.end_time]);

  const getElapsedFromNow = useCallback(() => {
    const now = new Date();
    const [sh, sm] = session.start_time.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const seconds = (currentMinutes - startMinutes) * 60 + now.getSeconds();
    return Math.max(0, seconds);
  }, [session.start_time]);

  useEffect(() => {
    setElapsed(getElapsedFromNow());
  }, [getElapsedFromNow]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const totalSeconds = getSessionDurationSeconds();
  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = totalSeconds > 0 ? Math.min(1, elapsed / totalSeconds) : 0;

  return {
    elapsed,
    remaining,
    progress,
    running,
    toggleRunning: () => setRunning((r) => !r),
    resync: () => setElapsed(getElapsedFromNow()),
  };
}

interface SessionCockpitProps {
  session: SessionWithDetails;
  onClose: () => void;
}

export default function SessionCockpit({ session, onClose }: SessionCockpitProps) {
  const { user } = useAuth();
  const timer = useSessionTimer(session);
  const { data: goals = [] } = useSessionGoals(session.id);
  const createGoal = useCreateSessionGoal();
  const toggleGoal = useToggleSessionGoal();
  const [newGoalTitle, setNewGoalTitle] = useState('');

  const handleAddGoal = () => {
    const title = newGoalTitle.trim();
    if (!title) return;
    createGoal.mutate(
      { sessionId: session.id, title },
      { onSuccess: () => setNewGoalTitle('') }
    );
  };

  const goingAttendees = (session.session_attendees ?? []).filter(
    (a) => a.status === 'going'
  );
  const completedGoals = goals.filter((g) => g.is_completed).length;

  return (
    <AnimatePresence>
      <motion.div
        key="session-cockpit"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.97 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Cockpit panel */}
        <motion.div
          className={cn(
            'relative z-10 w-full max-w-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden',
            'bg-card/80 backdrop-blur-xl'
          )}
          layoutId="session-cockpit-panel"
        >
          {/* Header */}
          <div className="relative px-5 pt-5 pb-4 border-b border-border/50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                  </span>
                  <span className="text-xs font-medium text-success uppercase tracking-wider">
                    Session in progress
                  </span>
                </div>
                <h2 className="font-display text-lg font-semibold text-foreground truncate">
                  {session.title}
                </h2>
                {session.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                    {session.description}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Location chip */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              {session.is_online ? (
                <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Online</span>
              ) : session.location ? (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {session.location}</span>
              ) : null}
              <span>{session.start_time} - {session.end_time}</span>
            </div>
          </div>

          {/* Timer section */}
          <div className="px-5 py-5 border-b border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Elapsed</p>
                <p className="font-mono text-3xl font-bold text-foreground tracking-tight">
                  {formatDuration(timer.elapsed)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                <p className={cn(
                  'font-mono text-lg font-semibold tracking-tight',
                  timer.remaining <= 300 ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {formatDuration(timer.remaining)}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${timer.progress * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            {/* Timer controls */}
            <div className="flex items-center justify-center gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={timer.toggleRunning}
                className="h-8 gap-1.5"
              >
                {timer.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {timer.running ? 'Pause' : 'Resume'}
              </Button>
              <Button variant="ghost" size="sm" onClick={timer.resync} className="h-8 gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Sync
              </Button>
            </div>
          </div>

          {/* Goals checklist */}
          <div className="px-5 py-4 border-b border-border/50 max-h-52 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Goals for today</h3>
              </div>
              {goals.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {completedGoals}/{goals.length}
                </Badge>
              )}
            </div>

            {goals.length > 0 ? (
              <ul className="space-y-1.5">
                {goals.map((goal) => (
                  <motion.li
                    key={goal.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 group"
                  >
                    <button
                      onClick={() =>
                        toggleGoal.mutate({
                          goalId: goal.id,
                          isCompleted: !goal.is_completed,
                          sessionId: session.id,
                        })
                      }
                      disabled={toggleGoal.isPending}
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        goal.is_completed
                          ? 'bg-success border-success text-white'
                          : 'border-muted-foreground/40 hover:border-primary'
                      )}
                    >
                      {goal.is_completed && <Check className="w-3 h-3" />}
                    </button>
                    <span
                      className={cn(
                        'text-sm flex-1',
                        goal.is_completed
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      )}
                    >
                      {goal.title}
                    </span>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No goals yet. Add one below to stay focused.
              </p>
            )}

            {/* Add goal input */}
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="e.g. Finish Chapter 4 exercises"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
                className="h-8 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 shrink-0"
                onClick={handleAddGoal}
                disabled={!newGoalTitle.trim() || createGoal.isPending}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Attendees */}
          <div className="px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {goingAttendees.slice(0, 6).map((a) => (
                  <Avatar key={a.user_id} className="w-7 h-7 border-2 border-card">
                    <AvatarImage src={a.profiles?.avatar ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {(a.profiles?.name ?? '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {goingAttendees.length} studying now
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

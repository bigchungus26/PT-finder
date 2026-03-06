import { useState } from 'react';
import { DollarSign, Target } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCurrentProfile, useUpdateProfile } from '@/hooks/useProfile';

interface EarningsGoalProps {
  totalEarnings: number;
  hourlyRate: number;
  availableSlots: number;
}

export function EarningsGoal({ totalEarnings, hourlyRate, availableSlots }: EarningsGoalProps) {
  const { data: profile } = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const [goalInput, setGoalInput] = useState('');
  const [editing, setEditing] = useState(false);

  const goal = profile?.earnings_goal ?? 0;
  const pct = goal > 0 ? Math.min(Math.round((totalEarnings / goal) * 100), 100) : 0;
  const remaining = Math.max(goal - totalEarnings, 0);
  const sessionsNeeded = hourlyRate > 0 ? Math.ceil(remaining / hourlyRate) : 0;

  if (!goal && !editing) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Earnings Goal</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Set a monthly target to stay motivated</p>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="w-full">Set Goal</Button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Set Earnings Goal</h3>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              min="100"
              step="50"
              placeholder="e.g. 500"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            size="sm"
            disabled={!goalInput || updateProfile.isPending}
            onClick={async () => {
              await updateProfile.mutateAsync({ earnings_goal: parseFloat(goalInput) } as Record<string, unknown>);
              setEditing(false);
              setGoalInput('');
            }}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground text-sm">Earnings Goal</h3>
        </div>
        <button onClick={() => setEditing(true)} className="text-xs text-primary hover:underline">Edit</button>
      </div>
      <div className="mb-2">
        <div className="flex items-baseline justify-between text-sm mb-1">
          <span className="font-semibold text-foreground">${totalEarnings.toFixed(0)}</span>
          <span className="text-muted-foreground">of ${goal.toFixed(0)}</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
      {remaining > 0 ? (
        <p className="text-xs text-muted-foreground">
          You need <span className="font-semibold text-foreground">{sessionsNeeded} more session{sessionsNeeded !== 1 ? 's' : ''}</span> to reach your goal.
          {availableSlots > 0 && ` You have ${availableSlots} available slots this week.`}
        </p>
      ) : (
        <p className="text-xs text-emerald-600 font-medium">Goal reached! Great work this month.</p>
      )}
    </div>
  );
}

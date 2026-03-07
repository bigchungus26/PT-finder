import { useState, useMemo } from 'react';
import { Activity, Scale, Moon, Zap, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useWeeklyLogs, useUpsertWeeklyLog } from '@/hooks/useRetention';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function WeeklyTracker() {
  const { data: logs = [] } = useWeeklyLogs();
  const upsert = useUpsertWeeklyLog();
  const [weight, setWeight] = useState('');
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState(false);

  const weekStart = getWeekStart();
  const hasThisWeek = logs.some(l => l.week_start_date === weekStart);

  const chartData = useMemo(() =>
    [...logs].reverse().map(l => ({
      week: l.week_start_date.slice(5),
      weight: l.weight_kg,
      energy: l.energy,
    })),
    [logs]
  );

  const handleSubmit = async () => {
    await upsert.mutateAsync({
      week_start_date: weekStart,
      weight_kg: weight ? parseFloat(weight) : null,
      energy,
      sleep,
      note: note.trim() || null,
    });
    setWeight('');
    setNote('');
    setExpanded(false);
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground text-sm">Your Body This Week</h3>
        </div>
        {!hasThisWeek && !expanded && (
          <Button size="sm" variant="outline" onClick={() => setExpanded(true)}>Log</Button>
        )}
        {hasThisWeek && !expanded && (
          <span className="text-xs text-emerald-600 font-medium">Logged this week</span>
        )}
      </div>

      {expanded && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <Scale className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              type="number"
              step="0.1"
              placeholder="Weight (kg)"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Energy</span>
                <span className="font-medium text-foreground">{energy}/5</span>
              </div>
              <Slider value={[energy]} onValueChange={v => setEnergy(v[0])} min={1} max={5} step={1} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Sleep quality</span>
                <span className="font-medium text-foreground">{sleep}/5</span>
              </div>
              <Slider value={[sleep]} onValueChange={v => setSleep(v[0])} min={1} max={5} step={1} />
            </div>
          </div>
          <Input placeholder="Optional note..." value={note} onChange={e => setNote(e.target.value)} className="h-9" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={upsert.isPending} className="gap-1.5">
              <Send className="w-3.5 h-3.5" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {chartData.length >= 2 && (
        <div className="h-32 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" />
              <Line type="monotone" dataKey="energy" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Energy" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {logs.length === 0 && !expanded && (
        <p className="text-xs text-muted-foreground">Track your weight, energy, and sleep weekly to see trends.</p>
      )}
    </div>
  );
}

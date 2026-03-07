import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useCurrentProfile } from '@/hooks/useProfile';
import { computeProfileStrength } from '@/hooks/useRetention';
import { cn } from '@/lib/utils';

export function ProfileStrength() {
  const { data: profile } = useCurrentProfile();
  if (!profile) return null;

  const { score, label, missing } = computeProfileStrength(profile);
  const labelColors: Record<string, string> = {
    Starter: 'bg-muted text-muted-foreground',
    Rising: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    Pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    Elite: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground text-sm">Profile Strength</h3>
        </div>
        <Badge className={cn('border-0 text-xs', labelColors[label] ?? labelColors.Starter)}>
          {label}
        </Badge>
      </div>
      <div className="mb-3">
        <div className="flex items-baseline justify-between text-sm mb-1">
          <span className="font-semibold text-foreground">{score}%</span>
        </div>
        <Progress value={score} className="h-2" />
      </div>
      {missing.length > 0 && (
        <div className="space-y-1.5">
          {missing.slice(0, 3).map((m, i) => (
            <Link
              key={i}
              to="/settings"
              className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="text-muted-foreground">{m.item}</span>
              <span className="text-primary font-medium flex items-center gap-1">
                +{m.value}% <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      )}
      {label === 'Elite' && (
        <p className="text-xs text-emerald-600 font-medium mt-2">
          Elite profiles appear first in search results
        </p>
      )}
    </div>
  );
}

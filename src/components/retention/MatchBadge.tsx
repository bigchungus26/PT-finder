import { Badge } from '@/components/ui/badge';

export function MatchBadge({ score, maxScore = 8 }: { score: number; maxScore?: number }) {
  const pct = Math.min(Math.round((score / maxScore) * 100), 99);
  if (pct < 25) return null;
  return (
    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0 text-xs font-semibold">
      {pct}% match
    </Badge>
  );
}

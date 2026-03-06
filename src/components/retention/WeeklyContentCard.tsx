import { Sparkles } from 'lucide-react';
import { useCurrentWeeklyContent } from '@/hooks/useRetention';

export function WeeklyContentCard() {
  const { data: content } = useCurrentWeeklyContent();

  if (!content) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">This Week's Focus</span>
      </div>
      <h3 className="font-display font-semibold text-foreground mb-1">{content.theme}</h3>
      <p className="text-sm text-muted-foreground mb-2">{content.tip_text}</p>
      {content.cta_text && (
        <p className="text-xs text-primary font-medium">{content.cta_text}</p>
      )}
    </div>
  );
}

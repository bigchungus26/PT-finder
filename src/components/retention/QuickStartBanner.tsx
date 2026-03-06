import { Link } from 'react-router-dom';
import { ArrowRight, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickStartBanner() {
  return (
    <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-5 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Dumbbell className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-0.5">You're 2 steps away from your first session</h3>
          <p className="text-sm text-muted-foreground">Find a trainer that matches your goals and book your first session.</p>
        </div>
        <Button asChild className="shrink-0 gap-1.5">
          <Link to="/discover">
            Find a trainer <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

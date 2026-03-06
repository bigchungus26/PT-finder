import { Link } from 'react-router-dom';
import { Check, Search, Calendar, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentProfile, useUpdateProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

const WHATSAPP_SHARE_URL = `https://wa.me/?text=${encodeURIComponent('Join me on Kotch — the app I use to find personal trainers in Lebanon. Check it out: https://kotch.app')}`;

export function SetupChecklist() {
  const { data: profile } = useCurrentProfile();
  const updateProfile = useUpdateProfile();

  if (!profile) return null;

  const steps = [
    {
      label: 'Browse trainers and save your favorites',
      done: profile.setup_step_discover,
      icon: Search,
      action: <Button size="sm" variant="outline" asChild><Link to="/discover">Browse</Link></Button>,
    },
    {
      label: 'Send your first inquiry or book a session',
      done: profile.setup_step_inquiry,
      icon: Calendar,
      action: <Button size="sm" variant="outline" asChild><Link to="/discover">Find trainer</Link></Button>,
    },
    {
      label: 'Tell a friend about Kotch',
      done: profile.setup_step_share,
      icon: Share2,
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            window.open(WHATSAPP_SHARE_URL, '_blank');
            updateProfile.mutate({ setup_step_share: true } as Record<string, unknown>);
          }}
        >
          Share
        </Button>
      ),
    },
  ];

  const allDone = steps.every(s => s.done);
  if (allDone) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-6">
      <h3 className="font-semibold text-foreground mb-1">Complete your setup</h3>
      <p className="text-sm text-muted-foreground mb-4">Finish these steps to get the most out of Kotch</p>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
              step.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {step.done ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn('flex-1 text-sm', step.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium')}>
              {step.label}
            </span>
            {!step.done && step.action}
          </div>
        ))}
      </div>
    </div>
  );
}

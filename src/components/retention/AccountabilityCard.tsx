import { Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccountabilityPartner } from '@/hooks/useRetention';
import { useAuth } from '@/contexts/AuthContext';

export function AccountabilityCard() {
  const { user } = useAuth();
  const { data: partner } = useAccountabilityPartner();

  const inviteUrl = `https://kotch.app/join?partner=${user?.id}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Join me on Kotch as my accountability partner! We'll keep each other on track with our fitness goals. ${inviteUrl}`)}`;

  if (!partner) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground text-sm">Accountability Partner</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Invite a friend to keep each other on track. You'll see each other's session streaks.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5"
          onClick={() => window.open(whatsappUrl, '_blank')}
        >
          <Share2 className="w-3.5 h-3.5" /> Invite via WhatsApp
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground text-sm">Accountability Partner</h3>
      </div>
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
          {partner.profile_photo_url ? (
            <img src={partner.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            partner.name?.charAt(0) ?? '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{partner.name}</p>
          <p className="text-xs text-muted-foreground">
            {partner.total_completed_sessions ?? 0} sessions completed
          </p>
        </div>
      </div>
    </div>
  );
}

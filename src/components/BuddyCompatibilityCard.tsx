import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageCircle, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectionStatus, useSendConnectionRequest } from '@/hooks/useConnections';
import { useSendDirectMessage } from '@/hooks/useDirectMessages';
import { useSessionsWithBuddy } from '@/hooks/useSessions';
import type { MatchResult } from '@/hooks/useMatching';

export function BuddyCompatibilityCard({
  match,
  courseId,
}: {
  match: MatchResult;
  courseId?: string;
}) {
  const { user: matchUser, compatibilityScore, reasons, overlappingSlots } = match;
  const { user: currentUser } = useAuth();
  const status = useConnectionStatus(matchUser.id);
  const sendRequest = useSendConnectionRequest();
  const sendDM = useSendDirectMessage();
  const [inviteOpen, setInviteOpen] = useState(false);
  const { data: sessionsTogether = 0 } = useSessionsWithBuddy(
    status?.status === 'active' ? matchUser.id : null
  );
  const iSentRequest = status?.status === 'pending' && status.initiated_by === currentUser?.id;
  const verifiedCourse =
    courseId &&
    (matchUser.user_courses ?? []).find((uc) => uc.course_id === courseId)?.courses?.code;

  const handleQuickInvite = (slotLabel: string) => {
    sendDM.mutate(
      { receiverId: matchUser.id, content: `Want to study ${slotLabel}?` },
      { onSuccess: () => setInviteOpen(false) }
    );
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border/50 shadow-soft flex flex-col sm:flex-row gap-4">
      <div className="flex items-center gap-4 shrink-0">
        <Avatar className="w-14 h-14">
          <AvatarImage src={matchUser.avatar ?? undefined} />
          <AvatarFallback>{(matchUser.name ?? '?')[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-foreground">{matchUser.name}</h3>
          <p className="text-xs text-muted-foreground">
            {matchUser.city || matchUser.gym || ''}
          </p>
          <Badge className="mt-1.5" variant="secondary">
            {compatibilityScore}% match
          </Badge>
          {sessionsTogether > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {sessionsTogether} session{sessionsTogether !== 1 ? 's' : ''} together
            </p>
          )}
          {verifiedCourse && (
            <Badge variant="outline" className="mt-1 text-xs bg-success/10 text-success border-success/20">
              Verified {verifiedCourse}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
          Shared strengths
        </p>
        <ul className="text-sm text-foreground space-y-0.5">
          {reasons.slice(0, 3).map((r, i) => (
            <li key={i}>{r.description}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col justify-center gap-2 shrink-0">
        {!status && (
          <Button
            size="sm"
            onClick={() => sendRequest.mutate(matchUser.id)}
            disabled={sendRequest.isPending}
          >
            Connect
          </Button>
        )}
        {status?.status === 'pending' && !status.isExpired && !iSentRequest && (
          <span className="text-xs text-muted-foreground">Pending</span>
        )}
        {status?.status === 'pending' && iSentRequest && (
          <span className="text-xs text-muted-foreground">Request sent</span>
        )}
        {status?.status === 'pending' && status.isExpired && (
          <span className="text-xs text-amber-600">Expired</span>
        )}
        {status?.status === 'active' && (
          <div className="flex flex-col gap-1.5">
            <Button size="sm" variant="soft" asChild>
              <Link to={`/messages/${matchUser.id}`}>
                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                Message
              </Link>
            </Button>
            {overlappingSlots && overlappingSlots.length > 0 && (
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="w-full">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Quick Invite
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Suggest a study time</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground mb-3">
                    You're both free at these times. Send a suggestion:
                  </p>
                  <div className="space-y-2">
                    {overlappingSlots.map((slot, i) => (
                      <Button
                        key={i}
                        variant="secondary"
                        className="w-full justify-start"
                        onClick={() => handleQuickInvite(slot.label)}
                        disabled={sendDM.isPending}
                      >
                        {slot.label}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

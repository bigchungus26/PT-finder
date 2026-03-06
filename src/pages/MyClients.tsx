import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Users, MessageSquare, Calendar, Search, Clock,
  RotateCcw, ChevronRight,
} from 'lucide-react';
import { useMyClients } from '@/hooks/useRetention';
import { useSendDirectMessage } from '@/hooks/useDirectMessages';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function MyClients() {
  const { data: clients = [], isLoading } = useMyClients();
  const sendDM = useSendDirectMessage();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [reengageId, setReengageId] = useState<string | null>(null);

  const filtered = search.trim()
    ? clients.filter(c => c.client.name?.toLowerCase().includes(search.toLowerCase()))
    : clients;

  const handleReengage = async (clientId: string, clientName: string) => {
    try {
      await sendDM.mutateAsync({
        recipientId: clientId,
        content: `Hey ${clientName}! I wanted to check in on your progress. I have availability this week if you'd like to book a session. Let me know!`,
      });
      toast({ title: 'Re-engagement message sent!' });
      setReengageId(null);
    } catch {
      toast({ title: 'Could not send message', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-3xl">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> My Clients
          </h1>
          <p className="text-muted-foreground">All clients you've worked with on Kotch</p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border/50">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-1">No clients yet</h3>
            <p className="text-sm text-muted-foreground">Clients will appear here once they book sessions with you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(({ client, totalSessions, lastSessionDate }) => {
              const daysSince = Math.floor((Date.now() - new Date(lastSessionDate).getTime()) / (1000 * 60 * 60 * 24));
              const isDormant = daysSince >= 30;

              return (
                <div key={client.id} className="bg-card rounded-xl p-4 border border-border/50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0 overflow-hidden">
                      {client.profile_photo_url ? (
                        <img src={client.profile_photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        client.name?.charAt(0) ?? '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{client.name}</span>
                        {client.area && (
                          <span className="text-xs text-muted-foreground">{client.area}</span>
                        )}
                        {isDormant && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Inactive 30d+
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {totalSessions} session{totalSessions !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Last: {new Date(lastSessionDate).toLocaleDateString()}
                        </span>
                      </div>
                      {(client.fitness_goals ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(client.fitness_goals ?? []).slice(0, 3).map(g => (
                            <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/messages/${client.id}`}>
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                      </Button>
                      {isDormant && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => handleReengage(client.id, client.name?.split(' ')[0] ?? 'there')}
                          disabled={sendDM.isPending}
                        >
                          <RotateCcw className="w-3 h-3" /> Re-engage
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

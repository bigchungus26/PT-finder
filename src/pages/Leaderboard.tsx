import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy, MessageSquare, Dumbbell } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useFeaturesV2';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'rating' | 'sessions' | 'reviews'>('rating');
  const { data: entries = [], isLoading } = useLeaderboard(tab);

  const metricLabel = tab === 'rating' ? 'Rating' : tab === 'sessions' ? 'Sessions' : 'Reviews';
  const metricValue = (entry: typeof entries[0]) => {
    if (tab === 'rating') return (entry.rating_avg ?? 0).toFixed(1);
    if (tab === 'sessions') return entry.total_completed_sessions ?? 0;
    return entry.total_reviews ?? 0;
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-7 h-7 text-green-600" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">Top trainers on Kotch this week</p>
        </div>

        <Tabs value={tab} onValueChange={v => setTab(v as typeof tab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="rating" className="gap-1.5"><Star className="w-4 h-4" />Top Rated</TabsTrigger>
            <TabsTrigger value="sessions" className="gap-1.5"><Dumbbell className="w-4 h-4" />Most Sessions</TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5"><MessageSquare className="w-4 h-4" />Most Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No data yet. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => {
                  const isMe = entry.id === user?.id;
                  return (
                    <Link
                      key={entry.id}
                      to={`/trainers/${entry.id}`}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-primary/40',
                        isMe ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-card border-border/50'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                        entry.rank <= 3 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-muted text-muted-foreground'
                      )}>
                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
                        {entry.profile_photo_url ? (
                          <img src={entry.profile_photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          entry.name?.charAt(0) ?? '?'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {entry.name}
                          {isMe && <span className="text-green-600 text-xs ml-2">(You)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.city ?? ''}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0 font-semibold">
                        {metricValue(entry)} {metricLabel === 'Rating' ? '★' : ''}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

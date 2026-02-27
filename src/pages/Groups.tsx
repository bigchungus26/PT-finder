import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/components/layout/AppLayout';
import { Search, Plus, Users, Star, BookOpen } from 'lucide-react';
import { useGroups } from '@/hooks/useGroups';
import { useRecommendedGroups } from '@/hooks/useMatching';
import { cn } from '@/lib/utils';

const Groups = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  const { data: allGroups = [], isLoading } = useGroups();
  const { data: recommendedGroups = [] } = useRecommendedGroups();

  const filteredGroups = allGroups.filter((group) => {
    const course = group.courses;
    const matchesSearch =
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course?.code ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = !levelFilter || group.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Study Groups
            </h1>
            <p className="text-muted-foreground">
              Find and join study groups that match your style
            </p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/groups/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search groups by name, course, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {['beginner', 'average', 'advanced'].map((level) => (
              <Button
                key={level}
                variant={levelFilter === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLevelFilter(levelFilter === level ? null : level)}
                className="capitalize"
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        <section className="mb-8">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-warning" />
            Recommended for You
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedGroups.slice(0, 3).map(({ group, score, reasons }) => (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="block bg-card rounded-xl p-4 border border-border/50 shadow-soft card-hover"
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="text-xs">
                    {group.courses?.code ?? group.course_id}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-warning" />
                    <span className="font-medium">{score}%</span>
                  </div>
                </div>
                <h3 className="font-medium text-foreground mb-1">{group.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {group.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {reasons.slice(0, 2).map((reason, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {reason.description}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {(group.group_members ?? []).slice(0, 4).map((member) => (
                      <Avatar key={member.user_id} className="w-7 h-7 border-2 border-card">
                        <AvatarImage src={member.profiles?.avatar ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {(member.profiles?.name ?? '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {(group.group_members?.length ?? 0) > 4 && (
                      <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs">
                        +{(group.group_members?.length ?? 0) - 4}
                      </div>
                    )}
                  </div>
                  <Badge
                    className={cn(
                      'text-xs capitalize',
                      group.level === 'beginner' && 'bg-success/10 text-success',
                      group.level === 'average' && 'bg-info/10 text-info',
                      group.level === 'advanced' && 'bg-warning/10 text-warning'
                    )}
                  >
                    {group.level}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            All Groups
            <span className="text-sm font-normal text-muted-foreground">
              ({filteredGroups.length})
            </span>
          </h2>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading groups...</div>
          ) : filteredGroups.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((group) => (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="block bg-card rounded-xl p-4 border border-border/50 shadow-soft card-hover"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className="text-xs">
                      {group.courses?.code ?? group.course_id}
                    </Badge>
                    <Badge
                      className={cn(
                        'text-xs capitalize',
                        group.level === 'beginner' &&
                          'bg-success/10 text-success border-success/20',
                        group.level === 'average' && 'bg-info/10 text-info border-info/20',
                        group.level === 'advanced' &&
                          'bg-warning/10 text-warning border-warning/20'
                      )}
                    >
                      {group.level}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-foreground mb-1">{group.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {group.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(group.tags ?? []).slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {(group.group_members ?? []).slice(0, 4).map((member) => (
                        <Avatar key={member.user_id} className="w-7 h-7 border-2 border-card">
                          <AvatarImage src={member.profiles?.avatar ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {(member.profiles?.name ?? '?')[0]}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {(group.group_members?.length ?? 0)}/{group.max_members} members
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border/50">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No groups found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <Button variant="coral" asChild>
                <Link to="/groups/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create a New Group
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default Groups;

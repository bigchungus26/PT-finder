import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/components/layout/AppLayout';
import {
  ArrowLeft,
  Users,
  Calendar,
  MessageCircle,
  Link2,
  Clock,
  MapPin,
  Video,
  Send,
  Pin,
  Plus,
  Check,
} from 'lucide-react';
import { useGroup, useJoinGroup, useLeaveGroup } from '@/hooks/useGroups';
import { useGroupSessions, useCreateSession, useRSVP } from '@/hooks/useSessions';
import { useMessages, useSendMessage, useMessagesSubscription } from '@/hooks/useMessages';
import { useGroupResources, useCreateResource } from '@/hooks/useResources';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const GroupDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');

  // Session dialog state
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    is_online: false,
    meeting_link: '',
  });

  // Resource dialog state
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    type: 'link',
    url: '',
  });

  const { data: group, isLoading } = useGroup(id);
  const { data: sessions = [] } = useGroupSessions(id);
  const { data: messages = [] } = useMessages(id);
  const { data: resources = [] } = useGroupResources(id);

  useMessagesSubscription(id);
  const sendMessage = useSendMessage();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const createSession = useCreateSession();
  const rsvp = useRSVP();
  const createResource = useCreateResource();

  const isMember = group && user && group.group_members.some((m) => m.user_id === user.id);

  const handleSendMessage = () => {
    if (!id || !newMessage.trim()) return;
    sendMessage.mutate(
      { groupId: id, content: newMessage.trim() },
      { onSuccess: () => setNewMessage('') }
    );
  };

  const handleCreateSession = () => {
    if (!id || !sessionForm.title.trim() || !sessionForm.date || !sessionForm.start_time || !sessionForm.end_time) return;
    createSession.mutate(
      {
        group_id: id,
        title: sessionForm.title.trim(),
        description: sessionForm.description.trim() || undefined,
        date: sessionForm.date,
        start_time: sessionForm.start_time,
        end_time: sessionForm.end_time,
        location: sessionForm.location.trim() || undefined,
        is_online: sessionForm.is_online,
        meeting_link: sessionForm.meeting_link.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSessionDialogOpen(false);
          setSessionForm({ title: '', description: '', date: '', start_time: '', end_time: '', location: '', is_online: false, meeting_link: '' });
        },
      }
    );
  };

  const handleRSVP = (sessionId: string, currentStatus: string | undefined) => {
    const nextStatus = currentStatus === 'going' ? 'not-going' : 'going';
    rsvp.mutate({ sessionId, status: nextStatus });
  };

  const handleCreateResource = () => {
    if (!id || !resourceForm.title.trim()) return;
    createResource.mutate(
      {
        title: resourceForm.title.trim(),
        description: resourceForm.description.trim() || undefined,
        type: resourceForm.type,
        url: resourceForm.url.trim() || undefined,
        group_id: id,
      },
      {
        onSuccess: () => {
          setResourceDialogOpen(false);
          setResourceForm({ title: '', description: '', type: 'link', url: '' });
        },
      }
    );
  };

  if (isLoading || (id && !group)) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center min-h-[40vh]">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          ) : (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">Group not found</h1>
              <Button asChild>
                <Link to="/groups">Back to Groups</Link>
              </Button>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  if (!group) return null;

  const course = group.courses;
  const members = group.group_members ?? [];

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <Link
            to="/groups"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Groups
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
                  {group.name}
                </h1>
                <Badge variant="outline">{course?.code ?? group.course_id}</Badge>
              </div>
              <p className="text-muted-foreground mb-3">{group.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {(group.tags ?? []).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            {isMember ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => leaveGroup.mutate(group.id)}
                disabled={leaveGroup.isPending}
              >
                Leave Group
              </Button>
            ) : (
              <Button
                variant="coral"
                size="lg"
                onClick={() => joinGroup.mutate(group.id)}
                disabled={joinGroup.isPending}
              >
                <Users className="w-4 h-4 mr-2" />
                Join Group
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="chat">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="sessions">
                  <Calendar className="w-4 h-4 mr-2" />
                  Sessions
                </TabsTrigger>
                <TabsTrigger value="resources">
                  <Link2 className="w-4 h-4 mr-2" />
                  Resources
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="mt-0">
                <div className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden">
                  <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isMe = message.user_id === user?.id;
                      const profile = message.profiles;
                      return (
                        <div
                          key={message.id}
                          className={cn('flex gap-3', isMe && 'flex-row-reverse')}
                        >
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarImage src={profile?.avatar ?? undefined} />
                            <AvatarFallback>{(profile?.name ?? '?')[0]}</AvatarFallback>
                          </Avatar>
                          <div className={cn('max-w-[70%]', isMe && 'text-right')}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-foreground">
                                {profile?.name ?? 'Unknown'}
                              </span>
                              {message.is_pinned && <Pin className="w-3 h-3 text-warning" />}
                            </div>
                            <div
                              className={cn(
                                'rounded-xl px-4 py-2 text-sm',
                                isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                              )}
                            >
                              {message.content}
                            </div>
                            <span className="text-xs text-muted-foreground mt-1 block">
                              {new Date(message.created_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessage.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sessions" className="mt-0">
                <div className="space-y-3">
                  {isMember && (
                    <div className="flex justify-end mb-2">
                      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="coral" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Session
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Schedule a Study Session</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="session-title">Title</Label>
                              <Input
                                id="session-title"
                                placeholder="e.g., Exam review, Homework help"
                                value={sessionForm.title}
                                onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="session-desc">Description (optional)</Label>
                              <Textarea
                                id="session-desc"
                                placeholder="What will you cover?"
                                value={sessionForm.description}
                                onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                                rows={2}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor="session-date">Date</Label>
                                <Input
                                  id="session-date"
                                  type="date"
                                  value={sessionForm.date}
                                  onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="session-start">Start</Label>
                                <Input
                                  id="session-start"
                                  type="time"
                                  value={sessionForm.start_time}
                                  onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="session-end">End</Label>
                                <Input
                                  id="session-end"
                                  type="time"
                                  value={sessionForm.end_time}
                                  onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={sessionForm.is_online}
                                  onChange={(e) => setSessionForm({ ...sessionForm, is_online: e.target.checked })}
                                  className="rounded"
                                />
                                <span className="text-sm">Online session</span>
                              </label>
                            </div>
                            {sessionForm.is_online ? (
                              <div className="space-y-2">
                                <Label htmlFor="session-link">Meeting link</Label>
                                <Input
                                  id="session-link"
                                  placeholder="https://zoom.us/j/..."
                                  value={sessionForm.meeting_link}
                                  onChange={(e) => setSessionForm({ ...sessionForm, meeting_link: e.target.value })}
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label htmlFor="session-location">Location</Label>
                                <Input
                                  id="session-location"
                                  placeholder="e.g., Library Room 204"
                                  value={sessionForm.location}
                                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                                />
                              </div>
                            )}
                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" onClick={() => setSessionDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={handleCreateSession}
                                disabled={
                                  !sessionForm.title.trim() ||
                                  !sessionForm.date ||
                                  !sessionForm.start_time ||
                                  !sessionForm.end_time ||
                                  createSession.isPending
                                }
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {sessions.length > 0 ? (
                    sessions.map((session) => {
                      const goingCount = (session.session_attendees ?? []).filter(
                        (a) => a.status === 'going'
                      ).length;
                      const myRsvp = user
                        ? (session.session_attendees ?? []).find((a) => a.user_id === user.id)
                        : undefined;
                      return (
                        <div
                          key={session.id}
                          className="bg-card rounded-xl p-4 border border-border/50 shadow-soft"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-foreground">{session.title}</h3>
                              {session.description && (
                                <p className="text-sm text-muted-foreground">
                                  {session.description}
                                </p>
                              )}
                            </div>
                            {isMember && (
                              <Button
                                variant={myRsvp?.status === 'going' ? 'default' : 'soft'}
                                size="sm"
                                onClick={() => handleRSVP(session.id, myRsvp?.status)}
                                disabled={rsvp.isPending}
                              >
                                {myRsvp?.status === 'going' ? (
                                  <>
                                    <Check className="w-3 h-3 mr-1" />
                                    Going
                                  </>
                                ) : (
                                  'RSVP'
                                )}
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {new Date(session.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {session.start_time} - {session.end_time}
                            </div>
                            {session.is_online ? (
                              <div className="flex items-center gap-1.5">
                                <Video className="w-4 h-4" />
                                Online
                              </div>
                            ) : session.location ? (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {session.location}
                              </div>
                            ) : null}
                          </div>
                          {(session.agenda_items?.length ?? 0) > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                                Agenda
                              </h4>
                              <div className="space-y-1.5">
                                {session.agenda_items?.map((item, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">
                                      {item.duration}min
                                    </span>
                                    <span className="text-foreground">{item.title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {goingCount} going
                              </span>
                              <div className="flex -space-x-2">
                                {(session.session_attendees ?? []).slice(0, 4).map((attendee) => (
                                  <Avatar
                                    key={attendee.user_id}
                                    className="w-6 h-6 border-2 border-card"
                                  >
                                    <AvatarImage
                                      src={attendee.profiles?.avatar ?? undefined}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {(attendee.profiles?.name ?? '?')[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium text-foreground mb-2">
                        No upcoming sessions
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Schedule a study session with your group
                      </p>
                      {isMember && (
                        <Button variant="coral" onClick={() => setSessionDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Session
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="resources" className="mt-0">
                <div className="space-y-3">
                  {isMember && (
                    <div className="flex justify-end mb-2">
                      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="coral" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Resource
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Share a Resource</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="resource-title">Title</Label>
                              <Input
                                id="resource-title"
                                placeholder="e.g., Chapter 5 Notes"
                                value={resourceForm.title}
                                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="resource-desc">Description (optional)</Label>
                              <Textarea
                                id="resource-desc"
                                placeholder="Brief description..."
                                value={resourceForm.description}
                                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                                rows={2}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Type</Label>
                              <Select
                                value={resourceForm.type}
                                onValueChange={(value) => setResourceForm({ ...resourceForm, type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="link">Link</SelectItem>
                                  <SelectItem value="notes">Notes</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                  <SelectItem value="document">Document</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="resource-url">URL</Label>
                              <Input
                                id="resource-url"
                                placeholder="https://..."
                                value={resourceForm.url}
                                onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" onClick={() => setResourceDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={handleCreateResource}
                                disabled={!resourceForm.title.trim() || createResource.isPending}
                              >
                                <Link2 className="w-4 h-4 mr-2" />
                                Share
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {resources.length > 0 ? (
                    resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="bg-card rounded-xl p-4 border border-border/50 shadow-soft flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                          <Link2 className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {resource.title}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {resource.description ?? ''}
                          </p>
                        </div>
                        {resource.url ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              Open
                            </a>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">
                            Open
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                      <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium text-foreground mb-2">No resources yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Share helpful resources with your group
                      </p>
                      {isMember && (
                        <Button variant="coral" onClick={() => setResourceDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Resource
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-xl p-4 border border-border/50 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Members
                </h3>
                <span className="text-sm text-muted-foreground">
                  {members.length}/{group.max_members}
                </span>
              </div>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.profiles?.avatar ?? undefined} />
                      <AvatarFallback>
                        {(member.profiles?.name ?? '?')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.profiles?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border/50 shadow-soft">
              <h3 className="font-display font-semibold text-foreground mb-4">Group Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Course</span>
                  <span className="font-medium text-foreground">
                    {course?.code ?? group.course_id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Level</span>
                  <Badge variant="secondary" className="capitalize">
                    {group.level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Visibility</span>
                  <span className="font-medium text-foreground">
                    {group.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
              {group.rules && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">
                    Group Rules
                  </h4>
                  <p className="text-sm text-foreground">{group.rules}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default GroupDetail;

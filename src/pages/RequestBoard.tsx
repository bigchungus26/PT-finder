import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Megaphone,
  Plus,
  DollarSign,
  Clock,
  BookOpen,
  Send,
  Star,
  MapPin,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useCourses } from '@/hooks/useCourses';
import {
  useOpenRequests,
  useMyRequests,
  useMyBids,
  useCreateRequest,
  useCreateBid,
  useAcceptBid,
  useCancelRequest,
} from '@/hooks/useTutorRequests';
import type { RequestWithDetails } from '@/hooks/useTutorRequests';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const RequestBoard = () => {
  const { user } = useAuth();
  const { data: profile } = useCurrentProfile();
  const isTutor = profile?.user_role === 'tutor';
  const { toast } = useToast();

  const { data: openRequests = [], isLoading: loadingOpen } = useOpenRequests();
  const { data: myRequests = [], isLoading: loadingMine } = useMyRequests();
  const { data: myBids = [] } = useMyBids();
  const { data: allCourses = [] } = useCourses();

  const createRequest = useCreateRequest();
  const createBid = useCreateBid();
  const acceptBid = useAcceptBid();
  const cancelRequest = useCancelRequest();

  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithDetails | null>(null);

  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqSubject, setReqSubject] = useState('');
  const [reqBudget, setReqBudget] = useState('');
  const [reqDeadline, setReqDeadline] = useState('');
  const [reqCourseId, setReqCourseId] = useState('');

  const [bidRate, setBidRate] = useState('');
  const [bidMessage, setBidMessage] = useState('');

  const alreadyBidRequestIds = new Set(myBids.map(b => b.request_id));

  const handleCreateRequest = async () => {
    if (!reqTitle.trim()) return;
    try {
      await createRequest.mutateAsync({
        title: reqTitle.trim(),
        description: reqDesc.trim() || undefined,
        subject: reqSubject.trim() || undefined,
        course_id: reqCourseId || undefined,
        max_budget: reqBudget ? parseFloat(reqBudget) : undefined,
        deadline: reqDeadline || undefined,
      });
      toast({ title: 'Request posted!' });
      setNewRequestOpen(false);
      resetRequestForm();
    } catch (err) {
      toast({ title: 'Failed to create request', variant: 'destructive' });
    }
  };

  const handleBid = async () => {
    if (!selectedRequest) return;
    try {
      await createBid.mutateAsync({
        request_id: selectedRequest.id,
        proposed_rate: bidRate ? parseFloat(bidRate) : undefined,
        message: bidMessage.trim() || undefined,
      });
      toast({ title: 'Bid submitted!' });
      setBidDialogOpen(false);
      setBidRate('');
      setBidMessage('');
      setSelectedRequest(null);
    } catch (err) {
      toast({ title: 'Failed to submit bid', variant: 'destructive' });
    }
  };

  const handleAcceptBid = async (bidId: string, requestId: string) => {
    try {
      await acceptBid.mutateAsync({ bidId, requestId });
      toast({ title: 'Bid accepted! The trainer has been notified.' });
    } catch (err) {
      toast({ title: 'Failed to accept bid', variant: 'destructive' });
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelRequest.mutateAsync(requestId);
      toast({ title: 'Request cancelled.' });
    } catch (err) {
      toast({ title: 'Failed to cancel', variant: 'destructive' });
    }
  };

  const resetRequestForm = () => {
    setReqTitle('');
    setReqDesc('');
    setReqSubject('');
    setReqBudget('');
    setReqDeadline('');
    setReqCourseId('');
  };

  const openBidDialog = (request: RequestWithDetails) => {
    setSelectedRequest(request);
    setBidDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              {isTutor ? 'Job Board' : 'Request Board'}
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-1">
              {isTutor ? 'Find Clients Who Need Help' : 'Post a Help Request'}
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              {isTutor
                ? 'Browse open requests from clients and apply to help them.'
                : "Can't find the right trainer? Post what you need and let trainers come to you."}
            </p>
          </div>
          {!isTutor && (
            <Button onClick={() => setNewRequestOpen(true)} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              New Request
            </Button>
          )}
        </div>

        <Tabs defaultValue={isTutor ? 'browse' : 'my-requests'}>
          <TabsList>
            {!isTutor && <TabsTrigger value="my-requests">My Requests</TabsTrigger>}
            <TabsTrigger value="browse">{isTutor ? 'Open Requests' : 'Browse All'}</TabsTrigger>
            {isTutor && <TabsTrigger value="my-bids">My Bids</TabsTrigger>}
          </TabsList>

          {!isTutor && (
            <TabsContent value="my-requests" className="mt-4">
              {loadingMine ? (
                <LoadingState />
              ) : myRequests.length === 0 ? (
                <EmptyState
                  icon={Megaphone}
                  title="No requests yet"
                  subtitle="Post a request and trainers will apply to help you."
                />
              ) : (
                <div className="space-y-4">
                  {myRequests.map(req => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      isOwner
                      onAcceptBid={handleAcceptBid}
                      onCancel={() => handleCancelRequest(req.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="browse" className="mt-4">
            {loadingOpen ? (
              <LoadingState />
            ) : openRequests.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title={isTutor ? 'No open requests right now' : 'No open requests yet'}
                subtitle={isTutor ? 'Check back later — clients post new requests often.' : 'Be the first to post!'}
              />
            ) : (
              <div className="space-y-4">
                {openRequests
                  .filter(r => r.student_id !== user?.id)
                  .map(req => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      isTutor={isTutor}
                      alreadyBid={alreadyBidRequestIds.has(req.id)}
                      onBid={() => openBidDialog(req)}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          {isTutor && (
            <TabsContent value="my-bids" className="mt-4">
              {myBids.length === 0 ? (
                <EmptyState
                  icon={Send}
                  title="No bids yet"
                  subtitle="Browse open requests and apply to help clients."
                />
              ) : (
                <div className="space-y-3">
                  {myBids.map(bid => (
                    <div key={bid.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-foreground">{bid.request.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {bid.message || 'No message attached.'}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            bid.status === 'accepted' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            bid.status === 'rejected' && 'bg-red-50 text-red-700 border-red-200',
                            bid.status === 'pending' && 'bg-green-50 text-green-700 border-green-200',
                          )}
                        >
                          {bid.status}
                        </Badge>
                      </div>
                      {bid.proposed_rate && (
                        <div className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
                          <DollarSign className="w-3.5 h-3.5" />
                          {bid.proposed_rate}/hr
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* New Request Dialog */}
        <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Post a Help Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  placeholder='e.g., "Need help with strength training and form"'
                  value={reqTitle}
                  onChange={e => setReqTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe your fitness goals, current level, and what you're hoping to achieve..."
                  value={reqDesc}
                  onChange={e => setReqDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input
                    placeholder="e.g., Strength Training"
                    value={reqSubject}
                    onChange={e => setReqSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Specialty</Label>
                  <select
                    value={reqCourseId}
                    onChange={e => setReqCourseId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Any specialty</option>
                    {allCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Max Budget ($/hr)</Label>
                  <Input
                    type="number"
                    min="5"
                    step="5"
                    placeholder="40"
                    value={reqBudget}
                    onChange={e => setReqBudget(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Need Help By</Label>
                  <Input
                    type="date"
                    value={reqDeadline}
                    onChange={e => setReqDeadline(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setNewRequestOpen(false); resetRequestForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateRequest}
                disabled={!reqTitle.trim() || createRequest.isPending}
                className="gap-2"
              >
                {createRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                Post Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bid Dialog */}
        <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply to Help</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <span className="font-medium">{selectedRequest.title}</span>
                  {selectedRequest.max_budget && (
                    <span className="text-muted-foreground ml-2">
                      (Budget: ${selectedRequest.max_budget}/hr)
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Your Rate ($/hr)</Label>
                  <Input
                    type="number"
                    min="5"
                    step="5"
                    placeholder="Enter your rate"
                    value={bidRate}
                    onChange={e => setBidRate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Message to Client</Label>
                  <Textarea
                    placeholder="Why you're a great fit, your experience with this specialty..."
                    value={bidMessage}
                    onChange={e => setBidMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setBidDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleBid}
                disabled={createBid.isPending}
                className="gap-2"
              >
                {createBid.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Bid
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

function RequestCard({
  request,
  isOwner,
  isTutor,
  alreadyBid,
  onBid,
  onAcceptBid,
  onCancel,
}: {
  request: RequestWithDetails;
  isOwner?: boolean;
  isTutor?: boolean;
  alreadyBid?: boolean;
  onBid?: () => void;
  onAcceptBid?: (bidId: string, requestId: string) => void;
  onCancel?: () => void;
}) {
  const statusColor: Record<string, string> = {
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    filled: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    expired: 'bg-muted text-muted-foreground',
    cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-foreground">{request.title}</h3>
            <Badge variant="outline" className={statusColor[request.status]}>
              {request.status}
            </Badge>
          </div>
          {request.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
          )}
        </div>
        {!isOwner && !alreadyBid && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            by {request.student?.name ?? 'Client'}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {request.subject && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <BookOpen className="w-3.5 h-3.5" />
            {request.subject}
          </span>
        )}
        {request.course && (
          <Badge variant="outline" className="text-xs">{request.course.code}</Badge>
        )}
        {request.max_budget && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <DollarSign className="w-3.5 h-3.5" />
            {request.max_budget}/hr budget
          </span>
        )}
        {request.deadline && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            By {new Date(request.deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Tutor: apply button */}
      {isTutor && request.status === 'open' && (
        <div className="pt-2 border-t border-border/50">
          {alreadyBid ? (
            <Badge variant="outline" className="bg-primary/5 text-primary">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Bid submitted
            </Badge>
          ) : (
            <Button size="sm" onClick={onBid} className="gap-2">
              <Send className="w-3.5 h-3.5" />
              Apply / Bid
            </Button>
          )}
        </div>
      )}

      {/* Owner: see bids */}
      {isOwner && request.tutor_bids?.length > 0 && (
        <div className="pt-3 border-t border-border/50 space-y-2">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-primary" />
            Bids ({request.tutor_bids.length})
          </h4>
          {request.tutor_bids.map(bid => (
            <div key={bid.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 bg-muted/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {bid.tutor?.name?.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/trainers/${bid.tutor_id}`} className="font-medium text-sm text-foreground hover:text-primary transition-colors">
                      {bid.tutor?.name}
                    </Link>
                    {bid.tutor?.verified_status && (
                      <Shield className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    {bid.tutor?.rating_avg > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-600">
                        <Star className="w-3 h-3 fill-current" />
                        {bid.tutor.rating_avg.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {bid.message && (
                    <p className="text-xs text-muted-foreground truncate">{bid.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {bid.proposed_rate && (
                  <span className="text-sm font-semibold text-emerald-600">${bid.proposed_rate}/hr</span>
                )}
                {request.status === 'open' && bid.status === 'pending' && (
                  <Button size="sm" variant="soft" onClick={() => onAcceptBid?.(bid.id, request.id)} className="gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accept
                  </Button>
                )}
                {bid.status === 'accepted' && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">Accepted</Badge>
                )}
                {bid.status === 'rejected' && (
                  <Badge variant="outline" className="bg-red-50 text-red-600">Rejected</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Owner: cancel */}
      {isOwner && request.status === 'open' && (
        <div className="flex justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground gap-1">
            <XCircle className="w-3.5 h-3.5" />
            Cancel Request
          </Button>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="text-center py-12 bg-card rounded-xl border border-border/50">
      <Icon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
      <h2 className="font-medium text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export default RequestBoard;

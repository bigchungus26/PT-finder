import AppLayout from '@/components/layout/AppLayout';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useReports, useUpdateReportStatus, ReportStatus } from '@/hooks/useReports';
import { useAllVerifications, useReviewVerification, VerificationWithTutor } from '@/hooks/useVerifications';
import { useSeasonalNotifications } from '@/hooks/useRetention';
import { useAdminStats, useAnnouncements, useCreateAnnouncement, useDeactivateAnnouncement } from '@/hooks/useFeaturesV2';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useMemo } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCheck,
  XCircle,
  ExternalLink,
  Star,
  Award,
  Loader2,
  BarChart3,
  TrendingUp,
  Calendar,
  Megaphone,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const statusLabel: Record<ReportStatus, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
};

const statusVariant: Record<ReportStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  reviewed: 'bg-info/10 text-info border-info/20',
  resolved: 'bg-success/10 text-success border-success/20',
};

const verificationTypeLabel: Record<string, string> = {
  transcript: 'Transcript',
  linkedin: 'LinkedIn Profile',
  background_check: 'Background Check',
  other: 'Other Document',
};

const Admin = () => {
  const { data: profile, isLoading } = useCurrentProfile();
  const isAdmin = !!profile?.is_admin;
  const { toast } = useToast();

  const [mainTab, setMainTab] = useState<'verifications' | 'reports' | 'retention' | 'content'>('verifications');
  const [reportTab, setReportTab] = useState<ReportStatus | 'all'>('pending');
  const [verifyTab, setVerifyTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const { data: reports = [], isLoading: reportsLoading } = useReports(isAdmin);
  const updateStatus = useUpdateReportStatus();

  const { data: verifications = [], isLoading: verificationsLoading } = useAllVerifications(isAdmin);
  const reviewVerification = useReviewVerification();
  const { data: seasonalNotifs = [] } = useSeasonalNotifications();
  const { data: adminStats } = useAdminStats();
  const { data: announcements = [] } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const deactivateAnnouncement = useDeactivateAnnouncement();

  // Retention data
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, user_role, created_at, last_active_at');
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const { data: funnelData = [] } = useQuery({
    queryKey: ['admin-funnel'],
    queryFn: async () => {
      const events = [
        'onboarding_started', 'onboarding_completed', 'first_discover_load',
        'trainer_profile_viewed', 'first_inquiry_sent', 'first_booking_sent',
        'first_booking_confirmed', 'first_session_completed', 'first_review_submitted',
      ];
      const results: { event: string; count: number }[] = [];
      for (const ev of events) {
        const { count } = await supabase
          .from('user_events')
          .select('user_id', { count: 'exact', head: true })
          .eq('event_name', ev);
        results.push({ event: ev.replace(/_/g, ' '), count: count ?? 0 });
      }
      return results;
    },
    enabled: isAdmin,
  });

  const retentionCohorts = useMemo(() => {
    if (!allProfiles.length) return [];
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const cohorts: { week: string; d1: number; d7: number; d30: number; total: number }[] = [];

    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(now - (i + 1) * weekMs);
      const weekEnd = new Date(now - i * weekMs);
      const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const cohort = allProfiles.filter(p => {
        const created = new Date(p.created_at);
        return created >= weekStart && created < weekEnd;
      });
      if (cohort.length === 0) continue;

      const d1 = cohort.filter(p => {
        if (!p.last_active_at) return false;
        const active = new Date(p.last_active_at);
        const created = new Date(p.created_at);
        return (active.getTime() - created.getTime()) >= 24 * 60 * 60 * 1000;
      }).length;

      const d7 = cohort.filter(p => {
        if (!p.last_active_at) return false;
        const active = new Date(p.last_active_at);
        const created = new Date(p.created_at);
        return (active.getTime() - created.getTime()) >= 7 * 24 * 60 * 60 * 1000;
      }).length;

      const d30 = cohort.filter(p => {
        if (!p.last_active_at) return false;
        const active = new Date(p.last_active_at);
        const created = new Date(p.created_at);
        return (active.getTime() - created.getTime()) >= 30 * 24 * 60 * 60 * 1000;
      }).length;

      cohorts.push({
        week: weekLabel,
        d1: cohort.length > 0 ? Math.round((d1 / cohort.length) * 100) : 0,
        d7: cohort.length > 0 ? Math.round((d7 / cohort.length) * 100) : 0,
        d30: cohort.length > 0 ? Math.round((d30 / cohort.length) * 100) : 0,
        total: cohort.length,
      });
    }
    return cohorts.reverse();
  }, [allProfiles]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="p-8 flex flex-col items-center justify-center min-h-[40vh] text-center">
          <Shield className="w-10 h-10 text-muted-foreground mb-3" />
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Admin access required
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            This page is only available to PT Finder admins.
          </p>
        </div>
      </AppLayout>
    );
  }

  const filteredReports =
    reportTab === 'all' ? reports : reports.filter((r) => r.status === reportTab);

  const filteredVerifications =
    verifyTab === 'all' ? verifications : verifications.filter(v => v.status === verifyTab);

  const pendingVerifyCount = verifications.filter(v => v.status === 'pending').length;

  const changeReportStatus = (id: string, status: ReportStatus) => {
    updateStatus.mutate({ id, status });
  };

  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const handleReview = async (v: VerificationWithTutor, status: 'approved' | 'rejected') => {
    try {
      await reviewVerification.mutateAsync({
        id: v.id,
        status,
        tutorId: v.tutor_id,
        rejectionReason: status === 'rejected' ? (rejectionReason.trim() || 'Documents did not meet requirements.') : undefined,
      });
      toast({ title: status === 'approved' ? 'Verification approved' : 'Verification rejected' });
      setRejectionReason('');
      setRejectingId(null);
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-2">
            <Shield className="w-3.5 h-3.5" />
            Admin Console
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-1">
            Admin Console
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage verifications, review reports, and keep PT Finder safe.
          </p>
        </div>

        {/* Platform Stats (Section 12a) */}
        {adminStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Total Users', value: adminStats.totalUsers },
              { label: 'Verified Trainers', value: adminStats.verifiedTrainers },
              { label: 'Total Bookings', value: adminStats.totalBookings },
              { label: 'Completed', value: adminStats.completedSessions },
              { label: 'Active (7d)', value: adminStats.activeThisWeek },
              { label: 'New (7d)', value: adminStats.newSignups },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-xl p-3 border border-border/50 text-center">
                <div className="text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Main tab switch */}
        <Tabs value={mainTab} onValueChange={v => setMainTab(v as typeof mainTab)}>
          <TabsList>
            <TabsTrigger value="verifications" className="gap-1.5">
              <FileCheck className="w-4 h-4" />
              Verifications
              {pendingVerifyCount > 0 && (
                <Badge className="ml-1 bg-green-600 text-white border-0 text-xs h-5 min-w-5 justify-center">{pendingVerifyCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="retention" className="gap-1.5">
              <BarChart3 className="w-4 h-4" />
              Retention
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-1.5">
              <Sparkles className="w-4 h-4" />
              Content
            </TabsTrigger>
          </TabsList>

          {/* Verifications Tab */}
          <TabsContent value="verifications" className="mt-4">
            <Tabs value={verifyTab} onValueChange={v => setVerifyTab(v as typeof verifyTab)}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value={verifyTab} className="mt-4">
                {verificationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredVerifications.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                    <FileCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h2 className="font-medium text-foreground mb-1">No verifications</h2>
                    <p className="text-sm text-muted-foreground">
                      {verifyTab === 'pending' ? 'No pending verifications to review.' : 'Nothing here yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredVerifications.map(v => (
                      <div key={v.id} className="bg-card rounded-xl border border-border/50 shadow-soft p-5 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              {v.tutor?.name?.charAt(0) ?? '?'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link to={`/trainers/${v.tutor_id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                                  {v.tutor?.name ?? 'Unknown'}
                                </Link>
                                {v.tutor?.verified_status && (
                                  <Badge className="gap-1 bg-blue-100 text-blue-700 border-0 text-xs">
                                    <Shield className="w-3 h-3" />
                                    Verified
                                  </Badge>
                                )}
                                {(v.tutor?.rating_avg ?? 0) > 0 && (
                                  <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                    <Star className="w-3 h-3 fill-current" />
                                    {(v.tutor?.rating_avg ?? 0).toFixed(1)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {v.tutor?.bio_expert || v.tutor?.major || 'No headline'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                v.status === 'pending' && 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
                                v.status === 'approved' && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
                                v.status === 'rejected' && 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
                              )}
                            >
                              {v.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(v.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <Badge variant="outline">
                            <Award className="w-3 h-3 mr-1" />
                            {verificationTypeLabel[v.type] ?? v.type}
                          </Badge>
                          {v.document_url && (
                            <a
                              href={v.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 text-xs"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Document
                            </a>
                          )}
                        </div>

                        {v.notes && (
                          <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                            {v.notes}
                          </p>
                        )}

                        {v.status === 'pending' && (
                          <div className="flex gap-2 pt-2 border-t border-border/50">
                            <Button
                              size="sm"
                              onClick={() => handleReview(v, 'approved')}
                              disabled={reviewVerification.isPending}
                              className="gap-1.5"
                            >
                              {reviewVerification.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReview(v, 'rejected')}
                              disabled={reviewVerification.isPending}
                              className="gap-1.5 text-destructive hover:text-destructive"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {v.reviewed_at && (
                          <p className="text-xs text-muted-foreground">
                            Reviewed on {new Date(v.reviewed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Reports Tab (preserved from original) */}
          <TabsContent value="reports" className="mt-4">
            <Tabs value={reportTab} onValueChange={(v) => setReportTab(v as ReportStatus | 'all')}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value={reportTab} className="mt-4">
                {reportsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading reports...</p>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                    <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h2 className="font-medium text-foreground mb-1">No reports</h2>
                    <p className="text-sm text-muted-foreground">
                      Everything looks quiet right now.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-card rounded-xl border border-border/50 shadow-soft p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={statusVariant[report.status]}
                              >
                                {statusLabel[report.status]}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(report.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {report.reason}
                            </p>
                            {report.description && (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {report.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Reporter:</span>{' '}
                              {report.reporter?.name ?? 'Unknown'}
                            </div>
                            {report.reported_user && (
                              <div>
                                <span className="font-medium">User:</span>{' '}
                                {report.reported_user.name}
                              </div>
                            )}
                            {report.reported_group && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Group:</span>
                                <Link
                                  to={`/groups/${report.reported_group.id}`}
                                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  {report.reported_group.name}
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-end">
                          {report.status !== 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => changeReportStatus(report.id, 'pending')}
                              disabled={updateStatus.isPending}
                            >
                              Mark pending
                            </Button>
                          )}
                          {report.status !== 'reviewed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => changeReportStatus(report.id, 'reviewed')}
                              disabled={updateStatus.isPending}
                            >
                              Mark reviewed
                            </Button>
                          )}
                          {report.status !== 'resolved' && (
                            <Button
                              variant="soft"
                              size="sm"
                              onClick={() => changeReportStatus(report.id, 'resolved')}
                              disabled={updateStatus.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Mark resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
          {/* Retention Tab (Section 10) */}
          <TabsContent value="retention" className="mt-4 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
                <div className="text-2xl font-bold text-foreground">{allProfiles.length}</div>
                <div className="text-xs text-muted-foreground">Total Users</div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {allProfiles.filter(p => p.user_role === 'trainer').length}
                </div>
                <div className="text-xs text-muted-foreground">Trainers</div>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {allProfiles.filter(p => p.user_role === 'client').length}
                </div>
                <div className="text-xs text-muted-foreground">Clients</div>
              </div>
            </div>

            {/* Retention Cohort Table */}
            <div className="bg-card rounded-xl p-5 border border-border/50">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Retention by Weekly Cohort
              </h3>
              {retentionCohorts.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-muted-foreground font-medium">Week</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">Users</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">D1</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">D7</th>
                          <th className="text-right py-2 text-muted-foreground font-medium">D30</th>
                        </tr>
                      </thead>
                      <tbody>
                        {retentionCohorts.map(c => (
                          <tr key={c.week} className="border-b border-border/50">
                            <td className="py-2 text-foreground">{c.week}</td>
                            <td className="py-2 text-right text-foreground">{c.total}</td>
                            <td className="py-2 text-right text-foreground">{c.d1}%</td>
                            <td className="py-2 text-right text-foreground">{c.d7}%</td>
                            <td className="py-2 text-right text-foreground">{c.d30}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="h-48 mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={retentionCohorts}>
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="d1" stroke="#16A34A" strokeWidth={2} name="D1 %" />
                        <Line type="monotone" dataKey="d7" stroke="#3B82F6" strokeWidth={2} name="D7 %" />
                        <Line type="monotone" dataKey="d30" stroke="#15803D" strokeWidth={2} name="D30 %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4">No cohort data available yet.</p>
              )}
            </div>

            {/* Funnel */}
            <div className="bg-card rounded-xl p-5 border border-border/50">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> User Funnel
              </h3>
              {funnelData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="event" type="category" tick={{ fontSize: 9 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#16A34A" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">No funnel data yet. Events are tracked as users interact with the app.</p>
              )}
            </div>
          </TabsContent>

          {/* Content Tab (Section 7b + 4d) */}
          <TabsContent value="content" className="mt-4 space-y-6">
            {/* Weekly Content Manager */}
            <div className="bg-card rounded-xl p-5 border border-border/50">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Weekly Content Cards
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create weekly fitness tips that appear on client dashboards every Monday.
              </p>
              <WeeklyContentForm />
            </div>

            {/* Announcements (Section 12d) */}
            <div className="bg-card rounded-xl p-5 border border-border/50">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" /> Announcements
              </h3>
              <div className="space-y-2 mb-4">
                {announcements.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.body}</p>
                      <Badge variant="outline" className="text-xs mt-1">{a.target_audience} &middot; {a.type}</Badge>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deactivateAnnouncement.mutate(a.id)}>
                      Deactivate
                    </Button>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">No active announcements.</p>
                )}
              </div>
              <AnnouncementForm onSubmit={(data) => createAnnouncement.mutate(data)} />
            </div>

            {/* Seasonal Notifications */}
            <div className="bg-card rounded-xl p-5 border border-border/50">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" /> Seasonal Notifications
              </h3>
              <div className="space-y-2">
                {seasonalNotifs.map(n => (
                  <div key={n.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">Trigger: {new Date(n.trigger_date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className={n.sent ? 'bg-emerald-50 text-emerald-700' : 'bg-green-50 text-green-700'}>
                      {n.sent ? 'Sent' : 'Pending'}
                    </Badge>
                  </div>
                ))}
                {seasonalNotifs.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">No seasonal notifications configured yet.</p>
                )}
              </div>
              <SeasonalNotificationForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

function WeeklyContentForm() {
  const { toast } = useToast();
  const [theme, setTheme] = useState('');
  const [tipText, setTipText] = useState('');
  const [ctaText, setCtaText] = useState('');

  const now = new Date();
  const weekNum = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);

  const handleCreate = async () => {
    const { error } = await supabase.from('weekly_content').insert({
      week_number: weekNum,
      year: now.getFullYear(),
      theme: theme.trim(),
      tip_text: tipText.trim(),
      cta_text: ctaText.trim() || null,
    });
    if (error) {
      toast({ title: 'Failed to create', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Weekly content created!' });
      setTheme(''); setTipText(''); setCtaText('');
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30 mt-4">
      <h4 className="text-sm font-medium">Create for Week {weekNum}</h4>
      <Input placeholder="Theme (e.g. Recovery Week)" value={theme} onChange={e => setTheme(e.target.value)} />
      <Textarea placeholder="Tip text (2-3 lines)" value={tipText} onChange={e => setTipText(e.target.value)} rows={2} />
      <Input placeholder="CTA text (optional)" value={ctaText} onChange={e => setCtaText(e.target.value)} />
      <Button size="sm" disabled={!theme.trim() || !tipText.trim()} onClick={handleCreate}>
        Create Content Card
      </Button>
    </div>
  );
}

function SeasonalNotificationForm() {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [triggerDate, setTriggerDate] = useState('');

  const handleCreate = async () => {
    const { error } = await supabase.from('seasonal_notifications').insert({
      title: title.trim(),
      body: body.trim(),
      trigger_date: triggerDate,
    });
    if (error) {
      toast({ title: 'Failed to create', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Seasonal notification created!' });
      setTitle(''); setBody(''); setTriggerDate('');
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30 mt-4">
      <h4 className="text-sm font-medium">Add Seasonal Notification</h4>
      <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <Textarea placeholder="Message body (use [Name] for trainer name)" value={body} onChange={e => setBody(e.target.value)} rows={2} />
      <Input type="date" value={triggerDate} onChange={e => setTriggerDate(e.target.value)} />
      <Button size="sm" disabled={!title.trim() || !body.trim() || !triggerDate} onClick={handleCreate}>
        Add Notification
      </Button>
    </div>
  );
}

function AnnouncementForm({ onSubmit }: { onSubmit: (data: { title: string; body: string; type: string; target_audience: string }) => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('info');
  const [target, setTarget] = useState('all');

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) return;
    onSubmit({ title: title.trim(), body: body.trim(), type, target_audience: target });
    setTitle(''); setBody('');
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30">
      <h4 className="text-sm font-medium">Create Announcement</h4>
      <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <Textarea placeholder="Body" value={body} onChange={e => setBody(e.target.value)} rows={2} />
      <div className="flex gap-3">
        <select value={type} onChange={e => setType(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="promo">Promo</option>
        </select>
        <select value={target} onChange={e => setTarget(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All Users</option>
          <option value="clients">Clients Only</option>
          <option value="trainers">Trainers Only</option>
        </select>
      </div>
      <Button size="sm" disabled={!title.trim() || !body.trim()} onClick={handleSubmit}>
        Create Announcement
      </Button>
    </div>
  );
}

export default Admin;

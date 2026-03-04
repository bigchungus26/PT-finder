import AppLayout from '@/components/layout/AppLayout';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useReports, useUpdateReportStatus, ReportStatus } from '@/hooks/useReports';
import { useAllVerifications, useReviewVerification, VerificationWithTutor } from '@/hooks/useVerifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

  const [mainTab, setMainTab] = useState<'reports' | 'verifications'>('verifications');
  const [reportTab, setReportTab] = useState<ReportStatus | 'all'>('pending');
  const [verifyTab, setVerifyTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const { data: reports = [], isLoading: reportsLoading } = useReports(isAdmin);
  const updateStatus = useUpdateReportStatus();

  const { data: verifications = [], isLoading: verificationsLoading } = useAllVerifications(isAdmin);
  const reviewVerification = useReviewVerification();

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

  const handleReview = async (v: VerificationWithTutor, status: 'approved' | 'rejected') => {
    try {
      await reviewVerification.mutateAsync({ id: v.id, status, tutorId: v.tutor_id });
      toast({ title: status === 'approved' ? 'Verification approved' : 'Verification rejected' });
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

        {/* Main tab switch */}
        <Tabs value={mainTab} onValueChange={v => setMainTab(v as typeof mainTab)}>
          <TabsList>
            <TabsTrigger value="verifications" className="gap-1.5">
              <FileCheck className="w-4 h-4" />
              Verifications
              {pendingVerifyCount > 0 && (
                <Badge className="ml-1 bg-amber-500 text-white border-0 text-xs h-5 min-w-5 justify-center">{pendingVerifyCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Reports
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
                                v.status === 'pending' && 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
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
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Admin;

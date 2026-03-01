import AppLayout from '@/components/layout/AppLayout';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useReports, useUpdateReportStatus, ReportStatus } from '@/hooks/useReports';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

const Admin = () => {
  const { data: profile, isLoading } = useCurrentProfile();
  const isAdmin = !!profile?.is_admin;
  const [tab, setTab] = useState<ReportStatus | 'all'>('pending');
  const { data: reports = [], isLoading: reportsLoading } = useReports(isAdmin);
  const updateStatus = useUpdateReportStatus();

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
            This page is only available to StudyHub admins. If you think this is a mistake,
            contact the maintainer.
          </p>
        </div>
      </AppLayout>
    );
  }

  const filteredReports =
    tab === 'all' ? reports : reports.filter((r) => r.status === tab);

  const changeStatus = (id: string, status: ReportStatus) => {
    updateStatus.mutate({ id, status });
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-2">
              <Shield className="w-3.5 h-3.5" />
              Admin
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-1">
              Admin Console
            </h1>
            <p className="text-sm text-muted-foreground">
              Review reports and keep the StudyHub community safe.
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as ReportStatus | 'all')}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
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
                          onClick={() => changeStatus(report.id, 'pending')}
                          disabled={updateStatus.isPending}
                        >
                          Mark pending
                        </Button>
                      )}
                      {report.status !== 'reviewed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => changeStatus(report.id, 'reviewed')}
                          disabled={updateStatus.isPending}
                        >
                          Mark reviewed
                        </Button>
                      )}
                      {report.status !== 'resolved' && (
                        <Button
                          variant="soft"
                          size="sm"
                          onClick={() => changeStatus(report.id, 'resolved')}
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
      </div>
    </AppLayout>
  );
};

export default Admin;


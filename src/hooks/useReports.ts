import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface ReportWithRelations {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_group_id: string | null;
  reason: string;
  description: string;
  status: ReportStatus;
  created_at: string;
  reporter?: { id: string; name: string; email: string | null };
  reported_user?: { id: string; name: string; email: string | null } | null;
  reported_group?: {
    id: string;
    name: string;
    courses?: { id: string; code: string; title: string } | null;
  } | null;
}

export function useReports(enabled: boolean) {
  return useQuery({
    queryKey: ['reports'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(
          `
          *,
          reporter:reporter_id ( id, name, email ),
          reported_user:reported_user_id ( id, name, email ),
          reported_group:reported_group_id (
            id,
            name,
            courses:courses (
              id,
              code,
              title
            )
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as ReportWithRelations[];
    },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReportStatus }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}


import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton", className)}
      {...props}
    />
  );
}

function TrainerCardSkeleton() {
  return (
    <div style={{ borderRadius: 16, background: '#111', border: '1px solid #1E1E1E', padding: 16 }}>
      <div className="flex items-start gap-4">
        <Skeleton style={{ width: 64, height: 64, borderRadius: 12 }} />
        <div className="flex-1 space-y-2">
          <Skeleton style={{ height: 18, width: '50%' }} />
          <div className="flex gap-2">
            <Skeleton style={{ height: 14, width: 40, borderRadius: 4 }} />
            <Skeleton style={{ height: 14, width: 50, borderRadius: 4 }} />
          </div>
          <Skeleton style={{ height: 14, width: '70%' }} />
          <Skeleton style={{ height: 16, width: 80 }} />
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div style={{ width: 120, height: 80, borderRadius: 12, background: '#141414', border: '1px solid #1E1E1E', padding: 16 }}>
      <Skeleton style={{ height: 12, width: 50, marginBottom: 8 }} />
      <Skeleton style={{ height: 28, width: 40 }} />
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton style={{ width: 44, height: 44, borderRadius: '50%' }} className="shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton style={{ height: 14, width: '60%' }} />
        <Skeleton style={{ height: 12, width: '80%' }} />
      </div>
    </div>
  );
}

function ProfileHeaderSkeleton() {
  return (
    <div style={{ padding: 20 }}>
      <Skeleton style={{ width: 80, height: 80, borderRadius: 16, marginBottom: 12 }} />
      <Skeleton style={{ height: 22, width: '60%', marginBottom: 8 }} />
      <Skeleton style={{ height: 14, width: '40%', marginBottom: 16 }} />
      <div className="flex gap-4">
        <Skeleton style={{ height: 14, width: 60 }} />
        <Skeleton style={{ height: 14, width: 80 }} />
        <Skeleton style={{ height: 14, width: 60 }} />
      </div>
    </div>
  );
}

export { Skeleton, TrainerCardSkeleton, StatCardSkeleton, ConversationSkeleton, ProfileHeaderSkeleton };

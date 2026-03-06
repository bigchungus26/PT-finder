import { formatDistanceToNow } from 'date-fns';
import { Lightbulb, MessageCircle } from 'lucide-react';
import { useFeedPosts } from '@/hooks/useRetention';
import { Link } from 'react-router-dom';

export function TipsFeed() {
  const { data: posts = [] } = useFeedPosts();

  if (posts.length === 0) return null;

  return (
    <div className="bg-card rounded-xl p-4 border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-foreground text-sm">Tips from Your Trainers</h3>
      </div>
      <div className="space-y-3">
        {posts.slice(0, 5).map(post => (
          <div key={post.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary overflow-hidden shrink-0">
                {post.trainer?.profile_photo_url ? (
                  <img src={post.trainer.profile_photo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  post.trainer?.name?.charAt(0) ?? '?'
                )}
              </div>
              <Link to={`/trainers/${post.trainer_id}`} className="text-xs font-medium text-foreground hover:text-primary">
                {post.trainer?.name}
              </Link>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-foreground">{post.content}</p>
            {post.image_url && (
              <img src={post.image_url} alt="" className="mt-2 rounded-lg w-full max-h-48 object-cover" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

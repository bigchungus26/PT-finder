import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';

interface FavoriteButtonProps {
  productId?: string;
  storeId?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function FavoriteButton({ productId, storeId, className, size = 'md' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: favs = [] } = useFavorites(user?.id);
  const toggle = useToggleFavorite();

  const isFav = productId
    ? favs.some((f) => f.product_id === productId)
    : favs.some((f) => f.store_id === storeId);

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]';
  const btnSize = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    toggle.mutate({ userId: user.id, productId, storeId, isFav });
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        `${btnSize} rounded-full flex items-center justify-center transition-all active:scale-90`,
        isFav
          ? 'bg-red-50 dark:bg-red-950'
          : 'bg-background/80 backdrop-blur hover:bg-muted',
        className
      )}
      aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
    >
      <Heart
        className={cn(
          iconSize,
          'transition-colors',
          isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
        )}
      />
    </button>
  );
}

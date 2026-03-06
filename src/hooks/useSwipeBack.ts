import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function useSwipeBack(enabled = true) {
  const navigate = useNavigate();
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch.clientX < 20) {
        startX.current = touch.clientX;
        startY.current = touch.clientY;
        swiping.current = true;
      }
    };

    const handleMove = (e: TouchEvent) => {
      if (!swiping.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = Math.abs(e.touches[0].clientY - startY.current);
      if (dy > dx) {
        swiping.current = false;
      }
    };

    const handleEnd = (e: TouchEvent) => {
      if (!swiping.current) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      if (dx > 60) {
        navigate(-1);
      }
      swiping.current = false;
    };

    document.addEventListener('touchstart', handleStart, { passive: true });
    document.addEventListener('touchmove', handleMove, { passive: true });
    document.addEventListener('touchend', handleEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleStart);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [enabled, navigate]);
}

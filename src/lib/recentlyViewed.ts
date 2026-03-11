const KEY = 'stackr_recently_viewed';
const MAX = 8;

export interface RecentProduct {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  price_lbp: number;
  store_name: string | null;
  viewedAt: number;
}

export function addRecentlyViewed(p: Omit<RecentProduct, 'viewedAt'>) {
  try {
    const existing: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    const filtered = existing.filter((x) => x.id !== p.id);
    const updated = [{ ...p, viewedAt: Date.now() }, ...filtered].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentlyViewed(): RecentProduct[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

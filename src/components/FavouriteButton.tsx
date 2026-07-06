'use client';

import { useState } from 'react';

export default function FavouriteButton({
  coachId,
  isFavourite: initial,
  size = 'md',
}: {
  coachId: string;
  isFavourite: boolean;
  size?: 'sm' | 'md';
}) {
  const [isFav,   setIsFav]   = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const prev = isFav;
    setIsFav(!prev);
    setLoading(true);
    const res = await fetch('/api/favourites', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ coachId }),
    });
    if (!res.ok) setIsFav(prev);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isFav ? 'Remove from My Coaches' : 'Save to My Coaches'}
      className={`transition-all disabled:opacity-40 hover:scale-110 active:scale-95 leading-none
        ${size === 'sm' ? 'text-base' : 'text-xl'}`}
    >
      {isFav ? '❤️' : '🤍'}
    </button>
  );
}

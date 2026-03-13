import { Star } from 'lucide-react';

interface StarRatingProps {
  rating?: number;
  count?: number;
  size?: 'sm' | 'md';
}

export function StarRating({ rating = 5, count, size = 'sm' }: StarRatingProps) {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`${sizeClass} ${i < rating ? 'fill-primary text-primary' : 'fill-muted text-muted'}`}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-[10px] text-muted-foreground ml-0.5">({count})</span>
      )}
    </div>
  );
}

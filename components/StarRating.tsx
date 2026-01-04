import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0-10
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  onChange, 
  readOnly = false,
  size = 20 
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  // Convert 0-10 scale to 1-5 stars for display
  const displayRating = Math.round(rating / 2);
  const currentHover = hoverValue ? Math.round(hoverValue / 2) : null;

  const handleStarClick = (starIndex: number) => {
    if (readOnly || !onChange) return;
    // starIndex is 1-5. We want to save as 1-10.
    onChange(starIndex * 2); 
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (currentHover ?? displayRating) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star * 2)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <Star
              size={size}
              className={`${
                isFilled 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-transparent text-slate-600'
              } transition-colors duration-200`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
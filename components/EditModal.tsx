import React, { useState, useEffect } from 'react';
import { Movie, MovieStatus } from '../types';
import StarRating from './StarRating';
import { X, Save } from 'lucide-react';

interface EditModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Movie>) => void;
}

const EditModal: React.FC<EditModalProps> = ({ movie, isOpen, onClose, onSave }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [status, setStatus] = useState<MovieStatus>('watchlist');

  useEffect(() => {
    if (movie) {
      setRating(movie.rating || 0);
      setReview(movie.userReview || '');
      setStatus(movie.status);
    }
  }, [movie]);

  if (!isOpen || !movie) return null;

  const handleSave = () => {
    onSave(movie.id, {
      rating,
      userReview: review,
      status
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white">Edit "{movie.title}"</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Status Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Status</label>
            <div className="flex bg-slate-800 rounded-lg p-1">
              {(['watchlist', 'watched', 'dropped'] as MovieStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 capitalize py-2 rounded-md text-sm font-medium transition-all ${
                    status === s 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Rating (Only if watched/dropped) */}
          <div className={`transition-all duration-300 ${status === 'watchlist' ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
             <label className="block text-sm font-medium text-slate-400 mb-2">Your Rating</label>
             <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                <StarRating rating={rating} onChange={setRating} size={32} />
                <span className="text-2xl font-bold text-yellow-500 min-w-[3ch] text-center">{rating}</span>
             </div>
          </div>

          {/* Review Textarea */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Thoughts & Review</label>
            <textarea
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="What did you think about the cinematography? The plot?"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-900/20"
          >
            <Save size={18} /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditModal;
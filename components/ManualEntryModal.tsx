import React, { useState } from 'react';
import { SearchResult, MediaType } from '../types';
import { X, Save, Film, Tv, Book } from 'lucide-react';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (movie: SearchResult) => void;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    title: '',
    year: new Date().getFullYear().toString(),
    director: '',
    description: '',
    genre: '',
    mediaType: 'movie' as MediaType
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result: SearchResult = {
        id: Date.now(), // Fallback numeric ID for manual entries
        title: formData.title,
        year: formData.year,
        director: formData.director || (formData.mediaType === 'book' ? 'Unknown Author' : 'Unknown'),
        description: formData.description || 'No description provided.',
        genre: formData.genre.split(',').map(g => g.trim()).filter(Boolean),
        posterPath: null,
        mediaType: formData.mediaType,
        voteAverage: 0
    };
    onAdd(result);
    onClose();
    // Reset form
    setFormData({
        title: '',
        year: new Date().getFullYear().toString(),
        director: '',
        description: '',
        genre: '',
        mediaType: 'movie'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Save size={20} className="text-indigo-500"/> Add Custom Item
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           
           {/* Type Selector */}
           <div className="flex gap-2">
             <label className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-lg border cursor-pointer transition-all ${formData.mediaType === 'movie' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                <input 
                    type="radio" 
                    name="mediaType" 
                    className="hidden" 
                    checked={formData.mediaType === 'movie'} 
                    onChange={() => setFormData({...formData, mediaType: 'movie'})} 
                />
                <Film size={18} /> <span className="text-xs font-bold">Movie</span>
             </label>
             <label className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-lg border cursor-pointer transition-all ${formData.mediaType === 'tv' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                <input 
                    type="radio" 
                    name="mediaType" 
                    className="hidden" 
                    checked={formData.mediaType === 'tv'} 
                    onChange={() => setFormData({...formData, mediaType: 'tv'})} 
                />
                <Tv size={18} /> <span className="text-xs font-bold">TV</span>
             </label>
             <label className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-lg border cursor-pointer transition-all ${formData.mediaType === 'book' ? 'bg-amber-600/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                <input 
                    type="radio" 
                    name="mediaType" 
                    className="hidden" 
                    checked={formData.mediaType === 'book'} 
                    onChange={() => setFormData({...formData, mediaType: 'book'})} 
                />
                <Book size={18} /> <span className="text-xs font-bold">Book</span>
             </label>
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
             <input 
                required
                type="text" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Title"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
             />
           </div>

           <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Year</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="2024"
                        value={formData.year}
                        onChange={e => setFormData({...formData, year: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                        {formData.mediaType === 'book' ? 'Author' : 'Director/Creator'}
                    </label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Name"
                        value={formData.director}
                        onChange={e => setFormData({...formData, director: e.target.value})}
                    />
                </div>
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Genres</label>
             <input 
                type="text" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Sci-Fi, Thriller..."
                value={formData.genre}
                onChange={e => setFormData({...formData, genre: e.target.value})}
             />
           </div>

           <div>
             <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
             <textarea 
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Short summary..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
             />
           </div>

           <div className="pt-2">
             <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
             >
               <Save size={18} /> Add to Library
             </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntryModal;

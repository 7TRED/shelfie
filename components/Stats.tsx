import React from 'react';
import { Movie } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Clock, Film, Star, BookOpen } from 'lucide-react';

interface StatsProps {
  movies: Movie[];
}

const Stats: React.FC<StatsProps> = ({ movies }) => {
  const watched = movies.filter(m => m.status === 'watched');
  const watchlist = movies.filter(m => m.status === 'watchlist');
  
  // Stats calculations
  const totalWatched = watched.length;
  const totalBooks = watched.filter(m => m.mediaType === 'book').length;

  const avgRating = totalWatched > 0 
    ? (watched.reduce((acc, m) => acc + (m.rating || 0), 0) / totalWatched).toFixed(1) 
    : 'N/A';
  
  const genreCounts: Record<string, number> = {};
  watched.forEach(m => {
    m.genre.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });

  const chartData = Object.entries(genreCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 genres

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Film} label="Total Completed" value={totalWatched} color="bg-emerald-500" />
        <StatCard icon={BookOpen} label="Books Read" value={totalBooks} color="bg-amber-500" />
        <StatCard icon={Clock} label="Watchlist" value={watchlist.length} color="bg-blue-500" />
        <StatCard icon={Star} label="Avg Rating" value={avgRating} color="bg-yellow-500" />
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-6">Top Genres</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                cursor={{fill: '#334155', opacity: 0.4}}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#d97706', '#f43f5e', '#f97316'][index % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Stats;

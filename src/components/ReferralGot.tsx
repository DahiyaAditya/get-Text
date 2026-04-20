import React from 'react';
import { XCircle, ThumbsDown } from 'lucide-react';
import { ReferralGotItem } from '../types';
import { formatDate } from '../utils';

interface ReferralGotProps {
  list: ReferralGotItem[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ReferralGotItem>) => void;
}

export default function ReferralGot({ list, onDelete, onUpdate }: ReferralGotProps) {
  // Sort list: non-disliked first, disliked last
  const sortedList = [...list].sort((a, b) => {
    if (a.disliked === b.disliked) return 0;
    return a.disliked ? 1 : -1;
  });

  return (
    <div className="bg-white p-5 md:p-8 rounded-[32px] md:rounded-[40px] shadow-sm border border-black/5">
      <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">Referral I Got</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedList.length === 0 ? (
          <div className="col-span-full text-center py-12 md:py-20">
            <p className="text-gray-400 italic">No referrals recorded yet.</p>
          </div>
        ) : (
          sortedList.map(item => (
            <div 
              key={item.id} 
              className={`flex items-center justify-between p-5 md:p-6 rounded-2xl border transition-colors ${
                item.disliked 
                  ? 'bg-red-50 border-red-100' 
                  : 'bg-emerald-50 border-emerald-100'
              }`}
            >
              <div className="min-w-0">
                <p className={`font-bold text-lg leading-tight truncate ${
                  item.disliked ? 'text-red-900' : 'text-emerald-900'
                }`}>
                  {item.company}
                </p>
                <p className={`text-xs mb-1 truncate ${
                  item.disliked ? 'text-red-700' : 'text-emerald-700'
                }`}>
                  {item.position} {item.jobId && `• ID: ${item.jobId}`}
                </p>
                <p className={`text-[10px] font-medium uppercase tracking-wider ${
                  item.disliked ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  Got on: {formatDate(item.dateGot)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => onUpdate(item.id, { disliked: !item.disliked })}
                  className={`transition-colors p-2 ${
                    item.disliked 
                      ? 'text-red-400 hover:text-red-600' 
                      : 'text-emerald-400 hover:text-red-500'
                  }`}
                  title={item.disliked ? "Undislike" : "Dislike"}
                >
                  <ThumbsDown className={`w-5 h-5 ${item.disliked ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={() => onDelete(item.id)}
                  className={`transition-colors p-2 ${
                    item.disliked ? 'text-red-400 hover:text-red-600' : 'text-emerald-400 hover:text-red-500'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

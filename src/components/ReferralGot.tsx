import React from 'react';
import { XCircle } from 'lucide-react';
import { ReferralGotItem } from '../types';
import { formatDate } from '../utils';

interface ReferralGotProps {
  list: ReferralGotItem[];
  onDelete: (id: string) => void;
}

export default function ReferralGot({ list, onDelete }: ReferralGotProps) {
  return (
    <div className="bg-white p-5 md:p-8 rounded-[32px] md:rounded-[40px] shadow-sm border border-black/5">
      <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">Referral I Got</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.length === 0 ? (
          <div className="col-span-full text-center py-12 md:py-20">
            <p className="text-gray-400 italic">No referrals recorded yet.</p>
          </div>
        ) : (
          list.map(item => (
            <div key={item.id} className="flex items-center justify-between p-5 md:p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="min-w-0">
                <p className="font-bold text-lg text-emerald-900 leading-tight truncate">{item.company}</p>
                <p className="text-xs text-emerald-700 mb-1 truncate">{item.position} {item.jobId && `• ID: ${item.jobId}`}</p>
                <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">Got on: {formatDate(item.dateGot)}</p>
              </div>
              <button 
                onClick={() => onDelete(item.id)}
                className="text-emerald-400 hover:text-red-500 transition-colors p-2 shrink-0"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

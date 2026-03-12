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
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
      <h2 className="text-2xl font-bold mb-8">Referral I Got</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.length === 0 ? (
          <p className="col-span-full text-center py-12 text-gray-400 italic">No referrals recorded yet.</p>
        ) : (
          list.map(item => (
            <div key={item.id} className="flex items-center justify-between p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div>
                <p className="font-bold text-lg text-emerald-900 leading-tight">{item.company}</p>
                <p className="text-xs text-emerald-700 mb-1">{item.position} {item.jobId && `• ID: ${item.jobId}`}</p>
                <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">Got on: {formatDate(item.dateGot)}</p>
              </div>
              <button 
                onClick={() => onDelete(item.id)}
                className="text-emerald-400 hover:text-red-500 transition-colors p-2"
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

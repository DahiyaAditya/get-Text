import React, { useState } from 'react';
import { XCircle, AlertTriangle, Clock } from 'lucide-react';
import { ReferralToGetItem } from '../types';
import { formatDate } from '../utils';

interface ReferralToGetProps {
  list: ReferralToGetItem[];
  onAddManual: (company: string, position: string, jobId: string, lastDate: string) => void;
  onMoveToGot: (item: ReferralToGetItem) => void;
}

export default function ReferralToGet({ list, onAddManual, onMoveToGot }: ReferralToGetProps) {
  const [newToGet, setNewToGet] = useState({ 
    company: '', 
    position: '',
    jobId: '',
    dateAdded: new Date().toISOString().split('T')[0], 
    lastDate: '' 
  });

  const handleAddManual = () => {
    if (!newToGet.company || !newToGet.position) return;
    const lastDate = newToGet.lastDate || new Date().toISOString().split('T')[0];
    onAddManual(newToGet.company, newToGet.position, newToGet.jobId, lastDate);
    setNewToGet({ 
      company: '', 
      position: '',
      jobId: '',
      dateAdded: new Date().toISOString().split('T')[0], 
      lastDate: '' 
    });
  };

  const getDeadlineStatus = (lastDate: string) => {
    if (!lastDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(lastDate);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { label: 'Today!', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle };
    } else if (diffDays > 0 && diffDays <= 2) {
      return { label: `${diffDays} day${diffDays > 1 ? 's' : ''} left`, color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock };
    } else if (diffDays < 0) {
      return { label: 'Passed', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle };
    }
    return null;
  };

  return (
    <div className="bg-white p-5 md:p-8 rounded-[32px] shadow-sm border border-black/5">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Referral To Get</h2>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <input 
            type="text" 
            placeholder="Company"
            className="flex-grow xl:flex-none px-4 py-3 md:py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            value={newToGet.company || ''}
            onChange={(e) => setNewToGet({ ...newToGet, company: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Position"
            className="flex-grow xl:flex-none px-4 py-3 md:py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            value={newToGet.position || ''}
            onChange={(e) => setNewToGet({ ...newToGet, position: e.target.value })}
          />
          <input 
            type="text" 
            placeholder="Job ID"
            className="flex-grow xl:flex-none px-4 py-3 md:py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 w-24"
            value={newToGet.jobId || ''}
            onChange={(e) => setNewToGet({ ...newToGet, jobId: e.target.value })}
          />
          <input 
            type="date" 
            className="flex-grow xl:flex-none px-4 py-3 md:py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            value={newToGet.lastDate || ''}
            onChange={(e) => setNewToGet({ ...newToGet, lastDate: e.target.value })}
          />
          <button 
            onClick={handleAddManual}
            className="w-full xl:w-auto bg-black text-white px-6 py-3 md:py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {list.map(item => {
          const status = getDeadlineStatus(item.lastDate);
          return (
            <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 md:p-6 bg-gray-50 rounded-2xl border border-gray-100 gap-4">
              <div className="flex-grow w-full">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <div className="flex flex-col">
                    <p className="font-bold text-lg leading-tight">{item.company}</p>
                    <p className="text-xs text-gray-500">{item.position} {item.jobId && `• ID: ${item.jobId}`}</p>
                  </div>
                  {status && (
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
                      <status.icon className="w-3 h-3" />
                      {status.label}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] md:text-xs text-gray-500">
                  <span>Added: {formatDate(item.dateAdded)}</span>
                  {item.lastDate && <span className={status?.label === 'Today!' ? 'text-red-500 font-bold' : ''}>Deadline: {formatDate(item.lastDate)}</span>}
                </div>
              </div>
              <button 
                onClick={() => onMoveToGot(item)}
                className="w-full sm:w-auto bg-emerald-500 text-white px-6 py-3 md:py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shrink-0"
              >
                Got Referral
              </button>
            </div>
          );
        })}

        {list.length === 0 && (
          <p className="text-center py-12 text-gray-400 italic">No referrals pending.</p>
        )}
      </div>
    </div>
  );
}

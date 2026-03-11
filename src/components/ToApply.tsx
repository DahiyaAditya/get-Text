import React, { useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { ToApplyItem } from '../types';
import { formatDate } from '../utils';

interface ToApplyProps {
  list: ToApplyItem[];
  onAdd: (company: string, link: string, dateAdded: string, lastDate: string) => void;
  onDelete: (id: string) => void;
}

export default function ToApply({ list, onAdd, onDelete }: ToApplyProps) {
  const getToday = () => new Date().toISOString().split('T')[0];
  const [newToApply, setNewToApply] = useState({ 
    company: '', 
    link: '', 
    dateAdded: getToday(), 
    lastDate: '' 
  });

  const handleAdd = () => {
    if (!newToApply.company) return;
    const dateAdded = newToApply.dateAdded || getToday();
    const lastDate = newToApply.lastDate || getToday();
    onAdd(newToApply.company, newToApply.link, dateAdded, lastDate);
    setNewToApply({ company: '', link: '', dateAdded: getToday(), lastDate: '' });
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold">Companies To Apply</h2>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <input 
            type="text" 
            placeholder="Company Name"
            className="flex-grow lg:flex-none px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            value={newToApply.company}
            onChange={(e) => setNewToApply({ ...newToApply, company: e.target.value })}
          />
          <input 
            type="url" 
            placeholder="Apply Link"
            className="flex-grow lg:flex-none px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
            value={newToApply.link}
            onChange={(e) => setNewToApply({ ...newToApply, link: e.target.value })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Added Date</label>
            <input 
              type="date" 
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
              value={newToApply.dateAdded}
              onChange={(e) => setNewToApply({ ...newToApply, dateAdded: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Last Date</label>
            <input 
              type="date" 
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
              value={newToApply.lastDate}
              onChange={(e) => setNewToApply({ ...newToApply, lastDate: e.target.value })}
            />
          </div>
          <button 
            onClick={handleAdd}
            className="bg-black text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all self-end"
          >
            Add
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Company</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Apply Link</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Added Date</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Last Date</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">No companies added yet.</td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{item.company}</td>
                  <td className="px-6 py-4">
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                      Visit Link <LinkIcon className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.dateAdded)}</td>
                  <td className="px-6 py-4 text-sm text-red-500 font-medium">{formatDate(item.lastDate)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

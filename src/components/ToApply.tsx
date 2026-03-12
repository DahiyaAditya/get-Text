import React, { useState } from 'react';
import { Link as LinkIcon, Trash2, Wand2, Plus, Calendar, Building2, Briefcase, Hash } from 'lucide-react';
import { ToApplyItem } from '../types';
import { formatDate } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface ToApplyProps {
  list: ToApplyItem[];
  onAdd: (company: string, position: string, jobId: string, link: string, dateAdded: string, lastDate: string) => void;
  onDelete: (id: string) => void;
  onGenerate: (item: ToApplyItem) => void;
}

export default function ToApply({ list, onAdd, onDelete, onGenerate }: ToApplyProps) {
  const getToday = () => new Date().toISOString().split('T')[0];
  const [isAdding, setIsAdding] = useState(false);
  const [newToApply, setNewToApply] = useState({ 
    company: '', 
    position: '',
    jobId: '',
    link: '', 
    dateAdded: getToday(), 
    lastDate: '' 
  });

  const handleAdd = () => {
    if (!newToApply.company || !newToApply.position) return;
    const dateAdded = newToApply.dateAdded || getToday();
    const lastDate = newToApply.lastDate || getToday();
    onAdd(newToApply.company, newToApply.position, newToApply.jobId, newToApply.link, dateAdded, lastDate);
    setNewToApply({ company: '', position: '', jobId: '', link: '', dateAdded: getToday(), lastDate: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Companies To Apply</h2>
            <p className="text-sm text-gray-500 mt-1">Track your job applications and generate referral requests.</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              isAdding ? 'bg-gray-100 text-gray-600' : 'bg-black text-white shadow-md hover:bg-gray-800'
            }`}
          >
            {isAdding ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Company</>}
          </button>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. Google"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={newToApply.company || ''}
                      onChange={(e) => setNewToApply({ ...newToApply, company: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Position</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. Software Engineer"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={newToApply.position || ''}
                      onChange={(e) => setNewToApply({ ...newToApply, position: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Job ID</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. 123456"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={newToApply.jobId || ''}
                      onChange={(e) => setNewToApply({ ...newToApply, jobId: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Apply Link</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="url" 
                      placeholder="https://..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={newToApply.link || ''}
                      onChange={(e) => setNewToApply({ ...newToApply, link: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Added Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="date" 
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={newToApply.dateAdded || ''}
                      onChange={(e) => setNewToApply({ ...newToApply, dateAdded: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Last Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="date" 
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                      value={newToApply.lastDate || ''}
                      onChange={(e) => setNewToApply({ ...newToApply, lastDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 lg:col-span-3 flex justify-end pt-2">
                  <button 
                    onClick={handleAdd}
                    className="bg-black text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md"
                  >
                    Save Application
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Company & Position</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Job ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Apply Link</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Added Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Last Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Building2 className="w-8 h-8 opacity-20" />
                      <p className="italic text-sm">No applications tracked yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{item.company}</span>
                        <span className="text-xs text-gray-500">{item.position}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                        {item.jobId || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.link ? (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          Visit Link <LinkIcon className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300 italic">No link</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{formatDate(item.dateAdded)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${
                        new Date(item.lastDate) < new Date() ? 'text-red-400' : 'text-orange-500'
                      }`}>
                        {formatDate(item.lastDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onGenerate(item)}
                          className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-all"
                          title="Generate Referral Request"
                        >
                          <Wand2 className="w-3 h-3" />
                          GENERATE
                        </button>
                        <button 
                          onClick={() => onDelete(item.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link as LinkIcon, Trash2, Wand2, Plus, Calendar, Building2, Briefcase, Hash, Sparkles, X, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { ToApplyItem } from '../types';
import { formatDate } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

interface ToApplyProps {
  list: ToApplyItem[];
  onAdd: (company: string, position: string, jobId: string, link: string, dateAdded: string, lastDate: string, parsedData?: any) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ToApplyItem>) => void;
  onGenerate: (item: ToApplyItem) => void;
  activeFilter: 'to-apply' | 'applied';
  onFilterChange: (filter: 'to-apply' | 'applied') => void;
}

export default function ToApply({ list, onAdd, onDelete, onUpdate, onGenerate, activeFilter, onFilterChange }: ToApplyProps) {
  const getToday = () => new Date().toISOString().split('T')[0];
  const [isAdding, setIsAdding] = useState(false);
  const [isParsingModalOpen, setIsParsingModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [jobUrl, setJobUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isViewingParsedData, setIsViewingParsedData] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [parsedJob, setParsedJob] = useState<any>(null);

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
    onAdd(newToApply.company, newToApply.position, newToApply.jobId, newToApply.link, dateAdded, lastDate, null);
    setNewToApply({ company: '', position: '', jobId: '', link: '', dateAdded: getToday(), lastDate: '' });
    setIsAdding(false);
  };

  const handleParseJob = async () => {
    if (!jobUrl) return;
    setIsParsing(true);
    setParsingError(null);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'undefined' || apiKey === 'MY_GEMINI_API_KEY') {
        throw new Error('Gemini API key is not configured. If you are hosting this yourself, please set the GEMINI_API_KEY environment variable in your hosting provider\'s dashboard.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Parse this job opening link and extract all relevant details: ${jobUrl}. 
        Please provide the details in a structured format.`,
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING, description: "Name of the company" },
              position: { type: Type.STRING, description: "Job title/position" },
              jobId: { type: Type.STRING, description: "Unique job identification number" },
              location: { type: Type.STRING, description: "Job location" },
              postedDate: { type: Type.STRING, description: "Date when the job was posted" },
              lastDateToApply: { type: Type.STRING, description: "Deadline for application (YYYY-MM-DD format if possible)" },
              experienceRequired: { type: Type.STRING, description: "Years of experience needed" },
              roleLevel: { type: Type.STRING, description: "Level of the role (e.g., SDE II, Senior, etc.)" },
              keyTech: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key technologies mentioned" },
              workModel: { type: Type.STRING, description: "Work model (Remote, Hybrid, On-site)" },
              descriptionSummary: { type: Type.STRING, description: "A brief summary of the role and responsibilities" },
              employeeCount: { type: Type.STRING, description: "Approximate number of employees in the company" },
              linkedinUrl: { type: Type.STRING, description: "URL to the company's LinkedIn page" },
            },
            required: ["company", "position"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setParsedJob(result);
      setIsParsingModalOpen(false);
      setIsResultModalOpen(true);
    } catch (error: any) {
      console.error('Parsing Error:', error);
      setParsingError(error.message || 'Failed to parse the job link. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddParsedJob = () => {
    if (!parsedJob) return;
    
    // Attempt to parse lastDateToApply to YYYY-MM-DD if it's not already
    let lastDate = parsedJob.lastDateToApply || '';
    if (lastDate && !/^\d{4}-\d{2}-\d{2}$/.test(lastDate)) {
      // If it's not in the right format, we might want to default to today or try to normalize
      // For now, let's just use it or default to today if it's completely invalid
      const parsed = new Date(lastDate);
      if (!isNaN(parsed.getTime())) {
        lastDate = parsed.toISOString().split('T')[0];
      } else {
        lastDate = getToday();
      }
    } else if (!lastDate) {
      lastDate = getToday();
    }

    onAdd(
      parsedJob.company,
      parsedJob.position,
      parsedJob.jobId || '',
      jobUrl,
      getToday(),
      lastDate,
      parsedJob
    );
    
    setIsResultModalOpen(false);
    setParsedJob(null);
    setJobUrl('');
    onFilterChange('to-apply'); // Switch to 'to-apply' when a new job is added
  };

  const toApplyList = list.filter(item => !item.applied);
  const appliedList = list.filter(item => item.applied);
  const filteredList = activeFilter === 'to-apply' ? toApplyList : appliedList;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 md:p-8 rounded-[32px] shadow-sm border border-black/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Companies To Apply</h2>
            <p className="text-sm text-gray-500 mt-1">Track your job applications and generate referral requests.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsParsingModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100"
            >
              <Sparkles className="w-4 h-4" /> Parse Job
            </button>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                isAdding ? 'bg-gray-100 text-gray-600' : 'bg-black text-white shadow-md hover:bg-gray-800'
              }`}
            >
              {isAdding ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Company</>}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-8 p-1 bg-gray-50 rounded-2xl w-fit border border-gray-100">
          <button
            onClick={() => onFilterChange('to-apply')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeFilter === 'to-apply' 
                ? 'bg-white text-black shadow-sm border border-gray-100' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            To Apply
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeFilter === 'to-apply' ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {toApplyList.length}
            </span>
          </button>
          <button
            onClick={() => onFilterChange('applied')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeFilter === 'applied' 
                ? 'bg-white text-black shadow-sm border border-gray-100' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Applied
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeFilter === 'applied' ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {appliedList.length}
            </span>
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

        <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Company & Position</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Job ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Apply Link</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Added Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Last Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Building2 className="w-8 h-8 opacity-20" />
                      <p className="italic text-sm">
                        {activeFilter === 'to-apply' ? 'No pending applications.' : 'No applied jobs yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`transition-colors group ${
                      item.applied ? 'bg-emerald-50/50 hover:bg-emerald-100/50' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{item.company}</span>
                        <span className="text-xs text-gray-500">{item.position}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={item.applied || false}
                          onChange={(e) => onUpdate(item.id, { applied: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
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
                        {item.parsedData && (
                          <button 
                            onClick={() => {
                              setParsedJob(item.parsedData);
                              setJobUrl(item.link);
                              setIsViewingParsedData(true);
                              setIsResultModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                            title="View Parsed Data"
                          >
                            <Info className="w-3 h-3" />
                            PARSE DATA
                          </button>
                        )}
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

        {/* Mobile List View */}
        <div className="md:hidden space-y-4">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-gray-400 py-12">
              <Building2 className="w-8 h-8 opacity-20" />
              <p className="italic text-sm">
                {activeFilter === 'to-apply' ? 'No pending applications.' : 'No applied jobs yet.'}
              </p>
            </div>
          ) : (
            filteredList.map((item) => (
              <div 
                key={item.id} 
                className={`p-5 rounded-2xl border transition-colors space-y-4 ${
                  item.applied ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      checked={item.applied || false}
                      onChange={(e) => onUpdate(item.id, { applied: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">{item.company}</h3>
                      <p className="text-xs text-gray-500">{item.position}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDelete(item.id)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Job ID</p>
                    <p className="font-mono text-gray-700">{item.jobId || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Deadline</p>
                    <p className={`font-bold ${new Date(item.lastDate) < new Date() ? 'text-red-400' : 'text-orange-500'}`}>
                      {formatDate(item.lastDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    {item.link ? (
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-600 font-bold text-xs flex items-center gap-1"
                      >
                        Apply Link <LinkIcon className="w-3 h-3" />
                      </a>
                    ) : <span className="text-xs text-gray-300 italic">No link</span>}
                    
                    {item.parsedData && (
                      <button 
                        onClick={() => {
                          setParsedJob(item.parsedData);
                          setJobUrl(item.link);
                          setIsViewingParsedData(true);
                          setIsResultModalOpen(true);
                        }}
                        className="text-blue-600 font-bold text-xs flex items-center gap-1 ml-2 bg-blue-50 px-2 py-1 rounded-md border border-blue-100"
                      >
                        Parse Data <Info className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => onGenerate(item)}
                    className="flex items-center gap-1.5 bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    GENERATE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Parse Job Modal */}
      <AnimatePresence>
        {isParsingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsParsingModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" /> Parse Job Opening
                </h2>
                <button onClick={() => setIsParsingModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-gray-500">Paste the job listing URL below. Our AI will extract all the important details for you.</p>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase px-1">Job Link</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="url" 
                      placeholder="https://linkedin.com/jobs/view/..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                    />
                  </div>
                </div>

                {parsingError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium">
                    {parsingError}
                  </div>
                )}

                <button 
                  onClick={handleParseJob}
                  disabled={isParsing || !jobUrl}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isParsing ? 'Parsing Listing...' : 'Parse Details'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {isResultModalOpen && parsedJob && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsResultModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-emerald-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    {isViewingParsedData ? <Info className="w-6 h-6 text-emerald-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isViewingParsedData ? 'Saved Job Details' : 'Job Details Parsed'}</h2>
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mt-0.5">{isViewingParsedData ? 'Stored AI Analysis' : 'AI Analysis Complete'}</p>
                  </div>
                </div>
                <button onClick={() => { setIsResultModalOpen(false); setIsViewingParsedData(false); }} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Company</p>
                    <p className="text-lg font-bold text-gray-900">{parsedJob.company}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Position</p>
                    <p className="text-lg font-bold text-gray-900">{parsedJob.position}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Job ID</p>
                    <p className="font-mono text-gray-700">{parsedJob.jobId || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</p>
                    <p className="text-gray-700">{parsedJob.location || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Posted Date</p>
                    <p className="text-gray-700">{parsedJob.postedDate || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deadline</p>
                    <p className="text-orange-600 font-bold">{parsedJob.lastDateToApply || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Experience</p>
                    <p className="text-gray-700">{parsedJob.experienceRequired || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role Level</p>
                    <p className="text-gray-700">{parsedJob.roleLevel || 'Not specified'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Key Technologies</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedJob.keyTech && parsedJob.keyTech.length > 0 ? (
                        parsedJob.keyTech.map((tech: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200">
                            {tech}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">None specified</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Work Model</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">{parsedJob.workModel || 'Not specified'}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role Summary</p>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed">{parsedJob.descriptionSummary || 'No summary available.'}</p>
                    </div>
                  </div>

                  {/* Company Insights at the end */}
                  <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4 mt-6">
                    <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Company Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">No. of Employees</p>
                        <p className="text-sm font-bold text-blue-900">{parsedJob.employeeCount || 'Not specified'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">LinkedIn Page</p>
                        {parsedJob.linkedinUrl ? (
                          <a 
                            href={parsedJob.linkedinUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            Visit LinkedIn <LinkIcon className="w-3 h-3" />
                          </a>
                        ) : (
                          <p className="text-sm text-blue-400 italic">Not specified</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                {isViewingParsedData ? (
                  <button 
                    onClick={() => { setIsResultModalOpen(false); setIsViewingParsedData(false); }}
                    className="w-full bg-black text-white px-6 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg"
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsResultModalOpen(false)}
                      className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={handleAddParsedJob}
                      className="flex-1 bg-black text-white px-6 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> Add to List
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

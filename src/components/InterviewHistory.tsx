import React, { useState, useMemo } from 'react';
import { 
  History, 
  Plus, 
  Trash2, 
  Edit,
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  MessageSquare,
  Search,
  Filter,
  Tag as TagIcon,
  TrendingUp,
  MapPin,
  DollarSign,
  User as UserIcon,
  BarChart3,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InterviewHistoryItem, InterviewRound } from '../types';

interface Props {
  list: InterviewHistoryItem[];
  onAdd: (item: Omit<InterviewHistoryItem, 'id' | 'uid'>) => void;
  onUpdate: (id: string, item: Omit<InterviewHistoryItem, 'id' | 'uid'>) => void;
  onDelete: (id: string) => void;
}

export default function InterviewHistory({ list, onAdd, onUpdate, onDelete }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'rejected' | 'ongoing'>('all');

  // Form State
  const [company, setCompany] = useState('');
  const [hrContact, setHrContact] = useState('');
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');

  // Stats Calculation
  const stats = useMemo(() => {
    const total = list.length;
    const passed = list.filter(item => item.rejectionRoundIndex == null && (item.rounds || []).some(r => r.status === 'Passed')).length;
    const rejected = list.filter(item => item.rejectionRoundIndex != null).length;
    const ongoing = total - passed - rejected;
    
    return { total, passed, rejected, ongoing };
  }, [list]);

  // Filtered List
  const filteredList = useMemo(() => {
    return list.filter(item => {
      const matchesSearch = item.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (item.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'passed' && item.rejectionRoundIndex == null && (item.rounds || []).some(r => r.status === 'Passed')) ||
                           (filterStatus === 'rejected' && item.rejectionRoundIndex != null) ||
                           (filterStatus === 'ongoing' && item.rejectionRoundIndex == null && !(item.rounds || []).some(r => r.status === 'Passed'));
      
      return matchesSearch && matchesFilter;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [list, searchQuery, filterStatus]);

  const addRound = () => {
    const newRound: InterviewRound = {
      type: 'Technical',
      questions: [''],
      status: 'Pending',
      difficulty: 'Medium',
      duration: '45 mins'
    };
    setRounds([...rounds, newRound]);
  };

  const updateRound = (index: number, field: keyof InterviewRound, value: any) => {
    const newRounds = [...rounds];
    newRounds[index] = { ...newRounds[index], [field]: value };
    setRounds(newRounds);
  };

  const addQuestion = (roundIndex: number) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].questions.push('');
    setRounds(newRounds);
  };

  const updateQuestion = (roundIndex: number, qIndex: number, value: string) => {
    const newRounds = [...rounds];
    newRounds[roundIndex].questions[qIndex] = value;
    setRounds(newRounds);
  };

  const removeRound = (index: number) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rejectionRoundIndex = rounds.findIndex(r => r.status === 'Rejected');
    const itemData = {
      company,
      hrContact,
      rounds,
      rejectionRoundIndex: rejectionRoundIndex === -1 ? null : rejectionRoundIndex,
      date,
      tags,
      salary,
      location
    };

    if (editingId) {
      onUpdate(editingId, itemData);
    } else {
      onAdd(itemData);
    }

    // Reset
    resetForm();
  };

  const resetForm = () => {
    setCompany('');
    setHrContact('');
    setRounds([]);
    setDate(new Date().toISOString().split('T')[0]);
    setTags([]);
    setSalary('');
    setLocation('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (item: InterviewHistoryItem) => {
    setCompany(item.company);
    setHrContact(item.hrContact || '');
    setRounds(item.rounds || []);
    setDate(item.date);
    setTags(item.tags || []);
    setSalary(item.salary || '');
    setLocation(item.location || '');
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Passed', value: stats.passed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Ongoing', value: stats.ongoing, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm"
          >
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-sm">
            <History className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Interview History</h2>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search company or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-black transition-all"
            />
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-2xl text-sm font-medium hover:bg-gray-800 transition-all shadow-md whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Experience
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'passed', 'rejected', 'ongoing'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
              filterStatus === status 
                ? 'bg-black text-white border-black' 
                : 'bg-white text-gray-400 border-black/5 hover:border-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-8 rounded-[40px] shadow-xl border border-black/5 space-y-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Interview Experience' : 'New Interview Experience'}</h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-black">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Google"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">HR Contact</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={hrContact}
                      onChange={(e) => setHrContact(e.target.value)}
                      placeholder="Phone or Email"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Remote, Bangalore"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Salary Package (Optional)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="e.g. 25 LPA"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-black transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="bg-black text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}><XCircle className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tag (e.g. Frontend, SDE-1)"
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-black transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Interview Rounds</label>
                  <button
                    type="button"
                    onClick={addRound}
                    className="flex items-center gap-1 text-xs font-bold text-black bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    Add Round
                  </button>
                </div>

                <div className="space-y-4">
                  {rounds.map((round, rIdx) => (
                    <motion.div 
                      layout
                      key={rIdx} 
                      className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 space-y-6 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => removeRound(rIdx)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Round Type</label>
                          <select
                            value={round.type}
                            onChange={(e) => updateRound(rIdx, 'type', e.target.value)}
                            className="w-full bg-white border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-black"
                          >
                            <option value="Technical">Technical</option>
                            <option value="Managerial">Managerial</option>
                            <option value="HR">HR</option>
                            <option value="Assignment">Assignment</option>
                            <option value="Interview">General Interview</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Status</label>
                          <select
                            value={round.status}
                            onChange={(e) => updateRound(rIdx, 'status', e.target.value)}
                            className={`w-full bg-white border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-black ${
                              round.status === 'Passed' ? 'text-green-600' : 
                              round.status === 'Rejected' ? 'text-red-600' : 'text-orange-600'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Passed">Passed</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Difficulty</label>
                          <select
                            value={round.difficulty}
                            onChange={(e) => updateRound(rIdx, 'difficulty', e.target.value)}
                            className="w-full bg-white border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-black"
                          >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Duration</label>
                          <input
                            value={round.duration}
                            onChange={(e) => updateRound(rIdx, 'duration', e.target.value)}
                            placeholder="e.g. 45 mins"
                            className="w-full px-4 py-2 rounded-xl bg-white border-none text-sm focus:ring-2 focus:ring-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Interviewer</label>
                          <input
                            value={round.interviewer}
                            onChange={(e) => updateRound(rIdx, 'interviewer', e.target.value)}
                            placeholder="Name (Optional)"
                            className="w-full px-4 py-2 rounded-xl bg-white border-none text-sm focus:ring-2 focus:ring-black"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-gray-400">Questions Asked</label>
                        <div className="space-y-2">
                          {round.questions.map((q, qIdx) => (
                            <textarea
                              key={qIdx}
                              value={q}
                              onChange={(e) => updateQuestion(rIdx, qIdx, e.target.value)}
                              placeholder={`Question ${qIdx + 1}`}
                              rows={2}
                              className="w-full px-4 py-2 rounded-xl bg-white border-none text-sm focus:ring-2 focus:ring-black resize-none"
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => addQuestion(rIdx)}
                          className="text-[10px] font-bold text-gray-400 hover:text-black flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Question
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-8 border-t border-gray-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 rounded-2xl text-sm font-bold bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10 transition-all"
                >
                  {editingId ? 'Update Experience' : 'Save Experience'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {filteredList.length === 0 ? (
          <div className="bg-white p-20 rounded-[48px] text-center border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No experiences found</h3>
            <p className="text-gray-400 max-w-xs mx-auto">
              {searchQuery || filterStatus !== 'all' 
                ? "Try adjusting your search or filters to find what you're looking for." 
                : "Start tracking your interview journey by adding your first experience."}
            </p>
          </div>
        ) : (
          filteredList.map((item) => (
            <motion.div
              layout
              key={item.id}
              className="bg-white rounded-[40px] shadow-sm border border-black/5 overflow-hidden hover:shadow-md transition-all group"
            >
              <div 
                className="p-8 cursor-pointer"
                onClick={() => {
                  if (expandedId === item.id || expandedId === `delete-${item.id}`) {
                    setExpandedId(null);
                  } else {
                    setExpandedId(item.id);
                  }
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-2xl tracking-tight">{item.company}</h3>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.rejectionRoundIndex != null 
                            ? 'bg-red-50 text-red-600' 
                            : (item.rounds || []).some(r => r.status === 'Passed')
                              ? 'bg-green-50 text-green-600'
                              : 'bg-orange-50 text-orange-600'
                        }`}>
                          {item.rejectionRoundIndex != null 
                            ? `Rejected (R${item.rejectionRoundIndex + 1})` 
                            : (item.rounds || []).some(r => r.status === 'Passed')
                              ? 'Passed'
                              : 'Ongoing'}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.location}
                          </span>
                        )}
                        {item.salary && (
                          <span className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" />
                            {item.salary}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {(item.tags || []).map(tag => (
                          <span key={tag} className="bg-gray-50 text-gray-400 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-black/5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rounds</p>
                      <div className="flex gap-1 justify-end">
                        {(item.rounds || []).map((r, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full ${
                              r.status === 'Passed' ? 'bg-green-500' : 
                              r.status === 'Rejected' ? 'bg-red-500' : 'bg-orange-300'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                      {expandedId === item.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {(expandedId === item.id || expandedId === `delete-${item.id}`) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-50 bg-gray-50/30"
                  >
                    <div className="p-8 space-y-8">
                      {/* HR Info */}
                      {item.hrContact && (
                        <div className="bg-white p-4 rounded-2xl border border-black/5 flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">HR Contact</p>
                            <p className="font-bold text-sm">{item.hrContact}</p>
                          </div>
                        </div>
                      )}

                      {/* Timeline of Rounds */}
                      <div className="space-y-6">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Interview Timeline</p>
                        <div className="grid grid-cols-1 gap-6">
                          {(item.rounds || []).map((round, idx) => (
                            <div key={idx} className="relative pl-10 border-l-2 border-gray-200 pb-2 last:pb-0">
                              <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${
                                round.status === 'Passed' ? 'bg-green-500' : 
                                round.status === 'Rejected' ? 'bg-red-500' : 'bg-orange-400'
                              }`} />
                              
                              <div className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div>
                                    <div className="flex items-center gap-3 mb-1">
                                      <h4 className="font-bold text-lg">Round {idx + 1}: {round.type}</h4>
                                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                        round.status === 'Passed' ? 'bg-green-50 text-green-600' : 
                                        round.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                                      }`}>
                                        {round.status}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                                      {round.difficulty && (
                                        <span className="flex items-center gap-1">
                                          <TrendingUp className="w-3 h-3" />
                                          {round.difficulty} Difficulty
                                        </span>
                                      )}
                                      {round.duration && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {round.duration}
                                        </span>
                                      )}
                                      {round.interviewer && (
                                        <span className="flex items-center gap-1">
                                          <UserIcon className="w-3 h-3" />
                                          {round.interviewer}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {(round.questions || []).length > 0 && (
                                  <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      Questions Asked
                                    </p>
                                    <ul className="space-y-3">
                                      {(round.questions || []).map((q, qIdx) => (
                                        <li key={qIdx} className="text-sm text-gray-700 leading-relaxed flex gap-3 whitespace-pre-wrap">
                                          <span className="text-gray-300 font-mono font-bold shrink-0">{qIdx + 1}.</span>
                                          {q || 'No question recorded'}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {round.notes && (
                                  <div className="pt-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                                    <p className="text-sm text-gray-600 italic">{round.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-xs font-bold transition-colors bg-blue-50/50 px-4 py-2 rounded-xl"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Experience
                          </button>

                          <div className="flex items-center gap-2">
                          <AnimatePresence mode="wait">
                            {expandedId === `delete-${item.id}` ? (
                              <motion.div
                                key="confirm"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl"
                              >
                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Are you sure?</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item.id);
                                  }}
                                  className="text-xs font-bold text-red-700 hover:underline"
                                >
                                  Yes, Delete
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedId(item.id); // Go back to normal expanded state
                                  }}
                                  className="text-xs font-bold text-gray-400 hover:text-black"
                                >
                                  Cancel
                                </button>
                              </motion.div>
                            ) : (
                              <motion.button
                                key="delete"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedId(`delete-${item.id}`);
                                }}
                                className="flex items-center gap-2 text-red-400 hover:text-red-600 text-xs font-bold transition-colors bg-red-50/50 px-4 py-2 rounded-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Experience
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

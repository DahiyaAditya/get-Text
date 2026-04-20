import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  MessageSquare,
  Building2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TodoItem } from '../types';

interface TodoProps {
  list: TodoItem[];
  onAdd: (item: Omit<TodoItem, 'id' | 'uid' | 'dateAdded'>) => void;
  onUpdate: (id: string, item: Partial<TodoItem>) => void;
  onDelete: (id: string) => void;
}

export default function Todo({ list, onAdd, onUpdate, onDelete }: TodoProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [company, setCompany] = useState('');
  const [type, setType] = useState<'Interview' | 'Assignment' | 'Other'>('Interview');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [thoughts, setThoughts] = useState('');

  const resetForm = () => {
    setCompany('');
    setType('Interview');
    setDueDate('');
    setDueTime('');
    setThoughts('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !dueDate) return;

    if (editingId) {
      onUpdate(editingId, { company, type, dueDate, dueTime, thoughts });
    } else {
      onAdd({ company, type, dueDate, dueTime, thoughts, completed: false });
    }
    resetForm();
  };

  const startEdit = (item: TodoItem) => {
    setEditingId(item.id);
    setCompany(item.company);
    setType(item.type);
    setDueDate(item.dueDate);
    setDueTime(item.dueTime || '');
    setThoughts(item.thoughts);
    setIsAdding(true);
  };

  const sortedList = [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const upcomingInterviews = list.filter(t => t.type === 'Interview' && !t.completed).length;
  const pendingAssignments = list.filter(t => t.type === 'Assignment' && !t.completed).length;

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-sm border border-black/5 flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-2 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-wider">Interviews</p>
            <p className="text-xl md:text-2xl font-bold">{upcomingInterviews}</p>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-sm border border-black/5 flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-2 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 text-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-gray-400 font-bold uppercase tracking-wider">Assignments</p>
            <p className="text-xl md:text-2xl font-bold">{pendingAssignments}</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingId ? 'Edit Task' : 'New Task'}
                </h2>
                <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Google, Meta..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Due Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Due Time (Optional)</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="time"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Task Type</label>
                  <div className="flex gap-2">
                    {(['Interview', 'Assignment', 'Other'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all border ${
                          type === t 
                            ? 'bg-black text-white border-black shadow-md' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Thoughts / Notes</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <textarea
                      placeholder="Add your thoughts, preparation notes, or assignment details..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all min-h-[120px] resize-y"
                      value={thoughts}
                      onChange={(e) => setThoughts(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="w-full md:w-auto bg-black text-white px-10 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingId ? 'Update Task' : 'Add Task'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold">Your Tasks</h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          )}
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {sortedList.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white p-6 rounded-[32px] shadow-sm border transition-all group ${
                  item.completed ? 'opacity-60 border-gray-100' : 'border-black/5 hover:border-black/10'
                }`}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <button
                    onClick={() => onUpdate(item.id, { completed: !item.completed })}
                    className={`mt-1 transition-colors shrink-0 ${
                      item.completed ? 'text-green-500' : 'text-gray-300 hover:text-black'
                    }`}
                  >
                    {item.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>

                  <div className="flex-grow space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            item.type === 'Interview' ? 'bg-blue-50 text-blue-600' :
                            item.type === 'Assignment' ? 'bg-orange-50 text-orange-600' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {item.type}
                          </span>
                          <span className={`text-xs font-medium ${
                            new Date(item.dueDate) < new Date() && !item.completed ? 'text-red-500' : 'text-gray-400'
                          }`}>
                            Due: {new Date(item.dueDate).toLocaleDateString()} {item.dueTime && `@ ${item.dueTime}`}
                          </span>
                        </div>
                        <h3 className={`text-lg font-bold ${item.completed ? 'line-through text-gray-400' : ''}`}>
                          {item.company}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {item.thoughts && (
                      <div className="bg-gray-50/50 p-4 rounded-2xl text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {item.thoughts}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sortedList.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-gray-400 font-medium">No tasks yet. Add your first interview or assignment!</p>
              <button
                onClick={() => setIsAdding(true)}
                className="mt-4 text-black font-bold hover:underline"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Search,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StoreItem } from '../types';

interface StoreProps {
  list: StoreItem[];
  onAdd: (content: string) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export default function Store({ list, onAdd, onUpdate, onDelete }: StoreProps) {
  const [newContent, setNewContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAdd(newContent.trim());
    setNewContent('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditing = (item: StoreItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  const handleUpdate = (id: string) => {
    if (!editContent.trim()) return;
    onUpdate(id, editContent.trim());
    setEditingId(null);
  };

  const filteredList = list
    .filter(item => 
      item.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

  return (
    <div className="space-y-6">
      {/* Add Section */}
      <div className="bg-white p-5 md:p-6 rounded-[32px] shadow-sm border border-black/5">
        <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add to Store
        </h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <textarea
            placeholder="Enter text to store..."
            className="w-full px-4 py-4 md:py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all min-h-[120px] resize-y text-sm"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newContent.trim()}
              className="w-full md:w-auto bg-black text-white px-8 py-4 md:py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              <Plus className="w-5 h-5" />
              Store Text
            </button>
          </div>
        </form>
      </div>

      {/* Search and List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stored text..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-400 font-medium px-2">
            {filteredList.length} items
          </div>
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredList.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5 group hover:border-black/10 transition-all"
              >
                {editingId === item.id ? (
                  <div className="space-y-4">
                    <textarea
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all min-h-[120px] resize-y"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleUpdate(item.id)}
                        className="bg-black text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                      <div className="flex-grow whitespace-pre-wrap text-sm text-gray-700 leading-relaxed w-full">
                        {item.content}
                      </div>
                      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-end md:self-start">
                        <button
                          onClick={() => handleCopy(item.id, item.content)}
                          className={`p-2.5 rounded-xl transition-all ${
                            copiedId === item.id 
                              ? 'text-green-500 bg-green-50' 
                              : 'text-gray-400 hover:text-black hover:bg-gray-50'
                          }`}
                          title="Copy text"
                        >
                          {copiedId === item.id ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => startEditing(item)}
                          className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all"
                          title="Edit text"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono uppercase tracking-wider border-t border-gray-50 pt-3">
                      <Clock className="w-3 h-3" />
                      {new Date(item.dateAdded).toLocaleString()}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredList.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <p className="text-gray-400 font-medium">No stored text found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

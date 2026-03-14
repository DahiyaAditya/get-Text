import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Send, 
  RefreshCw, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Phone, 
  Link as LinkIcon, 
  Briefcase, 
  Building2, 
  Hash,
  Plus,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomMessageType, FIXED_MAIL, FIXED_PHONE } from '../types';
import { db, auth } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';

interface ReferralGeneratorProps {
  prefill?: { company: string; position: string; jobId: string; link?: string } | null;
  onPrefillUsed?: () => void;
}

const DEFAULT_MESSAGE_TYPES: Omit<CustomMessageType, 'uid'>[] = [
  { 
    id: 'new', 
    label: 'New Note', 
    content: 'I hope you’re doing well. I noticed you’re working with [Company Name], and I found a [Position] opening that closely matches my skills and experience. If possible, could you kindly refer me for this role? Your support is truly valuable to me.\nLink: [Job Link]',
    icon: 'MessageSquare'
  },
  { 
    id: 'ask', 
    label: 'Ask Again', 
    content: 'Hi\nI had earlier asked about a referral. Since then, I’ve updated my resume/skills to better match the role. If it’s not too much trouble, I’d be truly grateful if you could consider referring me this time.\nJob link: [Job Link]\nJob Id: [Job ID]\nMail id: [Mail ID]\nNo: [Phone No]',
    icon: 'RefreshCw'
  },
  { 
    id: 'thanks', 
    label: 'Thanks Message', 
    content: 'Thank you so much.\nYour help really means a lot to me. Wishing you great success and a bright future ahead!',
    icon: 'CheckCircle2'
  },
  { 
    id: 'after', 
    label: 'After Notes', 
    content: 'Hey,\nThank you so much for your help—it truly means a lot to me. Please find my resume attached for the referral.\nOther details:\n[Mail ID]\n📱[Phone No]\nThanks again for your kind support!\nJob Id: [Job ID]',
    icon: 'Send'
  },
  { 
    id: 'closed', 
    label: 'Closed', 
    content: 'Hey,\n\nThank you so much for connecting with me—your kindness and willingness to help truly mean a lot. This job opening had already closed the day after I asked for a referral. I’m really grateful for your support, and in the future, I’ll surely reach out again.\n\nWishing you lots of success and a bright future ahead!',
    icon: 'XCircle'
  },
];

export default function ReferralGenerator({ prefill, onPrefillUsed }: ReferralGeneratorProps) {
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [jobId, setJobId] = useState('');
  const [shortenedLink, setShortenedLink] = useState('');
  const [isShortening, setIsShortening] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Custom Message Types State
  const [customTypes, setCustomTypes] = useState<CustomMessageType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Partial<CustomMessageType>>({ label: '', content: '' });

  useEffect(() => {
    if (prefill) {
      setCompanyName(prefill.company || '');
      setPosition(prefill.position || '');
      setJobId(prefill.jobId || '');
      if (prefill.link) setJobLink(prefill.link);
      if (onPrefillUsed) onPrefillUsed();
    }
  }, [prefill, onPrefillUsed]);

  // Fetch Custom Message Types
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'messageTypes'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const types = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as CustomMessageType[];
      setCustomTypes(types);
    });

    return () => unsubscribe();
  }, []);

  const allTypes = [...DEFAULT_MESSAGE_TYPES, ...customTypes];

  const shortenUrl = async (url: string) => {
    if (!url) return;
    setIsShortening(true);
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const short = await response.text();
        setShortenedLink(short);
      } else {
        setShortenedLink(url);
      }
    } catch (error) {
      console.error('Error shortening URL:', error);
      setShortenedLink(url);
    } finally {
      setIsShortening(false);
    }
  };

  useEffect(() => {
    if (jobLink) {
      const timer = setTimeout(() => {
        shortenUrl(jobLink);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setShortenedLink('');
    }
  }, [jobLink]);

  const replaceVariables = (content: string) => {
    const linkToUse = shortenedLink || jobLink || '[Job Link]';
    return content
      .replace(/\[Company Name\]/g, companyName || '[Company Name]')
      .replace(/\[Position\]/g, position || '[Position]')
      .replace(/\[Job Link\]/g, linkToUse)
      .replace(/\[Job ID\]/g, jobId || '[Job ID]')
      .replace(/\[Mail ID\]/g, FIXED_MAIL)
      .replace(/\[Phone No\]/g, FIXED_PHONE);
  };

  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId);
    const type = allTypes.find(t => t.id === typeId);
    if (type) {
      setGeneratedMessage(replaceVariables(type.content));
    }
  };

  // Update generated message when inputs change
  useEffect(() => {
    if (selectedTypeId) {
      const type = allTypes.find(t => t.id === selectedTypeId);
      if (type) {
        setGeneratedMessage(replaceVariables(type.content));
      }
    }
  }, [companyName, position, jobLink, jobId, shortenedLink, selectedTypeId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [modalError, setModalError] = useState<string | null>(null);

  const handleSaveType = async () => {
    if (!auth.currentUser || !modalData.label || !modalData.content) return;
    setModalError(null);

    try {
      if (modalData.id) {
        // Update
        const docRef = doc(db, 'messageTypes', modalData.id);
        await updateDoc(docRef, {
          label: modalData.label,
          content: modalData.content,
          updatedAt: serverTimestamp()
        });
      } else {
        // Add
        await addDoc(collection(db, 'messageTypes'), {
          label: modalData.label,
          content: modalData.content,
          uid: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setModalData({ label: '', content: '' });
    } catch (error: any) {
      console.error('Error saving message type:', error);
      setModalError('Failed to save template. Please check your connection.');
      if (error.code === 'permission-denied') {
        const errInfo = {
          error: error.message,
          operationType: modalData.id ? 'update' : 'create',
          path: `messageTypes/${modalData.id || 'new'}`,
          authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
          }
        };
        console.error('Firestore Permission Error:', JSON.stringify(errInfo));
      }
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteType = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'messageTypes', id));
      if (selectedTypeId === id) {
        setSelectedTypeId(null);
        setGeneratedMessage('');
      }
      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error('Error deleting message type:', error);
      setModalError('Failed to delete template.');
      if (error.code === 'permission-denied') {
        const errInfo = {
          error: error.message,
          operationType: 'delete',
          path: `messageTypes/${id}`,
          authInfo: {
            userId: auth.currentUser?.uid,
          }
        };
        console.error('Firestore Permission Error:', JSON.stringify(errInfo));
      }
    }
  };

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'MessageSquare': return MessageSquare;
      case 'RefreshCw': return RefreshCw;
      case 'CheckCircle2': return CheckCircle2;
      case 'Send': return Send;
      case 'XCircle': return XCircle;
      default: return MessageSquare;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-5 md:p-6 rounded-[32px] shadow-sm border border-black/5"
      >
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Briefcase className="w-5 h-5" /> Job Details
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">Company Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="e.g. Google"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                value={companyName || ''}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">Position</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="e.g. Software Engineer"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                value={position || ''}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">Job Link</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="url" 
                placeholder="https://..."
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                value={jobLink || ''}
                onChange={(e) => setJobLink(e.target.value)}
              />
              {isShortening && (
                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
              )}
            </div>
            {shortenedLink && (
              <p className="mt-1 text-[10px] text-emerald-600 font-medium">Shortened: {shortenedLink}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">Job ID</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="e.g. 123456"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                value={jobId || ''}
                onChange={(e) => setJobId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">Mail ID</label>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 p-3 md:p-2 rounded-lg border border-gray-200">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{FIXED_MAIL}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">Phone No</label>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 p-3 md:p-2 rounded-lg border border-gray-200">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{FIXED_PHONE}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-6"
      >
        <div className="bg-white p-5 md:p-6 rounded-[32px] shadow-sm border border-black/5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Send className="w-5 h-5" /> Select Message Type
            </h2>
            <button 
              onClick={() => {
                setModalData({ label: '', content: '' });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
            {allTypes.map((btn) => {
              const Icon = getIcon(btn.icon);
              const isCustom = customTypes.some(t => t.id === btn.id);
              return (
                <div key={btn.id} className="relative group">
                  <button
                    onClick={() => handleSelectType(btn.id)}
                    className={`w-full flex items-center gap-3 px-4 py-4 md:py-3 rounded-2xl text-sm font-bold transition-all ${
                      selectedTypeId === btn.id 
                        ? 'bg-black text-white shadow-lg scale-[1.02]' 
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${selectedTypeId === btn.id ? 'text-white' : 'text-gray-400'}`} />
                    <span className="truncate">{btn.label}</span>
                  </button>
                  {isCustom && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                      {confirmDeleteId === btn.id ? (
                        <div className="flex items-center gap-1 bg-white border border-red-100 rounded-xl p-1 shadow-lg animate-in fade-in zoom-in duration-200">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteType(btn.id);
                            }}
                            className="text-[10px] font-bold text-white bg-red-500 px-2 py-1.5 hover:bg-red-600 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                            className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalData(btn);
                              setIsModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-white/80 md:bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-sm border border-gray-200 transition-all"
                            title="Edit Template"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(btn.id);
                            }}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 shadow-sm border border-red-100 transition-all"
                            title="Delete Template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {generatedMessage && (
            <motion.div
              key={selectedTypeId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-5 md:p-6 rounded-[32px] shadow-sm border border-black/5 flex-grow flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Generated Message</h3>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex-grow">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                  {generatedMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{modalData.id ? 'Edit Message Type' : 'Add Message Type'}</h2>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Customize your templates</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto space-y-6">
                {modalError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium flex items-center gap-3"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    {modalError}
                  </motion.div>
                )}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">Template Label</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Follow-up Note"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    value={modalData.label}
                    onChange={(e) => setModalData(prev => ({ ...prev, label: e.target.value }))}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 block">Message Content</label>
                  </div>
                  <textarea 
                    rows={8}
                    placeholder="Write your message here. Use placeholders: [Company Name], [Position], [Job Link], [Job ID], [Mail ID], [Phone No]"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm leading-relaxed"
                    value={modalData.content}
                    onChange={(e) => setModalData(prev => ({ ...prev, content: e.target.value }))}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['[Company Name]', '[Position]', '[Job Link]', '[Job ID]', '[Mail ID]', '[Phone No]'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setModalData(prev => ({ ...prev, content: (prev.content || '') + tag }))}
                        className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveType}
                  className="px-8 py-3 bg-black text-white rounded-2xl text-sm font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-colors"
                >
                  {modalData.id ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

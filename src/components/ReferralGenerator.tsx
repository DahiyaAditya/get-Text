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
  Hash 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageType, FIXED_MAIL, FIXED_PHONE } from '../types';

export default function ReferralGenerator() {
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [jobId, setJobId] = useState('');
  const [shortenedLink, setShortenedLink] = useState('');
  const [isShortening, setIsShortening] = useState(false);
  const [selectedType, setSelectedType] = useState<MessageType | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [copied, setCopied] = useState(false);

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

  const generateMessage = (type: MessageType) => {
    setSelectedType(type);
    const linkToUse = shortenedLink || jobLink || '[Link]';
    const company = companyName || '[Company Name]';
    const pos = position || '[Position]';
    const id = jobId || '[Job ID]';

    let message = '';
    switch (type) {
      case 'new':
        message = `I hope you’re doing well. I noticed you’re working with ${company}, and I found a ${pos} opening that closely matches my skills and experience. If possible, could you kindly refer me for this role? Your support is truly valuable to me.\nLink: ${linkToUse}`;
        break;
      case 'ask':
        message = `Hi\nI had earlier asked about a referral. Since then, I’ve updated my resume/skills to better match the role. If it’s not too much trouble, I’d be truly grateful if you could consider referring me this time.\nJob link: ${linkToUse}\nJob Id: ${id}\nMail id: ${FIXED_MAIL}\nNo: ${FIXED_PHONE}`;
        break;
      case 'thanks':
        message = `Thank you so much.\nYour help really means a lot to me. Wishing you great success and a bright future ahead!`;
        break;
      case 'after':
        message = `Hey,\nThank you so much for your help—it truly means a lot to me. Please find my resume attached for the referral.\nOther details:\n${FIXED_MAIL}\n📱${FIXED_PHONE}\nThanks again for your kind support!\nJob Id: ${id}`;
        break;
      case 'closed':
        message = `Hey,\n\nThank you so much for connecting with me—your kindness and willingness to help truly mean a lot. This job opening had already closed the day after I asked for a referral. I’m really grateful for your support, and in the future, I’ll surely reach out again.\n\nWishing you lots of success and a bright future ahead!`;
        break;
    }
    setGeneratedMessage(message);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-6 rounded-3xl shadow-sm border border-black/5"
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
                value={companyName}
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
                value={position}
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
                value={jobLink}
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
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">Mail ID</label>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 p-2 rounded-lg border border-gray-200">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{FIXED_MAIL}</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">Phone No</label>
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 p-2 rounded-lg border border-gray-200">
                <Phone className="w-3.5 h-3.5" />
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
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Send className="w-5 h-5" /> Select Message Type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'new', label: 'New Note', icon: MessageSquare },
              { id: 'ask', label: 'Ask Again', icon: RefreshCw },
              { id: 'thanks', label: 'Thanks Message', icon: CheckCircle2 },
              { id: 'after', label: 'After Notes', icon: Send },
              { id: 'closed', label: 'Closed', icon: XCircle },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => generateMessage(btn.id as MessageType)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedType === btn.id 
                    ? 'bg-black text-white shadow-lg' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <btn.icon className={`w-4 h-4 ${selectedType === btn.id ? 'text-white' : 'text-gray-400'}`} />
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {generatedMessage && (
            <motion.div
              key={selectedType}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-black/5 flex-grow flex flex-col"
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
    </div>
  );
}

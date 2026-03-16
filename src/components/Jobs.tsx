import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Briefcase, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Sparkles, 
  Loader2, 
  Info,
  X,
  Building2,
  Clock,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { JobSearchResult } from '../types';

const RESUME_CONTEXT = `
Name: Aditya Singh
Role: Frontend Developer (4+ years experience)
Core Skills: React.js, JavaScript, Next.js, FastAPI, TanStack Query, AWS S3, REST APIs, Python, Redux, TailwindCSS, Azure, Vercel, Git, GraphQL, Webpack.
Experience: Tech Mahindra (Software Engineer), GeeksForGeeks (SDE 1), Infosys (Digital Specialist Engineer).
Location: Bengaluru, India.
`;

export default function Jobs() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<JobSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobSearchResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key not found');

      const ai = new GoogleGenAI({ apiKey });
      const currentTime = new Date().toLocaleString();
      
      const prompt = `
      Current System Time: ${currentTime}
      User Profile: ${RESUME_CONTEXT}
      
      Task: Search LinkedIn ONLY for the latest job openings that are highly relevant to this user's professional profile. 
      Focus on Frontend Developer, React.js, and Next.js roles. 
      ONLY include roles from LinkedIn (linkedin.com).
      
      Return a list of at least 5 real, current job openings from LinkedIn.
      For each job, provide:
      - company name
      - position title
      - location
      - direct link to the opening (must be a linkedin.com URL)
      - posted date (relative or absolute)
      - experience required (e.g. "3+ years", "Mid-level")
      - a brief description summary
      - key technologies mentioned
      - a relevance score (0-100) based on the user's resume.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                company: { type: Type.STRING },
                position: { type: Type.STRING },
                location: { type: Type.STRING },
                link: { type: Type.STRING },
                postedDate: { type: Type.STRING },
                experienceRequired: { type: Type.STRING },
                descriptionSummary: { type: Type.STRING },
                keyTech: { type: Type.ARRAY, items: { type: Type.STRING } },
                relevanceScore: { type: Type.NUMBER }
              },
              required: ["company", "position", "link", "postedDate", "experienceRequired"]
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      setResults(data);
    } catch (err: any) {
      console.error('Search error:', err);
      let userMessage = 'Failed to search for jobs. Please try again.';
      
      // Handle 429 Resource Exhausted
      if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        userMessage = 'The AI search is currently at its limit. Please wait a minute and try again.';
      } else if (err.message?.includes('API key')) {
        userMessage = 'API configuration error. Please check your settings.';
      }
      
      setError(userMessage);
    } finally {
      setIsSearching(false);
    }
  };

  // Initial search on mount
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">LinkedIn Job Openings</h2>
            <p className="text-sm text-gray-500 mt-1">Latest opportunities from LinkedIn based on your profile.</p>
          </div>
          <button 
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-[#0077b5] text-white px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-[#006097] transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Refresh LinkedIn Jobs
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Openings for You</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {isSearching ? (
          <div className="bg-white p-20 rounded-[40px] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
              <Search className="absolute inset-0 m-auto w-6 h-6 text-black" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900">Scanning the web...</p>
              <p className="text-xs text-gray-500 mt-1">Finding the most relevant roles for your experience.</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white p-12 rounded-[40px] border border-black/5 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <Info className="w-8 h-8 text-red-500" />
            </div>
            <div className="max-w-sm">
              <p className="text-sm font-bold text-gray-900">Search Interrupted</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={handleSearch} 
              className="mt-2 px-6 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {results.map((job, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-[32px] border border-black/5 hover:border-black/10 transition-all group cursor-pointer"
                onClick={() => {
                  setSelectedJob(job);
                  setIsModalOpen(true);
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-black group-hover:border-black transition-colors">
                      <Briefcase className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg text-gray-900">{job.position}</h4>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
                          {job.relevanceScore}% Match
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Building2 className="w-4 h-4" /> {job.company}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" /> {job.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> {job.postedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Experience</p>
                      <p className="text-sm font-bold text-gray-900">{job.experienceRequired}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-20 rounded-[40px] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-200" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">No openings found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-[240px]">Try refreshing to search for the latest opportunities.</p>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedJob && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{selectedJob.position}</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{selectedJob.company}</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</p>
                    <p className="text-base font-bold text-gray-900">{selectedJob.location}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Experience</p>
                    <p className="text-base font-bold text-gray-900">{selectedJob.experienceRequired}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Posted</p>
                    <p className="text-base font-bold text-gray-900">{selectedJob.postedDate}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Key Technologies & Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.keyTech?.map((tech, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Job Description Summary</p>
                    <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedJob.descriptionSummary}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Close
                </button>
                <a 
                  href={selectedJob.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-black text-white px-6 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Open Job Portal <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

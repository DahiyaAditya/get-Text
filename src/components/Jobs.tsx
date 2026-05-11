import {
  Building2,
  Info,
  Search,
  Sparkles,
  ExternalLink,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ToApplyItem } from '../types';
export default function Jobs() {
  const [inputQuery, setInputQuery] = useState('');
  const [filteredList, setFilteredList] = useState<ToApplyItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [tempCompanyName, setTempCompanyName] = useState('');
  const [pendingJobLink, setPendingJobLink] = useState('');

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);
  // Fetch jobs from Firestore
  const fetchJobs = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'needtoApply'), where('uid', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const jobs: ToApplyItem[] = [];

      querySnapshot.forEach((doc) => {
        jobs.push({ id: doc.id, ...doc.data() } as ToApplyItem);
      });

      setFilteredList(jobs);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  };

  // Try to extract a company name from common job platform URLs
  const extractCompanyFromUrl = (rawUrl: string) => {
    try {
      const u = new URL(rawUrl);
      const host = u.hostname.toLowerCase();
      const path = u.pathname.replace(/\/+$/, '');
      const pathSegments = path.split('/').filter(Boolean);

      // Helper to title-case and clean
      const clean = (s: string) => {
        return s
          .replace(/[-_\.]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      };

      const domainParts = host.split('.');

      // Workday / myworkdayjobs subdomains: company.wd1.myworkdayjobs.com or company.myworkdayjobs.com
      if (host.endsWith('myworkdayjobs.com') || host.endsWith('workday.com')) {
        // take first label as company (usually company or careers)
        const candidate = domainParts[0];
        if (candidate && !['www', 'careers', 'jobs'].includes(candidate)) return clean(candidate);
      }

      // Greenhouse: boards.greenhouse.io/companyname/jobs/...
      if (host.endsWith('boards.greenhouse.io')) {
        if (pathSegments.length > 0) return clean(pathSegments[0]);
      }

      // Common pattern: company.<platform>.com (lever, jobvite, smartrecruiters, greenhouse)
      const knownPlatforms = ['greenhouse.io', 'lever.co', 'jobvite.com', 'smartrecruiters.com', 'workable.com', 'breezy.hr', 'jobs2.social', 'applytojobs.com'];
      for (const p of knownPlatforms) {
        if (host.endsWith(p)) {
          const candidate = domainParts[0];
          if (candidate && !['www', 'careers', 'jobs', 'boards'].includes(candidate)) return clean(candidate);
        }
      }

      // Hosts like careers.company.com or jobs.company.com -> try to pick the second label
      if (domainParts.length >= 3) {
        const sub = domainParts[0];
        if (['careers', 'jobs', 'jobs2', 'careers2', 'apply', 'boards'].includes(sub)) {
          return clean(domainParts[1]);
        }
      }

      // Fallback: try to derive company from path segments (look for plausible company-like segment)
      for (let i = 0; i < Math.min(3, pathSegments.length); i++) {
        const seg = pathSegments[i];
        if (seg && seg.length > 2 && !seg.match(/^\d+$/)) {
          // ignore common words
          if (!['jobs', 'careers', 'company', 'job', 'openings', 'positions'].includes(seg.toLowerCase())) {
            return clean(seg);
          }
        }
      }

      // Last fallback: use second-level domain (example: example.com -> example)
      if (domainParts.length >= 2) {
        return clean(domainParts[domainParts.length - 2]);
      }

      return '';
    } catch (e) {
      return '';
    }
  };

  // Handle adding a new job - shows modal first
  const handleSearch = async () => {
    if (!inputQuery.trim()) {
      setError('Please paste a job link');
      return;
    }

    if (!currentUser) {
      setError('Please sign in to add jobs');
      return;
    }

    setError(null);

    try {
      // Validate URL
      try {
        new URL(inputQuery);
      } catch {
        setError('Please enter a valid URL');
        return;
      }

      // Extract company and show modal for editing
      const companyFromUrl = extractCompanyFromUrl(inputQuery) || 'Job Link';
      setTempCompanyName(companyFromUrl);
      setPendingJobLink(inputQuery);
      setShowCompanyModal(true);
    } catch (err) {
      console.error('Error preparing job:', err);
      setError('Failed to process job link');
    }
  };

  // Handle confirming and saving the job after editing company name
  const handleConfirmJob = async () => {
    if (!tempCompanyName.trim()) {
      setError('Company name cannot be empty');
      return;
    }

    if (!auth.currentUser) {
      setError('User not authenticated');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const jobData = {
        company: tempCompanyName,
        position: 'Position',
        link: pendingJobLink,
        dateAdded: new Date().toISOString(),
        uid: auth.currentUser.uid
      };
      await addDoc(collection(db, 'needtoApply'), jobData);

      setInputQuery('');
      setShowCompanyModal(false);
      setTempCompanyName('');
      setPendingJobLink('');
      await fetchJobs();
    } catch (err) {
      console.error('Error adding job:', err);
      setError('Failed to add job link');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle deleting a job
  const handleDelete = async (jobId: string) => {
    try {
      await deleteDoc(doc(db, 'needtoApply', jobId));
      await fetchJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('Failed to delete job');
    }
  };

  // Fetch jobs on mount and when user changes
  useEffect(() => {
    fetchJobs();
  }, [currentUser]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-black/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Paste your job link here."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all hover:border-gray-300"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-[#0077b5] text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-[#006097] transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50 w-full md:w-auto"
          >
            <Sparkles className="w-5 h-5" />
            Add to List
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Company Name Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-xl max-w-sm w-full">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Company Name</h2>
            <p className="text-sm text-gray-600 mb-6">Edit the company name if needed:</p>
            <input
              type="text"
              value={tempCompanyName}
              onChange={(e) => setTempCompanyName(e.target.value)}
              placeholder="Company name"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mb-6"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCompanyModal(false);
                  setTempCompanyName('');
                  setPendingJobLink('');
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmJob}
                disabled={isSearching}
                className="flex-1 px-4 py-3 rounded-xl bg-[#0077b5] text-white font-semibold hover:bg-[#006097] transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white p-12 md:p-20 rounded-[40px] border border-gray-100 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-semibold text-gray-600">Loading jobs...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Company</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Added Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Building2 className="w-8 h-8 opacity-20" />
                        <p className="italic text-sm">No applied jobs yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">{item.company}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(item.dateAdded).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                            title="Open link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                            title="Delete job"
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredList.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3">
                <Building2 className="w-8 h-8 opacity-20 text-gray-400" />
                <p className="italic text-sm text-gray-400">No applied jobs yet.</p>
              </div>
            ) : (
              filteredList.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-900">{item.company}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.dateAdded).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">Open</span>
                    </a>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold"
                      title="Delete job"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

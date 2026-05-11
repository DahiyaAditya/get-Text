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

  // Handle adding a new job
  const handleSearch = async () => {
    if (!inputQuery.trim()) {
      setError('Please paste a job link');
      return;
    }

    if (!currentUser) {
      setError('Please sign in to add jobs');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Validate URL
      try {
        new URL(inputQuery);
      } catch {
        setError('Please enter a valid URL');
        setIsSearching(false);
        return;
      }

      // Add to Firestore
      if (!auth.currentUser) {
        setError('User not authenticated');
        return;
      }

      const jobData = {
        company: 'Job Link',
        position: 'Position',
        link: inputQuery,
        dateAdded: new Date().toISOString(),
        uid: auth.currentUser.uid
      };
      console.log(">>>", jobData)
      await addDoc(collection(db, 'needtoApply'), jobData);

      setInputQuery('');
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
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
            className="bg-[#0077b5] text-white px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-[#006097] transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50"
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

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white p-20 rounded-[40px] border border-gray-100 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
          </div>
          <p className="text-sm font-semibold text-gray-600">Loading jobs...</p>
        </div>
      ) : (
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Company & Position</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Apply Link</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Added Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Building2 className="w-8 h-8 opacity-20" />
                      <p className="italic text-sm">
                        No applied jobs yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.position}</p>
                        <p className="text-xs text-gray-500">{item.company}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate block max-w-xs">
                        {item.link}
                      </a>
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
      )}
    </div>
  );
}

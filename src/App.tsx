/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Briefcase, 
  Hash,
  LogOut,
  LogIn,
  User as UserIcon,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocFromServer 
} from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { 
  TabType, 
  ToApplyItem, 
  ReferralToGetItem, 
  ReferralGotItem,
  InterviewHistoryItem,
  StoreItem
} from './types';

// Components
import ReferralGenerator from './components/ReferralGenerator';
import ToApply from './components/ToApply';
import ReferralToGet from './components/ReferralToGet';
import ReferralGot from './components/ReferralGot';
import InterviewHistory from './components/InterviewHistory';
import Store from './components/Store';
import ErrorBoundary from './components/ErrorBoundary';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function AppContent() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('generator');
  const [prefillData, setPrefillData] = useState<{ company: string; position: string; jobId: string; link: string } | null>(null);

  // Tracker State
  const [toApplyList, setToApplyList] = useState<ToApplyItem[]>([]);
  const [referralToGetList, setReferralToGetList] = useState<ReferralToGetItem[]>([]);
  const [referralGotList, setReferralGotList] = useState<ReferralGotItem[]>([]);
  const [interviewHistoryList, setInterviewHistoryList] = useState<InterviewHistoryItem[]>([]);
  const [storeList, setStoreList] = useState<StoreItem[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Test connection
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if(error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }

        // Sync user profile
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role: 'user' // Default role
          }, { merge: true });
        } catch (error) {
          console.error("Error syncing user profile:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user) {
      setToApplyList([]);
      setReferralToGetList([]);
      setReferralGotList([]);
      return;
    }

    const qToApply = query(collection(db, 'toApply'), where('uid', '==', user.uid));
    const unsubToApply = onSnapshot(qToApply, (snapshot) => {
      setToApplyList(snapshot.docs.map(doc => doc.data() as ToApplyItem));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'toApply'));

    const qToGet = query(collection(db, 'referralToGet'), where('uid', '==', user.uid));
    const unsubToGet = onSnapshot(qToGet, (snapshot) => {
      setReferralToGetList(snapshot.docs.map(doc => doc.data() as ReferralToGetItem));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'referralToGet'));

    const qGot = query(collection(db, 'referralGot'), where('uid', '==', user.uid));
    const unsubGot = onSnapshot(qGot, (snapshot) => {
      setReferralGotList(snapshot.docs.map(doc => doc.data() as ReferralGotItem));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'referralGot'));

    const qHistory = query(collection(db, 'interviewHistory'), where('uid', '==', user.uid));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      setInterviewHistoryList(snapshot.docs.map(doc => doc.data() as InterviewHistoryItem));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'interviewHistory'));

    const qStore = query(collection(db, 'store'), where('uid', '==', user.uid));
    const unsubStore = onSnapshot(qStore, (snapshot) => {
      setStoreList(snapshot.docs.map(doc => doc.data() as StoreItem));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'store'));

    return () => {
      unsubToApply();
      unsubToGet();
      unsubGot();
      unsubHistory();
      unsubStore();
    };
  }, [user]);

  // Actions
  const addToApply = async (company: string, position: string, jobId: string, link: string, dateAdded: string, lastDate: string) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const item: ToApplyItem & { uid: string } = { 
      id, 
      company: company || '', 
      position: position || '', 
      jobId: jobId || '', 
      link: link || '', 
      dateAdded: dateAdded || new Date().toISOString().split('T')[0], 
      lastDate: lastDate || new Date().toISOString().split('T')[0], 
      uid: user.uid 
    };
    
    try {
      await setDoc(doc(db, 'toApply', id), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `toApply/${id}`);
      return; // Stop if first write fails
    }

    try {
      // Also add to Referral To Get list automatically
      const toGetItem: ReferralToGetItem & { uid: string } = { 
        id, 
        company, 
        position, 
        jobId, 
        dateAdded, 
        lastDate, 
        uid: user.uid 
      };
      await setDoc(doc(db, 'referralToGet', id), toGetItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `referralToGet/${id}`);
    }
  };

  const handleGenerateFromApply = (item: ToApplyItem) => {
    setPrefillData({
      company: item.company,
      position: item.position,
      jobId: item.jobId,
      link: item.link
    });
    setActiveTab('generator');
  };

  const deleteToApply = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'toApply', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `toApply/${id}`);
    }
  };

  const addToGetManual = async (company: string, position: string, jobId: string, lastDate: string) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const item: ReferralToGetItem & { uid: string } = { 
      id, 
      company: company || '', 
      position: position || '',
      jobId: jobId || '',
      dateAdded: new Date().toISOString().split('T')[0], 
      lastDate: lastDate || new Date().toISOString().split('T')[0],
      uid: user.uid
    };
    try {
      await setDoc(doc(db, 'referralToGet', id), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `referralToGet/${id}`);
    }
  };

  const moveToGot = async (item: ReferralToGetItem | ToApplyItem) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const gotItem: ReferralGotItem & { uid: string } = {
      id,
      company: item.company || '',
      position: item.position || '',
      jobId: item.jobId || '',
      dateGot: new Date().toISOString().split('T')[0],
      uid: user.uid
    };
    
    try {
      await setDoc(doc(db, 'referralGot', id), gotItem);
      // Try to delete from both collections just in case
      await deleteDoc(doc(db, 'referralToGet', item.id));
      await deleteDoc(doc(db, 'toApply', item.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `referralGot/${id}`);
    }
  };

  const deleteGot = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'referralGot', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `referralGot/${id}`);
    }
  };

  const addInterviewHistory = async (item: Omit<InterviewHistoryItem, 'id' | 'uid'>) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const newItem: InterviewHistoryItem = { ...item, id, uid: user.uid };
    try {
      await setDoc(doc(db, 'interviewHistory', id), newItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `interviewHistory/${id}`);
    }
  };

  const updateInterviewHistory = async (id: string, item: Omit<InterviewHistoryItem, 'id' | 'uid'>) => {
    if (!user) return;
    const updatedItem: InterviewHistoryItem = { ...item, id, uid: user.uid };
    try {
      await setDoc(doc(db, 'interviewHistory', id), updatedItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `interviewHistory/${id}`);
    }
  };

  const deleteInterviewHistory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'interviewHistory', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `interviewHistory/${id}`);
    }
  };

  const addStoreItem = async (content: string) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const item: StoreItem = {
      id,
      content,
      dateAdded: new Date().toISOString(),
      uid: user.uid
    };
    try {
      await setDoc(doc(db, 'store', id), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `store/${id}`);
    }
  };

  const updateStoreItem = async (id: string, content: string) => {
    if (!user) return;
    const item = storeList.find(i => i.id === id);
    if (!item) return;
    const updatedItem: StoreItem = { ...item, content };
    try {
      await setDoc(doc(db, 'store', id), updatedItem);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `store/${id}`);
    }
  };

  const deleteStoreItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'store', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `store/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-black/10 rounded-full"></div>
          <p className="text-gray-400 font-medium">Loading Referral Hub...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[40px] shadow-xl border border-black/5 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Briefcase className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-4 tracking-tight">Referral Hub</h1>
          <p className="text-gray-500 mb-10 leading-relaxed">
            Connect your account to sync your referrals across all your devices securely.
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-800 transition-all shadow-md group"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Main Header / Navigation */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl shadow-sm border border-black/5">
            <div className="flex items-center gap-4 px-4">
              <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Referral Hub</h1>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-2">
              {[
                { id: 'generator', label: 'Generator', icon: MessageSquare },
                { id: 'to-apply', label: 'To Apply', icon: Briefcase },
                { id: 'to-get', label: 'To Get', icon: Hash },
                { id: 'got', label: 'Got', icon: Hash },
                { id: 'history', label: 'History', icon: History },
                { id: 'store', label: 'Store', icon: Hash },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'bg-black text-white shadow-md' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3 px-4 border-l border-gray-100 ml-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <button 
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'generator' && (
            <motion.div
              key="generator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ReferralGenerator 
                prefill={prefillData} 
                onPrefillUsed={() => setPrefillData(null)} 
              />
            </motion.div>
          )}

          {activeTab === 'to-apply' && (
            <motion.div
              key="to-apply"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ToApply 
                list={toApplyList} 
                onAdd={addToApply} 
                onDelete={deleteToApply} 
                onGenerate={handleGenerateFromApply}
              />
            </motion.div>
          )}

          {activeTab === 'to-get' && (
            <motion.div
              key="to-get"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ReferralToGet 
                list={referralToGetList}
                onAddManual={addToGetManual}
                onMoveToGot={moveToGot}
              />
            </motion.div>
          )}

          {activeTab === 'got' && (
            <motion.div
              key="got"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ReferralGot 
                list={referralGotList}
                onDelete={deleteGot}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <InterviewHistory 
                list={interviewHistoryList}
                onAdd={addInterviewHistory}
                onUpdate={updateInterviewHistory}
                onDelete={deleteInterviewHistory}
              />
            </motion.div>
          )}

          {activeTab === 'store' && (
            <motion.div
              key="store"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Store 
                list={storeList}
                onAdd={addStoreItem}
                onUpdate={updateStoreItem}
                onDelete={deleteStoreItem}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

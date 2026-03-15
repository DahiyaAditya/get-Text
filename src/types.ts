export type MessageType = string;
export type TabType = 'generator' | 'to-apply' | 'to-get' | 'got' | 'history' | 'store' | 'to-do';

export interface CustomMessageType {
  id: string;
  label: string;
  content: string;
  icon?: string;
  uid?: string;
}

export interface InterviewRound {
  type: 'Assignment' | 'Interview' | 'HR' | 'Technical' | 'Managerial';
  questions: string[];
  status: 'Passed' | 'Rejected' | 'Pending';
  date: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  duration?: string; // e.g. "45 mins"
  interviewer?: string;
  notes?: string;
}

export interface InterviewHistoryItem {
  id: string;
  company: string;
  hrContact: string;
  rounds: InterviewRound[];
  rejectionRoundIndex: number | null;
  date?: string;
  tags: string[];
  salary?: string;
  location?: string;
  uid?: string;
  overallStatus?: 'Ongoing' | 'Passed' | 'Rejected';
}

export interface ToApplyItem {
  id: string;
  company: string;
  position: string;
  jobId: string;
  link: string;
  dateAdded: string;
  lastDate: string;
  parsedData?: any;
  applied?: boolean;
}

export interface ReferralToGetItem {
  id: string;
  company: string;
  position: string;
  jobId: string;
  dateAdded: string;
  lastDate: string;
}

export interface ReferralGotItem {
  id: string;
  company: string;
  position: string;
  jobId: string;
  dateGot: string;
}

export interface StoreItem {
  id: string;
  content: string;
  dateAdded: string;
  uid?: string;
}

export interface TodoItem {
  id: string;
  company: string;
  type: 'Interview' | 'Assignment' | 'Other';
  dueDate: string;
  dueTime?: string; // HH:mm format
  thoughts: string;
  completed: boolean;
  alertTriggered?: boolean;
  dateAdded: string;
  uid?: string;
}

export const FIXED_MAIL = "aditya995407@gmail.com";
export const FIXED_PHONE = "8587089954";

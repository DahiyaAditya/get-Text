export type MessageType = 'new' | 'ask' | 'thanks' | 'after' | 'closed';
export type TabType = 'generator' | 'to-apply' | 'to-get' | 'got' | 'history';

export interface InterviewRound {
  type: 'Assignment' | 'Interview' | 'HR' | 'Technical' | 'Managerial';
  questions: string[];
  status: 'Passed' | 'Rejected' | 'Pending';
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
  date: string;
  tags: string[];
  salary?: string;
  location?: string;
  uid?: string;
}

export interface ToApplyItem {
  id: string;
  company: string;
  link: string;
  dateAdded: string;
  lastDate: string;
}

export interface ReferralToGetItem {
  id: string;
  company: string;
  dateAdded: string;
  lastDate: string;
}

export interface ReferralGotItem {
  id: string;
  company: string;
  dateGot: string;
}

export const FIXED_MAIL = "aditya995407@gmail.com";
export const FIXED_PHONE = "8587089954";

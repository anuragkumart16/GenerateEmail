export type View = 'compose' | 'templates' | 'drafts' | 'scheduled';

export interface Template {
  id: string;
  name: string;
  instructions: string;
}

export interface Email {
  id?: string;
  to: string;
  subject:string;
  body: string;
  attachments?: File[];
}

// FIX: Add missing ScheduledEmail type for use in ScheduledView.tsx
export interface ScheduledEmail extends Email {
  id: string;
  scheduledAt: Date;
}

export interface Draft {
  id: string;
  message: {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: {
      headers: { name: string, value: string }[];
      body: { size: number; data?: string };
      parts?: any[];
    }
  };
}

// Google Auth Types
export interface Gapi {
  auth2: any;
  client: {
    init: (args: { apiKey: string; clientId: string; discoveryDocs: string[]; scope: string; }) => Promise<void>;
    getToken: () => any;
  };
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  expiry_date?: number;  // Added for token expiration tracking
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

// Add ScheduledEmail interface
export interface ScheduledEmail extends Email {
  id: string;
  scheduledAt: Date;
}

// FIX: Add type definition for window.google to resolve errors in useGoogleAuth.tsx
declare global {
  interface Window {
    google: any;
  }
}

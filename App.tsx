import React, { useState, useCallback, useEffect } from 'react';
import type { View, Template, Draft, Gapi, GoogleTokenResponse, UserProfile, ScheduledEmail } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ComposeView from './components/ComposeView';
import TemplatesView from './components/TemplatesView';
import DraftsView from './components/DraftsView';
import ScheduledView from './components/ScheduledView';
import { DEFAULT_TEMPLATES } from './constants';
import { useGoogleAuth } from './useGoogleAuth';
import { listDrafts, getDraft } from './services/gmailService';

const App: React.FC = () => {
  const { user, token, handleSignIn, handleSignOut } = useGoogleAuth();
  
  const [view, setView] = useState<View>('compose');
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [activeInstruction, setActiveInstruction] = useState<string>('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [initialDraft, setInitialDraft] = useState<Draft | null>(null);

  const addTemplate = (template: Template) => {
    setTemplates(prev => [...prev, template]);
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const useTemplate = useCallback((instruction: string) => {
    setActiveInstruction(instruction);
    setInitialDraft(null); // Clear any draft when using a template
    setView('compose');
  }, []);

  const fetchDrafts = useCallback(async () => {
    if (!token) return;
    try {
      const draftList = await listDrafts(token.access_token);
      setDrafts(draftList || []);
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    }
  }, [token]);

  useEffect(() => {
    if (view === 'drafts') {
      fetchDrafts();
    }
  }, [view, fetchDrafts]);

  const useDraft = useCallback(async (draftId: string) => {
    if (!token) return;
    try {
      const fullDraft = await getDraft(token.access_token, draftId);
      setInitialDraft(fullDraft);
      setActiveInstruction(''); // Clear instruction when loading a draft
      setView('compose');
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  }, [token]);

  const resetComposeView = () => {
    setInitialDraft(null);
    setActiveInstruction('');
  };

  const addScheduledEmail = (email: ScheduledEmail) => {
    setScheduledEmails(prev => [...prev, email]);
  };

  const cancelScheduledEmail = (id: string) => {
    setScheduledEmails(prev => prev.filter(email => email.id !== id));
  };

  const renderView = () => {
    switch (view) {
      case 'compose':
        return <ComposeView 
                  key={initialDraft?.id || activeInstruction} 
                  initialInstruction={activeInstruction} 
                  addScheduledEmail={addScheduledEmail}
                  templates={templates} 
                  token={token}
                  initialDraft={initialDraft}
                  onEmailSent={resetComposeView}
                />;
      case 'templates':
        return <TemplatesView templates={templates} addTemplate={addTemplate} deleteTemplate={deleteTemplate} useTemplate={useTemplate} />;
      case 'drafts':
        return <DraftsView drafts={drafts} useDraft={useDraft} fetchDrafts={fetchDrafts} />;
      case 'scheduled':
        return <ScheduledView scheduledEmails={scheduledEmails} cancelScheduledEmail={cancelScheduledEmail} />;
      default:
        return <ComposeView initialInstruction="" addScheduledEmail={addScheduledEmail} templates={templates} token={token} initialDraft={null} onEmailSent={resetComposeView} />;
    }
  };

  if (!user || !token) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Gemini Mail</h1>
          <p className="text-gray-400 mb-8">Your intelligent email assistant.</p>
          <button
            onClick={handleSignIn}
            className="bg-primary-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 font-sans overflow-hidden">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        isOpen={isSidebarOpen} 
        setIsOpen={setSidebarOpen}
        user={user}
        handleSignOut={handleSignOut}
       />
      <div className="flex-1 flex flex-col">
        <Header currentView={view} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;

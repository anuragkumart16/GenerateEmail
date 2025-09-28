import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateEmailBody } from '../services/geminiService';
import { sendEmail, createDraft } from '../services/gmailService';
import type { Template, GoogleTokenResponse, Draft, Email } from '../types';
import { SendIcon, WandIcon, BoldIcon, ItalicIcon, UnderlineIcon, ListIcon, ListOrderedIcon, PaperclipIcon, XIcon, DraftsIcon } from './icons';

interface ComposeViewProps {
  initialInstruction: string;
  addScheduledEmail: (email: any) => void;
  templates: Template[];
  token: GoogleTokenResponse | null;
  initialDraft: Draft | null;
  onEmailSent: () => void;
}

const EditorToolbar: React.FC = () => {
  const format = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const COLORS = ['#FFFFFF', '#EF4444', '#3B82F6', '#22C55E', '#F97316', '#A855F7'];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-t-md p-2 flex items-center gap-2 flex-wrap">
      <button onClick={() => format('bold')} className="p-2 rounded hover:bg-gray-700" aria-label="Bold"><BoldIcon className="w-4 h-4" /></button>
      <button onClick={() => format('italic')} className="p-2 rounded hover:bg-gray-700" aria-label="Italic"><ItalicIcon className="w-4 h-4" /></button>
      <button onClick={() => format('underline')} className="p-2 rounded hover:bg-gray-700" aria-label="Underline"><UnderlineIcon className="w-4 h-4" /></button>
      <div className="w-px h-6 bg-gray-700 mx-1"></div>
      <button onClick={() => format('insertUnorderedList')} className="p-2 rounded hover:bg-gray-700" aria-label="Bulleted list"><ListIcon className="w-4 h-4" /></button>
      <button onClick={() => format('insertOrderedList')} className="p-2 rounded hover:bg-gray-700" aria-label="Numbered list"><ListOrderedIcon className="w-4 h-4" /></button>
      <div className="w-px h-6 bg-gray-700 mx-1"></div>
      <div className="flex items-center gap-1">
        {COLORS.map(color => (
          <button key={color} onClick={() => format('foreColor', color)} className="w-5 h-5 rounded-full border border-gray-600" style={{ backgroundColor: color }} aria-label={`Set color to ${color}`}></button>
        ))}
      </div>
    </div>
  );
};

// Helper to parse draft content
const parseDraft = (draft: Draft): Email => {
    const headers = draft.message.payload.headers;
    const to = headers.find(h => h.name.toLowerCase() === 'to')?.value || '';
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
    
    let body = '';
    
    const findHtmlPart = (parts: any[]): any => {
      for (const part of parts) {
        if (part.mimeType === 'text/html') return part;
        if (part.parts) {
          const nestedPart = findHtmlPart(part.parts);
          if (nestedPart) return nestedPart;
        }
      }
      return null;
    }

    const htmlPart = draft.message.payload.parts ? findHtmlPart(draft.message.payload.parts) : draft.message.payload;
    
    if (htmlPart && htmlPart.body && htmlPart.body.data) {
        try {
            body = atob(htmlPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } catch(e) {
            console.error("Error decoding base64 body:", e);
            body = "<p>Could not decode email body.</p>";
        }
    }
    
    return { id: draft.id, to, subject, body };
}


const ComposeView: React.FC<ComposeViewProps> = ({ initialInstruction, templates, token, initialDraft, onEmailSent }) => {
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [instructions, setInstructions] = useState(initialInstruction);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialDraft) {
        const parsed = parseDraft(initialDraft);
        setDraftId(parsed.id);
        setTo(parsed.to);
        setSubject(parsed.subject);
        setBody(parsed.body);
    }
  }, [initialDraft]);

  useEffect(() => {
    if (editorRef.current && body !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = body;
    }
  }, [body]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleGenerate = useCallback(async () => {
    if (!instructions.trim()) {
      showToast('Please provide instructions first.');
      return;
    }
    setIsGenerating(true);
    setBody('<p>Generating with Gemini...</p>');
    try {
      const generatedBody = await generateEmailBody(instructions, { to, subject });
      setBody(generatedBody);
    } catch (error) {
      setBody('<p>Failed to generate email. See console for details.</p>');
    } finally {
      setIsGenerating(false);
    }
  }, [instructions, to, subject]);
  
  const clearForm = useCallback(() => {
    setDraftId(undefined);
    setTo('');
    setSubject('');
    setBody('');
    setInstructions('');
    setAttachments([]);
    if (editorRef.current) editorRef.current.innerHTML = '';
    onEmailSent();
  }, [onEmailSent]);

  const handleSend = async () => {
    if (!to || !subject || !body.trim().replace(/<[^>]*>/g, '')) {
      showToast('Please fill in To, Subject, and Body fields.');
      return;
    }
    if (!token) {
        showToast('Authentication error. Please sign in again.');
        return;
    }
    setIsSending(true);
    try {
        await sendEmail(token.access_token, { to, subject, body, attachments });
        showToast('Email sent successfully!');
        clearForm();
    } catch (error) {
        console.error("Failed to send email:", error);
        showToast(`Error: ${(error as Error).message}`);
    } finally {
        setIsSending(false);
    }
  };
  
  const handleSaveDraft = async () => {
    if (!to && !subject && !body.trim().replace(/<[^>]*>/g, '')) {
      showToast('Cannot save an empty draft.');
      return;
    }
    if (!token) {
        showToast('Authentication error. Please sign in again.');
        return;
    }
    setIsSending(true);
    try {
        const emailToSave = { id: draftId, to, subject, body, attachments };
        const result = await createDraft(token.access_token, emailToSave);
        setDraftId(result.id); // Update draft ID in case it was a new draft
        showToast('Draft saved successfully!');
    } catch (error) {
        console.error("Failed to save draft:", error);
        showToast(`Error: ${(error as Error).message}`);
    } finally {
        setIsSending(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        setAttachments(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeAttachment = (fileToRemove: File) => {
    setAttachments(prev => prev.filter(file => file !== fileToRemove));
  };
  
  const handleTemplateSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedInstructions = event.target.value;
    setInstructions(selectedInstructions);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-white hidden md:block">Compose Email</h2>
      <div className="flex flex-col md:flex-row flex-1 gap-4 overflow-hidden">
        {/* Email Editor */}
        <div className="md:w-2/3 flex flex-col gap-4">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
            <label htmlFor="to" className="text-sm font-medium text-gray-400">To:</label>
            <input id="to" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <label htmlFor="subject" className="text-sm font-medium text-gray-400">Subject:</label>
            <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex flex-col flex-1 min-h-[300px] md:min-h-0">
            <EditorToolbar />
            <div
                ref={editorRef}
                contentEditable
                onInput={(e) => setBody(e.currentTarget.innerHTML)}
                className="flex-1 bg-gray-800 border border-t-0 border-gray-700 rounded-b-md p-4 text-white resize-y overflow-y-auto focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        {/* Gemini Instructions Panel */}
        <div className="md:w-1/3 bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-white flex items-center"><WandIcon className="w-5 h-5 mr-2 text-primary-400"/>Instructions for Gemini</h3>
          <select onChange={handleTemplateSelect} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500" value={instructions}>
            <option value="">-- Use a template --</option>
            {templates.map(template => (
              <option key={template.id} value={template.instructions}>{template.name}</option>
            ))}
          </select>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g., Write a polite email to John asking for the TPS reports by Friday."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-md p-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={10}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isSending}
            className="w-full flex justify-center items-center gap-2 bg-primary-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-primary-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
             {isGenerating ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>
      </div>
      {attachments.length > 0 && (
          <div className="flex-shrink-0 flex flex-wrap gap-2 items-center p-2 border-t border-b border-gray-700">
            {attachments.map((file, index) => (
                <div key={index} className="bg-gray-700 text-sm rounded-full px-3 py-1 flex items-center gap-2">
                    <span>{file.name}</span>
                    <button onClick={() => removeAttachment(file)} className="hover:text-red-400" aria-label={`Remove ${file.name}`}><XIcon className="w-4 h-4" /></button>
                </div>
            ))}
          </div>
      )}
      <div className="flex-shrink-0 flex items-center gap-4 flex-wrap">
        <button onClick={handleSend} disabled={isSending || isGenerating} className="flex items-center gap-2 bg-primary-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-primary-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
            <SendIcon className="w-5 h-5"/> {isSending ? 'Sending...' : 'Send'}
        </button>
        <button onClick={handleSaveDraft} disabled={isSending || isGenerating} className="flex items-center gap-2 bg-gray-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
            <DraftsIcon className="w-5 h-5"/> Save Draft
        </button>
        <button onClick={() => fileInputRef.current?.click()} disabled={isSending || isGenerating} className="flex items-center gap-2 bg-gray-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
            <PaperclipIcon className="w-5 h-5"/> Attach File
        </button>
        <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      </div>
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-out z-50">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default ComposeView;

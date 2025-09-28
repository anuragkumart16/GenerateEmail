import React from 'react';
import type { Draft } from '../types';

interface DraftsViewProps {
  drafts: Draft[];
  useDraft: (id: string) => void;
  fetchDrafts: () => void;
}

const DraftsView: React.FC<DraftsViewProps> = ({ drafts, useDraft }) => {
  
  const getHeader = (draft: Draft, name: string) => {
    return draft.message.payload.headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-white">Drafts</h2>
        <p className="text-gray-400 text-sm mt-2 sm:mt-0">Drafts from your connected Gmail account.</p>
      </div>
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        {drafts.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {drafts.map(draft => (
              <li key={draft.id} className="p-4 hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => useDraft(draft.id)}>
                <div className="font-semibold text-white">To: {getHeader(draft, 'To') || '[No Recipient]'}</div>
                <div className="text-sm text-gray-300 truncate">Subject: {getHeader(draft, 'Subject') || '[No Subject]'}</div>
                <p className="text-xs text-gray-400 mt-1 truncate">{draft.message.snippet}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center text-gray-500">
            You have no drafts in your Gmail account.
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftsView;

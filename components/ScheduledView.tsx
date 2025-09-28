import React from 'react';
import type { ScheduledEmail } from '../types';
import { TrashIcon } from './icons';

interface ScheduledViewProps {
  scheduledEmails: ScheduledEmail[];
  cancelScheduledEmail: (id: string) => void;
}

const ScheduledView: React.FC<ScheduledViewProps> = ({ scheduledEmails, cancelScheduledEmail }) => {
  const sortedEmails = [...scheduledEmails].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Scheduled Emails (Mock)</h2>
      <p className="text-gray-400 text-sm">This is a mock feature. Emails listed here are not actually scheduled to be sent.</p>
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        {sortedEmails.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {sortedEmails.map(email => (
              <li key={email.id} className="p-4 hover:bg-gray-800 transition-colors flex justify-between items-start">
                <div>
                  <div className="font-semibold text-white">To: {email.to}</div>
                  <div className="text-sm text-gray-300">Subject: {email.subject}</div>
                  {email.attachments && email.attachments.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      Attachments: {email.attachments.length} file(s)
                    </div>
                  )}
                  <div className="text-xs text-primary-400 mt-2">
                    Scheduled for: {email.scheduledAt.toLocaleString()}
                  </div>
                </div>
                <button 
                  onClick={() => cancelScheduledEmail(email.id)} 
                  className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-700"
                  aria-label="Cancel scheduled email"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No emails are currently scheduled.
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduledView;
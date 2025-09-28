
import React, { useState, useEffect } from 'react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSchedule }) => {
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set default to 1 hour from now
      const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, '0');
      const day = String(defaultDate.getDate()).padStart(2, '0');
      const hours = String(defaultDate.getHours()).padStart(2, '0');
      const minutes = String(defaultDate.getMinutes()).padStart(2, '0');
      setScheduleDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (scheduleDate) {
      onSchedule(new Date(scheduleDate));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">Schedule Email (Mock)</h3>
        <p className="text-sm text-gray-400 mb-4">Select a date and time to 'send' this email.</p>
        <input
          type="datetime-local"
          value={scheduleDate}
          onChange={(e) => setScheduleDate(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-500 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} className="bg-primary-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-primary-600 transition-colors">
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;

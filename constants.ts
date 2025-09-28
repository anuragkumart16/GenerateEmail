
import type { Template } from './types';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Polite Meeting Decline',
    instructions: 'Politely decline a meeting invitation. Express gratitude for the invitation, briefly state unavailability without giving a specific reason, and suggest rescheduling for next week.',
  },
  {
    id: '2',
    name: 'Quarterly Report Request',
    instructions: 'Write a professional but firm email to a colleague requesting the quarterly report. Mention that the deadline is this Friday and ask if they need any help.',
  },
  {
    id: '3',
    name: 'Project Follow-up',
    instructions: 'Follow up on the status of a project. Ask for a brief update and inquire if there are any blockers or issues that need attention.',
  },
];

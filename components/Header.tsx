import React from 'react';
import { MenuIcon } from './icons';
import type { View } from '../types';

interface HeaderProps {
  currentView: View;
  onMenuClick: () => void;
}

const viewTitles: Record<View, string> = {
  compose: 'Compose',
  templates: 'Templates',
  drafts: 'Drafts',
};

const Header: React.FC<HeaderProps> = ({ currentView, onMenuClick }) => {
  return (
    <header className="md:hidden flex items-center p-4 bg-gray-900 border-b border-gray-700/50">
      <button onClick={onMenuClick} className="text-gray-200 hover:text-white mr-4">
        <MenuIcon className="w-6 h-6" />
      </button>
      <h1 className="text-lg font-semibold text-white capitalize">{viewTitles[currentView]}</h1>
    </header>
  );
};

export default Header;

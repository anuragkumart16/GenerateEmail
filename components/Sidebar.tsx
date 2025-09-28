import React from 'react';
import type { View, UserProfile } from '../types';
import { ComposeIcon, TemplatesIcon, DraftsIcon, WandIcon, SignOutIcon, XIcon, ClockIcon } from './icons';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: UserProfile;
  handleSignOut: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3.5 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
        : 'text-gray-200 hover:bg-gray-800 hover:text-white'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
    <span className="ml-3">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen, user, handleSignOut }) => {
  const handleNavClick = (view: View) => {
    setView(view);
    if (window.innerWidth < 768) { // md breakpoint
      setIsOpen(false);
    }
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center">
            <WandIcon className="w-8 h-8 text-primary-400" />
            <h1 className="ml-3 text-xl font-bold text-white">Gemini Mail</h1>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <XIcon className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex flex-col space-y-2 mb-6">
        <NavItem
          icon={<ComposeIcon className="w-5 h-5" />}
          label="Compose"
          isActive={currentView === 'compose'}
          onClick={() => handleNavClick('compose')}
        />
        <NavItem
          icon={<TemplatesIcon className="w-5 h-5" />}
          label="Templates"
          isActive={currentView === 'templates'}
          onClick={() => handleNavClick('templates')}
        />
        <NavItem
          icon={<DraftsIcon className="w-5 h-5" />}
          label="Drafts"
          isActive={currentView === 'drafts'}
          onClick={() => handleNavClick('drafts')}
        />
        <NavItem
          icon={<ClockIcon className="w-5 h-5" />}
          label="Scheduled"
          isActive={currentView === 'scheduled'}
          onClick={() => handleNavClick('scheduled')}
        />
      </nav>
      <div className="mt-auto pt-6 border-t border-gray-700/50">
        <div className="group relative p-3 mb-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
            <div className="flex items-center space-x-3">
                <img src={user.picture} alt="User" className="w-8 h-8 rounded-full border-2 border-gray-700 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate" title={user.name}>
                        {user.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate" title={user.email}>
                        {user.email.length > 30 ? `${user.email.substring(0, 30)}...` : user.email}
                    </p>
                </div>
            </div>
            {/* Tooltip for full email on hover */}
            <div className="absolute hidden group-hover:block left-0 -top-16 w-full p-2 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-50">
                <p className="text-xs text-gray-300 break-all">{user.email}</p>
            </div>
        </div>
        <button
            onClick={handleSignOut}
            className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-gray-200 hover:bg-gray-800 hover:text-white transition-all duration-200"
        >
            <span className="w-5 h-5 flex items-center justify-center">
                <SignOutIcon className="w-5 h-5" />
            </span>
            <span className="ml-3">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
        {/* Overlay for mobile */}
        <div 
            className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isOpen ? 'block' : 'hidden'}`}
            onClick={() => setIsOpen(false)}
        ></div>
        
        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900 p-4 border-r border-gray-700/50 flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:static md:transform-none md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {sidebarContent}
        </aside>
    </>
  );
};

export default Sidebar;

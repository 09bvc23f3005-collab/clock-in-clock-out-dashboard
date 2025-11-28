import React from 'react';
import { LayoutDashboard, Settings, Users, Hash, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  activeView: 'chat' | 'dashboard';
  setActiveView: (view: 'chat' | 'dashboard') => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, theme, toggleTheme }) => {
  return (
    <div className="w-[72px] md:w-60 bg-gray-100 dark:bg-discord-darkest flex flex-col h-full shrink-0 transition-all duration-300 border-r border-gray-200 dark:border-none">
      <div className="h-12 flex items-center justify-center md:justify-start md:px-4 border-b border-gray-200 dark:border-discord-darkest shadow-sm">
        <div className="bg-discord-brand p-1.5 rounded-lg mr-0 md:mr-3">
            <LayoutDashboard size={20} className="text-white" />
        </div>
        <h1 className="hidden md:block font-bold text-gray-800 dark:text-white tracking-wide transition-colors">ChronoBot</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-2 px-2 md:px-3">
        
        <div className="text-xs font-bold text-gray-500 dark:text-discord-muted uppercase px-2 mb-2 hidden md:block">
            Menu
        </div>

        <button
          onClick={() => setActiveView('chat')}
          className={`w-full flex items-center p-2 rounded-md group transition-all ${
            activeView === 'chat' 
              ? 'bg-gray-200 dark:bg-discord-light text-gray-900 dark:text-white' 
              : 'text-gray-600 dark:text-discord-text hover:bg-gray-200 dark:hover:bg-discord-darker hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Hash size={20} className="md:mr-3 text-gray-500 dark:text-discord-muted group-hover:text-gray-700 dark:group-hover:text-gray-200" />
          <span className="hidden md:block font-medium"># time-tracking</span>
        </button>

        <button
          onClick={() => setActiveView('dashboard')}
          className={`w-full flex items-center p-2 rounded-md group transition-all ${
            activeView === 'dashboard' 
              ? 'bg-discord-brand text-white' 
              : 'text-gray-600 dark:text-discord-text hover:bg-gray-200 dark:hover:bg-discord-darker hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Users size={20} className="md:mr-3" />
          <span className="hidden md:block font-medium">Manager Dashboard</span>
        </button>
      </div>

      <div className="p-3 bg-gray-200 dark:bg-discord-darker flex items-center justify-center md:justify-start transition-colors">
        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold text-white relative">
            JD
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-200 dark:border-discord-darker"></div>
        </div>
        <div className="hidden md:block ml-3">
            <div className="text-sm font-bold text-gray-900 dark:text-white">John Doe</div>
            <div className="text-xs text-gray-500 dark:text-discord-muted">Online</div>
        </div>
        
        <div className="ml-auto flex items-center space-x-2">
            <button 
                onClick={toggleTheme}
                className="text-gray-500 dark:text-discord-muted hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Toggle Theme"
            >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Settings size={18} className="text-gray-500 dark:text-discord-muted cursor-pointer hover:text-gray-900 dark:hover:text-white hidden md:block" />
        </div>
      </div>
    </div>
  );
};
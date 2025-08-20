import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bars3Icon, 
  BellIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { cn } from '../../utils/cn';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search on Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement global search
      console.log('Searching for:', searchQuery);
    }
  };

  const getThemeIcon = () => {
    switch (mode) {
      case 'light':
        return <SunIcon className="h-5 w-5" />;
      case 'dark':
        return <MoonIcon className="h-5 w-5" />;
      default:
        return <ComputerDesktopIcon className="h-5 w-5" />;
    }
  };

  const getThemeLabel = () => {
    switch (mode) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      default:
        return 'System theme';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={onMenuClick}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="hidden sm:block ml-4 lg:ml-0">
            <form onSubmit={handleSearch} className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={searchRef}
                type="text"
                placeholder="Search... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-md border-0 bg-gray-50 dark:bg-gray-700 py-1.5 pl-10 pr-3 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6 min-w-[300px]"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <kbd className="hidden sm:inline-flex items-center rounded border border-gray-200 dark:border-gray-600 px-1 font-sans text-xs text-gray-400">
                  ⌘K
                </kbd>
              </div>
            </form>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleMode}
            className="rounded-md p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            title={getThemeLabel()}
          >
            {getThemeIcon()}
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="relative rounded-md p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" />
            {/* Notification badge */}
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex max-w-xs items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <span className="sr-only">Open user menu</span>
              {user?.icon && user.icon !== 'defaultUser' ? (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={`/api/files/avatars/${user.icon}`}
                  alt={`${user.name} ${user.lastname}`}
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              )}
            </Menu.Button>
            
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {/* User info */}
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.name} {user?.lastname}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    @{user?.username}
                  </p>
                </div>

                {/* Menu items */}
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile"
                      className={cn(
                        active ? 'bg-gray-100 dark:bg-gray-700' : '',
                        'flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <UserCircleIcon className="mr-3 h-5 w-5" />
                      Your Profile
                    </Link>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/settings"
                      className={cn(
                        active ? 'bg-gray-100 dark:bg-gray-700' : '',
                        'flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <Cog6ToothIcon className="mr-3 h-5 w-5" />
                      Settings
                    </Link>
                  )}
                </Menu.Item>

                <div className="border-t border-gray-200 dark:border-gray-700">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={cn(
                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                          'flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header;
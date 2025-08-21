import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  MapIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  DocumentIcon as DocumentIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  PuzzlePieceIcon as PuzzlePieceIconSolid,
  MapIcon as MapIconSolid,
} from '@heroicons/react/24/solid';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon, 
    iconSolid: HomeIconSolid 
  },
  { 
    name: 'Alumet Workspaces', 
    href: '/alumet', 
    icon: AcademicCapIcon, 
    iconSolid: AcademicCapIconSolid 
  },
  { 
    name: 'Flashcards', 
    href: '/flashcards', 
    icon: BookOpenIcon, 
    iconSolid: BookOpenIconSolid 
  },
  { 
    name: 'Messages', 
    href: '/messages', 
    icon: ChatBubbleLeftRightIcon, 
    iconSolid: ChatBubbleLeftRightIconSolid 
  },
  { 
    name: 'Files', 
    href: '/files', 
    icon: DocumentIcon, 
    iconSolid: DocumentIconSolid 
  },
  { 
    name: 'Homework', 
    href: '/homework', 
    icon: PuzzlePieceIcon, 
    iconSolid: PuzzlePieceIconSolid 
  },
  { 
    name: 'Mindmaps', 
    href: '/mindmaps', 
    icon: MapIcon, 
    iconSolid: MapIconSolid 
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const isCurrentPath = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <img
                className="h-8 w-auto"
                src="/alumet-logo.png"
                alt="Alumet Education"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Alumet
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const current = isCurrentPath(item.href);
                    const Icon = current ? item.iconSolid : item.icon;
                    
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={cn(
                            current
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                              : 'text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200'
                          )}
                        >
                          <Icon
                            className={cn(
                              current 
                                ? 'text-primary-700 dark:text-primary-400' 
                                : 'text-gray-400 group-hover:text-primary-700 dark:group-hover:text-primary-400',
                              'h-6 w-6 shrink-0 transition-colors duration-200'
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* User info at bottom */}
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                  {user?.icon && user.icon !== 'defaultUser' ? (
                    <img
                      className="h-8 w-8 rounded-full bg-gray-50 object-cover"
                      src={`/api/files/avatars/${user.icon}`}
                      alt={`${user.name} ${user.lastname}`}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {user?.name?.[0]}{user?.lastname?.[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm">{user?.name} {user?.lastname}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user?.accountType}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 dark:border-gray-700 px-6 pb-4">
          {/* Header with close button */}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <img
                className="h-8 w-auto"
                src="/alumet-logo.png"
                alt="Alumet Education"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Alumet
              </span>
            </Link>
            <button
              type="button"
              className="rounded-md p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const current = isCurrentPath(item.href);
                    const Icon = current ? item.iconSolid : item.icon;
                    
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={onClose}
                          className={cn(
                            current
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                              : 'text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200'
                          )}
                        >
                          <Icon
                            className={cn(
                              current 
                                ? 'text-primary-700 dark:text-primary-400' 
                                : 'text-gray-400 group-hover:text-primary-700 dark:group-hover:text-primary-400',
                              'h-6 w-6 shrink-0 transition-colors duration-200'
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* User info at bottom */}
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                  {user?.icon && user.icon !== 'defaultUser' ? (
                    <img
                      className="h-8 w-8 rounded-full bg-gray-50 object-cover"
                      src={`/api/files/avatars/${user.icon}`}
                      alt={`${user.name} ${user.lastname}`}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {user?.name?.[0]}{user?.lastname?.[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm">{user?.name} {user?.lastname}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user?.accountType}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
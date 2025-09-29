'use client';

import React from 'react';
import { ArrowLeft, Home, TestTube, BarChart3, Settings } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  actions?: React.ReactNode;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  backUrl = '/',
  actions
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredNav, setHoveredNav] = React.useState<string | null>(null);

  const handleBack = () => {
    router.push(backUrl);
  };

  const navigationItems = [
    {
      label: 'Главная панель',
      href: '/',
      icon: Home,
      active: pathname === '/'
    },
    {
      label: 'Система тестирования',
      href: '/testing',
      icon: TestTube,
      active: pathname === '/testing'
    },
    {
      label: 'Аналитика',
      href: '/analytics',
      icon: BarChart3,
      active: pathname === '/analytics'
    },
    {
      label: 'Настройки',
      href: '/settings',
      icon: Settings,
      active: pathname === '/settings'
    }
  ];

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left side - Back button and title */}
          <div className="flex items-center space-x-6">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="p-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 
                         transition-all duration-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800
                         focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-base text-gray-500 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Center - Navigation items */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigationItems.map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-base font-medium 
                           transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 relative overflow-hidden
                           hover:scale-105 hover:shadow-md
                           ${item.active
                             ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-sm'
                             : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                           }`}
                onMouseEnter={() => setHoveredNav(item.href)}
                onMouseLeave={() => setHoveredNav(null)}
              >
                {/* Subtle glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-indigo-100/20 to-transparent opacity-0 transition-opacity duration-300
                                 ${hoveredNav === item.href ? 'opacity-100' : ''}`}></div>
                <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            {actions}
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <select
                value={pathname}
                onChange={(e) => router.push(e.target.value)}
                className="text-base border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 
                         bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white shadow-sm 
                         backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {navigationItems.map((item) => (
                  <option key={item.href} value={item.href}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationHeader;
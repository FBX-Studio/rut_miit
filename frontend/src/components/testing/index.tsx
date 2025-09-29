'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  BarChart3, 
  Play, 
  Link, 
  Activity,
  TestTube,
  Gauge,
  Monitor,
  ChevronRight
} from 'lucide-react';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import TestingDashboard from './TestingDashboard';
import VisualizationPanel from './VisualizationPanel';
import SimulationInterface from './SimulationInterface';
import IntegrationPanel from './IntegrationPanel';

type ActiveTab = 'dashboard' | 'visualization' | 'simulation' | 'integration';

interface TabConfig {
  id: ActiveTab;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const LogisticsTestingSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update time on client side only to avoid hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('ru-RU'));
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('ru-RU'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabs: TabConfig[] = [
    {
      id: 'dashboard',
      name: 'Панель управления',
      description: 'Динамическое изменение параметров и аналитика',
      icon: Settings,
      color: 'blue'
    },
    {
      id: 'visualization',
      name: 'Визуализация данных',
      description: 'Графики, тепловые карты и сравнительные таблицы',
      icon: BarChart3,
      color: 'green'
    },
    {
      id: 'simulation',
      name: 'Имитационное тестирование',
      description: 'Виртуальные сценарии и оценка алгоритмов',
      icon: Play,
      color: 'purple'
    },
    {
      id: 'integration',
      name: 'Интеграция системы',
      description: 'Мониторинг компонентов и тестирование интеграции',
      icon: Link,
      color: 'orange'
    }
  ];

  const getTabColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: {
        active: 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
        inactive: 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300 dark:text-gray-400 dark:hover:text-blue-400'
      },
      green: {
        active: 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
        inactive: 'border-transparent text-gray-500 hover:text-green-600 hover:border-green-300 dark:text-gray-400 dark:hover:text-green-400'
      },
      purple: {
        active: 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
        inactive: 'border-transparent text-gray-500 hover:text-purple-600 hover:border-purple-300 dark:text-gray-400 dark:hover:text-purple-400'
      },
      orange: {
        active: 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
        inactive: 'border-transparent text-gray-500 hover:text-orange-600 hover:border-orange-300 dark:text-gray-400 dark:hover:text-orange-400'
      }
    };

    return colors[color as keyof typeof colors]?.[isActive ? 'active' : 'inactive'] || colors.blue[isActive ? 'active' : 'inactive'];
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <TestingDashboard />;
      case 'visualization':
        return <VisualizationPanel />;
      case 'simulation':
        return <SimulationInterface />;
      case 'integration':
        return <IntegrationPanel />;
      default:
        return <TestingDashboard />;
    }
  };

  const getSystemStatusIndicator = () => {
    // Имитируем статус системы
    const systemStatus = {
      overall: 'healthy',
      components: {
        api: 'healthy',
        database: 'healthy',
        frontend: 'healthy',
        monitoring: 'warning'
      }
    };

    const hasWarnings = Object.values(systemStatus.components).includes('warning');
    const hasErrors = Object.values(systemStatus.components).includes('error');

    if (hasErrors) {
      return { color: 'red', text: 'Ошибки в системе', pulse: true };
    } else if (hasWarnings) {
      return { color: 'yellow', text: 'Предупреждения', pulse: false };
    } else {
      return { color: 'green', text: 'Система работает', pulse: false };
    }
  };

  const systemStatus = getSystemStatusIndicator();

  return (
    <div className="min-h-screen">
      {/* Navigation Header - Minimalist */}
      <NavigationHeader
        title="Тестирование"
        subtitle="Оптимизация и анализ маршрутов"
        showBackButton={true}
        backUrl="/"
        actions={
          <div className="flex items-center space-x-4">
            {/* System Status - Minimal */}
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${
                systemStatus.color === 'green' ? 'bg-emerald-500' :
                systemStatus.color === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'
              } ${systemStatus.pulse ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {systemStatus.text}
              </span>
            </div>
            
            {/* Quick Actions - Minimal */}
            <div className="flex items-center space-x-1">
              <button className="p-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 
                           transition-all duration-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800">
                <Activity className="h-5 w-5" />
              </button>
              <button className="p-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 
                           transition-all duration-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800">
                <Monitor className="h-5 w-5" />
              </button>
              <button className="p-3 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 
                           transition-all duration-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800">
                <Gauge className="h-5 w-5" />
              </button>
            </div>
          </div>
        }
      />

      {/* Navigation Tabs - Minimalist */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-4 sm:py-6">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium 
                             transition-all duration-200 whitespace-nowrap
                             ${isActive 
                               ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-sm'
                               : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                             }`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden text-xs">{tab.name.split(' ')[0]}</span>
                  {isActive && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 opacity-50" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Description - Minimal */}
      <div className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-light">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Main Content - Minimal Spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {renderActiveComponent()}
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                © 2025 Система тестирования логистики VRPTW
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Система активна</span>
              </div>
              <div className="text-center sm:text-right">
                Последнее обновление: {currentTime || '...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsTestingSystem;
export { LogisticsTestingSystem as TestingSystem };
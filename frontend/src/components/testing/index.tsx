'use client';

import React, { useState } from 'react';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TestTube className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Система тестирования логистики
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Комплексное тестирование доставки и оптимизации маршрутов
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* System Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  systemStatus.color === 'green' ? 'bg-green-500' :
                  systemStatus.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                } ${systemStatus.pulse ? 'animate-pulse' : ''}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {systemStatus.text}
                </span>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <Activity className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <Monitor className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <Gauge className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap transition-all duration-200 ${
                    getTabColorClasses(tab.color, isActive)
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                  {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Description */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {renderActiveComponent()}
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                © 2024 Система тестирования логистики VRPTW
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Система активна</span>
              </div>
              <div>
                Последнее обновление: {new Date().toLocaleTimeString('ru-RU')}
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
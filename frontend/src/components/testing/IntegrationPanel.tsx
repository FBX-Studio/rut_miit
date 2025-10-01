'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Link, 
  Database, 
  Server, 
  Wifi, 
  Shield, 
  Clock, 
  Zap,
  Monitor,
  Globe,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Eye,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SystemComponent {
  id: string;
  name: string;
  type: 'api' | 'database' | 'websocket' | 'service' | 'frontend' | 'monitoring';
  status: 'online' | 'offline' | 'warning' | 'error';
  health: number;
  lastCheck: string;
  dependencies: string[];
  metrics: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    throughput: number;
  };
}

interface IntegrationTest {
  id: string;
  name: string;
  description: string;
  components: string[];
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration: number;
  lastRun: string;
  results: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

interface SystemHealth {
  overall: number;
  components: {
    api: number;
    database: number;
    frontend: number;
    monitoring: number;
  };
  alerts: SystemAlert[];
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  component: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

const IntegrationPanel: React.FC = () => {
  const [components, setComponents] = useState<SystemComponent[]>([]);
  const [integrationTests, setIntegrationTests] = useState<IntegrationTest[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'components' | 'tests' | 'health' | 'monitoring'>('components');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [clientTime, setClientTime] = useState<string>('');

  const formatNumber = (num: number): string => {
    return Number(num.toFixed(2)).toString();
  };

  useEffect(() => {
    setClientTime(new Date().toLocaleTimeString('ru-RU'));
  }, []);

  useEffect(() => {
    loadSystemComponents();
    loadIntegrationTests();
    loadSystemHealth();

    const interval = setInterval(() => {
      if (autoRefresh) {
        refreshSystemStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadSystemComponents = () => {
    const systemComponents: SystemComponent[] = [
      {
        id: 'api_main',
        name: 'Основное API',
        type: 'api',
        status: 'online',
        health: 95,
        lastCheck: new Date().toISOString(),
        dependencies: ['database_main', 'redis_cache'],
        metrics: {
          responseTime: 120,
          uptime: 99.8,
          errorRate: 0.2,
          throughput: 1500
        }
      },
      {
        id: 'database_main',
        name: 'Основная БД',
        type: 'database',
        status: 'online',
        health: 98,
        lastCheck: new Date().toISOString(),
        dependencies: [],
        metrics: {
          responseTime: 45,
          uptime: 99.9,
          errorRate: 0.1,
          throughput: 2000
        }
      },
      {
        id: 'websocket_server',
        name: 'WebSocket сервер',
        type: 'websocket',
        status: 'online',
        health: 92,
        lastCheck: new Date().toISOString(),
        dependencies: ['api_main'],
        metrics: {
          responseTime: 25,
          uptime: 99.5,
          errorRate: 0.5,
          throughput: 800
        }
      },
      {
        id: 'route_optimizer',
        name: 'Оптимизатор маршрутов',
        type: 'service',
        status: 'online',
        health: 88,
        lastCheck: new Date().toISOString(),
        dependencies: ['api_main', 'database_main'],
        metrics: {
          responseTime: 2500,
          uptime: 99.2,
          errorRate: 1.2,
          throughput: 150
        }
      },
      {
        id: 'frontend_app',
        name: 'Фронтенд приложение',
        type: 'frontend',
        status: 'online',
        health: 96,
        lastCheck: new Date().toISOString(),
        dependencies: ['api_main', 'websocket_server'],
        metrics: {
          responseTime: 800,
          uptime: 99.7,
          errorRate: 0.3,
          throughput: 500
        }
      },
      {
        id: 'monitoring_system',
        name: 'Система мониторинга',
        type: 'monitoring',
        status: 'warning',
        health: 75,
        lastCheck: new Date().toISOString(),
        dependencies: ['api_main'],
        metrics: {
          responseTime: 300,
          uptime: 98.5,
          errorRate: 2.5,
          throughput: 200
        }
      }
    ];

    setComponents(systemComponents);
  };

  const loadIntegrationTests = () => {
    const tests: IntegrationTest[] = [
      {
        id: 'test_api_db',
        name: 'API ↔ База данных',
        description: 'Тестирование взаимодействия API с основной базой данных',
        components: ['api_main', 'database_main'],
        status: 'passed',
        duration: 1200,
        lastRun: new Date(Date.now() - 3600000).toISOString(),
        results: {
          passed: 15,
          failed: 0,
          warnings: 1
        }
      },
      {
        id: 'test_websocket_api',
        name: 'WebSocket ↔ API',
        description: 'Тестирование real-time обновлений через WebSocket',
        components: ['websocket_server', 'api_main'],
        status: 'passed',
        duration: 800,
        lastRun: new Date(Date.now() - 1800000).toISOString(),
        results: {
          passed: 12,
          failed: 0,
          warnings: 0
        }
      },
      {
        id: 'test_route_optimization',
        name: 'Оптимизация маршрутов',
        description: 'Тестирование алгоритмов оптимизации и интеграции с API',
        components: ['route_optimizer', 'api_main', 'database_main'],
        status: 'running',
        duration: 0,
        lastRun: new Date().toISOString(),
        results: {
          passed: 8,
          failed: 0,
          warnings: 2
        }
      },
      {
        id: 'test_frontend_integration',
        name: 'Фронтенд интеграция',
        description: 'Полное тестирование интеграции фронтенда с бэкендом',
        components: ['frontend_app', 'api_main', 'websocket_server'],
        status: 'pending',
        duration: 0,
        lastRun: new Date(Date.now() - 7200000).toISOString(),
        results: {
          passed: 0,
          failed: 0,
          warnings: 0
        }
      },
      {
        id: 'test_monitoring_alerts',
        name: 'Система мониторинга',
        description: 'Тестирование алертов и уведомлений системы мониторинга',
        components: ['monitoring_system', 'api_main'],
        status: 'failed',
        duration: 600,
        lastRun: new Date(Date.now() - 900000).toISOString(),
        results: {
          passed: 5,
          failed: 3,
          warnings: 1
        }
      }
    ];

    setIntegrationTests(tests);
  };

  const loadSystemHealth = () => {
    const health: SystemHealth = {
      overall: 92,
      components: {
        api: 95,
        database: 98,
        frontend: 96,
        monitoring: 75
      },
      alerts: [
        {
          id: 'alert_1',
          type: 'warning',
          component: 'monitoring_system',
          message: 'Высокая нагрузка на систему мониторинга',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          resolved: false
        },
        {
          id: 'alert_2',
          type: 'info',
          component: 'route_optimizer',
          message: 'Запланированное обновление алгоритма оптимизации',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: false
        },
        {
          id: 'alert_3',
          type: 'error',
          component: 'monitoring_system',
          message: 'Ошибка подключения к внешнему сервису метрик',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          resolved: false
        }
      ]
    };

    setSystemHealth(health);
  };

  const refreshSystemStatus = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setComponents(prev => prev.map(component => ({
        ...component,
        lastCheck: new Date().toISOString(),
        health: Number(Math.max(70, Math.min(100, component.health + (Math.random() - 0.5) * 10)).toFixed(2)),
        metrics: {
          ...component.metrics,
          responseTime: Number(Math.max(10, component.metrics.responseTime + (Math.random() - 0.5) * 100).toFixed(2)),
          errorRate: Number(Math.max(0, Math.min(5, component.metrics.errorRate + (Math.random() - 0.5) * 1)).toFixed(2))
        }
      })));

      toast.success('Статус системы обновлен');
    } catch (error) {
      toast.error('Ошибка обновления статуса');
    } finally {
      setLoading(false);
    }
  };

  const runIntegrationTest = async (testId: string) => {
    setLoading(true);
    try {
      setIntegrationTests(prev => prev.map(test => 
        test.id === testId ? { ...test, status: 'running', lastRun: new Date().toISOString() } : test
      ));

      await new Promise(resolve => setTimeout(resolve, 3000));

      const success = Math.random() > 0.2;
      const results = {
        passed: Math.floor(Math.random() * 15) + 5,
        failed: success ? 0 : Math.floor(Math.random() * 3) + 1,
        warnings: Math.floor(Math.random() * 3)
      };

      setIntegrationTests(prev => prev.map(test => 
        test.id === testId ? {
          ...test,
          status: success ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 2000) + 500,
          results
        } : test
      ));

      toast.success(`Тест ${success ? 'пройден' : 'провален'}`);
    } catch (error) {
      toast.error('Ошибка выполнения теста');
    } finally {
      setLoading(false);
    }
  };

  const getComponentIcon = (type: SystemComponent['type']) => {
    switch (type) {
      case 'api':
        return <Server className="h-5 w-5" />;
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'websocket':
        return <Wifi className="h-5 w-5" />;
      case 'service':
        return <Zap className="h-5 w-5" />;
      case 'frontend':
        return <Monitor className="h-5 w-5" />;
      case 'monitoring':
        return <Activity className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'passed':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'offline':
      case 'error':
      case 'failed':
        return 'text-red-500';
      case 'running':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'online':
      case 'passed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'offline':
      case 'error':
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-500';
    if (health >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      {}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Интеграция системы
          </h1>
          <p className="text-gray-400 mt-1">
            Мониторинг компонентов и тестирование интеграции
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center bg-gray-900/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-indigo-500/30 hover:border-indigo-500/50 transition-all cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-800"
            />
            <span className="ml-2 text-sm text-gray-300">Автообновление</span>
          </label>
          <button
            onClick={refreshSystemStatus}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] disabled:opacity-50 flex items-center gap-2 font-medium hover:scale-105"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>
      </div>

      {}
      {systemHealth && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-purple-400" />
            Общее состояние системы
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="p-5 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl mb-2 border border-gray-700/50 shadow-[0_0_15px_rgba(100,100,100,0.1)]">
                <div className={`text-4xl font-bold ${getHealthColor(systemHealth.overall)}`}>
                  {systemHealth.overall}%
                </div>
                <p className="text-sm text-gray-400 mt-2">Общее</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="p-5 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 backdrop-blur-sm rounded-2xl mb-2 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <div className={`text-3xl font-bold ${getHealthColor(systemHealth.components.api)}`}>
                  {systemHealth.components.api}%
                </div>
                <p className="text-sm text-gray-400 mt-2">API</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="p-5 bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm rounded-2xl mb-2 border border-green-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <div className={`text-3xl font-bold ${getHealthColor(systemHealth.components.database)}`}>
                  {systemHealth.components.database}%
                </div>
                <p className="text-sm text-gray-400 mt-2">БД</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="p-5 bg-gradient-to-br from-purple-900/30 to-fuchsia-900/30 backdrop-blur-sm rounded-2xl mb-2 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <div className={`text-3xl font-bold ${getHealthColor(systemHealth.components.frontend)}`}>
                  {systemHealth.components.frontend}%
                </div>
                <p className="text-sm text-gray-400 mt-2">Фронтенд</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="p-5 bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-sm rounded-2xl mb-2 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                <div className={`text-3xl font-bold ${getHealthColor(systemHealth.components.monitoring)}`}>
                  {systemHealth.components.monitoring}%
                </div>
                <p className="text-sm text-gray-400 mt-2">Мониторинг</p>
              </div>
            </div>
          </div>

          {}
          {systemHealth.alerts.filter(alert => !alert.resolved).length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                Активные уведомления
              </h3>
              <div className="space-y-2">
                {systemHealth.alerts.filter(alert => !alert.resolved).map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      alert.type === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                      alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                      'bg-blue-50 dark:bg-blue-900/20'
                    }`}
                  >
                    {alert.type === 'error' ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : alert.type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Activity className="h-5 w-5 text-blue-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.component}: {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(alert.timestamp).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] overflow-hidden">
        <div className="border-b border-indigo-500/20">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: 'components', name: 'Компоненты', icon: Server },
              { id: 'tests', name: 'Тесты интеграции', icon: CheckCircle },
              { id: 'health', name: 'Здоровье системы', icon: Activity },
              { id: 'monitoring', name: 'Мониторинг', icon: Eye }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {}
          {activeTab === 'components' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Компоненты системы
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {components.map((component) => (
                  <div
                    key={component.id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-5 hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {getComponentIcon(component.type)}
                        <h3 className="font-medium text-white">
                          {component.name}
                        </h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBg(component.status)}`}>
                        {component.status === 'online' ? 'Онлайн' :
                         component.status === 'offline' ? 'Офлайн' :
                         component.status === 'warning' ? 'Предупреждение' : 'Ошибка'}
                      </span>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Здоровье:</span>
                        <span className={`font-medium ${getHealthColor(component.health)}`}>
                          {formatNumber(component.health)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Время отклика:</span>
                        <span className="text-white font-medium">
                          {formatNumber(component.metrics.responseTime)}мс
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Uptime:</span>
                        <span className="text-white font-medium">
                          {formatNumber(component.metrics.uptime)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ошибки:</span>
                        <span className="text-white font-medium">
                          {formatNumber(component.metrics.errorRate)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-indigo-500/20">
                      <p className="text-xs text-gray-400">
                        Последняя проверка: {clientTime ? new Date(component.lastCheck).toLocaleTimeString('ru-RU') : '...'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Тесты интеграции
                </h2>
                <button
                  onClick={() => {
                    integrationTests.forEach(test => {
                      if (test.status === 'pending') {
                        runIntegrationTest(test.id);
                      }
                    });
                  }}
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50 flex items-center gap-2 font-medium hover:scale-105"
                >
                  <Play className="h-4 w-4" />
                  Запустить все
                </button>
              </div>
              
              <div className="space-y-4">
                {integrationTests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-white">
                          {test.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {test.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBg(test.status)}`}>
                          {test.status === 'passed' ? 'Пройден' :
                           test.status === 'failed' ? 'Провален' :
                           test.status === 'running' ? 'Выполняется' : 'Ожидает'}
                        </span>
                        <button
                          onClick={() => runIntegrationTest(test.id)}
                          disabled={loading || test.status === 'running'}
                          className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 text-sm disabled:opacity-50 hover:scale-105"
                        >
                          {test.status === 'running' ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-green-900/30 backdrop-blur-sm rounded-xl border border-green-500/30">
                        <div className="text-2xl font-bold text-green-400">
                          {test.results.passed}
                        </div>
                        <div className="text-gray-400 text-xs mt-1">Пройдено</div>
                      </div>
                      <div className="text-center p-3 bg-red-900/30 backdrop-blur-sm rounded-xl border border-red-500/30">
                        <div className="text-2xl font-bold text-red-400">
                          {test.results.failed}
                        </div>
                        <div className="text-gray-400 text-xs mt-1">Провалено</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-900/30 backdrop-blur-sm rounded-xl border border-yellow-500/30">
                        <div className="text-2xl font-bold text-yellow-400">
                          {test.results.warnings}
                        </div>
                        <div className="text-gray-400 text-xs mt-1">Предупреждений</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-purple-500/20 flex justify-between text-xs text-gray-400">
                      <span>
                        Компоненты: {test.components.join(', ')}
                      </span>
                      <span>
                        Последний запуск: {clientTime ? new Date(test.lastRun).toLocaleString('ru-RU') : '...'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Детальное состояние системы
              </h2>
              
              {}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-500/30 rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <Cpu className="h-6 w-6 text-blue-400" />
                    <span className="text-3xl font-bold text-blue-400">
                      {Math.floor(Math.random() * 30) + 45}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Загрузка CPU</p>
                </div>
                
                <div className="bg-green-900/30 backdrop-blur-sm border border-green-500/30 rounded-xl p-5 hover:border-green-500/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <MemoryStick className="h-6 w-6 text-green-400" />
                    <span className="text-3xl font-bold text-green-400">
                      {Math.floor(Math.random() * 20) + 60}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Использование RAM</p>
                </div>
                
                <div className="bg-purple-900/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-5 hover:border-purple-500/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <HardDrive className="h-6 w-6 text-purple-400" />
                    <span className="text-3xl font-bold text-purple-400">
                      {Math.floor(Math.random() * 15) + 25}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Диск</p>
                </div>
                
                <div className="bg-orange-900/30 backdrop-blur-sm border border-orange-500/30 rounded-xl p-5 hover:border-orange-500/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <Network className="h-6 w-6 text-orange-400" />
                    <span className="text-3xl font-bold text-orange-400">
                      {Math.floor(Math.random() * 500) + 100} Мб/с
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Сеть</p>
                </div>
              </div>

              {}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-5">
                <h3 className="text-md font-medium bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                  Зависимости компонентов
                </h3>
                <div className="space-y-3">
                  {components.map((component) => (
                    <div key={component.id} className="flex items-center space-x-4 p-3 bg-gray-900/30 rounded-lg hover:bg-gray-900/50 transition-colors">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        {getComponentIcon(component.type)}
                        <span className="text-sm font-medium text-white truncate">
                          {component.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {component.dependencies.length > 0 ? (
                          <>
                            <Link className="h-4 w-4 text-indigo-400" />
                            <span className="text-sm text-gray-400">
                              {component.dependencies.length} зависимостей
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Независимый
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Мониторинг в реальном времени
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-5">
                  <h3 className="text-md font-medium bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                    Время отклика компонентов
                  </h3>
                  <div className="space-y-3">
                    {components.map((component) => (
                      <div key={component.id} className="flex items-center justify-between p-2 hover:bg-gray-900/30 rounded-lg transition-colors">
                        <div className="flex items-center space-x-2">
                          {getComponentIcon(component.type)}
                          <span className="text-sm text-white">
                            {component.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                component.metrics.responseTime < 100 ? 'bg-green-500' :
                                component.metrics.responseTime < 500 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{
                                width: `${Math.min(100, (component.metrics.responseTime / 1000) * 100)}%`
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 min-w-0 font-medium">
                            {formatNumber(component.metrics.responseTime)}мс
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-5">
                  <h3 className="text-md font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                    Уровень ошибок
                  </h3>
                  <div className="space-y-3">
                    {components.map((component) => (
                      <div key={component.id} className="flex items-center justify-between p-2 hover:bg-gray-900/30 rounded-lg transition-colors">
                        <div className="flex items-center space-x-2">
                          {getComponentIcon(component.type)}
                          <span className="text-sm text-white">
                            {component.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                component.metrics.errorRate < 1 ? 'bg-green-500' :
                                component.metrics.errorRate < 3 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{
                                width: `${Math.min(100, (component.metrics.errorRate / 5) * 100)}%`
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 min-w-0 font-medium">
                            {formatNumber(component.metrics.errorRate)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-5">
                <h3 className="text-md font-medium bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Метрики в реальном времени
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-blue-900/30 backdrop-blur-sm rounded-xl border border-blue-500/30">
                    <div className="text-3xl font-bold text-blue-400">
                      {components.reduce((sum, c) => sum + c.metrics.throughput, 0)}
                    </div>
                    <div className="text-sm text-gray-400 mt-2">Запросов/мин</div>
                  </div>
                  <div className="p-4 bg-green-900/30 backdrop-blur-sm rounded-xl border border-green-500/30">
                    <div className="text-3xl font-bold text-green-400">
                      {formatNumber(components.reduce((sum, c) => sum + c.metrics.uptime, 0) / components.length)}%
                    </div>
                    <div className="text-sm text-gray-400 mt-2">Средний Uptime</div>
                  </div>
                  <div className="p-4 bg-yellow-900/30 backdrop-blur-sm rounded-xl border border-yellow-500/30">
                    <div className="text-3xl font-bold text-yellow-400">
                      {formatNumber(components.reduce((sum, c) => sum + c.metrics.responseTime, 0) / components.length)}мс
                    </div>
                    <div className="text-sm text-gray-400 mt-2">Среднее время</div>
                  </div>
                  <div className="p-4 bg-red-900/30 backdrop-blur-sm rounded-xl border border-red-500/30">
                    <div className="text-3xl font-bold text-red-400">
                      {formatNumber(components.reduce((sum, c) => sum + c.metrics.errorRate, 0) / components.length)}%
                    </div>
                    <div className="text-sm text-gray-400 mt-2">Средние ошибки</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationPanel;

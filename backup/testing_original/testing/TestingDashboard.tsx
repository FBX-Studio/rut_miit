'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  BarChart3, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Truck,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DynamicParameter {
  parameter_type: string;
  target_id: number;
  value: any;
  duration_minutes?: number;
  description?: string;
}

interface TestScenario {
  name: string;
  description?: string;
  parameters: DynamicParameter[];
  duration_minutes: number;
  auto_reoptimize: boolean;
}

interface TestResult {
  scenario_id: string;
  start_time: string;
  end_time?: string;
  status: string;
  metrics_before: Record<string, any>;
  metrics_after?: Record<string, any>;
  parameter_changes: any[];
  reoptimization_count: number;
  performance_impact?: Record<string, any>;
}

interface DriverLoadAnalysis {
  driver_id: number;
  current_load: number;
  experience_factor: number;
  efficiency_score: number;
  recommended_max_load: number;
  current_routes: number;
  avg_delivery_time: number;
  stress_indicators: string[];
}

interface VehicleDistributionAnalysis {
  total_vehicles: number;
  available_vehicles: number;
  utilization_rate: number;
  optimal_distribution: Record<string, number>;
  current_distribution: Record<string, number>;
  efficiency_score: number;
  recommendations: string[];
}

const TestingDashboard: React.FC = () => {
  const [activeScenarios, setActiveScenarios] = useState<TestResult[]>([]);
  const [driverAnalysis, setDriverAnalysis] = useState<DriverLoadAnalysis[]>([]);
  const [vehicleAnalysis, setVehicleAnalysis] = useState<VehicleDistributionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'scenarios' | 'analytics' | 'simulation'>('scenarios');

  // Состояние для создания нового сценария
  const [newScenario, setNewScenario] = useState<TestScenario>({
    name: '',
    description: '',
    parameters: [],
    duration_minutes: 60,
    auto_reoptimize: true
  });

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchActiveScenarios();
    fetchAnalytics();
    
    // Обновляем данные каждые 30 секунд
    const interval = setInterval(() => {
      fetchActiveScenarios();
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchActiveScenarios = async () => {
    try {
      const response = await fetch('/api/v1/testing/scenarios/active');
      if (response.ok) {
        const data = await response.json();
        setActiveScenarios(data);
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const [driverResponse, vehicleResponse] = await Promise.all([
        fetch('/api/v1/testing/analytics/driver-load'),
        fetch('/api/v1/testing/analytics/vehicle-distribution')
      ]);

      if (driverResponse.ok) {
        const driverData = await driverResponse.json();
        setDriverAnalysis(driverData);
      }

      if (vehicleResponse.ok) {
        const vehicleData = await vehicleResponse.json();
        setVehicleAnalysis(vehicleData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const createScenario = async () => {
    if (!newScenario.name.trim()) {
      toast.error('Введите название сценария');
      return;
    }

    if (newScenario.parameters.length === 0) {
      toast.error('Добавьте хотя бы один параметр');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/testing/scenarios/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newScenario),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Сценарий "${newScenario.name}" создан и запущен`);
        setShowCreateModal(false);
        setNewScenario({
          name: '',
          description: '',
          parameters: [],
          duration_minutes: 60,
          auto_reoptimize: true
        });
        fetchActiveScenarios();
      } else {
        const error = await response.json();
        toast.error(`Ошибка создания сценария: ${error.detail}`);
      }
    } catch (error) {
      toast.error('Ошибка создания сценария');
      console.error('Error creating scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const stopScenario = async (scenarioId: string) => {
    try {
      const response = await fetch(`/api/v1/testing/scenarios/${scenarioId}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Сценарий остановлен');
        fetchActiveScenarios();
      } else {
        toast.error('Ошибка остановки сценария');
      }
    } catch (error) {
      toast.error('Ошибка остановки сценария');
      console.error('Error stopping scenario:', error);
    }
  };

  const addParameter = () => {
    const newParam: DynamicParameter = {
      parameter_type: 'traffic_delay',
      target_id: 1,
      value: 1.5,
      duration_minutes: 30,
      description: ''
    };
    setNewScenario({
      ...newScenario,
      parameters: [...newScenario.parameters, newParam]
    });
  };

  const updateParameter = (index: number, field: keyof DynamicParameter, value: any) => {
    const updatedParams = [...newScenario.parameters];
    updatedParams[index] = { ...updatedParams[index], [field]: value };
    setNewScenario({ ...newScenario, parameters: updatedParams });
  };

  const removeParameter = (index: number) => {
    const updatedParams = newScenario.parameters.filter((_, i) => i !== index);
    setNewScenario({ ...newScenario, parameters: updatedParams });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getLoadColor = (load: number) => {
    if (load > 0.9) return 'text-red-500';
    if (load > 0.7) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Система тестирования логистики
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Динамическое изменение параметров и аналитика производительности
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              fetchActiveScenarios();
              fetchAnalytics();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <Play className="h-4 w-4 mr-2" />
            Создать сценарий
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'scenarios', label: 'Тестовые сценарии', icon: Play },
            { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
            { id: 'simulation', label: 'Симуляция', icon: Activity }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedTab(id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                selectedTab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {selectedTab === 'scenarios' && (
        <div className="space-y-6">
          {/* Active Scenarios */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Активные сценарии
            </h2>
            
            {activeScenarios.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Нет активных сценариев</p>
                <p className="text-sm">Создайте новый сценарий для начала тестирования</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeScenarios.map((scenario) => (
                  <div
                    key={scenario.scenario_id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(scenario.status)}
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {scenario.scenario_id}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Запущен: {new Date(scenario.start_time).toLocaleString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          scenario.status === 'running' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          scenario.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          scenario.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {scenario.status === 'running' ? 'Выполняется' :
                           scenario.status === 'completed' ? 'Завершен' :
                           scenario.status === 'failed' ? 'Ошибка' :
                           scenario.status === 'stopped' ? 'Остановлен' : scenario.status}
                        </span>
                        {scenario.status === 'running' && (
                          <button
                            onClick={() => stopScenario(scenario.scenario_id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                          >
                            Остановить
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Metrics */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Изменений</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {scenario.parameter_changes.length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Реоптимизаций</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {scenario.reoptimization_count}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Маршруты до</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {scenario.metrics_before?.total_routes || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Маршруты после</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {scenario.metrics_after?.total_routes || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          {/* Driver Load Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Анализ нагрузки водителей
            </h2>
            
            {driverAnalysis.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Нет данных о водителях</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Водитель
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Нагрузка
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Опыт
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Эффективность
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Маршруты
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {driverAnalysis.map((driver) => (
                      <tr key={driver.driver_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          Водитель #{driver.driver_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${
                                  driver.current_load > 0.9 ? 'bg-red-500' :
                                  driver.current_load > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(driver.current_load * 100, 100)}%` }}
                              ></div>
                            </div>
                            <span className={`font-medium ${getLoadColor(driver.current_load)}`}>
                              {Math.round(driver.current_load * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {Math.round(driver.experience_factor * 100)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {Math.round(driver.efficiency_score * 100)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {driver.current_routes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {driver.stress_indicators.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {driver.stress_indicators.map((indicator, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-full"
                                >
                                  {indicator}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">
                              Норма
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Vehicle Distribution Analysis */}
          {vehicleAnalysis && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Анализ распределения транспорта
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{vehicleAnalysis.total_vehicles}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Всего транспорта</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{vehicleAnalysis.available_vehicles}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Доступно</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">
                    {Math.round(vehicleAnalysis.utilization_rate * 100)}%
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Загруженность</p>
                </div>
              </div>

              {vehicleAnalysis.recommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Рекомендации:
                  </h3>
                  <ul className="space-y-1">
                    {vehicleAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'simulation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Симуляция доставки
            </h2>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Функция симуляции в разработке</p>
              <p className="text-sm">Здесь будут инструменты для виртуального тестирования сценариев доставки</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Scenario Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Создать тестовый сценарий
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Название сценария *
                  </label>
                  <input
                    type="text"
                    value={newScenario.name}
                    onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Например: Тест задержек в час пик"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Длительность (минуты)
                  </label>
                  <input
                    type="number"
                    value={newScenario.duration_minutes}
                    onChange={(e) => setNewScenario({ ...newScenario, duration_minutes: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Описание
                </label>
                <textarea
                  value={newScenario.description}
                  onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Описание тестового сценария..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto_reoptimize"
                  checked={newScenario.auto_reoptimize}
                  onChange={(e) => setNewScenario({ ...newScenario, auto_reoptimize: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="auto_reoptimize" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Автоматическая реоптимизация при изменениях
                </label>
              </div>

              {/* Parameters */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Параметры для изменения
                  </h3>
                  <button
                    onClick={addParameter}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Добавить параметр
                  </button>
                </div>

                {newScenario.parameters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Нет параметров для изменения</p>
                    <p className="text-sm">Добавьте параметры для тестирования</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {newScenario.parameters.map((param, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Тип параметра
                            </label>
                            <select
                              value={param.parameter_type}
                              onChange={(e) => updateParameter(index, 'parameter_type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            >
                              <option value="traffic_delay">Задержки трафика</option>
                              <option value="order_volume">Объем заказа</option>
                              <option value="driver_change">Смена водителя</option>
                              <option value="customer_schedule">График клиента</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              ID объекта
                            </label>
                            <input
                              type="number"
                              value={param.target_id}
                              onChange={(e) => updateParameter(index, 'target_id', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Значение
                            </label>
                            <input
                              type="text"
                              value={param.value}
                              onChange={(e) => updateParameter(index, 'value', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                              placeholder="1.5"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => removeParameter(index)}
                              className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Описание изменения
                          </label>
                          <input
                            type="text"
                            value={param.description || ''}
                            onChange={(e) => updateParameter(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            placeholder="Описание изменения..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={createScenario}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Создать и запустить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestingDashboard;
'use client';

import React, { useState, useEffect } from 'react';
import { Activity, BarChart3, Clock, Settings, X, Play, Square, TrendingUp, TrendingDown, Users, Truck, AlertTriangle, CheckCircle, XCircle, Pause, RefreshCw } from 'lucide-react';
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

interface DeliveryTimeEvent {
  timestamp: string;
  time_change: number;
  description: string;
  event_type: string;
}

interface DeliveryTimeTracker {
  scenario_id: string;
  initial_delivery_time: number;
  current_delivery_time: number;
  events: DeliveryTimeEvent[];
  start_time: string;
}

interface ManualParameterChange {
  parameter_type: string;
  value: any;
  description?: string;
  time_impact?: number;
}

const TestingDashboard: React.FC = () => {
  const [activeScenarios, setActiveScenarios] = useState<TestResult[]>([]);
  const [driverAnalysis, setDriverAnalysis] = useState<DriverLoadAnalysis[]>([]);
  const [vehicleAnalysis, setVehicleAnalysis] = useState<VehicleDistributionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'scenarios' | 'analytics' | 'simulation'>('scenarios');

  const [deliveryTrackers, setDeliveryTrackers] = useState<Record<string, DeliveryTimeTracker>>({});
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [manualParameter, setManualParameter] = useState<ManualParameterChange>({
    parameter_type: 'traffic_delay',
    value: 1.0,
    description: '',
    time_impact: 0
  });
  const [showParameterModal, setShowParameterModal] = useState(false);

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
    fetchDeliveryTrackers();
    
    const scenarioInterval = setInterval(fetchActiveScenarios, 5000);
    const trackerInterval = setInterval(fetchDeliveryTrackers, 2000);
    
    return () => {
      clearInterval(scenarioInterval);
      clearInterval(trackerInterval);
    };
  }, []);

  const fetchDeliveryTrackers = async () => {
    try {
      const trackerPromises = activeScenarios
        .filter(scenario => scenario.status === 'running')
        .map(async (scenario) => {
          const response = await fetch(`/api/v1/testing/scenarios/${scenario.scenario_id}/time-tracker`);
          if (response.ok) {
            const tracker = await response.json();
            return { [scenario.scenario_id]: tracker };
          }
          return null;
        });

      const trackerResults = await Promise.all(trackerPromises);
      const trackersMap = trackerResults
        .filter(result => result !== null)
        .reduce((acc, tracker) => ({ ...acc, ...tracker }), {});
      
      setDeliveryTrackers(trackersMap);
    } catch (error) {
      console.error('Error fetching delivery trackers:', error);
    }
  };

  const applyManualParameter = async () => {
    if (!selectedScenario) {
      toast.error('Выберите сценарий');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/testing/scenarios/${selectedScenario}/modify-parameter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manualParameter),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Параметр изменен. Влияние на время: ${result.time_impact > 0 ? '+' : ''}${result.time_impact} мин`);
        setShowParameterModal(false);
        fetchActiveScenarios();
        fetchDeliveryTrackers();
      } else {
        const error = await response.json();
        toast.error(`Ошибка изменения параметра: ${error.detail}`);
      }
    } catch (error) {
      toast.error('Ошибка изменения параметра');
      console.error('Error applying manual parameter:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '';
    return `${sign}${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const formatTimeChange = (change: number): string => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change} мин`;
  };

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
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
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
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-105 transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-105 transition-colors flex items-center"
          >
            <Play className="h-4 w-4" />
            Создать сценарий
          </button>
        </div>
      </div>

      {}
      <div className="border-b border-indigo-500/20 bg-gray-900/30 backdrop-blur-sm rounded-t-2xl overflow-hidden">
        <nav className="flex space-x-1 px-2 pt-2">
          {[
            { id: 'scenarios', label: 'Тестовые сценарии', icon: Play },
            { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
            { id: 'simulation', label: 'Симуляция', icon: Activity }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedTab(id as any)}
              className={`px-4 py-3 font-medium text-sm flex items-center gap-2 rounded-t-xl transition-all duration-300 ${
                selectedTab === id
                  ? 'bg-gray-900/50 text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/30'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

       {}
       {selectedTab === 'scenarios' && (
         <div className="space-y-6">
           {}
           <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] p-6">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold text-white">
                 Активные сценарии
               </h2>
               {activeScenarios.some(s => s.status === 'running') && (
                 <button
                   onClick={() => setShowParameterModal(true)}
                   className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center"
                 >
                   <Settings className="h-4 w-4" />
                   Изменить параметр
                 </button>
               )}
             </div>
             
             {activeScenarios.length === 0 ? (
               <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                 <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                 <p>Нет активных сценариев</p>
                 <p className="text-sm">Создайте новый сценарий для начала тестирования</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {activeScenarios.map((scenario) => {
                   const tracker = deliveryTrackers[scenario.scenario_id];
                   return (
                     <div
                       key={scenario.scenario_id}
                       className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all duration-300 p-4"
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-3">
                           {getStatusIcon(scenario.status)}
                           <div>
                             <h3 className="font-medium text-white">
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

                       {}
                       {tracker && scenario.status === 'running' && (
                         <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                           <div className="flex items-center justify-between mb-3">
                             <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center">
                               <Clock className="h-4 w-4" />
                               Отслеживание времени доставки
                             </h4>
                             <div className="text-right">
                               <p className="text-sm text-blue-700 dark:text-blue-300">
                                 Текущее время: <span className="font-mono font-bold">{formatTime(tracker.current_delivery_time)}</span>
                               </p>
                               <p className="text-xs text-blue-600 dark:text-blue-400">
                                 Изначально: {formatTime(tracker.initial_delivery_time)}
                               </p>
                               {}
                               {(() => {
                                 const timeDiff = tracker.current_delivery_time - tracker.initial_delivery_time;
                                 const isPositive = timeDiff > 0;
                                 const absTimeDiff = Math.abs(timeDiff);
                                 
                                 if (absTimeDiff > 0) {
                                   return (
                                     <p className={`text-sm font-bold ${
                                       isPositive ? 'text-red-600' : 'text-green-600'
                                     }`}>
                                       {isPositive ? '⏱️ Потеряно: ' : '⚡ Сэкономлено: '}
                                       <span className="font-mono">{formatTime(absTimeDiff)}</span>
                                     </p>
                                   );
                                 }
                                 return (
                                   <p className="text-sm text-gray-600 dark:text-gray-400">
                                     📊 Без изменений
                                   </p>
                                 );
                               })()}
                             </div>
                           </div>
                           
                           {tracker.events.length > 0 && (
                             <div className="space-y-2">
                               <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                 Последние события:
                               </h5>
                               <div className="max-h-32 overflow-y-auto space-y-1">
                                 {tracker.events.slice(-5).reverse().map((event, index) => (
                                   <div key={index} className="flex items-center justify-between text-xs">
                                     <span className="text-blue-700 dark:text-blue-300">
                                       {event.description}
                                     </span>
                                     <span className={`font-mono font-bold ${
                                       event.time_change > 0 ? 'text-red-600' : 'text-green-600'
                                     }`}>
                                       {formatTimeChange(event.time_change)}
                                     </span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                         </div>
                       )}
                       
                       {}
                       <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="text-center">
                           <p className="text-sm text-gray-500 dark:text-gray-400">Изменений</p>
                           <p className="text-lg font-semibold text-white">
                             {scenario.parameter_changes.length}
                           </p>
                         </div>
                         <div className="text-center">
                           <p className="text-sm text-gray-500 dark:text-gray-400">Реоптимизаций</p>
                           <p className="text-lg font-semibold text-white">
                             {scenario.reoptimization_count}
                           </p>
                         </div>
                         <div className="text-center">
                           <p className="text-sm text-gray-500 dark:text-gray-400">Маршруты до</p>
                           <p className="text-lg font-semibold text-white">
                             {scenario.metrics_before?.total_routes || 0}
                           </p>
                         </div>
                         <div className="text-center">
                           <p className="text-sm text-gray-500 dark:text-gray-400">Маршруты после</p>
                           <p className="text-lg font-semibold text-white">
                             {scenario.metrics_after?.total_routes || '-'}
                           </p>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
           </div>
         </div>
       )}

      {selectedTab === 'analytics' && (
        <div className="space-y-6">
          {}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {Math.round(driver.experience_factor * 100)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {Math.round(driver.efficiency_score * 100)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
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

          {}
          {vehicleAnalysis && (
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
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
                  <h3 className="text-sm font-medium text-white mb-2">
                    Рекомендации:
                  </h3>
                  <ul className="space-y-1">
                    {vehicleAnalysis.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
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
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
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

      {}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-indigo-500/20 bg-gray-900/30 backdrop-blur-sm rounded-t-2xl overflow-hidden">
              <h2 className="text-xl font-semibold text-white">
                Создать тестовый сценарий
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {}
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
                <label htmlFor="auto_reoptimize" className="ml-2 block text-sm text-white">
                  Автоматическая реоптимизация при изменениях
                </label>
              </div>

              {}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">
                    Параметры для изменения
                  </h3>
                  <button
                    onClick={addParameter}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-105 transition-colors text-sm"
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
                      <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all duration-300 p-4">
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
                              className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-500 hover:to-rose-500 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(244,63,94,0.4)] hover:scale-105 transition-colors text-sm"
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

            {}
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
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-105 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                Создать и запустить
              </button>
            </div>
          </div>
        </div>
      )}

       {}
       {showParameterModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-white">
                 Изменить параметр
               </h3>
               <button
                 onClick={() => setShowParameterModal(false)}
                 className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
               >
                 <X className="h-5 w-5" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Сценарий
                 </label>
                 <select
                   value={selectedScenario || ''}
                   onChange={(e) => setSelectedScenario(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                 >
                   <option value="">Выберите сценарий</option>
                   {activeScenarios.filter(s => s.status === 'running').map((scenario) => (
                     <option key={scenario.scenario_id} value={scenario.scenario_id}>
                       {scenario.scenario_id}
                     </option>
                   ))}
                 </select>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Тип параметра
                 </label>
                 <select
                   value={manualParameter.parameter_type}
                   onChange={(e) => setManualParameter({
                     ...manualParameter,
                     parameter_type: e.target.value as 'traffic_delay' | 'order_volume' | 'driver_availability' | 'weather_impact'
                   })}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                 >
                   <option value="traffic_delay">Задержка трафика</option>
                   <option value="order_volume">Объем заказов</option>
                   <option value="driver_availability">Доступность водителей</option>
                   <option value="weather_impact">Влияние погоды</option>
                 </select>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Значение
                 </label>
                 <input
                   type="number"
                   value={manualParameter.value}
                   onChange={(e) => setManualParameter({
                     ...manualParameter,
                     value: parseFloat(e.target.value) || 0
                   })}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                   placeholder="Введите значение"
                   step="0.1"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   Описание (опционально)
                 </label>
                 <input
                   type="text"
                   value={manualParameter.description}
                   onChange={(e) => setManualParameter({
                     ...manualParameter,
                     description: e.target.value
                   })}
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                   placeholder="Описание изменения"
                 />
               </div>
             </div>
             
             <div className="flex justify-end space-x-3 mt-6">
               <button
                 onClick={() => setShowParameterModal(false)}
                 className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
               >
                 Отмена
               </button>
               <button
                 onClick={() => {
                   if (selectedScenario) {
                     applyManualParameter();
                   }
                 }}
                 disabled={!selectedScenario}
                 className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 Применить
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default TestingDashboard;
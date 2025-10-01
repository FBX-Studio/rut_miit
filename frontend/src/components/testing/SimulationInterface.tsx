'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Settings, 
  Activity, 
  Clock, 
  MapPin, 
  Truck, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Zap,
  TrendingUp,
  Users,
  Route,
  Timer,
  Target,
  Gauge,
  Navigation
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Динамический импорт карты симуляции для избежания SSR проблем
const SimulationMap = dynamic(() => import('./SimulationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-400">Загрузка карты...</p>
      </div>
    </div>
  )
});

// Импорт данных симуляции
import { SimulationDriver, mockSimulationData, startRouteAnimation, stopRouteAnimation } from './SimulationData';
import { SimulationIntegrationService } from '@/services/simulationIntegration';
import { generateSimulationWithRealAddresses } from '@/services/simulationGenerator';

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  parameters: {
    vehicle_count: number;
    driver_count: number;
    order_count: number;
    time_window_hours: number;
    traffic_factor: number;
    weather_conditions: 'clear' | 'rain' | 'snow' | 'fog';
    rush_hour_enabled: boolean;
    customer_availability: number;
  };
  duration_minutes: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
}

interface SimulationResult {
  scenario_id: string;
  start_time: string;
  end_time?: string;
  status: string;
  metrics: {
    total_deliveries: number;
    successful_deliveries: number;
    failed_deliveries: number;
    average_delivery_time: number;
    total_distance: number;
    fuel_consumption: number;
    driver_utilization: number;
    vehicle_utilization: number;
    customer_satisfaction: number;
    cost_efficiency: number;
  };
  events: SimulationEvent[];
}

interface SimulationEvent {
  timestamp: string;
  type: 'delivery_start' | 'delivery_complete' | 'traffic_delay' | 'vehicle_breakdown' | 'driver_break' | 'route_optimization';
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  severity: 'low' | 'medium' | 'high';
}

interface RealTimeMetrics {
  current_time: string;
  active_deliveries: number;
  completed_deliveries: number;
  pending_deliveries: number;
  active_vehicles: number;
  average_speed: number;
  current_efficiency: number;
  estimated_completion: string;
}

const SimulationInterface: React.FC = () => {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [activeSimulation, setActiveSimulation] = useState<SimulationResult | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generatedDriver, setGeneratedDriver] = useState<SimulationDriver | null>(null);
  
  const [newScenario, setNewScenario] = useState<Omit<SimulationScenario, 'id' | 'status'>>({
    name: '',
    description: '',
    parameters: {
      vehicle_count: 10,
      driver_count: 8,
      order_count: 50,
      time_window_hours: 8,
      traffic_factor: 1.0,
      weather_conditions: 'clear',
      rush_hour_enabled: true,
      customer_availability: 0.9
    },
    duration_minutes: 120
  });

  useEffect(() => {
    loadScenarios();
    
    // Обновляем метрики в реальном времени каждые 5 секунд
    const interval = setInterval(() => {
      if (activeSimulation?.status === 'running') {
        updateRealTimeMetrics();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSimulation]);

  const loadScenarios = () => {
    // Загружаем предустановленные сценарии
    const defaultScenarios: SimulationScenario[] = [
      {
        id: 'scenario_1',
        name: 'Обычный рабочий день',
        description: 'Стандартные условия доставки в будний день',
        parameters: {
          vehicle_count: 10,
          driver_count: 8,
          order_count: 50,
          time_window_hours: 8,
          traffic_factor: 1.0,
          weather_conditions: 'clear',
          rush_hour_enabled: true,
          customer_availability: 0.9
        },
        duration_minutes: 480,
        status: 'idle'
      },
      {
        id: 'scenario_2',
        name: 'Час пик с дождем',
        description: 'Сложные условия: пробки и плохая погода',
        parameters: {
          vehicle_count: 12,
          driver_count: 10,
          order_count: 60,
          time_window_hours: 6,
          traffic_factor: 1.8,
          weather_conditions: 'rain',
          rush_hour_enabled: true,
          customer_availability: 0.8
        },
        duration_minutes: 360,
        status: 'idle'
      },
      {
        id: 'scenario_3',
        name: 'Выходной день',
        description: 'Спокойные условия, меньше заказов',
        parameters: {
          vehicle_count: 6,
          driver_count: 5,
          order_count: 25,
          time_window_hours: 10,
          traffic_factor: 0.7,
          weather_conditions: 'clear',
          rush_hour_enabled: false,
          customer_availability: 0.95
        },
        duration_minutes: 600,
        status: 'idle'
      }
    ];
    
    setScenarios(defaultScenarios);
  };

  const startSimulation = async (scenario: SimulationScenario) => {
    setLoading(true);
    toast.loading('Генерация маршрута с реальными адресами...', { id: 'sim-start' });
    
    try {
      // Генерируем маршрут с реальными адресами
      const numStops = Math.min(scenario.parameters.order_count / scenario.parameters.vehicle_count, 10);
      const driver = await generateSimulationWithRealAddresses(Math.floor(numStops));
      
      setGeneratedDriver(driver);
      toast.success('Маршрут сгенерирован!', { id: 'sim-start' });
      
      // Имитируем запуск симуляции
      const result: SimulationResult = {
        scenario_id: scenario.id,
        start_time: new Date().toISOString(),
        status: 'running',
        metrics: {
          total_deliveries: scenario.parameters.order_count,
          successful_deliveries: 0,
          failed_deliveries: 0,
          average_delivery_time: 0,
          total_distance: 0,
          fuel_consumption: 0,
          driver_utilization: 0,
          vehicle_utilization: 0,
          customer_satisfaction: 0,
          cost_efficiency: 0
        },
        events: []
      };

      setActiveSimulation(result);
      
      // Обновляем статус сценария
      setScenarios(prev => prev.map(s => 
        s.id === scenario.id ? { ...s, status: 'running' } : s
      ));

      toast.success(`Симуляция "${scenario.name}" запущена`);
      
      // Запускаем симуляцию событий
      simulateEvents(scenario);
      
      // Запускаем анимацию маршрута
      startRouteAnimation(driver);
      
      // Синхронизируем данные с основной системой
      await SimulationIntegrationService.syncSimulationWithMainSystem(driver);
      
    } catch (error) {
      toast.error('Ошибка запуска симуляции');
      console.error('Error starting simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateEvents = (scenario: SimulationScenario) => {
    const events: SimulationEvent[] = [];
    const totalDuration = scenario.duration_minutes * 60 * 1000; // в миллисекундах
    const eventInterval = totalDuration / (scenario.parameters.order_count * 2); // примерно 2 события на заказ

    let eventCount = 0;
    const maxEvents = scenario.parameters.order_count * 3;

    const eventTimer = setInterval(() => {
      if (eventCount >= maxEvents) {
        clearInterval(eventTimer);
        completeSimulation();
        return;
      }

      const eventTypes = ['delivery_start', 'delivery_complete', 'traffic_delay', 'route_optimization'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)] as SimulationEvent['type'];
      
      const newEvent: SimulationEvent = {
        timestamp: new Date().toISOString(),
        type: randomType,
        description: getEventDescription(randomType),
        impact: getEventImpact(randomType),
        severity: getEventSeverity()
      };

      events.push(newEvent);
      
      setActiveSimulation(prev => prev ? {
        ...prev,
        events: [...prev.events, newEvent],
        metrics: updateMetrics(prev.metrics, newEvent, scenario)
      } : null);

      eventCount++;
    }, Math.max(eventInterval / 10, 1000)); // минимум 1 секунда между событиями для демонстрации
  };

  const getEventDescription = (type: SimulationEvent['type']): string => {
    const descriptions = {
      delivery_start: 'Начата доставка заказа',
      delivery_complete: 'Доставка завершена успешно',
      traffic_delay: 'Задержка из-за пробок',
      vehicle_breakdown: 'Поломка транспортного средства',
      driver_break: 'Перерыв водителя',
      route_optimization: 'Оптимизация маршрута'
    };
    return descriptions[type];
  };

  const getEventImpact = (type: SimulationEvent['type']): SimulationEvent['impact'] => {
    const impacts = {
      delivery_start: 'neutral',
      delivery_complete: 'positive',
      traffic_delay: 'negative',
      vehicle_breakdown: 'negative',
      driver_break: 'neutral',
      route_optimization: 'positive'
    };
    return impacts[type] as SimulationEvent['impact'];
  };

  const getEventSeverity = (): SimulationEvent['severity'] => {
    const severities = ['low', 'medium', 'high'];
    const weights = [0.6, 0.3, 0.1]; // больше низких, меньше высоких
    const random = Math.random();
    
    if (random < weights[0]) return 'low';
    if (random < weights[0] + weights[1]) return 'medium';
    return 'high';
  };

  const updateMetrics = (
    currentMetrics: SimulationResult['metrics'], 
    event: SimulationEvent, 
    scenario: SimulationScenario
  ): SimulationResult['metrics'] => {
    const updated = { ...currentMetrics };
    
    switch (event.type) {
      case 'delivery_complete':
        updated.successful_deliveries++;
        updated.average_delivery_time = Math.random() * 60 + 20; // 20-80 минут
        updated.total_distance += Math.random() * 50 + 10; // 10-60 км
        updated.customer_satisfaction = Math.min(0.95, updated.customer_satisfaction + 0.02);
        break;
      case 'traffic_delay':
        updated.average_delivery_time += Math.random() * 20 + 5; // +5-25 минут
        updated.fuel_consumption += Math.random() * 2 + 1; // +1-3 литра
        break;
      case 'route_optimization':
        updated.cost_efficiency = Math.min(0.95, updated.cost_efficiency + 0.05);
        break;
    }

    // Обновляем общие метрики
    updated.driver_utilization = Math.min(0.95, (updated.successful_deliveries / scenario.parameters.order_count) * 1.2);
    updated.vehicle_utilization = Math.min(0.9, (updated.successful_deliveries / scenario.parameters.order_count) * 1.1);
    
    return updated;
  };

  const completeSimulation = () => {
    setActiveSimulation(prev => prev ? {
      ...prev,
      status: 'completed',
      end_time: new Date().toISOString()
    } : null);

    setScenarios(prev => prev.map(s => 
      s.id === activeSimulation?.scenario_id ? { ...s, status: 'completed' } : s
    ));

    toast.success('Симуляция завершена');
  };

  const stopSimulation = async () => {
    if (activeSimulation) {
      // Останавливаем анимацию маршрута
      stopRouteAnimation();
      
      // Уведомляем основную систему об остановке симуляции
      if (typeof window !== 'undefined' && (window as any).simulationSync) {
        (window as any).simulationSync({
          type: 'simulation_stopped',
          data: { 
            simulation_id: activeSimulation.scenario_id,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      setActiveSimulation(prev => prev ? {
        ...prev,
        status: 'completed',
        end_time: new Date().toISOString()
      } : null);

      setScenarios(prev => prev.map(s => 
        s.id === activeSimulation.scenario_id ? { ...s, status: 'idle' } : s
      ));

      toast.info('Симуляция остановлена');
    }
  };

  const updateRealTimeMetrics = () => {
    if (!activeSimulation) return;

    const metrics: RealTimeMetrics = {
      current_time: new Date().toLocaleTimeString('ru-RU'),
      active_deliveries: Math.floor(Math.random() * 10) + 5,
      completed_deliveries: activeSimulation.metrics.successful_deliveries,
      pending_deliveries: activeSimulation.metrics.total_deliveries - activeSimulation.metrics.successful_deliveries,
      active_vehicles: Math.floor(Math.random() * 8) + 6,
      average_speed: Math.random() * 20 + 30,
      current_efficiency: Math.random() * 0.3 + 0.7,
      estimated_completion: new Date(Date.now() + Math.random() * 3600000).toLocaleTimeString('ru-RU')
    };

    setRealTimeMetrics(metrics);
  };

  const createScenario = () => {
    if (!newScenario.name.trim()) {
      toast.error('Введите название сценария');
      return;
    }

    const scenario: SimulationScenario = {
      ...newScenario,
      id: `scenario_${Date.now()}`,
      status: 'idle'
    };

    setScenarios(prev => [...prev, scenario]);
    setShowCreateModal(false);
    setNewScenario({
      name: '',
      description: '',
      parameters: {
        vehicle_count: 10,
        driver_count: 8,
        order_count: 50,
        time_window_hours: 8,
        traffic_factor: 1.0,
        weather_conditions: 'clear',
        rush_hour_enabled: true,
        customer_availability: 0.9
      },
      duration_minutes: 120
    });

    toast.success('Сценарий создан');
  };

  const getStatusIcon = (status: SimulationScenario['status']) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventIcon = (type: SimulationEvent['type']) => {
    switch (type) {
      case 'delivery_start':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'delivery_complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'traffic_delay':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'route_optimization':
        return <Zap className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Имитационное тестирование
          </h1>
          <p className="text-gray-400">
            Виртуальные сценарии доставки и оценка алгоритмов в реальном времени
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            Создать сценарий
          </button>
          {activeSimulation?.status === 'running' && (
            <button
              onClick={stopSimulation}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
            >
              <Square className="h-4 w-4 mr-2" />
              Остановить
            </button>
          )}
        </div>
      </div>

      {/* Real-time Metrics */}
      {activeSimulation?.status === 'running' && realTimeMetrics && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 animate-pulse" />
            Метрики в реальном времени
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mb-2">
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto" />
              </div>
              <p className="text-sm text-gray-400">Активные</p>
              <p className="text-xl font-bold text-white">
                {realTimeMetrics.active_deliveries}
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg mb-2">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto" />
              </div>
              <p className="text-sm text-gray-400">Завершено</p>
              <p className="text-xl font-bold text-white">
                {realTimeMetrics.completed_deliveries}
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg mb-2">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mx-auto" />
              </div>
              <p className="text-sm text-gray-400">Ожидают</p>
              <p className="text-xl font-bold text-white">
                {realTimeMetrics.pending_deliveries}
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mb-2">
                <Truck className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto" />
              </div>
              <p className="text-sm text-gray-400">Транспорт</p>
              <p className="text-xl font-bold text-white">
                {realTimeMetrics.active_vehicles}
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg mb-2">
                <Gauge className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mx-auto" />
              </div>
              <p className="text-sm text-gray-400">Скорость</p>
              <p className="text-xl font-bold text-white">
                {Math.round(realTimeMetrics.average_speed)} км/ч
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg mb-2">
                <Target className="h-6 w-6 text-teal-600 dark:text-teal-400 mx-auto" />
              </div>
              <p className="text-sm text-gray-400">Эффективность</p>
              <p className="text-xl font-bold text-white">
                {Math.round(realTimeMetrics.current_efficiency * 100)}%
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg mb-2">
                <Timer className="h-6 w-6 text-orange-600 dark:text-orange-400 mx-auto" />
              </div>
              <p className="text-sm text-gray-400">Время</p>
              <p className="text-xl font-bold text-white">
                {realTimeMetrics.current_time}
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg mb-2">
                <Clock className="h-6 w-6 text-pink-600 dark:text-pink-400 mx-auto" />
              </div>
              <p className="text-sm text-gray-400">Завершение</p>
              <p className="text-xl font-bold text-white">
                {realTimeMetrics.estimated_completion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Map */}
      {activeSimulation?.status === 'running' && generatedDriver && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
          <div className="p-4 border-b border-indigo-500/20">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Карта симуляции маршрута
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Отслеживание движения водителя в реальном времени по реальным дорогам Москвы
            </p>
          </div>
          <SimulationMap 
            initialDriver={generatedDriver} 
            averageSpeed={40} // средняя скорость 40 км/ч
          />
        </div>
      )}

      {/* Scenarios List */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] p-6">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6">
          Сценарии симуляции
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((scenario, idx) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-5 hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(scenario.status)}
                  <h3 className="font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {scenario.name}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  scenario.status === 'running' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  scenario.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}>
                  {scenario.status === 'running' ? 'Выполняется' :
                   scenario.status === 'completed' ? 'Завершен' :
                   scenario.status === 'idle' ? 'Готов' : scenario.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-400 mb-4">
                {scenario.description}
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-4">
                <div className="flex items-center gap-1"><Truck className="h-3 w-3 text-indigo-400" /> {scenario.parameters.vehicle_count}</div>
                <div className="flex items-center gap-1"><Users className="h-3 w-3 text-purple-400" /> {scenario.parameters.driver_count}</div>
                <div className="flex items-center gap-1"><Package className="h-3 w-3 text-blue-400" /> {scenario.parameters.order_count}</div>
                <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-green-400" /> {scenario.parameters.time_window_hours}ч</div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => startSimulation(scenario)}
                  disabled={scenario.status === 'running' || loading}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium hover:scale-105"
                >
                  <Play className="h-4 w-4" />
                  Запустить
                </button>
                <button
                  className="px-4 py-2.5 border border-purple-500/30 text-gray-300 rounded-xl hover:bg-white/5 hover:border-purple-500/50 transition-all duration-300"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active Simulation Events */}
      {activeSimulation && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            События симуляции
          </h2>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {activeSimulation.events.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ожидание событий симуляции...</p>
              </div>
            ) : (
              activeSimulation.events.slice().reverse().map((event, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    event.impact === 'positive' ? 'bg-green-50 dark:bg-green-900/20' :
                    event.impact === 'negative' ? 'bg-red-50 dark:bg-red-900/20' :
                    'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {event.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString('ru-RU')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {event.severity === 'high' ? 'Высокий' :
                     event.severity === 'medium' ? 'Средний' : 'Низкий'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Scenario Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-indigo-500/20">
              <h2 className="text-xl font-semibold text-white">
                Создать сценарий симуляции
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
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
                    placeholder="Например: Тест в час пик"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Длительность (минуты)
                  </label>
                  <input
                    type="number"
                    value={newScenario.duration_minutes}
                    onChange={(e) => setNewScenario({ ...newScenario, duration_minutes: parseInt(e.target.value) || 120 })}
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
                  placeholder="Описание сценария..."
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Транспорт
                  </label>
                  <input
                    type="number"
                    value={newScenario.parameters.vehicle_count}
                    onChange={(e) => setNewScenario({
                      ...newScenario,
                      parameters: { ...newScenario.parameters, vehicle_count: parseInt(e.target.value) || 10 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Водители
                  </label>
                  <input
                    type="number"
                    value={newScenario.parameters.driver_count}
                    onChange={(e) => setNewScenario({
                      ...newScenario,
                      parameters: { ...newScenario.parameters, driver_count: parseInt(e.target.value) || 8 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Заказы
                  </label>
                  <input
                    type="number"
                    value={newScenario.parameters.order_count}
                    onChange={(e) => setNewScenario({
                      ...newScenario,
                      parameters: { ...newScenario.parameters, order_count: parseInt(e.target.value) || 50 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Время (часы)
                  </label>
                  <input
                    type="number"
                    value={newScenario.parameters.time_window_hours}
                    onChange={(e) => setNewScenario({
                      ...newScenario,
                      parameters: { ...newScenario.parameters, time_window_hours: parseInt(e.target.value) || 8 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Фактор трафика
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newScenario.parameters.traffic_factor}
                    onChange={(e) => setNewScenario({
                      ...newScenario,
                      parameters: { ...newScenario.parameters, traffic_factor: parseFloat(e.target.value) || 1.0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="0.1"
                    max="3.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Погодные условия
                  </label>
                  <select
                    value={newScenario.parameters.weather_conditions}
                    onChange={(e) => setNewScenario({
                      ...newScenario,
                      parameters: { ...newScenario.parameters, weather_conditions: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="clear">Ясно</option>
                    <option value="rain">Дождь</option>
                    <option value="snow">Снег</option>
                    <option value="fog">Туман</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newScenario.parameters.rush_hour_enabled}
                    onChange={(e) => setNewScenario({
                      ...newScenario,
                      parameters: { ...newScenario.parameters, rush_hour_enabled: e.target.checked }
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-white">Час пик</span>
                </label>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Доступность клиентов ({Math.round(newScenario.parameters.customer_availability * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={newScenario.parameters.customer_availability}
                    onChange={(e) => setNewScenario({
                      ...newScenario,
                      parameters: { ...newScenario.parameters, customer_availability: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={createScenario}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Создать сценарий
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationInterface;
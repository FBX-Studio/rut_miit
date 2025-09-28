'use client';

import { useState } from 'react';
import { Play, Settings, MapPin, Clock, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface QuickSimulationProps {
  onLaunch?: () => void;
}

export default function SimulationLauncher({ onLaunch }: QuickSimulationProps) {
  const [isLaunching, setIsLaunching] = useState(false);
  const router = useRouter();

  const quickSimulationScenarios = [
    {
      id: 'quick_delivery',
      name: 'Быстрая доставка',
      description: 'Симуляция стандартной доставки по городу',
      duration: '30 мин',
      orders: 5,
      vehicles: 2,
      icon: <Truck className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    {
      id: 'rush_hour',
      name: 'Час пик',
      description: 'Доставка в условиях пробок',
      duration: '45 мин',
      orders: 8,
      vehicles: 3,
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-orange-500'
    },
    {
      id: 'multi_zone',
      name: 'Мульти-зона',
      description: 'Доставка в разные районы города',
      duration: '60 мин',
      orders: 12,
      vehicles: 4,
      icon: <MapPin className="h-5 w-5" />,
      color: 'bg-green-500'
    }
  ];

  const launchQuickSimulation = async (scenarioId: string) => {
    setIsLaunching(true);
    
    try {
      // Сохраняем выбранный сценарий в localStorage для передачи в систему тестирования
      localStorage.setItem('quickSimulationScenario', scenarioId);
      
      toast.success('Запуск симуляции...');
      
      // Переходим к системе тестирования с автозапуском
      router.push(`/testing?autostart=${scenarioId}`);
      
      onLaunch?.();
    } catch (error) {
      toast.error('Ошибка запуска симуляции');
      console.error('Error launching simulation:', error);
    } finally {
      setIsLaunching(false);
    }
  };

  const openFullTestingSystem = () => {
    router.push('/testing');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Запуск симуляции
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Быстрый запуск тестовых сценариев
          </p>
        </div>
        <button
          onClick={openFullTestingSystem}
          className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Settings className="h-4 w-4 mr-1" />
          Настройки
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {quickSimulationScenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors cursor-pointer"
            onClick={() => launchQuickSimulation(scenario.id)}
          >
            <div className="flex items-center mb-2">
              <div className={`${scenario.color} text-white p-2 rounded-lg mr-3`}>
                {scenario.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {scenario.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {scenario.duration}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {scenario.description}
            </p>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{scenario.orders} заказов</span>
              <span>{scenario.vehicles} ТС</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Выберите сценарий для быстрого запуска
        </div>
        <button
          onClick={openFullTestingSystem}
          disabled={isLaunching}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="h-4 w-4 mr-2" />
          {isLaunching ? 'Запуск...' : 'Полная система'}
        </button>
      </div>
    </div>
  );
}
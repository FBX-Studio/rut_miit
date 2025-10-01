'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle,
  Clock,
  Truck,
  TrendingUp,
  Settings,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  params: {
    trafficDelay?: number;
    driverChange?: boolean;
    orderChange?: boolean;
    weatherImpact?: number;
    customerTimeChange?: boolean;
  };
}

const SCENARIOS: SimulationScenario[] = [
  {
    id: 'normal',
    name: 'Нормальный день',
    description: 'Стандартные условия доставки без осложнений',
    icon: Activity,
    params: {}
  },
  {
    id: 'traffic',
    name: 'Сильные пробки',
    description: 'Задержки на дорогах +30% к времени в пути',
    icon: AlertTriangle,
    params: { trafficDelay: 30 }
  },
  {
    id: 'driver_sick',
    name: 'Болезнь водителя',
    description: 'Водитель заболел, требуется экстренная замена',
    icon: Truck,
    params: { driverChange: true }
  },
  {
    id: 'order_change',
    name: 'Изменение заказа',
    description: 'Клиент изменил время доставки или отменил заказ',
    icon: Clock,
    params: { orderChange: true }
  },
  {
    id: 'complex',
    name: 'Сложный день',
    description: 'Комбинация факторов: пробки, изменения, погода',
    icon: TrendingUp,
    params: {
      trafficDelay: 20,
      weatherImpact: 15,
      customerTimeChange: true
    }
  }
];

interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentStep: number;
  totalSteps: number;
  selectedScenario: string;
  results: any;
}

export const AdvancedSimulation: React.FC = () => {
  const [simulation, setSimulation] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    currentStep: 0,
    totalSteps: 100,
    selectedScenario: 'normal',
    results: null
  });

  const [config, setConfig] = useState({
    numRoutes: 5,
    ordersPerRoute: 10,
    numVehicles: 5,
    numDrivers: 5
  });

  const selectedScenarioData = SCENARIOS.find(s => s.id === simulation.selectedScenario);

  const handleStart = () => {
    setSimulation(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      currentStep: 0
    }));
    
    // Здесь будет логика запуска симуляции
    console.log('Starting simulation with scenario:', simulation.selectedScenario);
  };

  const handlePause = () => {
    setSimulation(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  };

  const handleReset = () => {
    setSimulation({
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      totalSteps: 100,
      selectedScenario: simulation.selectedScenario,
      results: null
    });
  };

  const handleScenarioChange = (scenarioId: string) => {
    setSimulation(prev => ({
      ...prev,
      selectedScenario: scenarioId
    }));
  };

  const progress = simulation.totalSteps > 0 
    ? (simulation.currentStep / simulation.totalSteps) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-indigo-600" />
            Расширенная симуляция доставки
          </CardTitle>
          <CardDescription>
            Тестирование алгоритма в различных сценариях для оценки эффективности
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Выбор сценария */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Выберите сценарий</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SCENARIOS.map((scenario) => {
                const Icon = scenario.icon;
                const isSelected = simulation.selectedScenario === scenario.id;
                
                return (
                  <button
                    key={scenario.id}
                    onClick={() => handleScenarioChange(scenario.id)}
                    disabled={simulation.isRunning}
                    className={`
                      p-4 rounded-xl border-2 transition-all text-left
                      ${isSelected 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                      }
                      ${simulation.isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        p-2 rounded-lg
                        ${isSelected 
                          ? 'bg-indigo-100 dark:bg-indigo-800' 
                          : 'bg-gray-100 dark:bg-gray-800'
                        }
                      `}>
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                          {scenario.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {scenario.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Параметры сценария */}
          {selectedScenarioData && (
            <Alert variant="default">
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">Параметры сценария:</div>
                  <ul className="text-sm space-y-1 ml-4">
                    {selectedScenarioData.params.trafficDelay && (
                      <li>• Задержка из-за пробок: +{selectedScenarioData.params.trafficDelay}%</li>
                    )}
                    {selectedScenarioData.params.driverChange && (
                      <li>• Замена водителя в процессе</li>
                    )}
                    {selectedScenarioData.params.orderChange && (
                      <li>• Изменение/отмена заказов</li>
                    )}
                    {selectedScenarioData.params.weatherImpact && (
                      <li>• Влияние погоды: +{selectedScenarioData.params.weatherImpact}%</li>
                    )}
                    {selectedScenarioData.params.customerTimeChange && (
                      <li>• Изменение времени работы клиентов</li>
                    )}
                    {Object.keys(selectedScenarioData.params).length === 0 && (
                      <li>• Стандартные условия без осложнений</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Конфигурация симуляции */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numRoutes">Количество маршрутов</Label>
              <Select
                id="numRoutes"
                value={config.numRoutes.toString()}
                onChange={(e) => setConfig(prev => ({ ...prev, numRoutes: parseInt(e.target.value) }))}
                disabled={simulation.isRunning}
              >
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordersPerRoute">Заказов на маршрут</Label>
              <Select
                id="ordersPerRoute"
                value={config.ordersPerRoute.toString()}
                onChange={(e) => setConfig(prev => ({ ...prev, ordersPerRoute: parseInt(e.target.value) }))}
                disabled={simulation.isRunning}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numVehicles">Транспортных средств</Label>
              <Select
                id="numVehicles"
                value={config.numVehicles.toString()}
                onChange={(e) => setConfig(prev => ({ ...prev, numVehicles: parseInt(e.target.value) }))}
                disabled={simulation.isRunning}
              >
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numDrivers">Водителей</Label>
              <Select
                id="numDrivers"
                value={config.numDrivers.toString()}
                onChange={(e) => setConfig(prev => ({ ...prev, numDrivers: parseInt(e.target.value) }))}
                disabled={simulation.isRunning}
              >
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
              </Select>
            </div>
          </div>

          {/* Прогресс симуляции */}
          {simulation.isRunning && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Прогресс симуляции
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {simulation.currentStep} / {simulation.totalSteps} шагов ({progress.toFixed(0)}%)
                </span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {simulation.isPaused && (
                <Badge variant="warning" className="gap-1">
                  <Pause className="h-3 w-3" />
                  Пауза
                </Badge>
              )}
            </div>
          )}

          {/* Управление */}
          <div className="flex items-center gap-3 flex-wrap">
            {!simulation.isRunning ? (
              <Button
                variant="default"
                size="lg"
                onClick={handleStart}
                className="gap-2"
              >
                <Play className="h-5 w-5" />
                Запустить симуляцию
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handlePause}
                  className="gap-2"
                >
                  {simulation.isPaused ? (
                    <>
                      <Play className="h-5 w-5" />
                      Продолжить
                    </>
                  ) : (
                    <>
                      <Pause className="h-5 w-5" />
                      Пауза
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="gap-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  Сброс
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Результаты симуляции */}
      {simulation.results && (
        <Card>
          <CardHeader>
            <CardTitle>Результаты симуляции</CardTitle>
            <CardDescription>
              Сценарий: {selectedScenarioData?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Общее время
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {simulation.results.totalTime || 0} мин
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Общая дистанция
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {simulation.results.totalDistance || 0} км
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Доставлено вовремя
                </div>
                <div className="text-2xl font-bold text-emerald-600">
                  {simulation.results.onTimeRate || 0}%
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Адаптаций маршрута
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {simulation.results.adaptations || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedSimulation;

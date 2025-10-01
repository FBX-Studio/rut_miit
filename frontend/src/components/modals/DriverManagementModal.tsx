'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Star, MapPin, Clock, Plus, Edit, Trash2, Car } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DriverManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Driver {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  license_category: string;
  rating: number;
  status: 'available' | 'busy' | 'offline';
  current_location?: [number, number];
  shift_start?: string;
  shift_end?: string;
  total_deliveries?: number;
  created_at: string;
}

export const DriverManagementModal: React.FC<DriverManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    license_category: 'B',
    rating: 5
  });

  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
    }
  }, [isOpen]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/drivers/');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      } else {
        toast.error('Ошибка загрузки водителей');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/drivers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Водитель успешно создан');
        setShowForm(false);
        setFormData({
          full_name: '',
          phone: '',
          email: '',
          license_category: 'B',
          rating: 5
        });
        fetchDrivers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка создания водителя');
      }
    } catch (error) {
      console.error('Error creating driver:', error);
      toast.error('Ошибка при создании водителя');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDriver = async (driverId: number, updates: Partial<Driver>) => {
    try {
      const response = await fetch(`/api/v1/drivers/${driverId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast.success('Водитель обновлен');
        fetchDrivers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка обновления водителя');
      }
    } catch (error) {
      console.error('Error updating driver:', error);
      toast.error('Ошибка при обновлении водителя');
    }
  };

  const handleDeleteDriver = async (driverId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого водителя?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/drivers/${driverId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Водитель удален');
        fetchDrivers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Ошибка удаления водителя');
      }
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Ошибка при удалении водителя');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Доступен';
      case 'busy': return 'Занят';
      case 'offline': return 'Не в сети';
      default: return 'Неизвестно';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Управление водителями
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить водителя
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Загрузка водителей...</p>
            </div>
          )}

          {/* Create Driver Form */}
          {showForm && (
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Добавить нового водителя
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ФИО
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Введите ФИО"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="driver@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Категория прав
                  </label>
                  <select
                    value={formData.license_category}
                    onChange={(e) => setFormData({...formData, license_category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="BE">BE</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateDriver}
                  disabled={!formData.full_name || !formData.phone}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Создать
                </button>
              </div>
            </div>
          )}

          {/* Drivers List */}
          {!loading && drivers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map((driver) => (
                <div key={driver.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-8 w-8 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {driver.full_name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                          {getStatusText(driver.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setSelectedDriver(driver)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{driver.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{driver.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4" />
                      <span>Категория: {driver.license_category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>Рейтинг: {driver.rating}/5</span>
                    </div>
                    {driver.total_deliveries && (
                      <div className="text-xs text-gray-500">
                        Доставок: {driver.total_deliveries}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateDriver(driver.id, { 
                          status: driver.status === 'available' ? 'offline' : 'available' 
                        })}
                        className={`flex-1 px-3 py-1 text-xs rounded-md transition-colors ${
                          driver.status === 'available' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {driver.status === 'available' ? 'Отключить' : 'Включить'}
                      </button>
                      <button
                        onClick={() => {
                          // Open driver location on map (placeholder)
                          toast('Функция просмотра на карте в разработке');
                        }}
                        className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
                      >
                        На карте
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && drivers.length === 0 && (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Водители не найдены</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Добавить первого водителя
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
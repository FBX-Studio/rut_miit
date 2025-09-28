'use client';

import { useState, useEffect } from 'react';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  Users, 
  Truck, 
  MapPin,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SettingsSection {
  id: string;
  title: string;
  icon: any;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'general',
    title: 'Общие настройки',
    icon: Settings,
    description: 'Основные параметры системы'
  },
  {
    id: 'notifications',
    title: 'Уведомления',
    icon: Bell,
    description: 'Настройки оповещений и алертов'
  },
  {
    id: 'security',
    title: 'Безопасность',
    icon: Shield,
    description: 'Параметры безопасности и доступа'
  },
  {
    id: 'database',
    title: 'База данных',
    icon: Database,
    description: 'Настройки подключения к БД'
  },
  {
    id: 'integrations',
    title: 'Интеграции',
    icon: Globe,
    description: 'Внешние сервисы и API'
  }
];

const ToggleSwitch = ({ enabled, onChange, label }: any) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    // Общие настройки
    companyName: 'РУТ МИИТ Логистика',
    timezone: 'Europe/Moscow',
    language: 'ru',
    theme: 'auto',
    autoSave: true,
    
    // Уведомления
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    alertsEnabled: true,
    criticalAlertsOnly: false,
    
    // Безопасность
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    
    // База данных
    dbHost: 'localhost',
    dbPort: '5432',
    dbName: 'logistics_db',
    dbUser: 'admin',
    dbPassword: '••••••••',
    connectionPoolSize: 10,
    
    // Интеграции
    mapsApiKey: '••••••••••••••••',
    weatherApi: true,
    trafficApi: true,
    smsGateway: 'disabled',
    webhookUrl: ''
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Здесь будет логика сохранения настроек
    toast.success('Настройки сохранены успешно!');
  };

  const handleReset = () => {
    // Здесь будет логика сброса настроек
    toast.success('Настройки сброшены к значениям по умолчанию');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Название компании
        </label>
        <input
          type="text"
          value={settings.companyName}
          onChange={(e) => handleSettingChange('companyName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Часовой пояс
        </label>
        <select
          value={settings.timezone}
          onChange={(e) => handleSettingChange('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="Europe/Moscow">Москва (UTC+3)</option>
          <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
          <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
          <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Язык интерфейса
        </label>
        <select
          value={settings.language}
          onChange={(e) => handleSettingChange('language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Тема оформления
        </label>
        <select
          value={settings.theme}
          onChange={(e) => handleSettingChange('theme', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="auto">Автоматически</option>
          <option value="light">Светлая</option>
          <option value="dark">Темная</option>
        </select>
      </div>

      <ToggleSwitch
        enabled={settings.autoSave}
        onChange={(value: boolean) => handleSettingChange('autoSave', value)}
        label="Автоматическое сохранение"
      />
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      <ToggleSwitch
        enabled={settings.emailNotifications}
        onChange={(value: boolean) => handleSettingChange('emailNotifications', value)}
        label="Email уведомления"
      />
      <ToggleSwitch
        enabled={settings.pushNotifications}
        onChange={(value: boolean) => handleSettingChange('pushNotifications', value)}
        label="Push уведомления"
      />
      <ToggleSwitch
        enabled={settings.smsNotifications}
        onChange={(value: boolean) => handleSettingChange('smsNotifications', value)}
        label="SMS уведомления"
      />
      <ToggleSwitch
        enabled={settings.alertsEnabled}
        onChange={(value: boolean) => handleSettingChange('alertsEnabled', value)}
        label="Системные алерты"
      />
      <ToggleSwitch
        enabled={settings.criticalAlertsOnly}
        onChange={(value: boolean) => handleSettingChange('criticalAlertsOnly', value)}
        label="Только критические алерты"
      />
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <ToggleSwitch
        enabled={settings.twoFactorAuth}
        onChange={(value: boolean) => handleSettingChange('twoFactorAuth', value)}
        label="Двухфакторная аутентификация"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Таймаут сессии (минуты)
        </label>
        <input
          type="number"
          value={settings.sessionTimeout}
          onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Срок действия пароля (дни)
        </label>
        <input
          type="number"
          value={settings.passwordExpiry}
          onChange={(e) => handleSettingChange('passwordExpiry', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Максимум попыток входа
        </label>
        <input
          type="number"
          value={settings.loginAttempts}
          onChange={(e) => handleSettingChange('loginAttempts', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Хост
          </label>
          <input
            type="text"
            value={settings.dbHost}
            onChange={(e) => handleSettingChange('dbHost', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Порт
          </label>
          <input
            type="text"
            value={settings.dbPort}
            onChange={(e) => handleSettingChange('dbPort', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Имя базы данных
        </label>
        <input
          type="text"
          value={settings.dbName}
          onChange={(e) => handleSettingChange('dbName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Пользователь
          </label>
          <input
            type="text"
            value={settings.dbUser}
            onChange={(e) => handleSettingChange('dbUser', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Пароль
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={settings.dbPassword}
              onChange={(e) => handleSettingChange('dbPassword', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Размер пула соединений
        </label>
        <input
          type="number"
          value={settings.connectionPoolSize}
          onChange={(e) => handleSettingChange('connectionPoolSize', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex gap-2">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
          <Check className="w-4 h-4" />
          Тест соединения
        </button>
        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Сброс пула
        </button>
      </div>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          API ключ карт
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={settings.mapsApiKey}
            onChange={(e) => handleSettingChange('mapsApiKey', e.target.value)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <ToggleSwitch
        enabled={settings.weatherApi}
        onChange={(value: boolean) => handleSettingChange('weatherApi', value)}
        label="Интеграция с погодным API"
      />

      <ToggleSwitch
        enabled={settings.trafficApi}
        onChange={(value: boolean) => handleSettingChange('trafficApi', value)}
        label="Мониторинг трафика"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          SMS шлюз
        </label>
        <select
          value={settings.smsGateway}
          onChange={(e) => handleSettingChange('smsGateway', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="disabled">Отключен</option>
          <option value="smsc">SMSC.ru</option>
          <option value="smsaero">SMS Aero</option>
          <option value="twilio">Twilio</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Webhook URL
        </label>
        <input
          type="url"
          value={settings.webhookUrl}
          onChange={(e) => handleSettingChange('webhookUrl', e.target.value)}
          placeholder="https://example.com/webhook"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'database':
        return renderDatabaseSettings();
      case 'integrations':
        return renderIntegrationSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavigationHeader 
        title="Настройки"
        subtitle="Конфигурация системы и параметры"
        showBackButton={true}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Боковое меню */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {section.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Основной контент */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {settingsSections.find(s => s.id === activeSection)?.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {settingsSections.find(s => s.id === activeSection)?.description}
                </p>
              </div>
              
              <div className="px-6 py-6">
                {renderContent()}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Сбросить
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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
  <div className="flex items-center justify-between py-2 group">
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 transition-colors">{label}</span>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
        enabled ? 'bg-indigo-600 shadow-lg shadow-indigo-500/25' : 'bg-gray-200 dark:bg-gray-600'
      } hover:scale-110 group-hover:shadow-md`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 shadow-sm ${
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
    companyName: 'РУТ МИИТ Логистика',
    timezone: 'Europe/Moscow',
    language: 'ru',
    theme: 'auto',
    autoSave: true,
    
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    alertsEnabled: true,
    criticalAlertsOnly: false,
    
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,
    
    dbHost: 'localhost',
    dbPort: '5432',
    dbName: 'logistics_db',
    dbUser: 'admin',
    dbPassword: '••••••••',
    connectionPoolSize: 10,
    
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
    toast.success('Настройки сохранены успешно!');
  };

  const handleReset = () => {
    toast.success('Настройки сброшены к значениям по умолчанию');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Название компании
        </label>
        <input
          type="text"
          value={settings.companyName}
          onChange={(e) => handleSettingChange('companyName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm hover:bg-white/90 dark:hover:bg-gray-800/90 focus:bg-white dark:focus:bg-gray-800 break-words"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Часовой пояс
        </label>
        <select
          value={settings.timezone}
          onChange={(e) => handleSettingChange('timezone', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 shadow-sm"
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

      <div className="flex gap-3">
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-sm">
          <Check className="w-4 h-4" />
          Тест соединения
        </button>
        <button className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-sm">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 via-white to-gray-50/50 dark:from-gray-900/50 dark:via-gray-950 dark:to-gray-900/50 relative overflow-hidden">
      {}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-800/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-emerald-200/20 dark:bg-emerald-800/20 rounded-full blur-3xl animate-pulse delay-1500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-200/10 to-emerald-200/10 dark:from-indigo-700/10 dark:to-emerald-700/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <NavigationHeader 
        title="Настройки"
        subtitle="Управление параметрами системы"
        showBackButton={true}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
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

          {}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
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
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:scale-105 group"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  Сбросить
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-sm hover:shadow-lg hover:scale-105 relative overflow-hidden group"
                >
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="relative z-10">Сохранить</span>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
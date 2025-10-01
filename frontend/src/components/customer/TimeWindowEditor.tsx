'use client';

import React, { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, Edit2, Save, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface TimeWindowData {
  customerId: number;
  customerName: string;
  
  // Заявленное время из заявки
  declaredStart: string;
  declaredEnd: string;
  
  // Реальное время работы
  actualStart: string;
  actualEnd: string;
  
  // Время обеда
  lunchStart?: string;
  lunchEnd?: string;
  
  // Метаданные
  lastUpdated?: string;
  updatedBy?: string;
  discrepancyDetected: boolean;
}

interface TimeWindowEditorProps {
  customer: TimeWindowData;
  onSave: (updated: TimeWindowData) => void;
  onCancel: () => void;
}

export const TimeWindowEditor: React.FC<TimeWindowEditorProps> = ({
  customer,
  onSave,
  onCancel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(customer);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof TimeWindowData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setFormData(customer);
    setIsEditing(false);
    setHasChanges(false);
    onCancel();
  };

  const hasDiscrepancy = () => {
    return formData.declaredStart !== formData.actualStart ||
           formData.declaredEnd !== formData.actualEnd;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              {customer.customerName}
            </CardTitle>
            <CardDescription>
              Корректировка временных окон доставки
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasDiscrepancy() && (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Расхождение
              </Badge>
            )}
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Alert о расхождении */}
        {hasDiscrepancy() && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Обнаружено расхождение</AlertTitle>
            <AlertDescription>
              Заявленное и реальное время работы клиента не совпадают. 
              Это может повлиять на построение маршрута.
            </AlertDescription>
          </Alert>
        )}

        {/* Заявленное время */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Заявленное время (из заявки)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 pl-4">
            <div className="space-y-2">
              <Label htmlFor="declaredStart">Начало работы</Label>
              <Input
                id="declaredStart"
                type="time"
                value={formData.declaredStart}
                onChange={(e) => handleChange('declaredStart', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="declaredEnd">Окончание работы</Label>
              <Input
                id="declaredEnd"
                type="time"
                value={formData.declaredEnd}
                onChange={(e) => handleChange('declaredEnd', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Реальное время */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Реальное время работы (скорректированное)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 pl-4">
            <div className="space-y-2">
              <Label htmlFor="actualStart">Фактическое начало</Label>
              <Input
                id="actualStart"
                type="time"
                value={formData.actualStart}
                onChange={(e) => handleChange('actualStart', e.target.value)}
                disabled={!isEditing}
                className={hasDiscrepancy() ? 'border-amber-300 focus:ring-amber-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualEnd">Фактическое окончание</Label>
              <Input
                id="actualEnd"
                type="time"
                value={formData.actualEnd}
                onChange={(e) => handleChange('actualEnd', e.target.value)}
                disabled={!isEditing}
                className={hasDiscrepancy() ? 'border-amber-300 focus:ring-amber-500' : ''}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Время обеда */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Перерыв на обед (опционально)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 pl-4">
            <div className="space-y-2">
              <Label htmlFor="lunchStart">Начало обеда</Label>
              <Input
                id="lunchStart"
                type="time"
                value={formData.lunchStart || ''}
                onChange={(e) => handleChange('lunchStart', e.target.value)}
                disabled={!isEditing}
                placeholder="12:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lunchEnd">Окончание обеда</Label>
              <Input
                id="lunchEnd"
                type="time"
                value={formData.lunchEnd || ''}
                onChange={(e) => handleChange('lunchEnd', e.target.value)}
                disabled={!isEditing}
                placeholder="13:00"
              />
            </div>
          </div>
        </div>

        {/* Информация о последнем обновлении */}
        {customer.lastUpdated && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>
                Последнее обновление: {customer.lastUpdated}
                {customer.updatedBy && ` (${customer.updatedBy})`}
              </span>
            </div>
          </div>
        )}
      </CardContent>

      {isEditing && hasChanges && (
        <CardFooter className="bg-gray-50 dark:bg-gray-800/50">
          <Alert variant="default" className="w-full">
            <AlertDescription className="text-sm">
              <strong>Внимание:</strong> Изменение временных окон может повлиять на построенные маршруты.
              Рекомендуется пересчитать маршруты после сохранения.
            </AlertDescription>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
};

export default TimeWindowEditor;

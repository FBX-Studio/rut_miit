# shadcn/ui Компоненты для VRPTW Frontend

Этот проект использует компоненты в стиле shadcn/ui для создания современного и красивого интерфейса.

## 🎨 Доступные компоненты

### Button (Кнопка)
Универсальная кнопка с различными вариантами стилизации.

**Варианты:**
- `default` - основная кнопка (индиго)
- `secondary` - вторичная кнопка (белая с границей)
- `destructive` - кнопка для опасных действий (красная)
- `outline` - кнопка с контуром
- `ghost` - прозрачная кнопка
- `link` - кнопка-ссылка

**Размеры:**
- `default` - стандартный размер
- `sm` - маленький
- `lg` - большой
- `icon` - для иконок

**Пример использования:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg">
  Создать маршрут
</Button>

<Button variant="outline" size="sm">
  Отмена
</Button>
```

### Card (Карточка)
Контейнер для группировки контента с красивой тенью и закругленными углами.

**Компоненты:**
- `Card` - основной контейнер
- `CardHeader` - заголовок карточки
- `CardTitle` - название
- `CardDescription` - описание
- `CardContent` - основной контент
- `CardFooter` - подвал карточки

**Пример использования:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Активные маршруты</CardTitle>
    <CardDescription>3 активных из 10</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Контент карточки */}
  </CardContent>
</Card>
```

### Badge (Значок)
Компактный индикатор статуса или категории.

**Варианты:**
- `default` - синий (индиго)
- `secondary` - серый
- `success` - зеленый (изумрудный)
- `warning` - оранжевый (янтарный)
- `destructive` - красный (розовый)
- `outline` - с контуром

**Пример использования:**
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="success">Активен</Badge>
<Badge variant="warning">Задержка</Badge>
<Badge variant="destructive">Отменён</Badge>
```

### Alert (Уведомление)
Компонент для отображения важных сообщений.

**Варианты:**
- `default` - информационное (синее)
- `success` - успех (зеленое)
- `warning` - предупреждение (оранжевое)
- `destructive` - ошибка (красное)

**Пример использования:**
```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

<Alert variant="warning">
  <AlertTitle>Внимание!</AlertTitle>
  <AlertDescription>
    Маршрут #1234 задерживается на 15 минут
  </AlertDescription>
</Alert>
```

### Input (Поле ввода)
Стилизованное поле для ввода текста.

**Пример использования:**
```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="example@mail.ru" 
  />
</div>
```

### Select (Выпадающий список)
Стилизованный select элемент.

**Пример использования:**
```tsx
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="vehicle">Транспорт</Label>
  <Select id="vehicle">
    <option value="">Выберите транспорт</option>
    <option value="1">ГАЗель Next А123БВ</option>
    <option value="2">Ford Transit В456ГД</option>
  </Select>
</div>
```

### Separator (Разделитель)
Визуальный разделитель контента.

**Пример использования:**
```tsx
import { Separator } from '@/components/ui/separator';

<div>
  <div>Раздел 1</div>
  <Separator className="my-4" />
  <div>Раздел 2</div>
</div>
```

### Skeleton (Скелетон)
Индикатор загрузки в виде анимированного блока.

**Пример использования:**
```tsx
import { Skeleton } from '@/components/ui/skeleton';

<div className="space-y-3">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

## 🎯 Специализированные компоненты

### StatsCard
Улучшенная карточка для отображения статистики с иконками и индикаторами изменений.

**Пример использования:**
```tsx
import { StatsCard } from '@/components/ui/StatsCard';
import { Truck } from 'lucide-react';

<StatsCard
  title="Активные маршруты"
  value={12}
  icon={Truck}
  change={{ 
    value: 8, 
    type: 'increase', 
    period: 'за месяц' 
  }}
/>
```

### RouteCard
Компонент для отображения информации о маршруте.

**Пример использования:**
```tsx
import { RouteCard } from '@/components/ui/route-card';

<RouteCard
  route={{
    id: 1001,
    name: "Маршрут #1001",
    status: "active",
    driver: "Иванов А.П.",
    vehicle: "ГАЗель Next А123БВ",
    stops: 8,
    completedStops: 3,
    estimatedTime: "16:30",
    distance: "45.2 км"
  }}
  onViewDetails={(id) => console.log('View route', id)}
/>
```

## 🎨 Цветовая палитра

Проект использует следующие основные цвета:

- **Primary (Indigo)**: Основной цвет для кнопок и акцентов
- **Success (Emerald)**: Для успешных операций
- **Warning (Amber)**: Для предупреждений
- **Destructive (Rose)**: Для ошибок и опасных действий
- **Secondary (Gray)**: Для второстепенных элементов

## 🚀 Утилиты

### cn() функция
Утилита для объединения классов с поддержкой условных стилей.

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  isActive && "active-class",
  "another-class"
)}>
  Content
</div>
```

## 📝 Стилевые классы

Проект использует кастомные CSS классы для быстрой стилизации:

### Кнопки
- `.btn-primary` - основная кнопка
- `.btn-secondary` - вторичная кнопка
- `.btn-success` - кнопка успеха
- `.btn-warning` - кнопка предупреждения
- `.btn-danger` - кнопка опасности

### Карточки
- `.card` - стандартная карточка с glassmorphism эффектом
- `.card-minimal` - минималистичная карточка
- `.card-header` - заголовок карточки

### Формы
- `.input-field` - поле ввода
- `.select-field` - выпадающий список

### Бейджи
- `.badge-primary` - основной бейдж
- `.badge-success` - бейдж успеха
- `.badge-warning` - бейдж предупреждения
- `.badge-danger` - бейдж ошибки
- `.badge-neutral` - нейтральный бейдж

## 🌟 Анимации

Доступные анимации:
- `.animate-fade-in` - плавное появление
- `.animate-slide-in` - появление со смещением
- `.animate-pulse-slow` - медленное пульсирование
- `.animate-pulse-subtle` - тонкое пульсирование
- `.animate-float` - плавающая анимация
- `.animate-glow` - эффект свечения

## 💡 Советы по использованию

1. **Консистентность**: Используйте одинаковые варианты компонентов во всем приложении
2. **Семантика**: Выбирайте правильные варианты (success для успеха, destructive для опасных действий)
3. **Доступность**: Все компоненты поддерживают темную тему
4. **Адаптивность**: Компоненты адаптивны и работают на всех устройствах
5. **Производительность**: Используйте lazy loading для тяжелых компонентов

## 🔧 Настройка

Все цвета и стили настраиваются в:
- `tailwind.config.js` - основная конфигурация Tailwind
- `src/app/globals.css` - глобальные стили и CSS переменные
- `components.json` - конфигурация shadcn/ui

## 📚 Дополнительные ресурсы

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

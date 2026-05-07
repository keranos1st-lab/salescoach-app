export const PLANS = {
  TRIAL: {
    label: "Пробный период",
    price: 0,
    maxCalls: 20,
    maxManagers: 2,
    features: ["4 дня бесплатно", "до 20 звонков", "до 2 менеджеров"],
  },
  STARTER: {
    label: "Старт",
    price: 3990,
    maxCalls: 20,
    maxManagers: 1,
    features: [
      "до 20 звонков в месяц",
      "1 менеджер",
      "Анализ звонков с помощью ИИ",
      "Отчёты и рекомендации",
      "Email-поддержка",
    ],
  },
  STANDARD: {
    label: "Стандарт",
    price: 7990,
    maxCalls: 120,
    maxManagers: 2,
    features: [
      "до 120 звонков в месяц",
      "2 менеджера",
      "Анализ звонков с помощью ИИ",
      "Отчёты и рекомендации",
      "Сравнение менеджеров",
      "Email-поддержка",
    ],
  },
  PRO: {
    label: "Про",
    price: 14490,
    maxCalls: 450,
    maxManagers: 5,
    features: [
      "до 450 звонков в месяц",
      "до 5 менеджеров",
      "Анализ звонков с помощью ИИ",
      "Расширенная аналитика",
      "Командные отчёты",
      "Приоритетная поддержка",
    ],
  },
  BUSINESS: {
    label: "Бизнес",
    price: 49990,
    maxCalls: null,
    maxManagers: 15,
    features: [
      "Безлимитные звонки",
      "до 15 менеджеров",
      "Анализ звонков с помощью ИИ",
      "Полная аналитика и дашборды",
      "Выгрузка отчётов в Excel/PDF",
      "Персональный менеджер",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

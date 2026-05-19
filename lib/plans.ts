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
      "Анализ звонков с помощью ИИ",
      "Управленческие отчёты",
      "до 20 звонков / 1 менеджер",
      "Email-поддержка",
    ],
  },
  STANDARD: {
    label: "Стандарт",
    price: 7990,
    maxCalls: 120,
    maxManagers: 2,
    features: [
      "Всё из Старт +",
      "Карта рисков команды · последние 30 дней",
      "до 120 звонков / 2 менеджера",
      "Email-поддержка",
    ],
  },
  PRO: {
    label: "Про",
    price: 14490,
    maxCalls: 450,
    maxManagers: 5,
    features: [
      "Всё из Стандарт +",
      "Динамика рисков по неделям",
      "Расширенная аналитика",
      "до 450 звонков / 5 менеджеров",
    ],
  },
  BUSINESS: {
    label: "Бизнес",
    price: 49990,
    maxCalls: null,
    maxManagers: 15,
    features: [
      "Всё из Про +",
      "Полная аналитика и дашборды",
      "Безлимитные звонки / 15 менеджеров",
      "Персональный менеджер",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

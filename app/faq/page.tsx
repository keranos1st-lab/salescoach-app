import { FaqAccordion, type FaqItem } from "@/components/FaqAccordion";
import { SiteFooter } from "@/components/site-footer";

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-salescoach",
    category: "О сервисе",
    question: "Что такое SalesCoach?",
    answer:
      "SalesCoach — SaaS-сервис для анализа звонков менеджеров по продажам с помощью ИИ. Помогает оценивать качество работы сотрудников на основе реальных разговоров.",
  },
  {
    id: "how-analysis-works",
    category: "О сервисе",
    question: "Как работает анализ звонков?",
    answer:
      "Загружаете аудиозапись — сервис транскрибирует и оценивает качество работы менеджера по телефонному звонку: следование скриптам, работа с возражениями, вежливость и другие параметры.",
  },
  {
    id: "audio-formats",
    category: "О сервисе",
    question: "Какие форматы аудио поддерживаются?",
    answer: "MP3, WAV, WEBM, M4A.",
  },
  {
    id: "audio-storage",
    category: "О сервисе",
    question: "Аудиофайлы хранятся на серверах?",
    answer:
      "Нет. После транскрипции хранится только текстовая расшифровка.",
  },
  {
    id: "how-to-start",
    category: "Начало работы",
    question: "Как начать пользоваться?",
    answer:
      "Зарегистрируйтесь — пробный период активируется автоматически.",
  },
  {
    id: "trial-contents",
    category: "Начало работы",
    question: "Что входит в пробный период?",
    answer: "4 дня, до 20 звонков, до 2 менеджеров, однократно.",
  },
  {
    id: "tariffs-list",
    category: "Тарифы и оплата",
    question: "Какие тарифы есть?",
    answer:
      "Минимальный — Старт (1 менеджер). Полный список на [/pricing].",
  },
  {
    id: "how-to-pay",
    category: "Тарифы и оплата",
    question: "Как оплатить?",
    answer:
      "Через Robokassa: карта, СБП и другие способы.",
  },
  {
    id: "receipt",
    category: "Тарифы и оплата",
    question: "Приходит ли чек?",
    answer: "Да, фискальный чек приходит на email автоматически.",
  },
  {
    id: "what-is-manager",
    category: "Звонки и менеджеры",
    question: "Что такое «менеджер» в системе?",
    answer:
      "Отдельный сотрудник, чьи звонки анализируются. Количество зависит от тарифа.",
  },
  {
    id: "calls-limit",
    category: "Звонки и менеджеры",
    question: "Сколько звонков можно загрузить?",
    answer: "Зависит от тарифа, подробнее на [/pricing].",
  },
  {
    id: "personal-data",
    category: "Безопасность и документы",
    question: "Как обрабатываются персональные данные?",
    answer:
      "Согласно Политике ПД [/privacy] и 152-ФЗ.",
  },
  {
    id: "public-offer",
    category: "Безопасность и документы",
    question: "Где найти публичную оферту?",
    answer: "На странице [/offer].",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-14 text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Частые вопросы
          </h1>
          <p className="mt-3 text-zinc-400">
            Ответы по сервису, тарифам, оплате и документам
          </p>
        </header>

        <div className="mt-10">
          <FaqAccordion items={FAQ_ITEMS} />
        </div>

        <SiteFooter />
      </div>
    </main>
  );
}

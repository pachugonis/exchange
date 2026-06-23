import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface ContentState {
  aboutUs: string;
  faqItems: FAQItem[];
  
  // Actions
  updateAboutUs: (content: string) => void;
  updateFAQItems: (items: FAQItem[]) => void;
  addFAQItem: (item: Omit<FAQItem, 'id'>) => void;
  updateFAQItem: (id: string, updates: Partial<FAQItem>) => void;
  deleteFAQItem: (id: string) => void;
}

const defaultAboutUs = `ExchangeKit - это надежный сервис обмена криптовалют и электронных денег, работающий с 2020 года.

Мы предоставляем быстрый и безопасный обмен различных валют по выгодным курсам. Наша цель - сделать процесс обмена максимально простым и удобным для каждого клиента.

## Наши преимущества:

- Высокая скорость обработки заявок (5-30 минут)
- Низкие комиссии
- Круглосуточная поддержка
- Безопасность и конфиденциальность
- Широкий выбор направлений обмена`;

const defaultFAQItems: FAQItem[] = [
  {
    id: '1',
    question: 'Как долго происходит обмен?',
    answer: 'Обычно обмен занимает от 5 до 30 минут. Время зависит от выбранных валют и загруженности сети. Криптовалютные транзакции могут занять больше времени из-за необходимости подтверждений в блокчейне.',
    order: 1,
  },
  {
    id: '2',
    question: 'Какие комиссии берет сервис?',
    answer: 'Все комиссии уже включены в курс обмена. Вы видите итоговую сумму, которую получите, без каких-либо скрытых платежей. Дополнительно может взиматься только комиссия сети при переводе криптовалюты.',
    order: 2,
  },
  {
    id: '3',
    question: 'Нужна ли регистрация для обмена?',
    answer: 'Нет, регистрация не требуется для обмена. Однако для некоторых направлений обмена может потребоваться базовая верификация (KYC) в соответствии с требованиями законодательства.',
    order: 3,
  },
  {
    id: '4',
    question: 'Какой минимальный и максимальный объем обмена?',
    answer: 'Лимиты зависят от выбранных валют. Минимальная сумма обычно составляет от 10$ для электронных валют и от 0.001 BTC для криптовалют. Максимальные суммы указаны для каждого направления обмена.',
    order: 4,
  },
  {
    id: '5',
    question: 'Что делать, если обмен задерживается?',
    answer: 'Если обмен задерживается более 30 минут, свяжитесь с нашей службой поддержки через чат на сайте или по email. Укажите номер вашей заявки, и мы оперативно решим проблему.',
    order: 5,
  },
  {
    id: '6',
    question: 'Безопасно ли пользоваться сервисом?',
    answer: 'Да, мы используем SSL-шифрование для защиты данных, проводим AML/KYC проверки и следуем всем требованиям безопасности. Ваши средства защищены на всех этапах обмена.',
    order: 6,
  },
  {
    id: '7',
    question: 'Можно ли отменить заявку?',
    answer: 'Вы можете отменить заявку до момента отправки средств. После отправки средств отмена невозможна. Если возникли проблемы, обратитесь в службу поддержки.',
    order: 7,
  },
  {
    id: '8',
    question: 'Работает ли сервис круглосуточно?',
    answer: 'Да, наш сервис работает 24/7 без выходных. Служба поддержки также доступна круглосуточно для решения любых вопросов.',
    order: 8,
  },
];

export const useContentStore = create<ContentState>()(
  persist(
    (set) => ({
      aboutUs: defaultAboutUs,
      faqItems: defaultFAQItems,

      updateAboutUs: (content) => {
        set({ aboutUs: content });
      },

      updateFAQItems: (items) => {
        set({ faqItems: items });
      },

      addFAQItem: (item) => {
        const newItem: FAQItem = {
          ...item,
          id: Date.now().toString(),
        };
        set((state) => ({
          faqItems: [...state.faqItems, newItem].sort((a, b) => a.order - b.order),
        }));
      },

      updateFAQItem: (id, updates) => {
        set((state) => ({
          faqItems: state.faqItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      deleteFAQItem: (id) => {
        set((state) => ({
          faqItems: state.faqItems.filter((item) => item.id !== id),
        }));
      },
    }),
    {
      name: 'content-storage',
    }
  )
);

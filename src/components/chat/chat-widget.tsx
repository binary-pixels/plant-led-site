'use client';

import { useTranslations } from 'next-intl';
import { useChat } from './chat-context';
import TranslatedChat from './translated-chat';

function ChatButton() {
  const t = useTranslations('chat');
  const { open } = useChat();

  return (
    <button
      onClick={open}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-105 flex items-center justify-center"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    </button>
  );
}

function ChatModal() {
  const t = useTranslations('chat');
  const { isOpen, close } = useChat();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md sm:w-[90vw] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-semibold text-gray-900">{t('title')}</h2>
          <button onClick={close} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <TranslatedChat onClose={close} />
      </div>
    </div>
  );
}

export { useChat };

export default function ChatWidget() {
  return (
    <>
      <ChatButton />
      <ChatModal />
    </>
  );
}

import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const phone = '919386469006';
  const message = encodeURIComponent('Hello, I would like to inquire about your services.');

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 rounded-full px-4 py-3 sm:px-5 shadow-lg transition-transform hover:scale-105 active:scale-95 safe-area-bottom"
      style={{ background: '#25D366', color: 'white' }}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="text-sm font-semibold hidden sm:inline">WhatsApp</span>
    </a>
  );
};

export default WhatsAppButton;

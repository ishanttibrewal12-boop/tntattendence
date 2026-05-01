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
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2.5 sm:px-5 sm:py-3 shadow-lg transition-transform hover:scale-[1.03] active:scale-95 safe-area-bottom text-white text-sm font-medium"
      style={{ background: '#25D366' }}
    >
      <MessageCircle className="h-[18px] w-[18px]" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
};

export default WhatsAppButton;

import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const phone = '916203229118';
  const message = encodeURIComponent('Hello, I would like to inquire about your services.');

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 shadow-lg transition-transform hover:scale-105 active:scale-95"
      style={{ background: '#25D366', color: 'white' }}
    >
      <MessageCircle className="h-5 w-5" />
      <span className="text-sm font-semibold hidden sm:inline">WhatsApp</span>
    </a>
  );
};

export default WhatsAppButton;

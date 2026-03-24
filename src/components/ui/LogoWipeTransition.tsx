import { motion, AnimatePresence } from 'framer-motion';
import companyLogo from '@/assets/tibrewal-logo.png';

interface LogoWipeTransitionProps {
  show: boolean;
  onComplete: () => void;
}

const LogoWipeTransition = ({ show, onComplete }: LogoWipeTransitionProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'hsl(210, 55%, 7%)' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          {/* Wipe curtain from center */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'hsl(210, 55%, 7%)', transformOrigin: 'center' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
          />

          {/* Logo with text-first then arc animation */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            onAnimationComplete={() => {
              if (show) {
                setTimeout(onComplete, 500);
              }
            }}
          >
            {/* Text appears first */}
            <motion.p
              className="text-2xl font-extrabold tracking-[0.15em] uppercase"
              style={{ color: 'hsl(210, 15%, 90%)' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
            >
              TIBREWAL
            </motion.p>

            {/* Logo arc/design slides in from above */}
            <motion.img
              src={companyLogo}
              alt="Tibrewal Group"
              className="h-16 w-auto object-contain"
              loading="eager"
              initial={{ opacity: 0, y: -30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.2 }}
              className="text-[10px] font-medium"
              style={{ color: 'hsl(210, 15%, 50%)' }}
            >
              Industrial Business Group
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogoWipeTransition;

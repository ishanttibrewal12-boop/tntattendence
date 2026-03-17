import { motion, AnimatePresence } from 'framer-motion';
import companyLogo from '@/assets/company-logo.png';

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
          onAnimationComplete={(def: any) => {
            // Only call onComplete when exit finishes
          }}
        >
          {/* Wipe curtain from center */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'hsl(210, 55%, 7%)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
            style={{ transformOrigin: 'center', background: 'hsl(210, 55%, 7%)' }}
          />

          {/* Logo */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            onAnimationComplete={() => {
              if (show) {
                setTimeout(onComplete, 400);
              }
            }}
          >
            <img src={companyLogo} alt="T&T" className="h-16 w-16 object-contain rounded-xl" />
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.2 }}
              className="text-center"
            >
              <p className="text-sm font-bold" style={{ color: 'hsl(210, 15%, 90%)' }}>Tibrewal & Tibrewal</p>
              <p className="text-[10px] font-medium" style={{ color: 'hsl(210, 15%, 50%)' }}>Private Limited</p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LogoWipeTransition;

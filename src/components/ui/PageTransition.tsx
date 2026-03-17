import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const PageTransition = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default PageTransition;

import React from 'react';
import { motion } from 'framer-motion';

interface MarqueeProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}

const Marquee: React.FC<MarqueeProps> = ({
  children,
  direction = 'left',
  speed = 40,
  pauseOnHover = true,
  className = '',
}) => {
  const containerVariants = {
    animate: {
      x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: 'loop' as const,
          duration: speed,
          ease: 'linear' as any,
        },
      },
    },
  };

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div
        className="inline-block"
        variants={containerVariants}
        animate="animate"
        whileHover={pauseOnHover ? { animationPlayState: 'paused' } as any : undefined}
        style={{ display: 'flex' }}
      >
        <div className="flex shrink-0">
          {children}
        </div>
        <div className="flex shrink-0">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default Marquee;

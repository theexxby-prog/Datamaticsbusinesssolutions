import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
  animationDelay?: number; // in milliseconds
  className?: string;
  showHoverEffect?: boolean;
}

/**
 * Unified TableRow Component with iOS-Quality Motion
 *
 * Usage:
 * <TableRow onClick={() => handleClick()} animationDelay={index * 100}>
 *   <td className="px-6 py-4">Content 1</td>
 *   <td className="px-6 py-4">Content 2</td>
 * </TableRow>
 */
export function TableRow({
  children,
  onClick,
  animationDelay = 0,
  className = '',
  showHoverEffect = true
}: TableRowProps) {
  return (
    <motion.tr
      onClick={onClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationDelay / 1000, duration: 0.3 }}
      whileHover={showHoverEffect ? { 
        backgroundColor: 'var(--color-surface)',
        transition: { duration: 0.15 }
      } : undefined}
      className={`
        group
        border-b
        border-gray-100
        ${showHoverEffect ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.tr>
  );
}

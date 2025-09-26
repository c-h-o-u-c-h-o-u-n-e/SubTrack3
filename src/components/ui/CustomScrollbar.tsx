import React, { ReactNode } from 'react';

interface CustomScrollbarProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
}

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  children,
  className = '',
  maxHeight = 'auto'
}) => {
  return (
    <div
      className={`${className}`}
      style={{ maxHeight, overflowY: 'auto' }}
    >
      {children}
    </div>
  );
};
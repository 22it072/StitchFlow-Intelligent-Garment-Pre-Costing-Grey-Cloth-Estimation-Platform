import React from 'react';

const Card = ({ children, className = '', hover = false, padding = 'p-6' }) => {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100
        ${padding}
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
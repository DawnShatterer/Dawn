import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ variant = 'rect', width, height, circle, className = '' }) => {
  const style = {
    width: width || (circle ? height : '100%'),
    height: height || '1rem',
    borderRadius: circle ? '50%' : '8px'
  };

  return (
    <div 
      className={`skeleton ${className}`}
      style={style}
      aria-busy="true"
      aria-label="Loading content"
    />
  );
};

export default SkeletonLoader;

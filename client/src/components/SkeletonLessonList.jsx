import React from 'react';
import SkeletonLoader from './SkeletonLoader';

const SkeletonLessonList = ({ count = 5 }) => {
  return (
    <div className="list-group">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="list-group-item d-flex align-items-center gap-3 py-3"
          style={{ border: '1px solid rgba(128,128,128,0.1)' }}
        >
          {/* Lesson Number/Icon */}
          <SkeletonLoader circle height="40px" />
          
          {/* Lesson Content */}
          <div style={{ flex: 1 }}>
            <SkeletonLoader height="1rem" width="70%" className="mb-2" />
            <SkeletonLoader height="0.75rem" width="50%" />
          </div>
          
          {/* Status/Duration */}
          <div className="text-end">
            <SkeletonLoader height="0.875rem" width="60px" className="mb-1" />
            <SkeletonLoader height="0.75rem" width="40px" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLessonList;

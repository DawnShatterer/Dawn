import React from 'react';
import SkeletonLoader from './SkeletonLoader';

const SkeletonDashboardStats = ({ count = 4 }) => {
  return (
    <div className="sd-stat-row mb-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="sd-stat-pill">
          {/* Icon */}
          <SkeletonLoader circle height="36px" />
          
          {/* Label and Value */}
          <div style={{ flex: 1 }}>
            <SkeletonLoader height="0.7rem" width="80px" className="mb-2" />
            <SkeletonLoader height="1.3rem" width="50px" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonDashboardStats;

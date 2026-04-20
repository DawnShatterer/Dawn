import React from 'react';
import SkeletonLoader from './SkeletonLoader';

const SkeletonChartCard = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="ad-chart-card mb-4">
          {/* Chart Header */}
          <div className="ad-chart-header">
            <SkeletonLoader height="0.9rem" width="150px" />
            <SkeletonLoader height="1.5rem" width="80px" />
          </div>
          
          {/* Chart Area - Large Rectangle */}
          <SkeletonLoader height="250px" className="mb-3" />
          
          {/* Stats Row Below Chart */}
          <div className="d-flex gap-3 justify-content-around">
            <div className="text-center">
              <SkeletonLoader height="1.5rem" width="60px" className="mb-1" />
              <SkeletonLoader height="0.75rem" width="80px" />
            </div>
            <div className="text-center">
              <SkeletonLoader height="1.5rem" width="60px" className="mb-1" />
              <SkeletonLoader height="0.75rem" width="80px" />
            </div>
            <div className="text-center">
              <SkeletonLoader height="1.5rem" width="60px" className="mb-1" />
              <SkeletonLoader height="0.75rem" width="80px" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonChartCard;

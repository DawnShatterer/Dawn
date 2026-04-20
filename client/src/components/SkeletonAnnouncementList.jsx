import React from 'react';
import SkeletonLoader from './SkeletonLoader';

const SkeletonAnnouncementList = ({ count = 3 }) => {
  return (
    <div className="sd-sidebar-section">
      {/* Section Title */}
      <div className="sd-sidebar-title">
        <SkeletonLoader height="0.95rem" width="120px" />
      </div>
      
      {/* Announcement Items */}
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="sd-update-item">
          {/* Avatar */}
          <SkeletonLoader circle height="34px" />
          
          {/* Content */}
          <div style={{ flex: 1 }}>
            <SkeletonLoader height="0.8rem" width="140px" className="mb-1" />
            <SkeletonLoader height="0.72rem" width="100%" className="mb-1" />
            <SkeletonLoader height="0.72rem" width="80%" className="mb-1" />
            <SkeletonLoader height="0.65rem" width="60px" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonAnnouncementList;

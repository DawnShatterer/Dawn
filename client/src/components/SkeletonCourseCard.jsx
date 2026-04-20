import React from 'react';
import SkeletonLoader from './SkeletonLoader';

const SkeletonCourseCard = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="col-md-6 col-lg-4 mb-4">
          <div className="rc-card rc-card-static">
            {/* Course Image */}
            <SkeletonLoader height="180px" className="mb-3" />
            
            {/* Course Title */}
            <SkeletonLoader height="1.5rem" width="80%" className="mb-2" />
            
            {/* Course Description - 2 lines */}
            <SkeletonLoader height="0.875rem" width="100%" className="mb-1" />
            <SkeletonLoader height="0.875rem" width="90%" className="mb-3" />
            
            {/* Instructor Info */}
            <div className="d-flex align-items-center gap-2 mb-3">
              <SkeletonLoader circle height="32px" />
              <SkeletonLoader height="0.875rem" width="120px" />
            </div>
            
            {/* Footer - Price and Button */}
            <div className="d-flex justify-content-between align-items-center pt-3" style={{ borderTop: '1px solid rgba(128,128,128,0.1)' }}>
              <SkeletonLoader height="1.25rem" width="60px" />
              <SkeletonLoader height="2.25rem" width="100px" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonCourseCard;

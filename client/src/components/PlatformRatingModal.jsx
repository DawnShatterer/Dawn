import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Star } from 'lucide-react';

const PlatformRatingModal = ({ show, onSubmit, onSkip }) => {
    const [hoveredStar, setHoveredStar] = useState(0);
    const [selectedStar, setSelectedStar] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

    const handleSubmit = async () => {
        if (selectedStar === 0) {
            onSkip();
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit(selectedStar);
        } catch {
            onSkip();
        }
    };

    return (
        <Modal show={show} centered backdrop="static" keyboard={false} size="sm">
            <Modal.Body className="text-center p-4">
                <div className="mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '56px', height: '56px' }}>
                        <Star size={28} className="text-primary" />
                    </div>
                    <h5 className="fw-bold mb-1">Rate Your Experience</h5>
                    <p className="text-muted small mb-0">How would you rate the Dawn platform?</p>
                </div>

                <div className="d-flex justify-content-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            className="btn p-0 border-0 bg-transparent"
                            style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            onClick={() => setSelectedStar(star)}
                        >
                            <Star
                                size={36}
                                fill={(hoveredStar || selectedStar) >= star ? '#ffc107' : 'transparent'}
                                color={(hoveredStar || selectedStar) >= star ? '#ffc107' : '#dee2e6'}
                                style={{ transition: 'all 0.15s ease', transform: (hoveredStar || selectedStar) >= star ? 'scale(1.15)' : 'scale(1)' }}
                            />
                        </button>
                    ))}
                </div>
                <p className="text-muted small fw-medium mb-3" style={{ minHeight: '20px' }}>
                    {labels[hoveredStar || selectedStar] || 'Tap a star to rate'}
                </p>

                <div className="d-grid gap-2 mt-4">
                    <Button
                        variant={selectedStar > 0 ? "primary" : "light"}
                        className={`rounded-3 fw-bold py-2 ${selectedStar === 0 ? "text-muted" : ""}`}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : selectedStar > 0 ? 'Submit & Logout' : 'Skip & Logout'}
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default PlatformRatingModal;

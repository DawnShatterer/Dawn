import React from 'react';
import { Spinner } from 'react-bootstrap';

const GlobalSpinner = ({ message = "Loading..." }) => {
    return (
        <div className="d-flex flex-column justify-content-center align-items-center w-100" style={{ minHeight: '50vh' }}>
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 text-muted fw-bold">{message}</p>
        </div>
    );
};

export default GlobalSpinner;

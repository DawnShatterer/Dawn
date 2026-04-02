import React from 'react';
import { Pagination } from 'react-bootstrap';

const PaginationControls = ({ page, setPage, totalPages }) => {
    if (!totalPages || totalPages <= 1) return null;

    let items = [];
    // Logic to show up to 5 surrounding responsive page numbers
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);

    if (page <= 3) {
        endPage = Math.min(totalPages, 5);
    }
    if (page >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
    }

    // Previous Arrow
    items.push(
        <Pagination.Prev 
            key="prev" 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)} 
        />
    );

    // Always show First Page + Ellipsis if skipped
    if (startPage > 1) {
        items.push(<Pagination.Item key={1} onClick={() => setPage(1)}>{1}</Pagination.Item>);
        if (startPage > 2) items.push(<Pagination.Ellipsis key="ell-start" disabled />);
    }

    // Render numbered items
    for (let number = startPage; number <= endPage; number++) {
        items.push(
            <Pagination.Item 
                key={number} 
                active={number === page} 
                onClick={() => setPage(number)}
                className="fw-bold"
            >
                {number}
            </Pagination.Item>
        );
    }

    // Always show Last Page + Ellipsis if skipped
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) items.push(<Pagination.Ellipsis key="ell-end" disabled />);
        items.push(<Pagination.Item key={totalPages} onClick={() => setPage(totalPages)}>{totalPages}</Pagination.Item>);
    }

    // Next Arrow
    items.push(
        <Pagination.Next 
            key="next" 
            disabled={page === totalPages} 
            onClick={() => setPage(page + 1)} 
        />
    );

    return (
        <Pagination className="justify-content-center mt-4 mb-0">
            {items}
        </Pagination>
    );
};

export default PaginationControls;

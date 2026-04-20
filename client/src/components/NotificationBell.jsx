import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api/notificationService';
import { Dropdown, Badge, Spinner } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const { data: unreadData } = useQuery({
        queryKey: ['notifications-unread'],
        queryFn: getUnreadCount,
        refetchInterval: 30000 // Poll every 30s
    });

    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: getMyNotifications,
        enabled: isOpen // Only fetch when dropdown is open
    });

    const readMutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['notifications-unread']);
        }
    });

    const readAllMutation = useMutation({
        mutationFn: markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['notifications-unread']);
        }
    });

    const unreadCount = unreadData?.count || 0;

    return (
        <Dropdown show={isOpen} onToggle={(val) => setIsOpen(val)} align="end" drop="down">
            <style>{`
                .bell-toggle.dropdown-toggle::after {
                    display: none !important;
                }
            `}</style>
            <Dropdown.Toggle as="div" className="position-relative nav-link bell-toggle" style={{ cursor: 'pointer' }}>
                <div className="p-2 rounded-circle bg-body-tertiary d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-bell text-secondary" style={{ fontSize: '20px' }}></i>
                </div>
                {unreadCount > 0 && (
                    <Badge bg="danger" pill className="position-absolute top-0 start-50 translate-middle mt-1 shadow-sm" style={{ fontSize: '10px' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow border-0 p-0" style={{ width: '350px', maxHeight: '500px', overflowY: 'auto' }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center sticky-top bg-body z-2">
                    <h6 className="m-0 fw-bold">Notifications</h6>
                    {unreadCount > 0 && (
                        <button className="btn btn-link text-decoration-none p-0 small text-primary d-flex align-items-center" onClick={() => readAllMutation.mutate()}>
                            <i className="bi bi-check-all me-1" style={{ fontSize: '14px' }}></i> Mark all read
                        </button>
                    )}
                </div>

                {isLoading && (
                    <div className="p-4 text-center">
                        <Spinner animation="border" size="sm" variant="primary" />
                    </div>
                )}

                {!isLoading && notifications?.length === 0 && (
                    <div className="p-4 text-center text-muted">
                        <p className="mb-0">You're all caught up!</p>
                    </div>
                )}

                {!isLoading && notifications?.map(notif => (
                    <div 
                        key={notif.id} 
                        className={`p-3 border-bottom ${!notif.isRead ? 'bg-primary bg-opacity-10' : ''}`}
                        style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                    >
                        <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className={`mb-0 ${!notif.isRead ? 'fw-bold text-body' : 'text-muted'}`}>{notif.title}</h6>
                            {!notif.isRead && (
                                <button className="btn btn-link p-0 text-primary" onClick={(e) => { e.stopPropagation(); readMutation.mutate(notif.id); }} title="Mark as read">
                                    <i className="bi bi-check" style={{ fontSize: '16px' }}></i>
                                </button>
                            )}
                        </div>
                        <p className={`small mb-2 ${!notif.isRead ? 'text-body' : 'text-muted'}`}>{notif.message}</p>
                        <small className="text-secondary" style={{ fontSize: '11px' }}>{new Date(notif.createdAt).toLocaleString()}</small>
                    </div>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
};

export default NotificationBell;

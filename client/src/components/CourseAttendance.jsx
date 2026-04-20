import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Form, Button, Badge, Spinner, Card, Alert } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from '../api/axios';
import PaginationControls from './PaginationControls';

const CourseAttendance = ({ courseId }) => {
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [feedback, setFeedback] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 10;
    const statusRefs = useRef({});

    // Add courseId type validation to ensure it's a number
    const validCourseId = typeof courseId === 'number' ? courseId : parseInt(courseId);

    // Invalidate roster query cache when courseId changes
    useEffect(() => {
        // Invalidate all roster queries to ensure fresh data when courseId changes
        queryClient.invalidateQueries({ queryKey: ['attendance-roster'] });
        // Also invalidate attendance records for the new course
        queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
    }, [validCourseId, queryClient]);

    // Fetch enrolled students (roster) for this module
    const { data: roster, isLoading: rosterLoading } = useQuery({
        queryKey: ['attendance-roster', validCourseId],
        queryFn: async () => {
            const res = await api.get(`/Attendance/roster/${validCourseId}`);
            return res.data;
        },
        enabled: !!validCourseId && !isNaN(validCourseId)
    });

    // Fetch existing attendance for this module+date
    const { data: existingRecords, isLoading: recordsLoading } = useQuery({
        queryKey: ['attendance-records', validCourseId, selectedDate],
        queryFn: async () => {
            const res = await api.get(`/Attendance/module/${validCourseId}?date=${selectedDate}`);
            return res.data;
        },
        enabled: !!validCourseId && !isNaN(validCourseId) && !!selectedDate
    });

    // Build a map of studentId → status from existing records
    const existingMap = {};
    existingRecords?.forEach(r => {
        existingMap[r.studentId] = r.status;
    });

    const saveMutation = useMutation({
        mutationFn: async (entries) => {
            const res = await api.post('/Attendance/mark', {
                moduleId: validCourseId,
                date: selectedDate,
                entries
            });
            return res.data;
        },
        onSuccess: (data) => {
            setFeedback({ type: 'success', msg: data.message || 'Attendance saved.' });
            queryClient.invalidateQueries(['attendance-records', validCourseId, selectedDate]);
            // Invalidate grade roster to refresh when attendance is updated
            queryClient.invalidateQueries(['course-grades']);
        },
        onError: (err) => {
            setFeedback({ type: 'danger', msg: err.response?.data?.message || 'Failed to save attendance.' });
        }
    });

    const handleSaveAttendance = () => {
        if (!roster?.length) return;
        setFeedback(null);

        const entries = roster.map(s => ({
            studentId: s.studentId,
            status: statusRefs.current[s.studentId]?.value || 'Present'
        }));

        saveMutation.mutate(entries);
    };

    if (rosterLoading || recordsLoading) return <div className="text-center p-4"><Spinner role="progressbar" /></div>;

    if (!roster || roster.length === 0) {
        return (
            <Card className="border-0 shadow-sm rounded-4 p-4 text-center">
                <i className="bi bi-people text-body-secondary mb-2 mx-auto" style={{ fontSize: '32px' }}></i>
                <p className="text-body-secondary mb-0">No students enrolled in this module yet.</p>
            </Card>
        );
    }

    // Pagination logic
    const totalPages = Math.ceil(roster.length / studentsPerPage);
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    const paginatedRoster = roster.slice(startIndex, endIndex);

    return (
        <Card className="border-0 shadow-sm rounded-4">
            <Card.Header className="bg-body border-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 className="fw-bold mb-0 d-flex align-items-center text-body">
                    <i className="bi bi-people me-2 text-info" style={{ fontSize: '18px' }}></i> Attendance Register
                </h5>
                <div className="d-flex align-items-center gap-3">
                    <Form.Control 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="bg-body-secondary border text-body fw-medium"
                        style={{ fontSize: '0.85rem' }}
                    />
                    <Button 
                        variant="info" 
                        className="text-white fw-bold px-3 py-2 border-0 rounded-3 d-flex align-items-center" 
                        onClick={handleSaveAttendance} 
                        disabled={saveMutation.isPending}
                    >
                        {saveMutation.isPending ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-check-circle me-2" style={{ fontSize: '16px' }}></i>} 
                        Save Records
                    </Button>
                </div>
            </Card.Header>
            <Card.Body className="p-4">
                {feedback && <Alert variant={feedback.type} className="py-2 small" dismissible onClose={() => setFeedback(null)}>{feedback.msg}</Alert>}
                
                <Table responsive hover className="align-middle mb-0">
                    <thead className="bg-body-secondary">
                        <tr>
                            <th className="py-3 text-body-secondary small text-uppercase fw-semibold">Student</th>
                            <th className="py-3 text-body-secondary small text-uppercase fw-semibold w-25">Current Status</th>
                            <th className="py-3 text-body-secondary small text-uppercase fw-semibold">Set Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRoster.map(s => {
                            const currentStatus = existingMap[s.studentId] || null;
                            return (
                                <tr key={s.studentId} className="border-bottom">
                                    <td className="py-3">
                                        <h6 className="fw-bold mb-0 fs-6 text-body">{s.fullName}</h6>
                                        <span className="text-body-secondary small" style={{ fontFamily: 'monospace' }}>{s.email}</span>
                                    </td>
                                    <td className="py-3">
                                        {currentStatus === 'Present' && (
                                            <Badge bg="success" className="px-3 py-2 fw-normal rounded-pill d-inline-flex align-items-center">
                                                <i className="bi bi-check-circle me-1" style={{ fontSize: '12px' }}></i> Present
                                            </Badge>
                                        )}
                                        {currentStatus === 'Absent' && (
                                            <Badge bg="danger" className="px-3 py-2 fw-normal rounded-pill d-inline-flex align-items-center">
                                                <i className="bi bi-x-circle me-1" style={{ fontSize: '12px' }}></i> Absent
                                            </Badge>
                                        )}
                                        {currentStatus === 'Late' && (
                                            <Badge bg="warning" text="dark" className="px-3 py-2 fw-normal rounded-pill d-inline-flex align-items-center">
                                                <i className="bi bi-clock me-1" style={{ fontSize: '12px' }}></i> Late
                                            </Badge>
                                        )}
                                        {!currentStatus && (
                                            <span className="text-body-secondary fst-italic small">Not marked</span>
                                        )}
                                    </td>
                                    <td className="py-3">
                                        <Form.Select 
                                            className="w-auto fw-medium border bg-body text-body" 
                                            defaultValue={currentStatus || 'Present'}
                                            ref={el => statusRefs.current[s.studentId] = el}
                                        >
                                            <option value="Present">Present</option>
                                            <option value="Absent">Absent</option>
                                            <option value="Late">Late</option>
                                        </Form.Select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
                
                {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center px-4 pb-3">
                        <span className="text-muted small">
                            Showing {startIndex + 1}-{Math.min(endIndex, roster.length)} of {roster.length} students
                        </span>
                        <PaginationControls 
                            page={currentPage} 
                            setPage={setCurrentPage} 
                            totalPages={totalPages} 
                        />
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default CourseAttendance;

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Button, Badge, Spinner, Card, Alert } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { getCourseGradeRoster } from '../api/enrollmentService';
import PaginationControls from './PaginationControls';

/**
 * GradeRoster Component
 * 
 * Displays a comprehensive grade roster for a course, showing all enrolled students
 * with their assignment, quiz, and attendance scores. Calculates final scores using
 * the 60/30/10 formula (60% assignments, 30% quizzes, 10% attendance) and displays
 * corresponding letter grades.
 * 
 * Features:
 * - Real-time data fetching from backend API
 * - CSV export functionality for grade records
 * - Loading, empty, and error state handling
 * - Automatic grade calculation and letter grade mapping
 * 
 * @param {Object} props - Component props
 * @param {number} props.courseId - The ID of the course to display grades for
 * @returns {JSX.Element} The rendered grade roster component
 */
const GradeRoster = ({ courseId }) => {
    // Add courseId type validation to ensure it's a number
    const validCourseId = typeof courseId === 'number' ? courseId : parseInt(courseId);
    
    const { data: grades, isLoading, error } = useQuery({
        queryKey: ['course-grades', validCourseId],
        queryFn: ({ signal }) => getCourseGradeRoster(validCourseId, { signal }),
        staleTime: 30000,
        enabled: !!validCourseId && !isNaN(validCourseId)
    });

    const [exporting, setExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 10;

    const handleExport = () => {
        setExporting(true);
        
        try {
            // CSV Headers
            const headers = 'Name,Email,Assignments,Quizzes,Attendance,Final Score,Grade\n';
            
            // CSV Rows - map each student to a CSV row
            const rows = grades.map(s => {
                // Calculate final score using 60/30/10 formula:
                // - 60% weight for assignments
                // - 30% weight for quizzes
                // - 10% weight for attendance
                const finalScore = (s.assignments * 0.6) + (s.quizzes * 0.3) + (s.attendance * 0.1);
                
                // Map final score to letter grade
                let letterGrade = 'F';
                if (finalScore >= 90) letterGrade = 'A';
                else if (finalScore >= 80) letterGrade = 'B';
                else if (finalScore >= 70) letterGrade = 'C';
                else if (finalScore >= 60) letterGrade = 'D';
                
                // Escape commas in names/emails by wrapping in quotes
                const name = `"${s.name}"`;
                const email = `"${s.email}"`;
                
                return `${name},${email},${s.assignments}%,${s.quizzes}%,${s.attendance}%,${finalScore.toFixed(1)}%,${letterGrade}`;
            }).join('\n');
            
            // Combine headers and rows
            const csvContent = headers + rows;
            
            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `grade_roster_course_${validCourseId}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setExporting(false);
        } catch (error) {
            alert('Failed to export CSV. Please try again.');
            setExporting(false);
        }
    };

    if (isLoading) return <div className="text-center p-4"><Spinner /></div>;

    if (error) {
        return (
            <Alert variant="danger" className="d-flex align-items-center m-3">
                <i className="bi bi-exclamation-triangle me-2" style={{ fontSize: '20px' }}></i>
                <span>Failed to load grade roster. Please try again later.</span>
            </Alert>
        );
    }

    if (!grades || grades.length === 0) {
        return (
            <div className="text-center p-5 opacity-50">
                <i className="bi bi-people" style={{ fontSize: '48px' }}></i>
                <h5 className="fw-bold mt-3">No Students Enrolled</h5>
                <p className="text-muted">This course has no enrolled students yet.</p>
            </div>
        );
    }

    // Pagination logic
    const totalPages = Math.ceil(grades.length / studentsPerPage);
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    const paginatedGrades = grades.slice(startIndex, endIndex);

    return (
        <Card className="border-0 shadow-sm rounded-4">
            <Card.Header className="bg-white border-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 d-flex align-items-center">
                    <i className="bi bi-award me-2 text-warning" style={{ fontSize: '18px' }}></i> Final Grade Roster
                </h5>
                <Button variant="light" className="text-success border fw-bold px-3 py-2 border-0 rounded-3 d-flex align-items-center shadow-sm" onClick={handleExport} disabled={exporting}>
                    {exporting ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-cloud-download me-2" style={{ fontSize: '16px' }}></i>} 
                    Export CSV
                </Button>
            </Card.Header>
            <Card.Body className="p-0">
                <Table responsive hover className="align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            <th className="px-4 py-3 text-muted small text-uppercase">Student Target</th>
                            <th className="py-3 text-muted small text-uppercase">HW (60%)</th>
                            <th className="py-3 text-muted small text-uppercase">Quizzes (30%)</th>
                            <th className="py-3 text-muted small text-uppercase">Att. (10%)</th>
                            <th className="py-3 text-muted small text-uppercase">Final Score</th>
                            <th className="py-3 text-muted small text-uppercase px-4 text-center">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedGrades?.map(s => {
                            // Calculate final score using 60/30/10 formula:
                            // - 60% weight for assignments
                            // - 30% weight for quizzes
                            // - 10% weight for attendance
                            const finalScore = (s.assignments * 0.6) + (s.quizzes * 0.3) + (s.attendance * 0.1);
                            
                            // Map final score to letter grade and badge variant
                            let letterGrade = 'F';
                            let variant = 'danger';
                            if (finalScore >= 90) { letterGrade = 'A'; variant = 'success'; }
                            else if (finalScore >= 80) { letterGrade = 'B'; variant = 'primary'; }
                            else if (finalScore >= 70) { letterGrade = 'C'; variant = 'warning'; }
                            else if (finalScore >= 60) { letterGrade = 'D'; variant = 'secondary'; }

                            return (
                                <tr key={s.id}>
                                    <td className="px-4">
                                        <h6 className="fw-bold mb-0 fs-6">{s.name}</h6>
                                        <span className="text-muted small" style={{ fontFamily: 'monospace' }}>{s.email}</span>
                                    </td>
                                    <td className="fw-medium">{s.assignments}%</td>
                                    <td className="fw-medium">{s.quizzes}%</td>
                                    <td className="fw-medium">{s.attendance}%</td>
                                    <td className="fw-bold fs-6">{finalScore.toFixed(1)}%</td>
                                    <td className="px-4 text-center">
                                        <Badge bg={variant} className="px-3 py-2 fs-6 fw-bold rounded-3 w-100 shadow-sm">
                                            {letterGrade}
                                        </Badge>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
                
                {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center px-4 pb-3">
                        <span className="text-muted small">
                            Showing {startIndex + 1}-{Math.min(endIndex, grades.length)} of {grades.length} students
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

export default GradeRoster;

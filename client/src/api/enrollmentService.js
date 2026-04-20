import api from './axios';

/**
 * Enroll the current student in a course.
 * @param {number} courseId
 */
export const enrollInCourse = async (courseId) => {
    const response = await api.post('/Enrollments', { courseId });
    return response.data;
};

/**
 * Unenroll the current student from a course.
 * @param {number} courseId
 */
export const unenrollFromCourse = async (courseId) => {
    const response = await api.delete(`/Enrollments/${courseId}`);
    return response.data;
};

/**
 * Get all courses the current student is enrolled in.
 */
export const getMyEnrollments = async () => {
    const response = await api.get('/Enrollments/my');
    return response.data;
};

/**
 * Get all students enrolled in a specific course (teacher view).
 * @param {number} courseId
 */
export const getCourseStudents = async (courseId) => {
    const response = await api.get(`/Enrollments/course/${courseId}`);
    return response.data;
};

/**
 * Check if the current user is enrolled in a specific course.
 * @param {number} courseId
 */
export const checkEnrollment = async (courseId) => {
    const response = await api.get(`/Enrollments/check/${courseId}`);
    return response.data;
};

/**
 * Fetch transcript with timeout and retry logic.
 * @param {string} studentId - The student ID
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @param {number} retries - Number of retry attempts (default: 1)
 * @returns {Promise<Object>} Transcript data or null on failure
 */
const fetchTranscriptWithRetry = async (studentId, timeout = 10000, retries = 1) => {
    let lastError = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await api.get(`/Transcript/student/${studentId}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.data;
        } catch (err) {
            lastError = err;
            
            // Don't retry on abort (timeout) or if it's the last attempt
            if (err.name === 'AbortError' || err.name === 'CanceledError' || attempt === retries) {
                break;
            }
            
            // Wait briefly before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        }
    }
    
    return null;
};

/**
 * Get course grade roster with student enrollment and transcript data.
 * Fetches enrolled students and their grade information for a specific course.
 * 
 * @param {number} courseId - The ID of the course
 * @param {Object} options - Optional configuration
 * @param {AbortSignal} options.signal - Abort signal for request cancellation
 * @returns {Promise<Array>} Array of student grade data with format:
 *   { id, name, email, assignments, quizzes, attendance }
 */
export const getCourseGradeRoster = async (courseId, options = {}) => {
    try {
        const enrollmentsResponse = await api.get(`/Enrollments/course/${courseId}`, {
            signal: options.signal
        });
        const enrollments = enrollmentsResponse.data;

        if (!enrollments || enrollments.length === 0) {
            return [];
        }

        const transcriptPromises = enrollments.map(async enrollment => {
            try {
                const transcript = await fetchTranscriptWithRetry(enrollment.studentId);
                
                return {
                    studentId: enrollment.studentId,
                    studentName: enrollment.student.fullName,
                    studentEmail: enrollment.student.email,
                    transcript
                };
            } catch (err) {
                return {
                    studentId: enrollment.studentId,
                    studentName: enrollment.student.fullName,
                    studentEmail: enrollment.student.email,
                    transcript: null,
                    error: err
                };
            }
        });

        const transcripts = await Promise.all(transcriptPromises);

        const gradeRoster = transcripts.map(({ studentId, studentName, studentEmail, transcript }) => {
            if (!transcript || !transcript.modules) {
                return {
                    id: studentId,
                    name: studentName,
                    email: studentEmail,
                    assignments: 0,
                    quizzes: 0,
                    attendance: 0
                };
            }

            const moduleData = transcript.modules.find(m => m.moduleId === courseId);

            if (!moduleData) {
                return {
                    id: studentId,
                    name: studentName,
                    email: studentEmail,
                    assignments: 0,
                    quizzes: 0,
                    attendance: 0
                };
            }

            return {
                id: studentId,
                name: studentName,
                email: studentEmail,
                assignments: moduleData.assignmentAvg,
                quizzes: moduleData.quizAvg,
                attendance: moduleData.attendancePercent
            };
        });
        
        return gradeRoster;
    } catch (err) {
        throw err;
    }
};

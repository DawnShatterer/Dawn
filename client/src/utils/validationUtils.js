/**
 * Validation utilities for file uploads, URLs, and phone numbers
 * All validation functions return { valid: boolean, error: string }
 */

/**
 * Validates file size against a maximum size limit
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum allowed size in megabytes
 * @param {string} fileType - Type of file for error message (e.g., 'Video', 'PDF', 'PPT', 'Profile picture')
 * @returns {{ valid: boolean, error: string }} Validation result
 */
export const validateFileSize = (file, maxSizeMB, fileType) => {
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    const fileSizeMB = file.size / (1024 * 1024);
    
    if (fileSizeMB > maxSizeMB) {
        return {
            valid: false,
            error: `${fileType} must be under ${maxSizeMB}MB`
        };
    }

    return { valid: true, error: '' };
};

/**
 * Validates file type against allowed extensions
 * @param {File} file - The file to validate
 * @param {string[]} allowedExtensions - Array of allowed extensions (e.g., ['.mp4', '.mkv'])
 * @returns {{ valid: boolean, error: string }} Validation result
 */
export const validateFileType = (file, allowedExtensions) => {
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    const fileName = file.name.toLowerCase();
    const isValid = allowedExtensions.some(ext => fileName.endsWith(ext.toLowerCase()));

    if (!isValid) {
        const extensionList = allowedExtensions.join(', ');
        return {
            valid: false,
            error: `Please select a valid file (${extensionList})`
        };
    }

    return { valid: true, error: '' };
};

/**
 * Validates YouTube URL format
 * @param {string} url - The URL to validate
 * @returns {{ valid: boolean, error: string }} Validation result
 */
export const validateYouTubeUrl = (url) => {
    // Empty URL is valid (optional field)
    if (!url || url.trim() === '') {
        return { valid: true, error: '' };
    }

    const youtubePattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/i;
    
    if (!youtubePattern.test(url)) {
        return {
            valid: false,
            error: 'Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...)'
        };
    }

    return { valid: true, error: '' };
};

/**
 * Validates Google Drive URL format
 * @param {string} url - The URL to validate
 * @returns {{ valid: boolean, error: string }} Validation result
 */
export const validateGoogleDriveUrl = (url) => {
    // Empty URL is valid (optional field)
    if (!url || url.trim() === '') {
        return { valid: true, error: '' };
    }

    const googleDrivePattern = /^https?:\/\/drive\.google\.com/i;
    
    if (!googleDrivePattern.test(url)) {
        return {
            valid: false,
            error: 'Please enter a valid Google Drive URL (e.g., https://drive.google.com/file/d/...)'
        };
    }

    return { valid: true, error: '' };
};

/**
 * Validates meeting link URL format for video conferencing platforms
 * @param {string} url - The URL to validate
 * @returns {{ valid: boolean, error: string }} Validation result
 */
export const validateMeetingLink = (url) => {
    // Meeting link is required (non-empty)
    if (!url || url.trim() === '') {
        return {
            valid: false,
            error: 'Meeting link is required'
        };
    }

    // Basic URL format validation
    const urlPattern = /^https?:\/\/.+/i;
    
    if (!urlPattern.test(url)) {
        return {
            valid: false,
            error: 'Please enter a valid meeting link (Zoom, Google Meet, or other video conferencing URL)'
        };
    }

    // Check for common video conferencing domains
    const meetingDomains = [
        'zoom.us',
        'meet.google.com',
        'teams.microsoft.com',
        'webex.com',
        'gotomeeting.com',
        'whereby.com',
        'jitsi.org'
    ];

    const urlLower = url.toLowerCase();
    const hasValidDomain = meetingDomains.some(domain => urlLower.includes(domain));

    if (!hasValidDomain) {
        return {
            valid: false,
            error: 'Please enter a valid meeting link (Zoom, Google Meet, or other video conferencing URL)'
        };
    }

    return { valid: true, error: '' };
};

/**
 * Validates phone number format
 * @param {string} phone - The phone number to validate
 * @returns {{ valid: boolean, error: string }} Validation result
 */
export const validatePhoneNumber = (phone) => {
    // Empty phone is valid (optional field)
    if (!phone || phone.trim() === '') {
        return { valid: true, error: '' };
    }

    // Allow digits, +, -, spaces, and parentheses
    const phonePattern = /^[\d+\-\s()]+$/;
    
    if (!phonePattern.test(phone)) {
        return {
            valid: false,
            error: 'Phone number can only contain digits, +, -, spaces, and parentheses'
        };
    }

    return { valid: true, error: '' };
};

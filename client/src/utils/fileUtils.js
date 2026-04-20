/**
 * Constructs a full URL for static files served from the backend.
 * The backend stores relative paths like "/uploads/thumbnails/guid_file.jpg"
 * but these files are served from the ASP.NET server, not the Vite dev server.
 *
 * @param {string} relativePath - The relative URL stored in the database (e.g. "/uploads/thumbnails/abc.jpg")
 * @returns {string} The full URL pointing to the backend server, or empty string if no path.
 */
export const getFileUrl = (relativePath) => {
    if (!relativePath) return '';

    // If it's already a full URL (e.g., Google avatar or external link), return as-is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        return relativePath;
    }

    // Strip the /api suffix from the base URL to get the raw server origin
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5159';
    const serverBase = apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '');

    // Ensure relativePath starts with /
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

    return `${serverBase}${path}`;
};

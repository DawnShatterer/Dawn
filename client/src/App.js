import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, // Prevents unnecessary API calls when switching tabs
            retry: 1,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <div className="app-container">
                    {/* We will add a Navbar here later */}
                    <Routes>
                        {/* Placeholder Routes */}
                        <Route path="/" element={<h1 className="text-center mt-5">Welcome to Dawn LMS</h1>} />
                        <Route path="/login" element={<div>Login Page Placeholder</div>} />
                        <Route path="/dashboard" element={<div>Dashboard Placeholder</div>} />
                    </Routes>
                </div>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
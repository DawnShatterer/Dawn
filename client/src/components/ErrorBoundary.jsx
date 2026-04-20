import React from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null 
        };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    
    componentDidCatch(error, errorInfo) {
        if (import.meta.env.DEV) {
            console.error('Error:', error);
            console.error('Stack:', errorInfo.componentStack);
        }
        
        this.setState({
            error,
            errorInfo
        });
    }
    
    handleReset = () => {
        this.setState({ 
            hasError: false, 
            error: null, 
            errorInfo: null 
        });
    };
    
    render() {
        if (this.state.hasError) {
            const isDevelopment = import.meta.env.DEV;
            
            return (
                <Container 
                    className="d-flex align-items-center justify-content-center" 
                    style={{ minHeight: '100vh' }}
                >
                    <Card 
                        className="border-0 shadow-lg rounded-4 text-center p-5" 
                        style={{ maxWidth: '600px', width: '100%' }}
                    >
                        <div className="mb-4">
                            <div 
                                className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                                style={{ width: '80px', height: '80px' }}
                            >
                                <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '40px' }}></i>
                            </div>
                        </div>
                        
                        <h3 className="fw-bold text-danger mb-2">
                            Something went wrong
                        </h3>
                        
                        <p className="text-muted mb-4">
                            We encountered an unexpected error. Please try reloading the page.
                        </p>
                        
                        {isDevelopment && this.state.error && (
                            <Alert variant="danger" className="text-start mb-4">
                                <strong>Error:</strong> {this.state.error.toString()}
                                <details className="mt-2">
                                    <summary className="cursor-pointer">Stack trace</summary>
                                    <pre className="mt-2 small text-start" style={{ maxHeight: '200px', overflow: 'auto' }}>
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            </Alert>
                        )}
                        
                        <div className="d-flex gap-3 justify-content-center">
                            <Button 
                                variant="danger" 
                                className="px-4 py-2 fw-bold rounded-3 shadow-sm" 
                                onClick={this.handleReset}
                            >
                                <i className="bi bi-arrow-clockwise me-2" style={{ fontSize: '18px' }}></i> 
                                Try Again
                            </Button>
                            
                            <Button 
                                variant="outline-secondary" 
                                className="px-4 py-2 rounded-3" 
                                onClick={() => window.location.href = '/dashboard'}
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </Card>
                </Container>
            );
        }
        
        return this.props.children;
    }
}

export default ErrorBoundary;

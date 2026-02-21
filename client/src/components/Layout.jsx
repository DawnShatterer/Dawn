import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="d-flex">
            <Sidebar />
            <main className="flex-grow-1 p-4 bg-white" style={{ height: '100vh', overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
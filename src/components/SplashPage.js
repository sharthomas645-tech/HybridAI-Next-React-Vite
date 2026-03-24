import React, { useEffect } from 'react';

const SplashPage = () => {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.location.href = '/dashboard';
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'url(image1) no-repeat center center fixed',
            backgroundSize: 'cover'
        }}>
            <h1 style={{ color: 'white', fontSize: '3em' }}>Welcome to Hybrid AI</h1>
        </div>
    );
};

export default SplashPage;
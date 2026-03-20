import React from 'react';

const ServicesDebug: React.FC = () => {
  React.useEffect(() => {}, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
      <h1 style={{ color: 'red' }}>🔴 DEBUG: Services Page Loaded Successfully!</h1>
      <p>Current time: {new Date().toLocaleString()}</p>
      <p>Current URL: {window.location.href}</p>
      <p>Pathname: {window.location.pathname}</p>
      <button>Test Button</button>
    </div>
  );
};

export default ServicesDebug;

import React from 'react';

const TestServices: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Services Test Page</h1>
      <p>If you see this, the routing is working!</p>
      <p>Current URL: {window.location.pathname}</p>
    </div>
  );
};

export default TestServices;

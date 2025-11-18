import React from 'react';
import { Activity } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e5e5e5', padding: '15px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Activity size={24} color="#2563eb" />
          <h1 style={{ margin: '0 0 0 10px', fontSize: '20px', color: '#1a1a1a' }}>
            Team Performance Dashboard
          </h1>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
};

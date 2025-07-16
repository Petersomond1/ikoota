// ikootaclient/src/Test.jsx
import React from 'react';

const Test = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
          Test Component
        </h1>
      </div>
      
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h2 style={{ color: '#495057', margin: '0 0 10px 0' }}>Test Content 1</h2>
        <p>This is the first test section content.</p>
      </div>
      
      <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h2 style={{ color: '#495057', margin: '0 0 10px 0' }}>Test Content 2</h2>
        <p>This is the second test section content.</p>
      </div>
      
      <div style={{ background: '#dee2e6', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h2 style={{ color: '#495057', margin: '0 0 10px 0' }}>Test Content 3</h2>
        <p>This is the third test section content.</p>
      </div>
      
      <div style={{ background: '#ced4da', padding: '15px', borderRadius: '5px' }}>
        <h2 style={{ color: '#495057', margin: '0 0 10px 0' }}>Test Content 4</h2>
        <p>This is the fourth test section content.</p>
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', background: '#007bff', color: 'white', borderRadius: '5px', textAlign: 'center' }}>
        <h3 style={{ margin: '0' }}>Test Component is Working!</h3>
        <p style={{ margin: '10px 0 0 0' }}>If you can see this, the Test component has been loaded successfully.</p>
      </div>
    </div>
  );
};

export default Test;
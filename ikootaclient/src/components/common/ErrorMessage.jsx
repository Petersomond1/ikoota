// ikootaclient/src/components/common/ErrorMessage.jsx
import React from 'react';

const ErrorMessage = ({ message, onRetry, showRetry = false }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="text-red-800 text-sm">
      {message || 'An error occurred'}
    </div>
    {showRetry && onRetry && (
      <button 
        onClick={onRetry}
        className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
      >
        Try Again
      </button>
    )}
  </div>
);

export default ErrorMessage;
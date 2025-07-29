// // ikootaclient/src/components/utils/DebugWrapper.jsx
// // Temporary debugging component to identify the source of infinite loops

// import React, { useEffect, useRef } from 'react';

// const DebugWrapper = ({ children, name = 'Component' }) => {
//   const renderCount = useRef(0);
//   const lastRenderTime = useRef(Date.now());

//   useEffect(() => {
//     renderCount.current += 1;
//     const now = Date.now();
//     const timeSinceLastRender = now - lastRenderTime.current;
    
//     console.log(`🔍 ${name} rendered ${renderCount.current} times. Time since last render: ${timeSinceLastRender}ms`);
    
//     if (timeSinceLastRender < 100 && renderCount.current > 10) {
//       console.error(`🚨 INFINITE LOOP DETECTED in ${name}! Rendered ${renderCount.current} times in quick succession.`);
//       console.trace('Stack trace:');
//     }
    
//     lastRenderTime.current = now;
//   });

//   return children;
// };

// export default DebugWrapper;
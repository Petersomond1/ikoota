// ikootaclient/src/components/towncrier/Towncrier.jsx
import React, { useState, useEffect, useMemo } from "react";
import "./towncrier.css";
import RevTopics from "./RevTopics";
import RevTeaching from "./RevTeaching";
import { useFetchTeachings } from "../service/useFetchTeachings";

const Towncrier = () => {
  const { data: rawTeachings = [], isLoading, error, refetch } = useFetchTeachings();
  const [selectedTeaching, setSelectedTeaching] = useState(null);

  // Memoize enhanced teachings to prevent unnecessary recalculations
  const enhancedTeachings = useMemo(() => {
    try {
      // Ensure teachings is an array
      const teachingsArray = Array.isArray(rawTeachings) ? rawTeachings : 
                            (rawTeachings?.data && Array.isArray(rawTeachings.data)) ? rawTeachings.data : [];

      if (teachingsArray.length === 0) return [];

      const enhanced = teachingsArray.map(teaching => ({
        ...teaching,
        content_type: 'teaching',
        content_title: teaching.topic || teaching.title || 'Untitled Teaching',
        prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
        display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
        author: teaching.author || teaching.user_id || teaching.created_by || 'Admin'
      }));
      
      // Sort by most recent first
      enhanced.sort((a, b) => {
        const aDate = new Date(a.display_date);
        const bDate = new Date(b.display_date);
        return bDate - aDate;
      });
      
      return enhanced;
    } catch (error) {
      console.error('Error processing teachings data:', error);
      return [];
    }
  }, [rawTeachings]); // Only depends on rawTeachings

  // Set initial selection when teachings first load - separate effect
  useEffect(() => {
    if (enhancedTeachings.length > 0 && !selectedTeaching) {
      setSelectedTeaching(enhancedTeachings[0]);
    }
  }, [enhancedTeachings.length]); // Only depends on the length, not the array itself

  // Clear selection when no teachings available
  useEffect(() => {
    if (enhancedTeachings.length === 0) {
      setSelectedTeaching(null);
    }
  }, [enhancedTeachings.length]);

  const handleSelectTeaching = (teaching) => {
    try {
      // Ensure the selected teaching has enhanced structure
      const enhancedTeaching = {
        ...teaching,
        content_type: 'teaching',
        content_title: teaching.topic || teaching.title || 'Untitled Teaching',
        prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
        display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
        author: teaching.author || teaching.user_id || teaching.created_by || 'Admin'
      };
      
      setSelectedTeaching(enhancedTeaching);
    } catch (error) {
      console.error('Error selecting teaching:', error);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="towncrier_container">
        <div className="nav">
          <span>Towncrier - Public Educational Content</span>
          <div className="nav-status">
            <span className="status-badge loading">Loading...</span>
          </div>
        </div>
        <div className="towncrier_viewport">
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading educational content...</p>
          </div>
        </div>
        <div className="footnote">Ikoota Educational Platform</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="towncrier_container">
        <div className="nav">
          <span>Towncrier - Public Educational Content</span>
          <div className="nav-status">
            <span className="status-badge error">Error</span>
          </div>
        </div>
        <div className="towncrier_viewport">
          <div className="error-message">
            <h3>Unable to Load Content</h3>
            <p style={{color: 'red'}}>Error: {error.message || 'Failed to fetch teachings'}</p>
            <button onClick={handleRefresh} className="retry-btn">
              🔄 Try Again
            </button>
          </div>
        </div>
        <div className="footnote">Ikoota Educational Platform</div>
      </div>
    );
  }

  return (
    <div className="towncrier_container">
      <div className="nav">
        <span>Towncrier - Public Educational Content</span>
        <div className="nav-stats">
          <span className="content-count">
            📚 {enhancedTeachings.length} Educational Resources
          </span>
          <button onClick={handleRefresh} className="refresh-btn" title="Refresh content">
            🔄 Refresh
          </button>
        </div>
      </div>
      
      <div className="towncrier_viewport">
        <RevTopics 
          teachings={enhancedTeachings} 
          onSelect={handleSelectTeaching}
          selectedTeaching={selectedTeaching}
        />
                
        <RevTeaching 
          teaching={selectedTeaching} 
          allTeachings={enhancedTeachings}
          onSelectNext={handleSelectTeaching}
        />
      </div>
      
      <div className="footnote">
        <span>Ikoota Educational Platform - Public Content</span>
        {selectedTeaching && (
          <span> | Viewing: {selectedTeaching.prefixed_id}</span>
        )}
        <span> | Last updated: {new Date().toLocaleString()}</span>
      </div>
    </div>
  );
};

export default Towncrier;



// // ikootaclient/src/components/towncrier/Towncrier.jsx
// import React, { useState, useEffect, useRef } from "react";
// import "./towncrier.css";
// import RevTopics from "./RevTopics";
// import RevTeaching from "./RevTeaching";
// import { useFetchTeachings } from "../service/useFetchTeachings";

// const Towncrier = () => {
//   const { data: teachings = [], isLoading, error, refetch } = useFetchTeachings();
//   const [selectedTeaching, setSelectedTeaching] = useState(null);
//   const [enhancedTeachings, setEnhancedTeachings] = useState([]);
  
//   // Use ref to track if we've set initial selection
//   const hasSetInitialSelection = useRef(false);

//   // Process teachings data when it changes
//   useEffect(() => {
//     try {
//       // Ensure teachings is an array
//       const teachingsArray = Array.isArray(teachings) ? teachings : 
//                             (teachings?.data && Array.isArray(teachings.data)) ? teachings.data : [];

//       if (teachingsArray.length > 0) {
//         const enhanced = teachingsArray.map(teaching => ({
//           ...teaching,
//           content_type: 'teaching',
//           content_title: teaching.topic || teaching.title || 'Untitled Teaching',
//           prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
//           display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
//           // Ensure author field exists
//           author: teaching.author || teaching.user_id || teaching.created_by || 'Admin'
//         }));
        
//         // Sort by most recent first
//         enhanced.sort((a, b) => {
//           const aDate = new Date(a.display_date);
//           const bDate = new Date(b.display_date);
//           return bDate - aDate;
//         });
        
//         setEnhancedTeachings(enhanced);
        
//         // Set initial selection only once when data first loads
//         if (!hasSetInitialSelection.current && enhanced.length > 0) {
//           setSelectedTeaching(enhanced[0]);
//           hasSetInitialSelection.current = true;
//         }
//       } else {
//         setEnhancedTeachings([]);
//         setSelectedTeaching(null);
//         hasSetInitialSelection.current = false;
//       }
//     } catch (error) {
//       console.error('Error processing teachings data:', error);
//       console.log('Raw teachings data:', teachings);
//       setEnhancedTeachings([]);
//       setSelectedTeaching(null);
//       hasSetInitialSelection.current = false;
//     }
//   }, [teachings]); // Only depend on teachings, not selectedTeaching

//   // Reset initial selection flag when teachings change
//   useEffect(() => {
//     hasSetInitialSelection.current = false;
//   }, [teachings]);

//   const handleSelectTeaching = (teaching) => {
//     try {
//       // Ensure the selected teaching has enhanced structure
//       const enhancedTeaching = {
//         ...teaching,
//         content_type: 'teaching',
//         content_title: teaching.topic || teaching.title || 'Untitled Teaching',
//         prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
//         display_date: teaching.updatedAt || teaching.createdAt || new Date().toISOString(),
//         author: teaching.author || teaching.user_id || teaching.created_by || 'Admin'
//       };
      
//       setSelectedTeaching(enhancedTeaching);
//     } catch (error) {
//       console.error('Error selecting teaching:', error);
//     }
//   };

//   const handleRefresh = () => {
//     hasSetInitialSelection.current = false;
//     refetch();
//   };

//   if (isLoading) {
//     return (
//       <div className="towncrier_container">
//         <div className="nav">
//           <span>Towncrier - Public Educational Content</span>
//           <div className="nav-status">
//             <span className="status-badge loading">Loading...</span>
//           </div>
//         </div>
//         <div className="towncrier_viewport">
//           <div className="loading-message">
//             <div className="loading-spinner"></div>
//             <p>Loading educational content...</p>
//           </div>
//         </div>
//         <div className="footnote">Ikoota Educational Platform</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="towncrier_container">
//         <div className="nav">
//           <span>Towncrier - Public Educational Content</span>
//           <div className="nav-status">
//             <span className="status-badge error">Error</span>
//           </div>
//         </div>
//         <div className="towncrier_viewport">
//           <div className="error-message">
//             <h3>Unable to Load Content</h3>
//             <p style={{color: 'red'}}>Error: {error.message || 'Failed to fetch teachings'}</p>
//             <button onClick={handleRefresh} className="retry-btn">
//               🔄 Try Again
//             </button>
//             <div className="error-details">
//               <details>
//                 <summary>Technical Details</summary>
//                 <pre>{JSON.stringify(error, null, 2)}</pre>
//               </details>
//             </div>
//           </div>
//         </div>
//         <div className="footnote">Ikoota Educational Platform</div>
//       </div>
//     );
//   }

//   return (
//     <div className="towncrier_container">
//       <div className="nav">
//         <span>Towncrier - Public Educational Content</span>
//         <div className="nav-stats">
//           <span className="content-count">
//             📚 {enhancedTeachings.length} Educational Resources
//           </span>
//           <button onClick={handleRefresh} className="refresh-btn" title="Refresh content">
//             🔄 Refresh
//           </button>
//         </div>
//       </div>
      
//       <div className="towncrier_viewport">
//         {/* Left side: Topics List */}
//         <RevTopics 
//           teachings={enhancedTeachings} 
//           onSelect={handleSelectTeaching}
//           selectedTeaching={selectedTeaching}
//         />
                
//         {/* Right side: Selected Teaching Details */}
//         <RevTeaching 
//           teaching={selectedTeaching} 
//           allTeachings={enhancedTeachings}
//           onSelectNext={(nextTeaching) => handleSelectTeaching(nextTeaching)}
//         />
//       </div>
      
//       <div className="footnote">
//         <span>Ikoota Educational Platform - Public Content</span>
//         {selectedTeaching && (
//           <span> | Viewing: {selectedTeaching.prefixed_id}</span>
//         )}
//         <span> | Last updated: {new Date().toLocaleString()}</span>
//       </div>
//     </div>
//   );
// };

// export default Towncrier;


// import React, { useState, useEffect } from "react";
// import "./towncrier.css";
// import RevTopics from "./RevTopics";
// import RevTeaching from "./RevTeaching";
// import { useFetchTeachings } from "../service/useFetchTeachings";

// const Towncrier = () => {
//   const { data: teachings = [], isLoading, error, refetch } = useFetchTeachings();
//   const [selectedTeaching, setSelectedTeaching] = useState(null);
//   const [enhancedTeachings, setEnhancedTeachings] = useState([]);

//   // Enhance teachings data with consistent structure
//   useEffect(() => {
//     if (teachings.length > 0) {
//       const enhanced = teachings.map(teaching => ({
//         ...teaching,
//         content_type: 'teaching',
//         content_title: teaching.topic || 'Untitled Teaching',
//         prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
//         display_date: teaching.updatedAt || teaching.createdAt,
//         // Ensure author field exists
//         author: teaching.user_id || teaching.author || 'Admin'
//       }));
      
//       // Sort by most recent first
//       enhanced.sort((a, b) => {
//         const aDate = new Date(a.display_date);
//         const bDate = new Date(b.display_date);
//         return bDate - aDate;
//       });
      
//       setEnhancedTeachings(enhanced);
      
//       // Set the latest teaching as the default selection if none selected
//       if (!selectedTeaching && enhanced.length > 0) {
//         setSelectedTeaching(enhanced[0]);
//       }
//     }
//   }, [teachings, selectedTeaching]);

//   const handleSelectTeaching = (teaching) => {
//     try {
//       // Ensure the selected teaching has enhanced structure
//       const enhancedTeaching = {
//         ...teaching,
//         content_type: 'teaching',
//         content_title: teaching.topic || 'Untitled Teaching',
//         prefixed_id: teaching.prefixed_id || `t${teaching.id}`,
//         display_date: teaching.updatedAt || teaching.createdAt,
//         author: teaching.user_id || teaching.author || 'Admin'
//       };
      
//       setSelectedTeaching(enhancedTeaching);
//     } catch (error) {
//       console.error('Error selecting teaching:', error);
//     }
//   };

//   const handleRefresh = () => {
//     refetch();
//   };

//   if (isLoading) {
//     return (
//       <div className="towncrier_container">
//         <div className="nav">Navbar: Towncrier</div>
//         <div className="towncrier_viewport">
//           <div className="loading-message">
//             <p>Loading teachings...</p>
//           </div>
//         </div>
//         <div className="footnote">Footnote</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="towncrier_container">
//         <div className="nav">Navbar: Towncrier</div>
//         <div className="towncrier_viewport">
//           <div className="error-message">
//             <p style={{color: 'red'}}>Error fetching teachings: {error.message}</p>
//             <button onClick={handleRefresh}>Retry</button>
//           </div>
//         </div>
//         <div className="footnote">Footnote</div>
//       </div>
//     );
//   }

//   return (
//     <div className="towncrier_container">
//       <div className="nav">
//         <span>Navbar: Towncrier</span>
//         <div className="nav-stats">
//           <span>Total Teachings: {enhancedTeachings.length}</span>
//           <button onClick={handleRefresh} className="refresh-btn">
//             Refresh
//           </button>
//         </div>
//       </div>
      
//       <div className="towncrier_viewport">
//         {/* Left side: Topics List */}
//         <RevTopics 
//           teachings={enhancedTeachings} 
//           onSelect={handleSelectTeaching}
//           selectedTeaching={selectedTeaching}
//         />
                
//         {/* Right side: Selected Teaching Details */}
//         <RevTeaching 
//           teaching={selectedTeaching} 
//           allTeachings={enhancedTeachings}
//           onSelectNext={(nextTeaching) => handleSelectTeaching(nextTeaching)}
//         />
//       </div>
      
//       <div className="footnote">
//         <span>Footnote - Last updated: {new Date().toLocaleString()}</span>
//         {selectedTeaching && (
//           <span> | Selected: {selectedTeaching.prefixed_id}</span>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Towncrier;
import React, { useState, useEffect } from "react";
import "./towncrier.css";
import RevTopics from "./RevTopics";
import RevTeaching from "./RevTeaching";
import { useFetchTeachings } from "../service/useFetchTeachings";

const Towncrier = () => {
  const { data: teachings = [], isLoading, error } = useFetchTeachings();
  const [selectedTeaching, setSelectedTeaching] = useState(null);

  // Set the latest teaching as the default selection
  useEffect(() => {
    if (teachings.length > 0) {
      setSelectedTeaching(teachings[0]);
    }
  }, [teachings]);

  const handleSelectTeaching = (teaching) => {
    setSelectedTeaching(teaching);
  };

  if (isLoading) return <p>Loading teachings...</p>;
  if (error) return <p>Error fetching teachings: {error.message}</p>;

  return (
    <div className="towncrier_container">
      <div className="nav">Navbar: Towncrier</div>
      <div className="towncrier_viewport">
        {/* Left side: Topics List */}
        <RevTopics teachings={teachings} onSelect={handleSelectTeaching} />
        
        {/* Right side: Selected Teaching Details */}
        <RevTeaching teaching={selectedTeaching} />
      </div>
      <div className="footnote">Footnote</div>
    </div>
  );
};

export default Towncrier;

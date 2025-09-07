import { useState } from 'react';
import './searchcontrols.css';

const SearchControls = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="search-controls">
      <form onSubmit={handleSearch}>
        <div className="search-input-container">
          <input
            style={{
              backgroundColor: 'transparent',
              border: '2px solid white',
              color: 'white',
              flex: 1,
              fontSize: '14px',
              borderRadius: '14px',
            }}
            id='search'
            name='search'
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="search-button-container">
          <span className="search-icon">🔍</span>
          <button type="submit">Search</button>
        </div>
      </form>
    </div>
  );
};

export default SearchControls;
import React, { useState } from 'react';
import './admin.css';
import EmojiPicker from 'emoji-picker-react';

const Admin = () => {
  const [selectedItem, setSelectedItem] = useState('Towncrier');
  const [openEmoji, setOpenEmoji] = useState(false);
  const [text, setText] = useState('');
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    message: '',
    audience: '',
    subjectMatter: '',
  });

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpenEmoji(false);
  };

  return (
    <div className='admin_container'>
      <div className="navbar">
        <div className="logo">
          <img src="./palmTree.png" alt="" />
          <p>IKOOTA</p>
        </div>
        <div className="nav_page_heading">The Clarion Call Admin Page</div>
        <div className="nav_items">
          <div className="nav_item">Home</div>
          <div className="nav_item">About</div>
          <div className="nav_item">Contact</div>
        </div>
      </div>
      <div className="admin_viewport">
        <div className="admin_sidebar">
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('Towncrier')}><p>Towncrier</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('Iko')}><p>Iko</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('Auth')}><p>Auth</p></div>
          <div className="admin_sidebar_item" onClick={() => setSelectedItem('Search')}><p>Search</p></div>
        </div>

        <div className="admin_controls_body">
          {selectedItem === 'Towncrier' && (
            <section className='towncrier_controls_body'>
              <div className="admin_controls_header">Towncrier Controls</div>
                <div className='towncrier_input_div'>
               
                <div className="icons">
                  <img src="./img.png" alt="Upload" />
                  <img src="./camera.png" alt="Camera" />
                  <img src="./mic.png" alt="Mic" />
                </div>

                {step === 0 && (
                    <input
                      type="text"
                      placeholder="Enter Topic"
                      value={formData.topic}
                      onChange={(e) => handleInputChange('topic', e.target.value)}
                    />
                )}
                {step === 1 && (
                    <input
                      type="text"
                      placeholder="Enter Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                )}
                {step === 2 && (
                    <select
                      value={formData.audience}
                      onChange={(e) => handleInputChange('audience', e.target.value)}
                    >
                      <option value="">Select Audience</option>
                      <option value="General">General</option>
                      <option value="Students">Students</option>
                      <option value="Professionals">Professionals</option>
                    </select>
                )}
                {step === 3 && (
                    <select
                      value={formData.subjectMatter}
                      onChange={(e) => handleInputChange('subjectMatter', e.target.value)}
                    >
                      <option value="">Select Subject Matter</option>
                      <option value="Eden">Eden</option>
                      <option value="Math">Math</option>
                      <option value="Science">Science</option>
                    </select>
                )}
                {step === 4 && (
                    <textarea
                      placeholder="Enter Main Message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                    />
                )}

                <div className="input-buttons">
                  {step > 0 && <button onClick={handlePrevStep}>Back</button>}
                  {step < 4 && <button onClick={handleNextStep}>Next</button>}
                </div>

                <div className="emoji">
                  <img
                    src="./emoji.png"
                    alt="Emoji"
                    onClick={() => setOpenEmoji(!openEmoji)}
                  />
                  <div className="picker">
                    {openEmoji && <EmojiPicker onEmojiClick={handleEmoji} />}
                  </div>
                </div>
                <button className="SendButton" onClick={() => console.log(formData)}>
                  Send
                </button>
              </div>
            </section>
          )}

          {selectedItem === 'Iko' && (
            <section className='iko_controls_body'>
              <div className="admin_controls_header">Iko Controls</div>
              <div>
                <p>iko1</p>
                <span>Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia quas tempore eius amet libero corporis, doloremque commodi, sed labore facilis quisquam dolor! Asperiores optio sit, laudantium tempore quos facere quas.</span>
              </div>
              <div>iko2</div>
              <div>iko3</div>
              <div>iko4</div>
              <div>iko5</div>
              <div>iko6</div>
            </section>
          )}

          {selectedItem === 'Auth' && (
            <section className='Auth_controls_body'>
              <div className="admin_controls_header">Auth Controls</div>
              <div>
                <p>Auth1</p>
                <span>Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia quas tempore eius amet libero corporis, doloremque commodi, sed labore facilis quisquam dolor! Asperiores optio sit, laudantium tempore quos facere quas.</span>
              </div>
              <div>Auth2</div>
              <div>Auth3</div>
              <div>Auth4</div>
              <div>Auth5</div>
              <div>Auth6</div>
            </section>
          )}

          {selectedItem === 'Search' && (
            <section className="search_controls_body">
              <div className="admin_controls_header">Search Controls</div>
              <div>
                <p>Search1</p>
                <span>Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia quas tempore eius amet libero corporis, doloremque commodi, sed labore facilis quisquam dolor! Asperiores optio sit, laudantium tempore quos facere quas.</span>
              </div>
              <div>Search2</div>
              <div>Search3</div>
              <div>Search4</div>
              <div>Search5</div>
              <div>Search6</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
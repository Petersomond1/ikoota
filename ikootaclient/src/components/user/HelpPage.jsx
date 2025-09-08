import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../auth/UserStatus';
import './HelpPage.css';

const HelpPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const helpSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      content: {
        overview: 'Welcome to IKoota! This comprehensive guide will help you navigate our platform and make the most of your learning experience.',
        topics: [
          {
            title: 'Account Setup',
            content: `
              <h4>Setting Up Your Profile</h4>
              <ul>
                <li>Complete your profile information in the Profile section</li>
                <li>Add your education background and interests</li>
                <li>Upload a profile picture (optional)</li>
                <li>Set your communication preferences</li>
              </ul>
              
              <h4>Understanding Membership Levels</h4>
              <ul>
                <li><strong>Applicant:</strong> Initial stage after registration</li>
                <li><strong>Pre-Member:</strong> Approved for basic access</li>
                <li><strong>Full Member:</strong> Complete access to all features</li>
              </ul>
            `
          },
          {
            title: 'Dashboard Navigation',
            content: `
              <h4>Main Dashboard Features</h4>
              <ul>
                <li><strong>Overview:</strong> Quick stats and recent activity</li>
                <li><strong>Profile:</strong> Manage your personal information</li>
                <li><strong>Analytics:</strong> Track your learning progress</li>
                <li><strong>Quick Actions:</strong> Access key features instantly</li>
              </ul>
              
              <h4>Navigation Tips</h4>
              <ul>
                <li>Use the notification bell to stay updated</li>
                <li>Access your classes through the My Classes section</li>
                <li>Check your mentorship assignments regularly</li>
              </ul>
            `
          }
        ]
      }
    },
    {
      id: 'classes',
      title: 'Classes & Learning',
      icon: '📚',
      content: {
        overview: 'Learn how to join classes, track progress, and engage with educational content effectively.',
        topics: [
          {
            title: 'Joining Classes',
            content: `
              <h4>How to Join a Class</h4>
              <ul>
                <li>Browse available classes from the Classes menu</li>
                <li>Click on a class to view its preview and details</li>
                <li>Click "Enter Classroom" to join the live session</li>
                <li>Participate in discussions and activities</li>
              </ul>
              
              <h4>Class Types</h4>
              <ul>
                <li><strong>Live Classes:</strong> Interactive sessions with instructors</li>
                <li><strong>Self-Paced:</strong> Study at your own rhythm</li>
                <li><strong>Group Projects:</strong> Collaborative learning experiences</li>
              </ul>
            `
          },
          {
            title: 'Progress Tracking',
            content: `
              <h4>Monitoring Your Progress</h4>
              <ul>
                <li>View completion percentage for each class</li>
                <li>Track assignments and their due dates</li>
                <li>Review feedback from instructors</li>
                <li>Access certificates upon completion</li>
              </ul>
            `
          }
        ]
      }
    },
    {
      id: 'mentorship',
      title: 'Mentorship System',
      icon: '🤝',
      content: {
        overview: 'Understand how our mentorship system works to enhance your learning experience.',
        topics: [
          {
            title: 'Finding a Mentor',
            content: `
              <h4>Mentor Assignment Process</h4>
              <ul>
                <li>Mentors are assigned based on your interests and goals</li>
                <li>You'll receive a notification when assigned</li>
                <li>View your mentor's profile and contact information</li>
                <li>Schedule regular check-ins and meetings</li>
              </ul>
              
              <h4>Working with Your Mentor</h4>
              <ul>
                <li>Complete assignments given by your mentor</li>
                <li>Ask questions and seek guidance</li>
                <li>Provide feedback on your learning experience</li>
                <li>Respect scheduled meeting times</li>
              </ul>
            `
          },
          {
            title: 'Becoming a Mentor',
            content: `
              <h4>Mentor Requirements</h4>
              <ul>
                <li>Full membership status required</li>
                <li>Demonstrate expertise in specific areas</li>
                <li>Complete mentor training program</li>
                <li>Maintain good standing in community</li>
              </ul>
            `
          }
        ]
      }
    },
    {
      id: 'communication',
      title: 'Communication & Community',
      icon: '💬',
      content: {
        overview: 'Learn how to communicate effectively and engage with the IKoota community.',
        topics: [
          {
            title: 'Towncrier System',
            content: `
              <h4>Community Discussion Platform</h4>
              <ul>
                <li>Share ideas and participate in discussions</li>
                <li>Follow community guidelines and etiquette</li>
                <li>Engage respectfully with other members</li>
                <li>Report inappropriate content when necessary</li>
              </ul>
            `
          },
          {
            title: 'IKO Chat System',
            content: `
              <h4>Real-time Communication</h4>
              <ul>
                <li>Connect with classmates and mentors</li>
                <li>Join study groups and discussions</li>
                <li>Share resources and collaborate</li>
                <li>Maintain professional communication standards</li>
              </ul>
            `
          }
        ]
      }
    },
    {
      id: 'account',
      title: 'Account Management',
      icon: '⚙️',
      content: {
        overview: 'Manage your account settings, privacy preferences, and security options.',
        topics: [
          {
            title: 'Privacy & Security',
            content: `
              <h4>Protecting Your Account</h4>
              <ul>
                <li>Use a strong, unique password</li>
                <li>Update your password regularly</li>
                <li>Review your privacy settings</li>
                <li>Control who can see your profile information</li>
              </ul>
              
              <h4>Data Management</h4>
              <ul>
                <li>Export your data when needed</li>
                <li>Delete your account if necessary</li>
                <li>Manage notification preferences</li>
              </ul>
            `
          },
          {
            title: 'Notification Settings',
            content: `
              <h4>Customizing Notifications</h4>
              <ul>
                <li>Choose which events trigger notifications</li>
                <li>Set notification delivery preferences</li>
                <li>Manage email notification frequency</li>
                <li>Configure mobile app notifications</li>
              </ul>
            `
          }
        ]
      }
    }
  ];

  const faqData = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking the "Forgot Password" link on the login page. Follow the instructions sent to your email address.'
    },
    {
      question: 'How long does membership approval take?',
      answer: 'Membership approval typically takes 3-5 business days. You will receive an email notification once your status changes.'
    },
    {
      question: 'Can I change my username?',
      answer: 'Usernames cannot be changed after account creation. Please contact support if you have special circumstances.'
    },
    {
      question: 'How do I join a class?',
      answer: 'Navigate to the Classes section, browse available classes, and click "Enter Classroom" on the class you want to join.'
    },
    {
      question: 'What if I miss a live class session?',
      answer: 'Live classes are typically recorded. You can access the recording from your My Classes section within 24 hours of the session.'
    },
    {
      question: 'How do I contact my mentor?',
      answer: 'You can contact your mentor through the messaging system in the Mentorship section of your dashboard.'
    },
    {
      question: 'Can I switch mentors?',
      answer: 'Mentor switches are possible under certain circumstances. Please contact support to discuss your situation.'
    },
    {
      question: 'How do I report inappropriate behavior?',
      answer: 'Use the report button next to any inappropriate content or contact support directly with details about the incident.'
    }
  ];

  const filteredFaq = faqData.filter(
    item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getCurrentSection = () => {
    return helpSections.find(section => section.id === activeSection);
  };

  return (
    <div className="help-page-container">
      <div className="help-page-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/dashboard')}
          aria-label="Back to Dashboard"
        >
          ← Back to Dashboard
        </button>
        <h1>Help Center</h1>
        <div className="help-search">
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      <div className="help-page-content">
        <div className="help-sidebar">
          <h3>Help Topics</h3>
          <ul className="help-sections">
            {helpSections.map(section => (
              <li key={section.id}>
                <button
                  className={`section-btn ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="section-icon">{section.icon}</span>
                  {section.title}
                </button>
              </li>
            ))}
          </ul>

          <div className="help-contact">
            <h4>Need More Help?</h4>
            <p>Can't find what you're looking for?</p>
            <button className="contact-support-btn">
              Contact Support
            </button>
          </div>
        </div>

        <div className="help-main-content">
          {searchTerm ? (
            <div className="search-results">
              <h2>Search Results</h2>
              {filteredFaq.length > 0 ? (
                <div className="faq-results">
                  {filteredFaq.map((item, index) => (
                    <div key={index} className="faq-item">
                      <h4>{item.question}</h4>
                      <p>{item.answer}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-results">No results found for "{searchTerm}". Try different keywords or browse topics below.</p>
              )}
            </div>
          ) : (
            <div className="help-section-content">
              <div className="section-header">
                <span className="section-icon-large">{getCurrentSection()?.icon}</span>
                <h2>{getCurrentSection()?.title}</h2>
              </div>
              
              <div className="section-overview">
                <p>{getCurrentSection()?.content.overview}</p>
              </div>

              <div className="section-topics">
                {getCurrentSection()?.content.topics.map((topic, index) => (
                  <div key={index} className="topic-card">
                    <h3>{topic.title}</h3>
                    <div 
                      className="topic-content"
                      dangerouslySetInnerHTML={{ __html: topic.content }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!searchTerm && (
            <div className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {faqData.map((item, index) => (
                  <div key={index} className="faq-item">
                    <button
                      className={`faq-question ${expandedFaq === index ? 'expanded' : ''}`}
                      onClick={() => toggleFaq(index)}
                    >
                      {item.question}
                      <span className="faq-toggle">{expandedFaq === index ? '−' : '+'}</span>
                    </button>
                    {expandedFaq === index && (
                      <div className="faq-answer">
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
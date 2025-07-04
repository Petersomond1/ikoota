// ikootaclient/src/components/auth/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useUser } from './UserStatus';
import './LandingPage.css';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, getDefaultRoute } = useUser();

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultRoute());
    }
  }, [isAuthenticated, navigate, getDefaultRoute]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      id: 1,
      title: "Interactive Teaching",
      description: "Create engaging lessons with multimedia content including videos, images, and audio.",
      icon: "🎓",
      color: "#3498db"
    },
    {
      id: 2,
      title: "Real-time Chat",
      description: "Connect with students and colleagues through our integrated chat system.",
      icon: "💬",
      color: "#e74c3c"
    },
    {
      id: 3,
      title: "Content Management",
      description: "Organize and manage your teaching materials with our smart content system.",
      icon: "📚",
      color: "#2ecc71"
    },
    {
      id: 4,
      title: "Community Learning",
      description: "Join a community of educators sharing knowledge and best practices.",
      icon: "🌟",
      color: "#f39c12"
    }
  ];

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleJoinCommunity = () => {
    navigate('/signup');
  };

  const handleViewPublicContent = () => {
    // This could navigate to a public version of towncrier or a preview
    navigate('/towncrier');
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-brand">
            <h2>Ikoota</h2>
            <span className="brand-tagline">Teaching System</span>
          </div>
          
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#membership" className="nav-link">Membership</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>
          
          <div className="nav-actions">
            <button onClick={handleLogin} className="btn-secondary">
              Sign In
            </button>
            <button onClick={handleGetStarted} className="btn-primary">
              Join Community
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Join the Future of
              <span className="gradient-text"> Educational Community</span>
            </h1>
            <p className="hero-description">
              Ikoota is an exclusive educational platform where approved members 
              collaborate, share knowledge, and build the future of learning together. 
              Apply for membership to join our growing community of educators.
            </p>
            
            <div className="hero-actions">
              <button onClick={handleJoinCommunity} className="btn-hero-primary">
                Apply for Membership
                <span className="btn-icon">→</span>
              </button>
              <button onClick={handleViewPublicContent} className="btn-hero-secondary">
                <span className="play-icon">👁</span>
                View Public Content
              </button>
            </div>
            
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">1,000+</span>
                <span className="stat-label">Active Members</span>
              </div>
              <div className="stat">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Students Impacted</span>
              </div>
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Collaborative Projects</span>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="preview-title">Ikoota Member Dashboard</span>
              </div>
              <div className="preview-content">
                <div className="preview-sidebar">
                  <div className="sidebar-item active">💬 Community Chat</div>
                  <div className="sidebar-item">📚 Shared Resources</div>
                  <div className="sidebar-item">👥 Member Directory</div>
                  <div className="sidebar-item">📊 Collaboration Tools</div>
                </div>
                <div className="preview-main">
                  <div className="content-card">
                    <div className="card-header">
                      <span className="content-type">Discussion</span>
                      <span className="content-id">d{Math.floor(Math.random() * 100)}</span>
                    </div>
                    <h4>Advanced Teaching Methodologies</h4>
                    <p>Collaborative discussion with verified educators...</p>
                  </div>
                  <div className="content-card">
                    <div className="card-header">
                      <span className="content-type resource">Resource</span>
                      <span className="content-id">r{Math.floor(Math.random() * 100)}</span>
                    </div>
                    <h4>Exclusive Educational Materials</h4>
                    <p>Member-only content and resources...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section id="membership" className="membership">
        <div className="container">
          <div className="section-header">
            <h2>Exclusive Membership Community</h2>
            <p>Join a curated community of verified educators and educational professionals</p>
          </div>
          
          <div className="membership-tiers">
            <div className="tier-card">
              <h3>🌟 Public Access</h3>
              <p>View our public content and community announcements</p>
              <ul>
                <li>Access to Towncrier public feed</li>
                <li>View community announcements</li>
                <li>See public educational content</li>
              </ul>
              <button onClick={handleViewPublicContent} className="btn-tier">
                View Public Content
              </button>
            </div>
            
            <div className="tier-card featured">
              <h3>🎓 Member Access</h3>
              <p>Full access to our exclusive educational community</p>
              <ul>
                <li>Join internal Iko chat system</li>
                <li>Access exclusive resources</li>
                <li>Collaborate with verified educators</li>
                <li>Create and share content</li>
                <li>Participate in member discussions</li>
              </ul>
              <button onClick={handleJoinCommunity} className="btn-tier primary">
                Apply for Membership
              </button>
            </div>
            
            <div className="tier-card">
              <h3>⚡ Admin Access</h3>
              <p>Leadership and management privileges</p>
              <ul>
                <li>All member privileges</li>
                <li>Community management tools</li>
                <li>User approval system</li>
                <li>Analytics and reporting</li>
              </ul>
              <button disabled className="btn-tier">
                By Invitation Only
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features for Educational Collaboration</h2>
            <p>Everything you need to connect, create, and collaborate with fellow educators</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={feature.id}
                className={`feature-card ${activeFeature === index ? 'active' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
                style={{'--feature-color': feature.color}}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>Built for Educators, by Educators</h2>
              <p>
                Ikoota is a curated community platform designed specifically for 
                educational professionals. Our membership-based approach ensures 
                high-quality discussions, verified expertise, and meaningful 
                collaborative opportunities.
              </p>
              
              <div className="about-highlights">
                <div className="highlight">
                  <div className="highlight-icon">🔐</div>
                  <div>
                    <h4>Verified Members Only</h4>
                    <p>All members go through an application and verification process</p>
                  </div>
                </div>
                <div className="highlight">
                  <div className="highlight-icon">🚀</div>
                  <div>
                    <h4>Quality Discussions</h4>
                    <p>Curated community ensures meaningful educational conversations</p>
                  </div>
                </div>
                <div className="highlight">
                  <div className="highlight-icon">🔒</div>
                  <div>
                    <h4>Secure & Private</h4>
                    <p>Member data and discussions are protected with enterprise-grade security</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="about-visual">
              <div className="testimonial-card">
                <div className="testimonial-content">
                  <p>"Being part of Ikoota's exclusive community has elevated my teaching practice. The quality of discussions and resources is unmatched."</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">👩‍🏫</div>
                  <div>
                    <h5>Dr. Sarah Johnson</h5>
                    <span>Verified Member - Mathematics Education</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Join Our Educational Community?</h2>
            <p>Apply for membership and become part of an exclusive network of verified educators.</p>
            
            <div className="cta-actions">
              <button onClick={handleJoinCommunity} className="btn-cta-primary">
                Apply for Membership
              </button>
              <Link to="/login" className="btn-cta-secondary">
                Already a member? Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Ikoota</h3>
              <p>Exclusive community for educational professionals.</p>
              <div className="social-links">
                <a href="#" aria-label="Facebook">📘</a>
                <a href="#" aria-label="Twitter">🐦</a>
                <a href="#" aria-label="LinkedIn">💼</a>
                <a href="#" aria-label="YouTube">📺</a>
              </div>
            </div>
            
            <div className="footer-section">
              <h4>Community</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#membership">Membership</a></li>
                <li><a href="#about">About</a></li>
                <li><Link to="/signup">Apply Now</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Application Process</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Contact</h4>
              <ul>
                <li>📧 membership@ikoota.com</li>
                <li>📞 +1 (555) 123-4567</li>
                <li>📍 123 Education St, Learning City</li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 Ikoota. All rights reserved.</p>
            <div className="footer-links">
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Membership Agreement</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;



// // ikootaclient/src/components/auth/LandingPage.jsx
// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { jwtDecode } from 'jwt-decode';
// import './LandingPage.css';

// const LandingPage = () => {
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [activeFeature, setActiveFeature] = useState(0);
//   const navigate = useNavigate();

//   // Check if user is already logged in
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         // If token is valid, redirect to main app
//         navigate('/iko');
//       } catch (error) {
//         // Token is invalid, stay on landing page
//         localStorage.removeItem("token");
//       }
//     }
//   }, [navigate]);

//   // Handle scroll effect for navbar
//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 50);
//     };

//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   // Auto-rotate features
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setActiveFeature((prev) => (prev + 1) % 4);
//     }, 4000);

//     return () => clearInterval(interval);
//   }, []);

//   const features = [
//     {
//       id: 1,
//       title: "Interactive Teaching",
//       description: "Create engaging lessons with multimedia content including videos, images, and audio.",
//       icon: "🎓",
//       color: "#3498db"
//     },
//     {
//       id: 2,
//       title: "Real-time Chat",
//       description: "Connect with students and colleagues through our integrated chat system.",
//       icon: "💬",
//       color: "#e74c3c"
//     },
//     {
//       id: 3,
//       title: "Content Management",
//       description: "Organize and manage your teaching materials with our smart content system.",
//       icon: "📚",
//       color: "#2ecc71"
//     },
//     {
//       id: 4,
//       title: "Community Learning",
//       description: "Join a community of educators sharing knowledge and best practices.",
//       icon: "🌟",
//       color: "#f39c12"
//     }
//   ];

//   const handleGetStarted = () => {
//     navigate('/signup');
//   };

//   const handleLogin = () => {
//     navigate('/login');
//   };

//   return (
//     <div className="landing-page">
//       {/* Navigation */}
//       <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
//         <div className="nav-container">
//           <div className="nav-brand">
//             <h2>Ikoota</h2>
//             <span className="brand-tagline">Teaching System</span>
//           </div>
          
//           <div className="nav-links">
//             <a href="#features" className="nav-link">Features</a>
//             <a href="#about" className="nav-link">About</a>
//             <a href="#contact" className="nav-link">Contact</a>
//           </div>
          
//           <div className="nav-actions">
//             <button onClick={handleLogin} className="btn-secondary">
//               Sign In
//             </button>
//             <button onClick={handleGetStarted} className="btn-primary">
//               Get Started
//             </button>
//           </div>
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <section className="hero">
//         <div className="hero-background">
//           <div className="hero-shapes">
//             <div className="shape shape-1"></div>
//             <div className="shape shape-2"></div>
//             <div className="shape shape-3"></div>
//           </div>
//         </div>
        
//         <div className="hero-content">
//           <div className="hero-text">
//             <h1 className="hero-title">
//               Transform Your
//               <span className="gradient-text"> Teaching Experience</span>
//             </h1>
//             <p className="hero-description">
//               Ikoota is a comprehensive teaching platform that combines interactive 
//               content creation, real-time communication, and community learning 
//               to revolutionize education.
//             </p>
            
//             <div className="hero-actions">
//               <button onClick={handleGetStarted} className="btn-hero-primary">
//                 Start Teaching Today
//                 <span className="btn-icon">→</span>
//               </button>
//               <button className="btn-hero-secondary">
//                 <span className="play-icon">▶</span>
//                 Watch Demo
//               </button>
//             </div>
            
//             <div className="hero-stats">
//               <div className="stat">
//                 <span className="stat-number">1,000+</span>
//                 <span className="stat-label">Active Teachers</span>
//               </div>
//               <div className="stat">
//                 <span className="stat-number">50K+</span>
//                 <span className="stat-label">Students Reached</span>
//               </div>
//               <div className="stat">
//                 <span className="stat-number">10K+</span>
//                 <span className="stat-label">Lessons Created</span>
//               </div>
//             </div>
//           </div>
          
//           <div className="hero-visual">
//             <div className="dashboard-preview">
//               <div className="preview-header">
//                 <div className="preview-dots">
//                   <span></span>
//                   <span></span>
//                   <span></span>
//                 </div>
//                 <span className="preview-title">Ikoota Dashboard</span>
//               </div>
//               <div className="preview-content">
//                 <div className="preview-sidebar">
//                   <div className="sidebar-item active">📚 My Teachings</div>
//                   <div className="sidebar-item">💬 Chats</div>
//                   <div className="sidebar-item">👥 Community</div>
//                   <div className="sidebar-item">📊 Analytics</div>
//                 </div>
//                 <div className="preview-main">
//                   <div className="content-card">
//                     <div className="card-header">
//                       <span className="content-type">Teaching</span>
//                       <span className="content-id">t{Math.floor(Math.random() * 100)}</span>
//                     </div>
//                     <h4>Introduction to Mathematics</h4>
//                     <p>Interactive lesson with multimedia content...</p>
//                   </div>
//                   <div className="content-card">
//                     <div className="card-header">
//                       <span className="content-type chat">Chat</span>
//                       <span className="content-id">c{Math.floor(Math.random() * 100)}</span>
//                     </div>
//                     <h4>Student Discussion Forum</h4>
//                     <p>Active conversation with 12 participants...</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section id="features" className="features">
//         <div className="container">
//           <div className="section-header">
//             <h2>Powerful Features for Modern Teaching</h2>
//             <p>Everything you need to create, share, and manage educational content</p>
//           </div>
          
//           <div className="features-grid">
//             {features.map((feature, index) => (
//               <div 
//                 key={feature.id}
//                 className={`feature-card ${activeFeature === index ? 'active' : ''}`}
//                 onMouseEnter={() => setActiveFeature(index)}
//                 style={{'--feature-color': feature.color}}
//               >
//                 <div className="feature-icon">{feature.icon}</div>
//                 <h3>{feature.title}</h3>
//                 <p>{feature.description}</p>
//                 <div className="feature-arrow">→</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* About Section */}
//       <section id="about" className="about">
//         <div className="container">
//           <div className="about-content">
//             <div className="about-text">
//               <h2>Built for Educators, by Educators</h2>
//               <p>
//                 Ikoota was created with a deep understanding of the challenges 
//                 modern educators face. Our platform combines cutting-edge technology 
//                 with pedagogical best practices to create an environment where 
//                 teaching and learning thrive.
//               </p>
              
//               <div className="about-highlights">
//                 <div className="highlight">
//                   <div className="highlight-icon">🚀</div>
//                   <div>
//                     <h4>Easy to Use</h4>
//                     <p>Intuitive interface designed for educators of all tech levels</p>
//                   </div>
//                 </div>
//                 <div className="highlight">
//                   <div className="highlight-icon">🔒</div>
//                   <div>
//                     <h4>Secure & Private</h4>
//                     <p>Your content and student data are protected with enterprise-grade security</p>
//                   </div>
//                 </div>
//                 <div className="highlight">
//                   <div className="highlight-icon">📱</div>
//                   <div>
//                     <h4>Mobile Ready</h4>
//                     <p>Access your teaching materials from any device, anywhere</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
            
//             <div className="about-visual">
//               <div className="testimonial-card">
//                 <div className="testimonial-content">
//                   <p>"Ikoota has transformed how I connect with my students. The integrated chat and content system makes teaching more engaging than ever."</p>
//                 </div>
//                 <div className="testimonial-author">
//                   <div className="author-avatar">👩‍🏫</div>
//                   <div>
//                     <h5>Sarah Johnson</h5>
//                     <span>High School Mathematics Teacher</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="cta">
//         <div className="container">
//           <div className="cta-content">
//             <h2>Ready to Transform Your Teaching?</h2>
//             <p>Join thousands of educators who are already using Ikoota to create amazing learning experiences.</p>
            
//             <div className="cta-actions">
//               <button onClick={handleGetStarted} className="btn-cta-primary">
//                 Start Your Free Account
//               </button>
//               <Link to="/login" className="btn-cta-secondary">
//                 Already have an account? Sign in
//               </Link>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer id="contact" className="footer">
//         <div className="container">
//           <div className="footer-content">
//             <div className="footer-section">
//               <h3>Ikoota</h3>
//               <p>Empowering educators with modern teaching tools.</p>
//               <div className="social-links">
//                 <a href="#" aria-label="Facebook">📘</a>
//                 <a href="#" aria-label="Twitter">🐦</a>
//                 <a href="#" aria-label="LinkedIn">💼</a>
//                 <a href="#" aria-label="YouTube">📺</a>
//               </div>
//             </div>
            
//             <div className="footer-section">
//               <h4>Platform</h4>
//               <ul>
//                 <li><a href="#features">Features</a></li>
//                 <li><a href="#about">About</a></li>
//                 <li><Link to="/signup">Sign Up</Link></li>
//                 <li><Link to="/login">Sign In</Link></li>
//               </ul>
//             </div>
            
//             <div className="footer-section">
//               <h4>Support</h4>
//               <ul>
//                 <li><a href="#">Help Center</a></li>
//                 <li><a href="#">Documentation</a></li>
//                 <li><a href="#">Contact Us</a></li>
//                 <li><a href="#">Privacy Policy</a></li>
//               </ul>
//             </div>
            
//             <div className="footer-section">
//               <h4>Contact</h4>
//               <ul>
//                 <li>📧 support@ikoota.com</li>
//                 <li>📞 +1 (555) 123-4567</li>
//                 <li>📍 123 Education St, Learning City</li>
//               </ul>
//             </div>
//           </div>
          
//           <div className="footer-bottom">
//             <p>&copy; 2025 Ikoota. All rights reserved.</p>
//             <div className="footer-links">
//               <a href="#">Terms of Service</a>
//               <a href="#">Privacy Policy</a>
//               <a href="#">Cookie Policy</a>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default LandingPage;

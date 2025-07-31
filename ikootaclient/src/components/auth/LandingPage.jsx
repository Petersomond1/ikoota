// ikootaclient/src/components/auth/LandingPage.jsx - FIXED WITH DASHBOARD REDIRECT & PRESERVED FUNCTIONALITY
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useUser } from './UserStatus';
import { getUserAccess, getDashboardRoute } from '../config/accessMatrix'; // ✅ ADDED: getDashboardRoute import
import './LandingPage.css';

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, loading, user, logout, getUserStatus } = useUser();

  // ✅ Get user status and access properly
  const userStatus = getUserStatus();
  const userAccess = user ? getUserAccess(user) : null;

  console.log('🔍 LandingPage - User Status:', userStatus);
  console.log('🔍 LandingPage - User Access:', userAccess);
  console.log('🔍 LandingPage - User Data:', user);

  // ✅ FIXED: Dashboard redirect handler using new function
  const handleDashboardRedirect = () => {
    const dashboardRoute = getDashboardRoute(user);
    console.log('🎯 Dashboard redirect to:', dashboardRoute);
    navigate(dashboardRoute); // Will always be '/dashboard' for authenticated users
  };

  // ✅ FIXED: Safer redirect logic with proper error handling
  useEffect(() => {
    // Don't redirect while still loading user data
    if (loading) return;
    
    try {
      // ✅ IMPORTANT: Allow pending users to freely access the landing page
      // Only redirect users who have full access to other areas
      if (isAuthenticated && !loading && user) {
        // ✅ Only redirect users who are NOT pending verification
        // Pending users should be able to browse the landing page freely
        if (userStatus === 'admin' || userStatus === 'full_member') {
          const defaultRoute = userAccess?.defaultRoute;
          if (defaultRoute && defaultRoute !== '/') {
            console.log('🔄 Active user on landing page, redirecting to:', defaultRoute);
            // Don't auto-redirect from landing page - let user choose
            // navigate(defaultRoute);
            // return;
          }
        }
        // ✅ Applicants and pending users can stay on landing page
        console.log('✅ Pending/applicant user can access landing page freely');
      }
    } catch (error) {
      console.error('Error in landing page redirect logic:', error);
      // Don't redirect on error - let user stay on landing page
    }
  }, [isAuthenticated, loading, navigate, userAccess, user, userStatus]);

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
    // ✅ FIXED: For public content viewing, we can navigate to towncrier
    // but we should handle this more gracefully for non-authenticated users
    try {
      navigate('/towncrier');
    } catch (error) {
      console.log('Error navigating to public content:', error);
      // Fallback - could show a modal or scroll to features section
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ✅ NEW: Handle logout functionality
  const handleLogout = async () => {
    try {
      console.log('🔓 Logging out user...');
      await logout(); // Call the logout function from UserStatus
      alert('You have been logged out successfully. Others can now use this system to sign up or log in.');
      // The page will automatically update to show login/signup buttons
    } catch (error) {
      console.error('Logout error:', error);
      alert('Logout completed. You can now use the system for other accounts.');
    }
  };

  // ✅ PRESERVED: Navigate to user's appropriate area (but using dashboard for dashboard buttons)
  const navigateToUserArea = () => {
    try {
      // ✅ FIXED: Use getDashboardRoute for dashboard buttons instead of defaultRoute
      const dashboardRoute = getDashboardRoute(user);
      console.log('🎯 Navigating to user dashboard:', dashboardRoute);
      navigate(dashboardRoute);
    } catch (error) {
      console.error('Navigation error:', error);
      navigate('/dashboard');
    }
  };

  // ✅ Show loading state while determining user authentication status
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px', color: '#666' }}>Loading...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
            {/* ✅ ENHANCED: Show different buttons based on authentication status */}
            {isAuthenticated && user ? (
              <div className="authenticated-actions">
                <button 
                  onClick={handleDashboardRedirect} // ✅ FIXED: Use dashboard redirect handler
                  className="btn-primary"
                >
                  Go to Dashboard
                </button>
                {/* ✅ NEW: Logout button for authenticated users */}
                <button 
                  onClick={handleLogout} 
                  className="btn-logout"
                  title="Logout to allow others to use this system"
                >
                  🔓 Logout
                </button>
              </div>
            ) : (
              <>
                <button onClick={handleLogin} className="btn-secondary">
                  Sign In
                </button>
                <button onClick={handleGetStarted} className="btn-primary">
                  Join Community
                </button>
              </>
            )}
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
              {/* ✅ ENHANCED: Conditional rendering with logout option */}
              {isAuthenticated && user ? (
                <div className="authenticated-hero-actions">
                  <button 
                    onClick={handleDashboardRedirect} // ✅ FIXED: Use dashboard redirect handler
                    className="btn-hero-primary"
                  >
                    Go to Your Dashboard
                    <span className="btn-icon">→</span>
                  </button>
                  {/* ✅ NEW: Logout option in hero section */}
                  <button onClick={handleLogout} className="btn-hero-logout">
                    <span className="logout-icon">🔓</span>
                    Allow Others to Sign Up
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={handleJoinCommunity} className="btn-hero-primary">
                    Apply for Membership
                    <span className="btn-icon">→</span>
                  </button>
                  <button onClick={handleViewPublicContent} className="btn-hero-secondary">
                    <span className="play-icon">👁</span>
                    View Public Content
                  </button>
                </>
              )}
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
            {/* ✅ PUBLIC ACCESS TIER */}
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
            
            {/* ✅ MEMBER ACCESS TIER - ENHANCED WITH CONDITIONAL BUTTONS */}
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
              
              {/* ✅ FIXED: Show appropriate buttons based on user status */}
              <div className="tier-buttons">
                {isAuthenticated && user ? (
                  <>
                    {/* ✅ FIXED: Dashboard button using new handler */}
                    <button 
                      onClick={handleDashboardRedirect} // ✅ FIXED: Use dashboard redirect handler
                      className="btn-tier primary"
                    >
                      User Dashboard
                    </button>
                    
                    {/* ✅ IKO CHAT BUTTON - Show for full members and admins */}
                    {(userStatus === 'full_member' || userStatus === 'admin') && (
                      <button 
                        onClick={() => navigate('/iko')} 
                        className="btn-tier iko-btn"
                        style={{ marginTop: '10px', backgroundColor: '#e74c3c' }}
                      >
                        💬 Access Iko Chat
                      </button>
                    )}
                  </>
                ) : (
                  <button onClick={handleJoinCommunity} className="btn-tier primary">
                    Apply for Membership
                  </button>
                )}
              </div>
            </div>
            
            {/* ✅ ADMIN ACCESS TIER - ENHANCED WITH WORKING BUTTON */}
            <div className="tier-card">
              <h3>⚡ Admin Access</h3>
              <p>Leadership and management privileges</p>
              <ul>
                <li>All member privileges</li>
                <li>Community management tools</li>
                <li>User approval system</li>
                <li>Analytics and reporting</li>
              </ul>
              
              {/* ✅ FIXED: Show working admin button for admin users */}
              {isAuthenticated && user && userStatus === 'admin' ? (
                <button 
                  onClick={() => navigate('/admin')} 
                  className="btn-tier admin-btn"
                  style={{ backgroundColor: '#f39c12', color: 'white' }}
                >
                  🔧 Access Admin Panel
                </button>
              ) : (
                <button disabled className="btn-tier">
                  By Invitation Only
                </button>
              )}
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
            <p>
              {isAuthenticated && user
                ? "Welcome back! Access your dashboard to continue your educational journey."
                : "Apply for membership and become part of an exclusive network of verified educators."
              }
            </p>
            
            <div className="cta-actions">
              {isAuthenticated && user ? (
                <div className="authenticated-cta-actions">
                  <button 
                    onClick={handleDashboardRedirect} // ✅ FIXED: Use dashboard redirect handler
                    className="btn-cta-primary"
                  >
                    Go to Dashboard
                  </button>
                  {/* ✅ NEW: Logout option in CTA section */}
                  <button onClick={handleLogout} className="btn-cta-logout">
                    🔓 Logout & Allow Others to Join
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={handleJoinCommunity} className="btn-cta-primary">
                    Apply for Membership
                  </button>
                  <Link to="/login" className="btn-cta-secondary">
                    Already a member? Sign in
                  </Link>
                </>
              )}
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
                <li>
                  {/* ✅ ENHANCED: Footer Apply Now with logout option if authenticated */}
                  {isAuthenticated && user ? (
                    <div className="footer-auth-actions">
                      <Link to="/signup">Apply Now (Others)</Link>
                      <button onClick={handleLogout} className="footer-logout-btn">
                        🔓 Logout First
                      </button>
                    </div>
                  ) : (
                    <Link to="/signup">Apply Now</Link>
                  )}
                </li>
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


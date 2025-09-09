//ikootaclient\src\components\auth\RoleProtectedRoute.jsx
const RoleProtectedRoute = ({ children, requiredRole, requiredMembership }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        // Get user data from token or API
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Decode token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Check role access
        if (requiredRole && payload.role !== requiredRole) {
          console.error('❌ Insufficient role permissions');
          navigate('/unauthorized');
          return;
        }

        // Check membership access
        if (requiredMembership && payload.membership_stage !== requiredMembership) {
          console.error('❌ Insufficient membership permissions');
          navigate('/application-survey');
          return;
        }

        setUser(payload);
      } catch (error) {
        console.error('❌ Access check failed:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUserAccess();
  }, [requiredRole, requiredMembership]);

  if (loading) return <div>Checking permissions...</div>;
  if (!user) return null;

  return children;
};

export default RoleProtectedRoute;

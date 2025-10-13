import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const getPageTitle = (pathname) => {
      const pathMap = {
        '/': '',
        '/login': 'Login',
        '/create-account': 'Create Account',
        '/dashboard': 'Home',
        '/dashboard/dashMyConnections': 'Sparks',
        '/dashboard/dashDateCalendar': 'Shop',
        '/dashboard/dashMyCoupons': 'My Coupons',
        '/dashboard/DashMyProfile': 'My Profile',
        '/dashboard/dashSettings': 'Settings',
        '/dashboard/dashChangePassword': 'Change Password',
        '/dashboard/dashDeleteAccount': 'Delete Account',
        '/dashboard/dashDeactivateAccount': 'Deactivate Account',
        '/dashboard/myMatches': 'My Matches',
        '/dashboard/seeAllMatches': 'All Matches',
        '/dashboard/dashPaymentHistory': 'Payment History',
        '/admin-dashboard': 'Admin Dashboard',
        '/admin-dashboard/analytics': 'Admin Analytics',
        '/admin-dashboard/events': 'Admin Events',
        '/admin-dashboard/users': 'Admin Users',
        '/admin-dashboard/businesses': 'Admin Businesses',
        '/admin-dashboard/coupons': 'Admin Coupons',
        '/enterprise-dash': 'Business Dashboard',
        '/enterprise-dash/analytics': 'Business Analytics',
        '/enterprise-dash/coupons': 'Business Coupons',
        '/enterprise-dash/profile': 'Business Profile',
        '/enterprise-dash/settings': 'Business Settings',
        '/contact': 'Contact',
        '/faq': 'FAQ',
        '/pricing': 'Pricing',
        '/how-it-works': 'How It Works',
        '/map': 'Map',
        '/preferencePage': 'Preferences',
        '/personality-quiz': 'Personality Quiz',
        '/verify-email': 'Verify Email',
        '/verify-phone': 'Verify Phone',
        '/forgot-password': 'Forgot Password',
        '/reactivate': 'Reactivate Account',
        '/legal': 'Legal',
        '/about': 'About',
        '/enterprise-create-account': 'Business Sign Up',
        '/enterprise-login': 'Business Login',
        '/enterprise-verify-email': 'Business Email Verification',
        '/enterprise-profile': 'Business Profile'
      };

      // Find the best matching route
      const exactMatch = pathMap[pathname];
      if (exactMatch) return exactMatch;

      // For nested routes, try to find the closest parent
      const pathSegments = pathname.split('/').filter(Boolean);
      for (let i = pathSegments.length; i > 0; i--) {
        const partialPath = '/' + pathSegments.slice(0, i).join('/');
        if (pathMap[partialPath]) {
          return pathMap[partialPath];
        }
      }

      // Default fallback
      return '';
    };

    const pageName = getPageTitle(location.pathname);
    document.title = pageName ? `Circuit | ${pageName}` : 'Circuit';
  }, [location.pathname]);
};

export default usePageTitle; 
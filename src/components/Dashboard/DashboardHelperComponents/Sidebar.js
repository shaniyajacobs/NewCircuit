import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../../firebaseConfig";
import { signOut } from "firebase/auth";
import secondaryLogo from "../../../images/Cir_Secondary_RGB_Mixed Black.svg";
import circuitLogo from "../../../images/Cir_Primary_RGB_Mixed Black.png";
import { ReactComponent as HomeIcon } from "../../../images/home.svg";
import { ReactComponent as CardIcon } from "../../../images/card.svg";
import { ReactComponent as FlashIcon } from "../../../images/flash.svg";
import { ReactComponent as TicketIcon } from "../../../images/ticket.svg";
import { ReactComponent as LogoutIcon } from "../../../images/logout.svg";
import { ReactComponent as ProfileCircleIcon } from "../../../images/profile-circle.svg";
import { ReactComponent as VectorIcon } from "../../../images/Vector 6.svg";
import xIcon from "../../../images/x.svg";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import * as IoIcons from "react-icons/io";
import * as RiIcons from "react-icons/ri";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from '../../../firebaseConfig';
import PopUp from './PopUp';
import { hasNewSparks } from '../../../utils/notificationManager';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showTabletMenu, setShowTabletMenu] = useState(false);
  const [hasNewSpark, setHasNewSpark] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Check for new sparks using the notification manager
  useEffect(() => {
    const checkNewSparks = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      try {
        const hasNew = await hasNewSparks();
        setHasNewSpark(hasNew);
        console.log(`Sidebar automatic check: ${hasNew ? 'has new sparks' : 'no new sparks'}`);
      } catch (err) {
        console.error('Error checking for new sparks:', err);
        setHasNewSpark(false);
      }
    };

    checkNewSparks();
    
    // Set up interval to check for new sparks every 30 seconds (less frequent)
    const interval = setInterval(checkNewSparks, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Also check when user navigates to sparks page
  useEffect(() => {
    if (location.pathname === "/dashboard/dashMyConnections") {
      const checkNewSparks = async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
          const hasNew = await hasNewSparks();
          setHasNewSpark(hasNew);
          console.log(`Sidebar navigation check: ${hasNew ? 'has new sparks' : 'no new sparks'}`);
        } catch (err) {
          console.error('Error checking for new sparks:', err);
          setHasNewSpark(false);
        }
      };
      
      // Check immediately when navigating to sparks page
      checkNewSparks();
    }
  }, [location.pathname]);

  // Listen for spark notification updates from other components
  useEffect(() => {
    const handleSparkNotificationUpdate = (event) => {
      console.log('Sidebar received spark notification update:', event.detail.hasNewSparks);
      setHasNewSpark(event.detail.hasNewSparks);
    };

    window.addEventListener('sparkNotificationUpdate', handleSparkNotificationUpdate);
    
    return () => {
      window.removeEventListener('sparkNotificationUpdate', handleSparkNotificationUpdate);
    };
  }, []);

  // Fetch cart count from Firestore
  useEffect(() => {
    const fetchCartCount = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const cart = userData.cart || [];
          setCartCount(cart.length);
        }
      } catch (err) {
        console.error('Error fetching cart count:', err);
      }
    };

    fetchCartCount();
    
    // Set up real-time listener for cart changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchCartCount();
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  // Listen for cart update events from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      const fetchCartCount = async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const cart = userData.cart || [];
            setCartCount(cart.length);
          }
        } catch (err) {
          console.error('Error fetching cart count:', err);
        }
      };
      
      fetchCartCount();
    };

    // Listen for cart update events
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [auth.currentUser]);

  const navItems = [
    { icon: "ti ti-home", text: "Home", active: true },
    { icon: "ti ti-users", text: "My Sparks" },
    { icon: "ti ti-calendar", text: "Date Calendar" },
    { icon: "ti ti-ticket", text: "My Coupons" },
    { icon: "ti ti-user", text: "My Profile" },
    { icon: "ti ti-settings", text: "Settings" },
    { icon: "ti ti-logout", text: "Sign Out" },
  ];

  const handleSignOut = (e) => {
    if (e) {
      e.preventDefault();
    }
    setShowSignOutModal(true);
    setShowSettingsDropdown(false);
  };

  const handleSignOutConfirm = async () => {
    try {
      await signOut(auth);
      setShowSignOutModal(false);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleTabletMenuToggle = () => {
    setShowTabletMenu(!showTabletMenu);
  };

  const SidebarData = [
    {
      title: "Home",
      path: "/dashboard",
      icon: (
        <HomeIcon
          className="w-5 h-5"
          style={{
            color: location.pathname === "/dashboard" ? "#1C50D8" : "#211f20"
          }}
        />
      ),
      cName: "nav-text",
    },
    {
      title: "Sparks",
      path: "/dashboard/dashMyConnections",
      icon: (
        <FlashIcon
          className="w-5 h-5"
          style={{
            color: location.pathname === "/dashboard/dashMyConnections" ? "#1C50D8" : "#211f20"
          }}
        />
      ),
      cName: "nav-text",
    },
    {
      title: "Shop",
      path: "/dashboard/dashDateCalendar",
      icon: (
        <CardIcon
          className="w-5 h-5"
          style={{
            color: location.pathname === "/dashboard/dashDateCalendar" ? "#1C50D8" : "#211f20"
          }}
        />
      ),
      cName: "nav-text",
    },
    {
     title: "My Coupons",
     path: "/dashboard/dashMyCoupons",
     icon: (
        <TicketIcon
          className="w-5 h-5"
          style={{
            color: location.pathname === "/dashboard/dashMyCoupons" ? "#1C50D8" : "#211f20"
          }}
        />
     ),
     cName: "nav-text",
    },
    {
      title: "My Profile",
      path: "/dashboard/dashMyProfile",
      icon: (
        <ProfileCircleIcon
          className="w-5 h-5"
          style={{
            color: location.pathname === "/dashboard/dashMyProfile" ? "#1C50D8" : "#211f20"
          }}
        />
      ),
      cName: "nav-text",
    },
    {
      title: "Settings",
      path: "/dashboard/dashSettings",
      icon: <RiIcons.RiSettings4Line />,
      cName: "nav-text",
    },
    {
      title: "Log out",
      path: "#",
      icon: <LogoutIcon className="w-5 h-5" />,
      cName: "nav-text",
      onClick: handleSignOut
    },
  ];

  return (
    <>
      {/* Desktop Sidebar (1280px and above) */}
      <div className="hidden md:flex flex-col h-screen px-5 py-10 bg-white rounded-xl w-[280px] max-md:p-5 max-md:w-full border border-[rgba(33,31,32,0.10)] fixed left-0 top-0">  
        <Link to="/dashboard" className="p-6 sm:p-6 md:p-6 lg:p-6">
          <img
            loading="lazy"
            src={secondaryLogo}
            alt="SecondaryLogo"
            className="object-contain"
          />
        </Link>

        {/* Main navigation items with top padding */}
        <div className="pt-6 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2"> {/* Add vertical gap between options */}
            {SidebarData.slice(0, -2).map((item, index) => (
              <Link key={item.path} to={item.path} className="w-full">
                <div className={`flex items-center justify-between w-full px-4 py-3 text-lg rounded-xl transition-all cursor-pointer duration-200 text-slate-500 border
                  ${location.pathname === item.path
                    ? "bg-[#1C50D81A] border-[#1C50D840] text-[#1C50D8]"
                    : "border-transparent hover:bg-[#F5F7FB] hover:text-[#1C50D8] hover:border-[#1C50D840]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                  {/* Only for Sparks - Red dot notification */}
                  {item.title === "Sparks" && hasNewSpark && (
                    <div className="flex items-center">
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#FF4848',
                          display: 'inline-block',
                          border: '1px solid #E5E7EB',
                          marginLeft: '8px',
                        }}
                      />
                    </div>
                  )}
                  {/* Cart indicator for Shop */}
                  {item.title === "Shop" && cartCount > 0 && (
                    <span
                      style={{
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '10px',
                        background: '#0043F1',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginLeft: '8px',
                      }}
                    >
                      {cartCount}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Settings and Sign Out at bottom - fixed */}
        <div className="pb-6 flex flex-col gap-2 mt-auto"> {/* Add vertical gap between settings and logout */}
          {SidebarData.slice(-2).map((item, index) => (
            <div key={index}>
              {item.onClick ? (
                // Sign Out button with onClick handler
                <div
                  className={`flex gap-2 sm:gap-2 md:gap-3 lg:gap-4 items-center px-5 py-3 sm:px-5 sm:py-3 md:px-6 md:py-4 lg:px-6 lg:py-4 text-lg rounded-2xl transition-all cursor-pointer duration-[0.2s] border
                    ${item.title === "Log out" 
                      ? "text-[#FF4848] bg-[rgba(255,72,72,0.10)] border-[rgba(255,72,72,0.20)] hover:bg-[rgba(255,72,72,0.15)]"
                      : location.pathname === item.path
                      ? "bg-[#1C50D81A] border-[#1C50D840] text-[#1C50D8]"
                      : "text-slate-500 border-transparent hover:bg-gray-50 hover:border-[#1C50D840]"
                    }`}
                  onClick={item.onClick}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </div>
              ) : (
                // Settings link
                <Link to={item.path}>
                  <div
                    className={`flex gap-2 sm:gap-2 md:gap-3 lg:gap-4 items-center px-5 py-3 sm:px-5 sm:py-3 md:px-6 md:py-4 lg:px-6 lg:py-4 text-lg rounded-2xl transition-all cursor-pointer duration-[0.2s] text-slate-500 border
                      ${location.pathname === item.path
                        ? "bg-[#1C50D81A] border-[#1C50D840] text-[#1C50D8]"
                        : "border-transparent hover:bg-gray-50 hover:border-[#1C50D840]"
                      }`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tablet Header Bar (under 1280px) */}
      <div className="flex md:hidden justify-between items-center px-6 py-4 bg-white border-b border-[rgba(33,31,32,0.10)] w-full">
        {/* Left side - Circuit logo / Page title text */}
        <div className="flex items-center">
          {/* Desktop: Show Circuit logo */}
          <Link to="/dashboard" className="max-md:hidden">
            <img
              loading="lazy"
              src={circuitLogo}
              alt="Circuit Logo"
              className="object-contain h-8"
            />
          </Link>
          {/* Mobile & Tablet: Show page title text */}
          <div 
            className="hidden max-md:block"
            style={{
              color: 'var(--Raisin_Black, #211F20)',
              fontFamily: '"Bricolage Grotesque"',
              fontSize: 'var(--H8, 16px)',
              fontStyle: 'normal',
              fontWeight: '500',
              lineHeight: '130%',
              textTransform: 'uppercase'
            }}
          >
            {(() => {
              const path = location.pathname;
              if (path === "/dashboard") return "HOME";
              if (path.includes("dashMyConnections")) return "MY SPARKS";
              if (path.includes("dashDateCalendar")) return "SHOP";
              if (path.includes("dashMyCoupons")) return "MY COUPONS";
              if (path.includes("dashMyProfile")) return "MY PROFILE";
              if (path.includes("dashSettings")) return "SETTINGS";
              if (path.includes("dashChangePassword")) return "CHANGE PASSWORD";
              if (path.includes("dashDeleteAccount")) return "DELETE ACCOUNT";
              if (path.includes("dashDeactivateAccount")) return "DEACTIVATE ACCOUNT";
              if (path.includes("dashPaymentHistory")) return "PAYMENT HISTORY";
              if (path.includes("dashMessages")) return "MESSAGES";
              return "DASHBOARD";
            })()}
          </div>
        </div>

        {/* Right side - Vectors (clickable) */}
        <div 
          className="flex flex-col items-center gap-3 cursor-pointer"
          onClick={handleTabletMenuToggle}
        >
          <VectorIcon className="w-6 h-1" />
          <VectorIcon className="w-6 h-1" />
        </div>
      </div>

      {/* Tablet Menu Overlay (full screen) */}
      {showTabletMenu && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 md:hidden">
          <div className="flex flex-col h-full bg-white w-[744px] max-w-full">
            {/* Tablet Menu Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[rgba(33,31,32,0.10)]">
              <Link to="/dashboard" onClick={() => setShowTabletMenu(false)}>
                <img
                  loading="lazy"
                  src={circuitLogo}
                  alt="Circuit Logo"
                  className="object-contain h-8"
                />
              </Link>
              <button 
                onClick={handleTabletMenuToggle}
                className="text-2xl font-bold text-gray-600 hover:text-gray-800"
              >
                <img src={xIcon} alt="Close" className="w-6 h-6" />
              </button>
            </div>

            {/* Tablet/Mobile Menu Items */}
            <div className="flex-1 px-6 py-4">
              {SidebarData.map((item, index) => (
                <div key={index} className="mb-2">
                  {item.onClick ? (
                    // Logout button with onClick handler
                    <button
                      onClick={() => {
                        setShowTabletMenu(false);
                        item.onClick();
                      }}
                      className="flex gap-4 items-center px-4 py-3 text-lg rounded-xl transition-all cursor-pointer duration-[0.2s] text-red-600 border border-transparent hover:bg-red-50 hover:border-[rgba(255,72,72,0.20)] w-full text-left"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </button>
                  ) : item.hasDropdown ? (
                    <div className="relative">
                      <div
                        className={`flex gap-4 items-center px-4 py-3 text-lg rounded-xl transition-all cursor-pointer duration-[0.2s] text-slate-500 border
                          ${location.pathname === item.path
                            ? "bg-[#1C50D81A] border-[#1C50D840] text-[#1C50D8]"
                            : "border-transparent hover:bg-gray-50 hover:border-[#1C50D840]"
                          }`}
                        onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                    
                      {showSettingsDropdown && (
                        <div className="ml-8 mt-2 space-y-1">
                          {item.dropdownItems.map((dropdownItem, dropIndex) => (
                            <Link 
                              to={dropdownItem.path} 
                              key={dropIndex}
                              className="flex gap-4 items-center px-4 py-2 text-base hover:bg-[#0043F1] hover:text-white text-slate-500 rounded-lg transition-colors duration-200"
                              onClick={() => {
                                dropdownItem.onClick && dropdownItem.onClick();
                                setShowTabletMenu(false);
                                setShowSettingsDropdown(false);
                              }}
                            >
                              {dropdownItem.icon}
                              <span>{dropdownItem.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link to={item.path} onClick={() => setShowTabletMenu(false)}>
                      <div
                        className={`flex gap-4 items-center px-4 py-3 text-lg rounded-xl transition-all cursor-pointer duration-[0.2s] text-slate-500 border
                          ${location.pathname === item.path
                            ? "bg-[#1C50D81A] border-[#1C50D840] text-[#1C50D8]"
                            : "border-transparent hover:bg-gray-50 hover:border-[#1C50D840]"
                          }`}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                        {/* Cart indicator for Shop in mobile menu */}
                        {item.title === "Shop" && cartCount > 0 && (
                          <span
                            style={{
                              minWidth: '20px',
                              height: '20px',
                              borderRadius: '10px',
                              background: '#0043F1',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '600',
                              marginLeft: 'auto',
                            }}
                          >
                            {cartCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Modal */}
      <PopUp
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        title="Sign Out"
        subtitle="Are you sure you want to sign out?"
        icon="🚪"
        iconColor="blue"
        primaryButton={{
          text: "Sign Out",
          onClick: handleSignOutConfirm
        }}
        secondaryButton={{
          text: "Cancel",
          onClick: () => setShowSignOutModal(false)
        }}
      />
    </>
  );
};

export default Sidebar;

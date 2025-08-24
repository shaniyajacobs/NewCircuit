import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../DashboardHelperComponents/ConfirmationModal";
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { auth, db } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import homePurchaseMoreDates from "../../../images/home_purchase_more_dates.jpg";
import imgNoise from "../../../images/noise.png";
import { ReactComponent as FiveDots } from "../../../images/5 Dots.svg";
import { ReactComponent as Team } from "../../../images/Team.svg";
import { ReactComponent as Hole } from "../../../images/Hole.svg";
import { ReactComponent as Butterfly } from "../../../images/Butterfly.svg";
import { ReactComponent as Ellipse } from "../../../images/Ellipse.svg";
import { ReactComponent as SoftFlower } from "../../../images/Soft Flower.svg";

const DatePlan = ({ title, time, price, venue, onBuyNow }) => {
  // Get the correct icon based on title
  const getIcon = () => {
    switch (title) {
      case "Brunch":
        return <Ellipse className="w-full h-full" />;
      case "Happy Hour":
        return <Butterfly className="w-full h-full" />;
      case "Dinner":
        return <SoftFlower className="w-full h-full" />;
      default:
        return <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-600">{title}</span>
        </div>;
    }
  };

  // Get features based on title
  const getFeatures = () => {
    switch (title) {
      case "Brunch":
        return ["Virtual Brunch Speed Date", "12:30pm - 2:00 pm", "Advanced Matching Algorithm"];
      case "Happy Hour":
        return ["Virtual Happy Hour Speed Date", "3:00pm - 4:30pm", "Advanced Matching Algorithm"];
      case "Dinner":
        return ["Virtual Dinner Speed Date", "6:00pm - 7:30pm", "Advanced Matching Algorithm"];
      default:
        return ["Speed Date", "Advanced Matching Algorithm"];
    }
  };

  return (
    <div className="relative w-full lg:max-w-[425px] mx-auto">
      <div className="flex flex-col bg-white border border-[#211F20] rounded-2xl overflow-hidden 
      pt-[0px] sm:pt-[0px] md:pt-[0px] lg:pt-[72px]
      min-h-[297px] sm:min-h-[343px] md:min-h-[419px] lg:min-h-[650px]">
        {/* The main card container */}
        <div className="relative flex flex-col flex-1 bg-white pt-[0px] sm:pt-[0px] md:pt-[0px]">
          
          {/* Upper Content */}
          <div className="flex flex-col flex-1 p-3 sm:p-4 lg:p-5 xl:p-6">
            {/* Icon */}
            <div className="flex justify-start w-[50px] h-[50px] sm:w-[75px] sm:h-[75px] md:w-[75px] md:h-[75px] lg:w-[100px] lg:h-[100px]"> 
              {getIcon()}
            </div>
            
            {/* Text Content */}
            <div className="mt-auto">
              <div className="mb-[16px] sm:mb-[20px] md:mb-[24px] lg:mb-[32px]">
                <h3 className="self-stretch text-[#211F20] font-bricolage text-[18px] sm:text-[20px] md:text-[28px] lg:text-[32px] font-normal leading-[130%] mb-[8px] sm:mb-[8px] md:mb-[10px] lg:mb-[12px]">{title}</h3>
                <div className="gap-[4px] self-stretch text-[#211F20] font-poppins text-[28px] sm:text-[30px] md:text-[36px] lg:text-[40px] font-medium leading-[100%] flex items-baseline">
                  <span className="text-[28px] sm:text-[30px] md:text-[36px] lg:text-[40px] font-medium text-[#211F20]">{price}</span>
                  <span className="text-[#211F20] font-poppins text-[14px] sm:text-[14px] md:text-[16px] lg:text-[20px] font-normal leading-[130%]">/Date</span>
                </div>
              </div>
              
              {/* Purchase Section */}
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 xl:gap-6" style={{ alignSelf: 'stretch' }}>
                <button
                  onClick={() => onBuyNow({ packageType: "Individual", title, venue, price })}
                  className="bg-[#211F20] text-white font-poppins
                  px-[20px] py-[4px] sm:px-[20px] sm:py-[4px] md:px-[20px] md:py-[5px] lg:px-[24px] lg:py-[6px]
                  rounded-lg text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-normal hover:bg-gray-800 transition-colors"
                >
                  Purchase
                </button>
              </div>
            </div>
          </div>
          
          {/* Features */}
          <div className="mt-auto bg-white p-3 sm:p-4 lg:p-5 xl:p-6 rounded-b-2xl sm:rounded-b-xl lg:rounded-b-2xl xl:rounded-b-2xl border-t border-black">
            <ul className="">
              {getFeatures().map((feature, index) => (
                <li key={index} className="self-stretch text-[#211F20] font-poppins text-[14px] md:text-[16px] lg:text-[20px] font-normal leading-[130%] flex items-start">
                  <span className="text-black-500 mr-2">•</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const BundlePlan = ({ title, features, dates, price, venue, onBuyNow }) => {
  // Calculate price per date for bundles
  const pricePerDate = Math.round(parseInt(price.replace('$', '')) / dates);
  const oldPrice = "$38";
  const isAdventure = title === "The Adventure";
  
  // Get the correct icon based on title
  const getIcon = () => {
    switch (title) {
      case "The Adventure":
        return <Team className="w-full h-full" />;
      case "The Connection":
        return <FiveDots className="w-full h-full" />;
      case "The Introduction":
        return <Hole className="w-full h-full" />;
      default:
        return <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-600">{dates}</span>
        </div>;
    }
  };
  
  return (
    <div className="relative w-full lg:max-w-[425px] mx-auto">
      <div className={`flex flex-col bg-white border border-[#211F20] rounded-2xl overflow-hidden 
      sm:min-h-[450px] md:min-h-[500px] lg:min-h-[650px] ${isAdventure ? 'min-h-[400px]' : 'min-h-[340px]'}`}>
      {/* The main card container needs to be relative for the absolute tag */}
        <div className={`relative flex flex-col flex-1 bg-white pt-[0px]   ${isAdventure ? 'pt-[40px] sm:pt-[38px] md:pt-[45px] lg:pt-[55px]' : 'sm:pt-[0px] md:pt-[10px] lg:pt-[52px]'}`}>
        
        {/* Tag for BEST DEAL*/}
        {isAdventure && (
          <div className="absolute top-0 left-0 right-0 z-10 border-b border-white">
            <div className="self-stretch text-[#F3F3F3] bg-[#1C50D8] text-center font-poppins 
            text-[14px] sm:text-[14px] md:text-[16px] lg:text-[20px] font-medium leading-[110%] 
             pt-3 rounded-t-2xl">
              BEST DEAL 🔥
              <div className="pt-2"> </div>
              <div className="w-full bg-white pb-[16px] sm:pb-[16px] md:pb-[20px] lg:pb-[24px] rounded-t-2xl"> 
              </div>
            </div>
            
          </div>
        )}
        
        {/* Upper Content */}
        <div className="flex flex-col flex-1 p-3 sm:p-4 lg:p-5 xl:p-6">
          {/* Icon */}
          <div className="flex justify-start w-[50px] h-[50px] sm:w-[75px] sm:h-[75px] md:w-[75px] md:h-[75px] lg:w-[100px] lg:h-[100px] "> 
            {getIcon()}
          </div>
          
          {/* Text Content */}
          <div className="mt-auto">
            <div className="mb-[16px] sm:mb-[20px] md:mb-[24px] lg:mb-[32px]">
              <div className="self-stretch text-[#211F20] font-bricolage text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] xl:text-[16px] font-medium leading-[130%] uppercase mb-[8px] sm:mb-[8px] md:mb-[10px] lg:mb-[12px]">{dates} Dates</div>
              <h3 className="self-stretch text-[#211F20] font-bricolage text-[18px] sm:text-[20px] md:text-[28px] lg:text-[32px]  font-normal leading-[130%] mb-[8px] sm:mb-[8px] md:mb-[10px] lg:mb-[12px]">{title}</h3>
              <div className="self-stretch text-gray-500 font-poppins text-[14px] md:text-[16] lg:text-[20] font-normal leading-[130%] line-through mb-[8px] sm:mb-[8px] md:mb-[10px] lg:mb-[12px]">{oldPrice}</div>
              <div className="gap-[4px] self-stretch text-[#211F20] font-poppins text-[28px] sm:text-[30px] md:text-[36px] lg:text-[40px] font-medium leading-[100%] flex items-baseline">
                <span className="text-[28px] sm:text-[30px] md:text-[36px] lg:text-[40px] font-medium text-[#211F20]">${pricePerDate}</span>
                <span className="text-[#211F20] font-poppins text-[14px] sm:text-[14px] md:text-[16px] lg:text-[20px] font-normal leading-[130%]">/Date</span>
              </div>
            </div>
            
            {/* Purchase Section */}
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 xl:gap-6" style={{ alignSelf: 'stretch' }}>
              <button
                onClick={() => onBuyNow({ packageType: "Bundle", title, numDates: dates, venue, price })}
                className="bg-[#211F20] text-white font-poppins
                px-[20px] py-[4px] sm:px-[20px] sm:py-[4px] md:px-[20px] md:py-[5px] lg:px-[24px] lg:py-[6px]
                rounded-lg text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-normal hover:bg-gray-800 transition-colors"
              >
                Purchase
              </button>
              <div className="text-[12px] sm:text-[12px] md:text-[14px] lg:text-[16px] text-[#211F20]">Billed at USD${parseInt(price.replace('$', ''))}</div>
            </div>
          </div>
        </div>
        
        {/* Features */}
        <div className="bg-white p-3 sm:p-4 lg:p-5 xl:p-6 rounded-b-2xl sm:rounded-b-xl lg:rounded-b-2xl xl:rounded-b-2xl border-t border-black">
          <ul className="">
            {features.map((feature, index) => (
              <li key={index} className="self-stretch text-[#211F20] font-poppins text-[14px] md:text-[16px] lg:text-[20px] font-normal leading-[130%] flex items-start">
                <span className="text-black-500 mr-2 ">•</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>


      </div>
      </div>
    </div>
  );
};

const DashDateCalendar = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [datesRemaining, setDatesRemaining] = useState(100);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Function to check if dates remaining is greater than 0
  const shouldShowCard = () => {
    return datesRemaining > 0;
  };

  // Function to refresh cart from Firestore
  const refreshCart = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const savedCart = userData.cart || [];
        setCart(savedCart);
      }
    } catch (error) {
      console.error('Error refreshing cart:', error);
    }
  };

  const handleBuyNow = (plan) => {
    const item = {
      id: `${plan.title}-${plan.venue}-${plan.packageType}`,
      title: plan.title,
      venue: plan.venue,
      packageType: plan.packageType,
      price: plan.price,
      type: 'date-package',
      numDates: plan.dates || 1 // Include the number of dates for bundles
    };
    
    addToCart(item);
  };

  const addToCart = async (item) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentCart = userDoc.data().cart || [];
        const existingItemIndex = currentCart.findIndex(cartItem => 
          cartItem.id === item.id && cartItem.type === item.type
        );

        let updatedCart;
        if (existingItemIndex !== -1) {
          // Update quantity if item already exists
          updatedCart = [...currentCart];
          updatedCart[existingItemIndex].quantity = (updatedCart[existingItemIndex].quantity || 1) + 1;
        } else {
          // Add new item
          updatedCart = [...currentCart, { ...item, quantity: 1 }];
        }

        await updateDoc(userRef, { cart: updatedCart });
        setCart(updatedCart);
        
        // Dispatch cart update event for other components (sidebar, header)
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Automatically open the cart modal with a small delay for better UX
        setTimeout(() => {
          setIsCartOpen(true);
        }, 300);
        
        // Refresh cart to ensure state is in sync
        await refreshCart();
        
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (itemId, itemType) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentCart = userDoc.data().cart || [];
        const updatedCart = currentCart.filter(item => 
          !(item.id === itemId && item.type === itemType)
        );

        await updateDoc(userRef, { cart: updatedCart });
        setCart(updatedCart);
        
        // Dispatch cart update event for other components (sidebar, header)
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Refresh cart to ensure state is in sync
        await refreshCart();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  // Generate plans with user's location
  const generateLocationBasedPlans = (userLocation) => {
    return {
      datePlans: [
        {
          title: "Brunch",
          time: "12:30pm - 2:00pm",
          venue: userLocation,
          price: "$28",
          features: [
            "Virtual Brunch Speed Date",
            "12:30pm - 2:00 pm",
            "Advanced Matching Algorithm"
          ]
        },
        {
          title: "Happy Hour",
          time: "3:00pm - 4:30pm",
          venue: userLocation,
          price: "$28",
          features: [
            "Virtual Happy Hour Speed Date",
            "3:00pm - 4:30pm",
            "Advanced Matching Algorithm"
          ]
        },
        {
          title: "Dinner",
          time: "6:00pm - 7:30pm",
          venue: userLocation,
          price: "$38",
          features: [
            "Virtual Dinner Speed Date",
            "6:00pm - 7:30pm",
            "Advanced Matching Algorithm"
          ]
        },
      ],
      bundlePlans: [
        {
          title: "The Adventure",
          features: [
            "10 Virtual Speed Dates",
            "Advanced Matching Algorithm",
            "Includes up to 3 Virtual dinner speed dates"
          ],
          dates: 10,
          venue: userLocation,
          price: "$220",
          tag: "BEST DEAL 🔥"
        },
        {
          title: "The Connection",
          features: [
            "6 Virtual Speed Dates",
            "Advanced Matching Algorithm",
            "Includes up to 2 Virtual dinner speed dates"
          ],
          dates: 6,
          venue: userLocation,
          price: "$144"
        },
        {
          title: "The Introduction",
          features: [
            "3 Virtual Speed Dates",
            "Advanced Matching Algorithm",
            "Includes up to 1 virtual dinner speed date"
          ],
          dates: 3,
          venue: userLocation,
          price: "$78"
        },
      ]
    };
  };

  // State for location-based plans
  const [locationBasedPlans, setLocationBasedPlans] = useState({
    datePlans: [],
    bundlePlans: []
  });
  
  // State for user location
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const data = userDoc.data();
          
          // Load saved cart
          const savedCart = data?.cart;
          if (savedCart) {
            setCart(savedCart);
          }
          
          // Fetch datesRemaining from Firestore (same logic as DashHome.js)
          if (data) {
            const fetchedRemaining = typeof data.datesRemaining === 'number'
              ? data.datesRemaining
              : Number(data.datesRemaining);
            setDatesRemaining(Number.isFinite(fetchedRemaining) ? fetchedRemaining : 0);
            
            // Generate location-based plans based on user's location
            if (data.location) {
              setUserLocation(data.location);
              const plans = generateLocationBasedPlans(data.location);
              setLocationBasedPlans(plans);
              console.log(`📍 Location-based plans generated for: ${data.location}`, plans);
            } else {
              // Default plans if no location set
              setUserLocation('San Francisco / Bay Area');
              const defaultPlans = generateLocationBasedPlans('San Francisco / Bay Area');
              setLocationBasedPlans(defaultPlans);
              console.log('📍 No location set, using default San Francisco / Bay Area plans');
            }
          }
        } catch (err) {
          console.error("Failed to load cart:", err);
        } finally {
          setCartLoaded(true);
        }
      } else {
        setCartLoaded(true); 
      }
    });
  
    return () => unsubscribe();
  }, []);
   
  useEffect(() => {
    const saveCartToFirestore = async (newCart) => {
      if (!user) return;
      try {
        await setDoc(doc(db, "users", user.uid), { cart: newCart }, { merge: true });
      } catch (err) {
        console.error("Failed to save cart:", err);
      }
    };
  
    if (user && cartLoaded) {
      saveCartToFirestore(cart);
    }
  }, [cart, user, cartLoaded]);
  
  // Listen for open cart event from header
  useEffect(() => {
    const handleOpenCart = () => {
      setIsCartOpen(true);
    };

    window.addEventListener('openCart', handleOpenCart);
    return () => window.removeEventListener('openCart', handleOpenCart);
  }, []);

  // Listen for dates updated event from checkout
  useEffect(() => {
    const handleDatesUpdated = async (event) => {
      const { newDatesRemaining, datesAdded } = event.detail;
      console.log(`🎉 Dates updated: +${datesAdded} dates, new total: ${newDatesRemaining}`);
      
      // Update local state
      setDatesRemaining(newDatesRemaining);
      
      // Refresh cart to ensure it's cleared
      await refreshCart();
    };

    window.addEventListener('datesUpdated', handleDatesUpdated);
    return () => window.removeEventListener('datesUpdated', handleDatesUpdated);
  }, []);



  // Handle body overflow when cart opens/closes
  useEffect(() => {
    if (isCartOpen) {
      // Store current overflow value
      const currentOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // Return function to restore overflow when cart closes
      return () => {
        document.body.style.overflow = currentOverflow || '';
      };
    }
  }, [isCartOpen]);

  // Cleanup function to restore body overflow when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="px-[16px] sm:px-[24px] md:px-[32px] lg:px-[50px]">
    <div className="pt-[16px] sm:pt-[24px] md:pt-[32px] lg:pt-[50px] pb-[16px] sm:pb-[24px] md:pb-[32px] lg:pb-[50px] bg-white rounded-3xl border border-gray-50 max-w-[1340px] mx-auto">
      <div className="flex flex-col max-w-full text-3xl w-full">

        {/* Header with Cart Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-[18px] sm:text-[20px] md:text-[24px] lg:text-[28px] font-bricolage font-medium leading-[130%] text-[#211F20]">
            Shop
          </h1>
          
          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
              cart.length > 0 
                ? 'bg-[#0043F1] text-white hover:bg-[#0034BD] shadow-md hover:shadow-lg transform hover:scale-105' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={cart.length === 0}
          >
            <FaShoppingCart className={`w-4 h-4 ${cart.length > 0 ? 'text-white' : 'text-gray-400'}`} />
            <span className="hidden sm:inline">Cart</span>
            {cart.length > 0 && (
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-bold">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Purchase more dates card */}
        {shouldShowCard() && (
          <div className="relative w-full rounded-2xl overflow-hidden flex items-center mb-6">
          <img src={homePurchaseMoreDates} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <img src={imgNoise} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ mixBlendMode: 'soft-light' }} />
          <div className="absolute inset-0 bg-[#211F20] bg-opacity-10" 
              style={{
                background: `
                  linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.50) 100%),
                  linear-gradient(0deg, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.30) 100%),
                  linear-gradient(0deg, rgba(226,255,101,0.25) 0%, rgba(226,255,101,0.25) 100%)
                `
              }}/>
          <div className="relative z-10 flex flex-col items-start p-6">
            <span
            className="
              flex items-center
              font-medium
              text-white
              leading-[130%]
              font-bricolage
              text-[14px] sm:text-[16px] lg:text-[20px] 2xl:text-[24px]
              
            "
          >
              Dates Remaining: {datesRemaining}
            </span>
          </div>
        </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[18px] sm:text-[20px] md:text-[28px] lg:text-[32px] font-bricolage font-medium leading-[130%] text-[#211F20]">
            Bundles
          </h2>
          {userLocation && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">
                {userLocation}
              </span>
            </div>
          )}
        </div>

        {/* Bundle Dates */}
        <div className="grid grid-cols-3 gap-[16px] sm:gap-[16px] md:gap-[20px] lg:gap-[24px] max-lg:grid-cols-1">
          {locationBasedPlans.bundlePlans.length > 0 ? (
            locationBasedPlans.bundlePlans.map((plan, index) => (
              <div key={index} className="w-full">
                <BundlePlan {...plan} onBuyNow={handleBuyNow} />
              </div>
            ))
          ) : (
            <div className="col-span-3 flex items-center justify-center py-8">
              <div className="text-gray-500">Loading location-based plans...</div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-20 mb-6 max-md:mt-10"> 
          <h2 className="self-start text-3xl font-semibold leading-snug text-black">
            Individual
          </h2>
        </div>

        {/* Individual Dates */}
        <div className="grid grid-cols-3 gap-[16px] sm:gap-[16px] md:gap-[20px] lg:gap-[24px] max-lg:grid-cols-1">
          {locationBasedPlans.datePlans.length > 0 ? (
            locationBasedPlans.datePlans.map((plan, index) => (
              <div key={index} className="w-full">
                <DatePlan {...plan} onBuyNow={handleBuyNow} />
              </div>
            ))
          ) : (
            <div className="col-span-3 flex items-center justify-center py-8">
              <div className="text-gray-500">Loading location-based plans...</div>
            </div>
          )}
        </div>

        {/* Cart */}
        <ConfirmationModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          removeFromCart={removeFromCart}
          navigate={navigate}
        />

        {/* Floating Cart Button for Mobile */}
        {cart.length > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 z-40 sm:hidden bg-[#0043F1] text-white p-4 rounded-full shadow-lg hover:bg-[#0034BD] transition-colors"
            aria-label="View cart"
          >
            <div className="relative">
              <FaShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] bg-white text-[#0043F1] text-xs font-bold rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            </div>
          </button>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Added to cart successfully!</span>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default DashDateCalendar;

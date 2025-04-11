import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../DashboardHelperComponents/ConfirmationModal";
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { auth, db } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const DatePlan = ({ title, time, price, venue, onBuyNow }) => {
  return (
    <div className="flex flex-col items-center pb-8 mx-auto w-full text-black rounded-3xl bg-zinc-100 shadow-lg max-md:mt-10 h-[350px]">
      <div className="self-stretch px-5 py-2 rounded-t-xl bg-zinc-100 shadow-lg text-2xl text-center">
        {title}
      </div>

      <div className="flex flex-col gap-2 self-stretch mt-6 mx-3 text-base">
        <div className="flex items-center gap-2">
          <FaCheck className="text-green-500 w-4 h-4 shrink-0" />
          <span className="text-gray-700">{time}</span>
        </div>
        <div className="flex items-center gap-2">
          <FaCheck className="text-green-500 w-4 h-4 shrink-0" />
          <span className="text-gray-700">Advanced Matching Algorithm</span>
        </div>
      </div>

      <div className="mt-6 text-center text-2xl">{price}</div>

      <div className="mt-auto">
        <button
          onClick={() => onBuyNow({ packageType: "Individual", title, venue, price })}
          className="px-14 py-1.5 mt-6 text-base tracking-tight text-center text-white bg-[#0043F1] rounded-lg w-[177px]"
        >
          Buy now
        </button>
      </div>
    </div>
  );
};

const BundlePlan = ({ title, features, dates, price, venue, onBuyNow }) => {
  return (
    <div className="flex flex-col items-center pb-8 mx-auto w-full text-black rounded-3xl bg-zinc-100 shadow-lg max-md:mt-10 h-[450px]">
      <div className="self-stretch px-5 py-2 rounded-t-xl bg-zinc-100 shadow-lg text-2xl text-center">
        {title}
      </div>

      <div className="flex flex-col gap-2 self-stretch mt-6 mx-3 text-base">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <FaCheck className="text-green-500 w-4 h-4 shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">{dates} Dates</div>
      <div className="mt-4 text-center text-black">{price}</div>

      <div className="mt-auto">
        <button
          onClick={() => onBuyNow({ packageType: "Bundle", title, numDates: dates, venue, price })}
          className="px-14 py-1.5 mt-6 text-base tracking-tight text-center text-white bg-[#0043F1] rounded-lg w-[177px]"
        >
          Buy now
        </button>
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

  const handleBuyNow = (plan) => {
    setCart((prevCart) => [...prevCart, plan]); 
    setIsCartOpen(true); 
  };

  const removeFromCart = (title, venue, packageType) => {
    setCart((prevCart) => {
      const indexToRemove = prevCart.findIndex(
        (plan) =>
          plan.title === title &&
          plan.venue === venue &&
          plan.packageType === packageType
      );

      if (indexToRemove !== -1) {
        const newCart = [...prevCart];
        newCart.splice(indexToRemove, 1);
        return newCart;
      }

      return prevCart;
    });
  };

  const datePlans = [
    { title: "Brunch", time: "12:30pm - 2:00pm", venue: "San Francisco", price: "$28" },
    { title: "Happy Hour", time: "3:00pm - 4:30pm", venue: "New York City", price: "$28" },
    { title: "Dinner", time: "6:00pm - 7:30pm", venue: "Los Angeles", price: "$38" },
  ];

  const bundlePlans = [
    {
      title: "The Introduction",
      features: ["All eligible venues", "Basic Matching Algorithm", "1 Dinner"],
      dates: 3,
      venue: "San Francisco",
      price: "$78",
    },
    {
      title: "The Connection",
      features: ["All eligible venues", "Advanced Matching Algorithm", "2 Dinners"],
      dates: 6,
      venue: "New York City",
      price: "$144",
    },
    {
      title: "The Adventure",
      features: ["All eligible venues", "Advanced Matching Algorithm", "Boosted Visibility and Matching", "3 Dinners"],
      dates: 10,
      venue: "Los Angeles",
      price: "$220",
    },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const savedCart = userDoc.data()?.cart;
          if (savedCart) {
            setCart(savedCart);
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
  

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 shadow-[0_4px_20px_rgba(238,238,238,0.502)]">
      <div className="flex flex-col ml-10 max-w-full text-3xl w-[90%]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="self-start text-3xl font-semibold leading-snug text-black">
            Individual Date
          </h2>
          <button
            onClick={() => setIsCartOpen(true)} 
            className="flex items-center gap-2 bg-[#0043F1] text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            <FaShoppingCart className="text-2xl" />
            <span className="text-lg font-semibold"> {cartLoaded ? cart.length : "\u00A0"} </span>
          </button>
        </div>

        {/* Individual Date Plans */}
        <div className="grid grid-cols-3 gap-8 max-md:grid-cols-1">
          {datePlans.map((plan, index) => (
            <div key={index} className="w-full max-w-[350px] mx-auto">
              <DatePlan {...plan} onBuyNow={handleBuyNow} />
            </div>
          ))}
        </div>

        <h2 className="self-start mt-20 mb-6 text-3xl font-semibold leading-snug text-black max-md:mt-10">
          Bundle Date Package
        </h2>

        {/* Bundle Date Packages */}
        <div className="grid grid-cols-3 gap-8 max-md:grid-cols-1">
          {bundlePlans.map((plan, index) => (
            <div key={index} className="w-full max-w-[350px] mx-auto">
              <BundlePlan {...plan} onBuyNow={handleBuyNow} />
            </div>
          ))}
        </div>

        {/* Cart */}
        <ConfirmationModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          removeFromCart={removeFromCart}
          navigate={navigate}
        />
      </div>
    </div>
  );
};

export default DashDateCalendar;

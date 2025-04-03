import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaCreditCard, FaTrash } from "react-icons/fa";

const DashCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cart, setCart] = useState(location.state?.cart || []);
  const [discountCode, setDiscountCode] = useState("");

  if (cart.length === 0) {
    return (
      <p className="text-center text-xl mt-10">
        No package selected. Please go back to the Date Calendar.
      </p>
    );
  }

  // **Grouping Plans**: Merge duplicate plans by title, venue, and packageType
  const groupedCart = cart.reduce((acc, plan) => {
    const key = `${plan.title}-${plan.venue}-${plan.packageType}`;
    if (!acc[key]) {
      acc[key] = { ...plan, quantity: 1 };
    } else {
      acc[key].quantity += 1;
      acc[key].price = `$${(
        parseFloat(acc[key].price.replace("$", "")) +
        parseFloat(plan.price.replace("$", ""))
      ).toFixed(2)}`;
    }
    return acc;
  }, {});

  const cartItems = Object.values(groupedCart);

  // **Delete Functionality**: Removes an item from cart
  const handleRemoveItem = (title, venue, packageType) => {
    const updatedCart = [...cart].filter(
      (plan) => !(plan.title === title && plan.venue === venue && plan.packageType === packageType)
    );
    setCart(updatedCart);
  
    // Optional: navigate again with new cart state
    navigate("/dashboard/DashCheckout", { state: { cart: updatedCart } });
  };
  

  // Calculate total price
  const totalPrice = cartItems.reduce((sum, plan) => sum + parseFloat(plan.price.replace("$", "")), 0);

  return (
    <div className="flex flex-col w-full min-h-screen px-10 py-10 bg-white rounded-3xl border border-gray-50 shadow-lg">
      
      <h2 className="text-4xl font-semibold text-black mb-8">Checkout Details</h2>

      <div className="flex w-full max-w-full min-h-[600px] gap-28">
        
        {/* Left Side - Payment Form */}
        <div className="w-2/3 h-full gap-28">
          <p className="text-[#000000] text-[24px] mb-9">
            Fill in the information below to complete your purchase.
          </p>

          <div className="mt-20">
            <div className="mb-8">
              <label className="block text-[20px] text-gray-600">Cardholder's Name</label>
              <input type="text" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="Full Name" />
            </div>

            <div className="mb-8">
              <label className="block text-[20px] text-gray-600">Card Number</label>
              <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                <FaCreditCard className="text-gray-500 mr-2" />
                <input type="text" className="w-full focus:outline-none" placeholder="9870 3456 7890 6473" />
              </div>
            </div>

            <div className="flex gap-5 mb-8">
              <div className="w-1/2">
                <label className="block text-[20px] text-gray-600">Expiry</label>
                <input type="text" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="MM / YY" />
              </div>
              <div className="w-1/2">
                <label className="block text-[20px] text-gray-600">CVC</label>
                <input type="text" className="w-full p-3 border border-gray-300 rounded-lg" placeholder="XXX" />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-[20px] text-gray-600">Discount Code</label>
              <div className="flex">
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Enter code"
                />
                <button className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg">
                  Apply
                </button>
              </div>
            </div>

            <button className="w-full mt-5 bg-[#0043F1] text-white py-4 rounded-lg text-lg hover:bg-blue-600">
              Pay
            </button>
          </div>
        </div>

        {/* Right Side - Summary Box */}
        <div className="w-2/5 bg-[#F0F0F0] p-8 rounded-lg shadow-md min-h-[700px] flex flex-col justify-between">
          
          <div>
            <p className="text-[24px] font-medium">You're paying,</p>
            <p className="text-[64px] font-bold">${Math.round(totalPrice)}</p>

            <div className="mt-4">
              {cartItems.map((plan, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-2 mb-2">
                <div>
                  <p className="font-bold text-[26px]">
                  {plan.quantity * (plan.numDates || 1)} x {plan.packageType === "Bundle" ? "Bundle Dates" : "Date"}
                  </p>
                  <p className="text-gray-600 text-[20px]">{plan.venue}</p>
                </div>
              
                <div className="flex items-center gap-4">
                  <p className="text-[24px] font-semibold">{plan.price}</p>
                  <button 
                    onClick={() => handleRemoveItem(plan.title, plan.venue, plan.packageType)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash size={22} />
                  </button>
                </div>
              </div>
              
              ))}
            </div>

            <div className="mt-10 font-bold text-[26px]">Discounts & Offers</div>
            <p className="text-right text-[24px]">$0.00</p>

            <hr className="my-3" />

            <div className="mt-2 text-[26px] font-bold">Tax</div>
            <p className="text-right text-[24px]">$0.00</p>

            <div className="mt-2 text-[26px] font-bold">Total</div>
            <p className="text-right text-[24px] font-bold">${Math.round(totalPrice)}
</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashCheckout;

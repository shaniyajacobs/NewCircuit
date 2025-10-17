import React from "react";
import { IoClose } from "react-icons/io5";
import { FaTrash } from "react-icons/fa";
import { formatCartItemDisplay } from '../../../utils/dateTypeFormatter';

const ConfirmationModal = ({ isOpen, onClose, cart, removeFromCart, navigate }) => {
  const groupedCart = cart.reduce((acc, plan) => {
    const key = `${plan.title}-${plan.venue}-${plan.packageType}`;
    if (!acc[key]) {
      acc[key] = { ...plan, quantity: 1 };
    } else {
      acc[key].quantity += 1;
    }
    return acc;
  }, {});

  const cartItems = Object.values(groupedCart);
  const totalPrice = cartItems.reduce((sum, plan) => {
    const price = parseFloat(plan.price.replace("$", ""));
    return sum + (price * plan.quantity);
  }, 0);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-30 transition-opacity duration-200 z-40 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={onClose}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />

      {/* Modal Panel */}
      <div
        className={`fixed top-1/2 left-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-[95vw] w-full sm:w-[420px] md:w-[480px] lg:w-[500px] xl:w-[520px] min-h-[320px] flex flex-col transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}
        role="dialog"
        aria-modal="true"
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-[20px] md:text-[22px] font-bricolage font-semibold text-[#211F20]">Cart</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition duration-200 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0043F1]"
            aria-label="Close cart"
          >
            <IoClose size={26} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            <p className="text-gray-500 text-center text-[16px] md:text-[18px] font-poppins">Your cart is empty.</p>
          ) : (
            <ul>
              {cartItems.map((plan, index) => {
                const totalDates = plan.quantity * (plan.numDates || 1);
                return (
                  <li
                    key={index}
                    className={`flex justify-between items-center py-3 ${index !== cartItems.length - 1 ? "border-b" : ""}`}
                  >
                    <div>
                      <p className="font-semibold text-[16px] md:text-[18px] text-[#211F20] font-bricolage">
                        {formatCartItemDisplay(plan)}
                      </p>
                      <p className="text-gray-500 text-[14px] md:text-[15px] font-poppins">{plan.venue}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[16px] md:text-[18px] font-semibold text-[#0043F1]">${parseFloat(plan.price.replace("$", "")).toFixed(2)}</p>
                      <button
                        onClick={() => removeFromCart(plan.id, plan.type)}
                        className="text-red-500 hover:text-red-700 transition duration-200 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
                        aria-label="Remove item"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="px-6 py-4 border-t bg-[#FAFAFA] rounded-b-2xl">
            <div className="flex justify-between items-center text-[18px] md:text-[20px] font-bold font-poppins mb-3">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={() => {
                navigate("/dashboard/DashCheckout");
                onClose();
              }}
              className="w-full bg-[#0043F1] text-white py-3 rounded-lg text-[16px] md:text-[18px] font-semibold font-poppins shadow hover:bg-[#0037C1] transition-all duration-200"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ConfirmationModal;

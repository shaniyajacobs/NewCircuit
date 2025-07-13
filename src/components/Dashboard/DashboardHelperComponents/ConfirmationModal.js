import React from "react";
import { IoClose } from "react-icons/io5";
import { FaTrash } from "react-icons/fa";

const ConfirmationModal = ({ isOpen, onClose, cart, removeFromCart, navigate }) => {
  const groupedCart = cart.reduce((acc, plan) => {
    const key = `${plan.title}-${plan.venue}-${plan.packageType}-${plan.numDates || 1}`;
    if (!acc[key]) {
      acc[key] = { ...plan, quantity: 1 };
    } else {
      acc[key].quantity += 1;
      const existingPrice = parseFloat(acc[key].price.replace("$", ""));
      const incomingPrice = parseFloat(plan.price.replace("$", ""));
      acc[key].price = `$${(existingPrice + incomingPrice).toFixed(2)}`;
    }
    return acc;
  }, {});

  const cartItems = Object.values(groupedCart);
  const totalPrice = cart.reduce((sum, plan) => sum + parseFloat(plan.price.replace("$", "")), 0);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-200 ${
          isOpen ? "opacity-50 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 w-96 bg-white shadow-lg transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Cart</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition duration-200"
            aria-label="Close cart"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="p-4 flex-1 overflow-y-auto">
          {cartItems.length === 0 ? (
            <p className="text-gray-600 text-center">Your cart is empty.</p>
          ) : (
            <ul>
              {cartItems.map((plan, index) => {
                const totalDates = plan.quantity * (plan.numDates || 1);
                return (
                  <li
                    key={index}
                    className={`flex justify-between items-center py-3 ${
                      index !== cartItems.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div>
                      <p className="font-bold text-lg">
                        {totalDates} x{" "}
                        {plan.packageType === "Bundle"
                          ? "Bundle Dates"
                          : "Date"}
                      </p>
                      <p className="text-gray-600 text-sm">{plan.venue}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold">${parseFloat(plan.price.replace("$", "")).toFixed(2)}</p>
                      <button
                        onClick={() =>
                          removeFromCart( plan.title, plan.venue, plan.packageType, plan.numDates || 1)
                        }
                        className="text-red-500 hover:text-red-700 transition duration-200"
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

        {cartItems.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <button
              onClick={() => {
                navigate("/dashboard/DashCheckout");
                onClose();
              }}
              className="w-full bg-[#0043F1] text-white py-3 mt-4 rounded-lg text-lg hover:bg-[#0037C1] transition-all duration-200"
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

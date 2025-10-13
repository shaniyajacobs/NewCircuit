import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTag, FaTrash } from "react-icons/fa";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { httpsCallable } from "firebase/functions";
import { collection, doc, getDoc, addDoc, setDoc, Timestamp, updateDoc, increment } from "firebase/firestore";
import { db, auth, functions } from "../../../firebaseConfig";
import { processDatePurchase } from "../../../utils/eventSpotsUtils";
import PopUp from "../DashboardHelperComponents/PopUp";

const parsePrice = (priceStr) => parseFloat(priceStr?.replace("$", "")) || 0;

const calculateTotal = (items, discount) => {
  const base = items.reduce((sum, plan) => sum + parsePrice(plan.price), 0);
  if (!discount) return Number(base.toFixed(2));

  let discounted = base;
  
  // Handle new discount structure
  if (discount.type === 'fixed') {
    discounted = Math.max(0, base - discount.value);
  } else if (discount.type === 'percentage') {
    discounted = Math.max(0, base * (1 - discount.value / 100));
  }
  // Handle legacy discount structure for backward compatibility
  else if (discount.amountOff) {
    discounted = Math.max(0, base - discount.amountOff);
  } else if (discount.percentOff) {
    discounted = Math.max(0, base * (1 - discount.percentOff / 100));
  }

  return Number(discounted.toFixed(2));
};

const DashCheckout = () => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [purchasedCart, setPurchasedCart] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountMessage, setDiscountMessage] = useState("");

  useEffect(() => {
    const fetchCart = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const storedCart = userDoc.data()?.cart;
        if (storedCart) setCart(storedCart);
      }
      setCartLoaded(true);
    };
    fetchCart();
  }, []);

  if (!cartLoaded && !paymentSuccess) return null;

  if (cart.length === 0 && !paymentSuccess) {
    return (
      <p className="text-center text-xl mt-10">
        No package selected. Please go back to the Date Calendar.
      </p>
    );
  }

  if (cart.length === 0 && !paymentSuccess) {
    return (
      <p className="text-center text-xl mt-10">
        No package selected. Please go back to the Date Calendar.
      </p>
    );
  }

  // Group same plans
  const groupedCart = cart.reduce((acc, plan) => {
    const key = `${plan.title}-${plan.venue}-${plan.packageType}`;
    if (!acc[key]) {
      acc[key] = { ...plan, quantity: 1 };
    } else {
      acc[key].quantity += 1;
      const sum = parsePrice(acc[key].price) + parsePrice(plan.price);
      acc[key].price = `$${sum.toFixed(2)}`;
    }
    return acc;
  }, {});

  const cartItems =
    paymentSuccess && purchasedCart
      ? purchasedCart
      : Object.values(groupedCart);
  const baseTotal = cartItems.reduce(
    (sum, plan) => sum + parsePrice(plan.price),
    0
  );
  const totalPrice = calculateTotal(cartItems, appliedDiscount);

  const handleApplyDiscount = async () => {
    if (!discountCode) {
      setDiscountMessage("Please enter a discount code.");
      setShowDiscountModal(true);
      return;
    }

    try {
      const discountRef = doc(db, "discounts", discountCode.toUpperCase());
      const discountSnap = await getDoc(discountRef);

      if (discountSnap.exists()) {
        const discountData = discountSnap.data();
        
        // Validate discount code
        const now = new Date();
        const validUntil = new Date(discountData.validUntil);
        
        // Check if discount is active
        if (!discountData.isActive) {
          setDiscountMessage("❌ This discount code is not active.");
          setShowDiscountModal(true);
          return;
        }
        
        // Check if discount has expired
        if (validUntil <= now) {
          setDiscountMessage("❌ This discount code has expired.");
          setShowDiscountModal(true);
          return;
        }
        
        // Check usage limit
        if (discountData.usageLimit && discountData.usageCount >= discountData.usageLimit) {
          setDiscountMessage("❌ This discount code has reached its usage limit.");
          setShowDiscountModal(true);
          return;
        }
        
        // Convert to the format expected by calculateTotal
        const formattedDiscount = {
          type: discountData.type,
          value: discountData.value,
          code: discountData.code,
          description: discountData.description
        };
        
        setAppliedDiscount(formattedDiscount);
        setDiscountMessage("✅ Discount applied successfully!");
        setShowDiscountModal(true);
      } else {
        setDiscountMessage("❌ Invalid discount code.");
        setShowDiscountModal(true);
      }
    } catch (err) {
      console.error("Error checking discount code:", err);
      setDiscountMessage("Error checking discount code.");
      setShowDiscountModal(true);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  const handleRemoveItem = async (title, venue, packageType) => {
    const indexToRemove = cart.findIndex(
      (plan) =>
        plan.title === title &&
        plan.venue === venue &&
        plan.packageType === packageType
    );

    if (indexToRemove !== -1) {
      const updatedCart = [...cart];
      updatedCart.splice(indexToRemove, 1);
      setCart(updatedCart);

      const user = auth.currentUser;
      if (user) {
        try {
          await setDoc(
            doc(db, "users", user.uid),
            { cart: updatedCart },
            { merge: true }
          );
        } catch (err) {
          console.error("❌ Failed to sync updated cart to Firestore:", err);
        }
      }

      navigate("/dashboard/DashCheckout", { state: { cart: updatedCart } });
    }
  };

  const handlePayment = async () => {
    if (!stripe || !elements) return;
    setIsProcessing(true);

    try {
      console.log("functions object:", functions);
      const createPaymentIntent = httpsCallable(
        functions,
        "createPaymentIntent"
      );
      const cents = Math.round(totalPrice * 100) || 0;
      console.log("totalPrice:", totalPrice);
      console.log("amount in cents:", Math.round(totalPrice * 100));

      const response = await createPaymentIntent({ amount: cents });
      const clientSecret = response.data.clientSecret;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: cardholderName,
          },
        },
      });

      if (result.error) {
        alert(`❌ Payment failed: ${result.error.message}`);
      } else if (result.paymentIntent.status === "succeeded") {
        setPaymentSuccess(true);

        // store in firebase
        const user = auth.currentUser;
        if (user) {
          try {
            // 1. Save payment record
            await addDoc(collection(db, "users", user.uid, "payments"), {
              amount: totalPrice,
              originalAmount: Number(baseTotal.toFixed(2)),
              discountCode: discountCode || null,
              appliedDiscount: appliedDiscount || null,
              cart: cartItems,
              createdAt: Timestamp.now(),
              paymentIntentId: result.paymentIntent.id,
              status: result.paymentIntent.status,
              planLabel: cartItems
                .map((item) => `${item.packageType} (${item.title})`)
                .join(", "),
            });

            // 2. Process date purchase transactionally
            const purchaseResult = await processDatePurchase(
              user.uid, 
              cartItems, 
              result.paymentIntent.id, 
              totalPrice
            );
            
            console.log("✅ Date purchase processed:", purchaseResult);
            
            // Validate purchase result
            if (!purchaseResult.success) {
              throw new Error("Failed to process date purchase");
            }
            
            // Log purchase details for debugging
            console.log("📊 Purchase Summary:", {
              totalAmount: totalPrice,
              datesAdded: purchaseResult.totalDatesPurchased,
              previousDates: purchaseResult.previousDates,
              newDates: purchaseResult.newDates,
              cartItems: cartItems.map(item => ({
                title: item.title,
                quantity: item.quantity,
                numDates: item.numDates || 1,
                totalDates: (item.quantity || 1) * (item.numDates || 1)
              }))
            });
            
            // 3. Update discount code usage count if applicable
            if (appliedDiscount && appliedDiscount.code) {
              try {
                const discountRef = doc(db, "discounts", appliedDiscount.code);
                await updateDoc(discountRef, {
                  usageCount: increment(1)
                });
                console.log("✅ Discount usage count updated");
              } catch (error) {
                console.error("❌ Failed to update discount usage count:", error);
              }
            }
            
            // 4. Clear cart after successful purchase
            await setDoc(
              doc(db, "users", user.uid),
              { cart: [] },
              { merge: true }
            );
            
            // 5. Show success message with dates added
            alert(`🎉 Purchase successful! ${purchaseResult.totalDatesPurchased} dates added to your account.`);
            
            // 6. Dispatch event to refresh dates remaining in other components
            window.dispatchEvent(new CustomEvent('datesUpdated', {
              detail: {
                newDatesRemaining: purchaseResult.newDates,
                datesAdded: purchaseResult.totalDatesPurchased
              }
            }));
            
          } catch (e) {
            console.error("Error processing purchase:", e);
            alert("❌ Payment processed but there was an error updating your dates. Please contact support.");
          }
        }
      }
      setPurchasedCart(cartItems);
      setCart([]);
    } catch (err) {
      console.error("Stripe error:", err);
      alert("An error occurred during payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen px-2 sm:px-4 md:px-8 lg:px-10 py-6 md:py-10 bg-white rounded-3xl border border-gray-50 shadow-lg">
      {isProcessing && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex flex-col justify-center items-center z-50">
          <svg
            className="animate-spin h-10 w-10 text-blue-600 mb-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <p className="text-lg font-medium text-[#0043F1]">
            Processing your payment...
          </p>
        </div>
      )}

      <h2
        className={`text-3xl md:text-4xl font-semibold mb-6 md:mb-8 ${
          paymentSuccess ? "text-4xl md:text-5xl text-center w-full mb-10" : "text-black"
        }`}
      >
        {paymentSuccess ? "Confirmation of Purchase" : "Checkout Details"}
      </h2>

      {/* Responsive layout */}
      <div className="flex flex-col lg:flex-row w-full max-w-full min-h-[600px] gap-8 md:gap-16 lg:gap-20 xl:gap-28">
        {/* Left Side - Payment Form */}
        <div className="w-full lg:w-2/3 h-full">
          {paymentSuccess ? (
            <div className="flex flex-col justify-start w-full">
              <p className="text-[22px] md:text-[26px] font-light text-black mt-10 md:mt-20 ml-0 md:ml-20">
                Congrats! You just bought this.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[#000000] text-[18px] md:text-[22px] lg:text-[24px] mb-6 md:mb-9">
                Fill in the information below to complete your purchase.
              </p>

              <div className="mt-8 md:mt-20">
                <div className="mb-6 md:mb-8">
                  <label className="block text-[16px] md:text-[20px] text-gray-600">
                    Cardholder's Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg text-[15px] md:text-[16px]"
                    placeholder="Full Name"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                  />
                </div>

                <div className="mb-6 md:mb-8">
                  <label className="block text-[16px] md:text-[20px] text-gray-600 mb-2">
                    Card Information
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 md:p-4 bg-white">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: "15px",
                            color: "#333",
                            "::placeholder": { color: "#bbb" },
                          },
                          invalid: {
                            color: "#e5424d",
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="mb-6 md:mb-8">
                  <label className="block text-[16px] md:text-[20px] text-gray-600">
                    Discount Code
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      className={`w-full p-3 border border-gray-300 rounded-lg text-[15px] md:text-[16px] ${
                        appliedDiscount ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter code"
                      disabled={appliedDiscount}
                    />
                    <button
                      className={`ml-2 px-4 py-2 rounded-lg text-[15px] md:text-[16px] ${
                        !discountCode || appliedDiscount
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                      onClick={handleApplyDiscount}
                      disabled={!discountCode || appliedDiscount}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <button
                  className="w-full mt-5 bg-[#0043F1] text-white py-3 md:py-4 rounded-lg text-[16px] md:text-lg hover:bg-blue-600 font-semibold font-poppins shadow"
                  onClick={handlePayment}
                >
                  Pay
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Side - Summary Box */}
        <div className="w-full lg:w-2/5 bg-[#F8FAFF] p-5 md:p-8 rounded-2xl shadow-md min-h-[400px] flex flex-col justify-between border border-gray-100">
          <div>
            <p className="text-[16px] md:text-[20px] font-medium text-gray-600 mb-2">
              {paymentSuccess ? "You bought:" : "You're paying,"}
            </p>
            <p className="text-[36px] md:text-[48px] lg:text-[60px] font-bold text-[#0043F1]">${totalPrice.toFixed(2)}</p>

            <div className="mt-4">
              {cartItems.map((plan, index) => (
                <div
                  key={index}
                  className="relative group flex justify-between items-start pb-2 mb-2"
                >
                  <div className="flex flex-col">
                    <p className="font-bold text-[18px] md:text-[22px] lg:text-[26px] leading-tight text-[#211F20]">
                      {`${plan.quantity * (plan.numDates || 1)} x ${
                        plan.packageType === "Bundle" ? "Bundle Date" : "Date"
                      }${plan.quantity * (plan.numDates || 1) > 1 ? "s" : ""}`}
                    </p>
                    <p className="text-gray-600 text-[15px] md:text-[18px] lg:text-[20px] font-poppins">{plan.venue}</p>
                  </div>

                  {/* Right column: price and trash icon */}
                  <div className="w-[90px] md:w-[120px] lg:w-[160px] flex justify-end items-center gap-3 pt-1">
                    <p className="text-[16px] md:text-[20px] lg:text-[24px] font-semibold text-[#0043F1]">
                      ${parseFloat(plan.price.replace("$", "")).toFixed(2)}
                    </p>
                    {!paymentSuccess && (
                      <button
                        onClick={() =>
                          handleRemoveItem(
                            plan.title,
                            plan.venue,
                            plan.packageType
                          )
                        }
                        className="text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <FaTrash size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {appliedDiscount && (
              <div className="flex justify-between items-center mt-5">
                <div className="flex flex-col text-green-700 text-[15px] md:text-[18px] lg:text-[20px]">
                  <div className="inline-flex items-center bg-gray-300 text-gray-800 px-3 py-1.5 rounded-md text-[13px] md:text-[15px] lg:text-[16px] font-semibold w-fit">
                    <FaTag className="mr-2 text-gray-600" />
                    {discountCode.toUpperCase()}
                    <button
                      onClick={handleRemoveDiscount}
                      className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                      title="Remove discount"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="mt-1 text-gray-500 text-[13px] md:text-[15px] lg:text-[16px]">
                    {appliedDiscount.type === 'percentage'
                      ? `${appliedDiscount.value}% off`
                      : appliedDiscount.type === 'fixed'
                      ? `$${appliedDiscount.value.toFixed(2)} off`
                      : appliedDiscount.percentOff
                      ? `${appliedDiscount.percentOff}% off`
                      : `$${appliedDiscount.amountOff.toFixed(2)} off`}
                  </div>
                </div>

                <div className="w-[90px] md:w-[120px] lg:w-[160px] flex justify-end items-center gap-3">
                  <p className="text-[16px] md:text-[20px] lg:text-[24px] text-gray-500">
                    -${(baseTotal - totalPrice).toFixed(2)}
                  </p>
                  <div className="w-[18px]" />
                </div>
              </div>
            )}

            <hr className="my-3 border-gray-300" />

            <div className="mt-5 flex justify-between items-center">
              <div className="text-[18px] md:text-[22px] lg:text-[26px] font-semibold">Tax</div>
              <div className="w-[90px] md:w-[120px] lg:w-[160px] flex justify-end items-center gap-3">
                <p className="text-[16px] md:text-[20px] lg:text-[24px] text-gray-700 font-medium">$0.00</p>
                <div className="w-[18px]" />
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <div className="text-[18px] md:text-[22px] lg:text-[26px] font-semibold">Total</div>
              <div className="w-[90px] md:w-[120px] lg:w-[160px] flex justify-end items-center gap-3">
                <p className="text-[16px] md:text-[20px] lg:text-[24px] font-bold text-[#0043F1]">
                  ${totalPrice.toFixed(2)}
                </p>
                <div className="w-[18px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Code Modal */}
      <PopUp
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        title="Discount Code"
        subtitle={discountMessage}
        icon={discountMessage.includes("✅") ? "✅" : "❌"}
        iconColor={discountMessage.includes("✅") ? "green" : "red"}
        maxWidth="max-w-sm"
        primaryButton={{
          text: "OK",
          onClick: () => setShowDiscountModal(false)
        }}
      />
    </div>
  );
};

export default DashCheckout;

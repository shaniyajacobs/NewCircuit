import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTag, FaTrash } from "react-icons/fa";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { httpsCallable } from "firebase/functions";
import { collection, doc, getDoc, addDoc, setDoc, Timestamp } from "firebase/firestore";
import { db, auth, functions } from "../../../firebaseConfig";

const parsePrice = (priceStr) => parseFloat(priceStr?.replace("$", "")) || 0;

const calculateTotal = (items, discount) => {
  const base = items.reduce((sum, plan) => sum + parsePrice(plan.price), 0);
  if (!discount) return Number(base.toFixed(2));

  let discounted = base;
  if (discount.amountOff) discounted = Math.max(0, base - discount.amountOff);
  else if (discount.percentOff)
    discounted = Math.max(0, base * (1 - discount.percentOff / 100));

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
    if (!discountCode) return alert("Please enter a discount code.");

    try {
      const discountRef = doc(db, "discounts", discountCode.toUpperCase());
      const discountSnap = await getDoc(discountRef);

      if (discountSnap.exists()) {
        const discountData = discountSnap.data();
        setAppliedDiscount(discountData);
        alert("✅ Discount applied!");
      } else {
        alert("❌ Invalid discount code.");
      }
    } catch (err) {
      console.error("Error checking discount code:", err);
      alert("Error checking discount code.");
    }
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
            await setDoc(
              doc(db, "users", user.uid),
              { cart: [] },
              { merge: true }
            );
          } catch (e) {
            console.error("Error saving payment to Firestore:", e);
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
    <div className="flex flex-col w-full min-h-screen px-10 py-10 bg-white rounded-3xl border border-gray-50 shadow-lg">
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
        className={`text-4xl font-semibold mb-8 ${
          paymentSuccess ? "text-5xl text-center w-full mb-10" : "text-black"
        }`}
      >
        {paymentSuccess ? "Confirmation of Purchase" : "Checkout Details"}
      </h2>

      {/* Left Side - Payment Form */}
      <div className="flex w-full max-w-full min-h-[800px] gap-28">
        <div className="w-2/3 h-full gap-28">
          {paymentSuccess ? (
            <div className="flex flex-col justify-start w-full">
              <p className="text-[26px] font-light text-black mt-20 ml-20">
                Congrats! You just bought this.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[#000000] text-[24px] mb-9">
                Fill in the information below to complete your purchase.
              </p>

              <div className="mt-20">
                <div className="mb-8">
                  <label className="block text-[20px] text-gray-600">
                    Cardholder's Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Full Name"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-[20px] text-gray-600 mb-2">
                    Card Information
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 bg-white">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: "16px",
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

                <div className="mb-8">
                  <label className="block text-[20px] text-gray-600">
                    Discount Code
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter code"
                    />
                    <button
                      className={`ml-2 px-4 py-2 rounded-lg ${
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
                  className="w-full mt-5 bg-[#0043F1] text-white py-4 rounded-lg text-lg hover:bg-blue-600"
                  onClick={handlePayment}
                >
                  Pay
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Side - Summary Box */}
        <div className="w-2/5 bg-[#F0F0F0] p-8 rounded-lg shadow-md min-h-[600px] flex flex-col justify-between">
          <div>
            <p className="text-[20px] font-medium text-gray-600">
              {paymentSuccess ? "You bought:" : "You're paying,"}
            </p>
            <p className="text-[60px] font-bold">${totalPrice.toFixed(2)}</p>

            <div className="mt-4">
              {cartItems.map((plan, index) => (
                <div
                  key={index}
                  className="relative group flex justify-between items-start pb-2 mb-2"
                >
                  <div className="flex flex-col">
                    <p className="font-bold text-[26px] leading-tight">
                      {`${plan.quantity * (plan.numDates || 1)} x ${
                        plan.packageType === "Bundle" ? "Bundle Date" : "Date"
                      }${plan.quantity * (plan.numDates || 1) > 1 ? "s" : ""}`}
                    </p>
                    <p className="text-gray-600 text-[20px]">{plan.venue}</p>
                  </div>

                  {/* Right column: price and trash icon */}
                  <div className="w-[160px] flex justify-end items-center gap-3 pt-1">
                    <p className="text-[24px] font-semibold">
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
                <div className="flex flex-col text-green-700 text-[20px]">
                  <div className="inline-flex items-center bg-gray-300 text-gray-800 px-3 py-1.5 rounded-md text-[16px] font-semibold w-fit">
                    <FaTag className="mr-2 text-gray-600" />
                    {discountCode.toUpperCase()}
                  </div>
                  <div className="mt-1 text-gray-500 text-[16px]">
                    {appliedDiscount.percentOff
                      ? `${appliedDiscount.percentOff}% off`
                      : `$${appliedDiscount.amountOff.toFixed(2)} off`}
                  </div>
                </div>

                <div className="w-[160px] flex justify-end items-center gap-3">
                  <p className="text-[24px] text-gray-500">
                    -${(baseTotal - totalPrice).toFixed(2)}
                  </p>
                  <div className="w-[18px]" />
                </div>
              </div>
            )}

            <hr className="my-3 border-gray-400" />

            <div className="mt-5 flex justify-between items-center">
              <div className="text-[26px] font-semibold">Tax</div>
              <div className="w-[160px] flex justify-end items-center gap-3">
                <p className="text-[24px] text-gray-700 font-medium">$0.00</p>
                <div className="w-[18px]" />
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <div className="text-[26px] font-semibold">Total</div>
              <div className="w-[160px] flex justify-end items-center gap-3">
                <p className="text-[24px] font-bold">
                  ${totalPrice.toFixed(2)}
                </p>
                <div className="w-[18px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashCheckout;

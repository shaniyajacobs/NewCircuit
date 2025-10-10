import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaTag, FaTrash } from "react-icons/fa";
import { httpsCallable } from "firebase/functions";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  PayPalCardFieldsProvider,
  PayPalCVVField,
  PayPalExpiryField,
  PayPalNameField,
  PayPalNumberField,
  PayPalScriptProvider,
  usePayPalCardFields,
} from "@paypal/react-paypal-js";

import { db, auth, functions } from "../../../firebaseConfig";
import { processDatePurchase } from "../../../utils/eventSpotsUtils";

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

  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [purchasedCart, setPurchasedCart] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentClientId, setPaymentClientId] = useState(undefined);

  const initialOptions = {
    "client-id": paymentClientId,
    "enable-funding": "venmo",
    "disable-funding": "",
    // "buyer-country": "US",
    currency: "USD",
    "data-page-type": "product-details",
    components: "buttons,card-fields",
    "data-sdk-integration-source": "developer-studio",
  };

  useEffect(() => {
    const getClient = async () => {
      try {
        const createPaymentClient = httpsCallable(functions, "paymentClientId");
        const response = await createPaymentClient();
        if (response?.data?.clientId) {
          setPaymentClientId(response?.data?.clientId);
        } else {
          alert("Payment is not ready");
        }
      } catch (error) {
        console.log("get client error", error);
        alert("Payment is not ready");
      }
    };
    getClient();
  }, []);

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

  const onSaveDB = async (result) => {
    try {
      if (result.status === "COMPLETED") {
        //store in firebase
        const user = auth.currentUser;
        if (user) {
          try {
            //1. Save payment record
            await addDoc(collection(db, "users", user.uid, "payments"), {
              amount: totalPrice,
              originalAmount: Number(baseTotal.toFixed(2)),
              discountCode: discountCode || null,
              appliedDiscount: appliedDiscount || null,
              cart: cartItems,
              createdAt: Timestamp.now(),
              paymentIntentId: result.id,
              status: result.status,
              planLabel: cartItems
                .map((item) => `${item.packageType} (${item.title})`)
                .join(", "),
            });

            // 2. Process date purchase transactionally
            const purchaseResult = await processDatePurchase(
              user.uid,
              cartItems,
              result.id,
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
              cartItems: cartItems.map((item) => ({
                title: item.title,
                quantity: item.quantity,
                numDates: item.numDates || 1,
                totalDates: (item.quantity || 1) * (item.numDates || 1),
              })),
            });

            // 3. Clear cart after successful purchase
            await setDoc(
              doc(db, "users", user.uid),
              { cart: [] },
              { merge: true }
            );

            setIsProcessing(false);
            setPaymentSuccess(true);

            // 4. Show success message with dates added
            alert(
              `🎉 Purchase successful! ${purchaseResult.totalDatesPurchased} dates added to your account.`
            );

            // 5. Dispatch event to refresh dates remaining in other components
            window.dispatchEvent(
              new CustomEvent("datesUpdated", {
                detail: {
                  newDatesRemaining: purchaseResult.newDates,
                  datesAdded: purchaseResult.totalDatesPurchased,
                },
              })
            );
          } catch (e) {
            console.error("Error processing purchase:", e);
            alert(
              "❌ Payment processed but there was an error updating your dates. Please contact support."
            );
          }
        }
      }
      setPurchasedCart(cartItems);
      setCart([]);
    } catch (err) {
      console.error("Paypal error:", err);
      alert("An error occurred during payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  const createOrder = async () => {
    setIsProcessing(true);
    try {
      const createPayPalOrder = httpsCallable(functions, "createPayPalOrder");
      const response = await createPayPalOrder({
        amount: totalPrice,
      });

      const orderData = response?.data;

      if (orderData.id) {
        return orderData.id;
      } else {
        const errorDetail = orderData?.details?.[0];
        const errorMessage = errorDetail
          ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
          : JSON.stringify(orderData);

        console.error(errorMessage);
        alert(errorMessage);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error(error);
      alert(`Could not initiate PayPal Checkout...${error}`);
      setIsProcessing(false);
    }
  };

  const onApproveCapture = async (data, actions) => {
    try {
      const capturePayPalOrder = httpsCallable(functions, "capturePayPalOrder");
      const response = await capturePayPalOrder({
        orderId: data.orderID,
      });

      onSaveDB(response.data);
    } catch (error) {
      alert(`Sorry, your transaction could not be processed...${error}`);
      setIsProcessing(false);
    }
  };

  const inputStyle = {
    input: {
      color: "#333",
      fontSize: "15px",
      height: "50px",
      lineHeight: "50px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
    },
    "::placeholder": {
      color: "#999",
      fontSize: "15px",
    },
    ":invalid": {
      color: "#e5424d",
      border: "1px solid #3b82f6",
    },
    ":focus": {
      border: "2px solid #3b82f6",
      boxShadow: "0 0 0 2px rgba(0, 112, 186, 0)",
    },
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
          paymentSuccess
            ? "text-4xl md:text-5xl text-center w-full mb-10"
            : "text-black"
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

              {paymentClientId && (
                <div className="mt-8 md:mt-20">
                  <PayPalScriptProvider options={initialOptions}>
                    <PayPalCardFieldsProvider
                      createOrder={createOrder}
                      onApprove={async (data, actions) => {
                        await onApproveCapture(data, actions);
                      }}
                    >
                      <div className="mb-6 md:mb-8">
                        <label className="block text-[16px] md:text-[20px] text-gray-600">
                          Cardholder's Name
                        </label>
                        <div className="border border-transparent rounded-lg  bg-white">
                          <PayPalNameField style={inputStyle} />
                        </div>
                      </div>

                      <div className="mb-6 md:mb-8">
                        <label className="block text-[16px] md:text-[20px] text-gray-600">
                          Card Information
                        </label>
                        <div className="border border-transparent rounded-md bg-white flex items-center">
                          <div style={{ flex: 1 }}>
                            <PayPalNumberField style={inputStyle} />
                          </div>

                          <div style={{ width: "110px", textAlign: "center" }}>
                            <PayPalExpiryField style={inputStyle} />
                          </div>

                          <div style={{ width: "70px", textAlign: "center" }}>
                            <PayPalCVVField style={inputStyle} />
                          </div>
                        </div>
                      </div>

                      <div className="mb-6 md:mb-8">
                        <label className="block text-[16px] md:text-[20px] text-gray-600 mb-[8px]">
                          Discount Code
                        </label>
                        <div className="flex mx-[5px]">
                          <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg text-[15px] md:text-[16px]"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="Enter code"
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

                      <SubmitPayment />
                    </PayPalCardFieldsProvider>
                  </PayPalScriptProvider>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Side - Summary Box */}
        <div className="w-full lg:w-2/5 bg-[#F8FAFF] p-5 md:p-8 rounded-2xl shadow-md min-h-[400px] flex flex-col justify-between border border-gray-100">
          <div>
            <p className="text-[16px] md:text-[20px] font-medium text-gray-600 mb-2">
              {paymentSuccess ? "You bought:" : "You're paying,"}
            </p>
            <p className="text-[36px] md:text-[48px] lg:text-[60px] font-bold text-[#0043F1]">
              ${totalPrice.toFixed(2)}
            </p>

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
                    <p className="text-gray-600 text-[15px] md:text-[18px] lg:text-[20px] font-poppins">
                      {plan.venue}
                    </p>
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
                  </div>
                  <div className="mt-1 text-gray-500 text-[13px] md:text-[15px] lg:text-[16px]">
                    {appliedDiscount.percentOff
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
              <div className="text-[18px] md:text-[22px] lg:text-[26px] font-semibold">
                Tax
              </div>
              <div className="w-[90px] md:w-[120px] lg:w-[160px] flex justify-end items-center gap-3">
                <p className="text-[16px] md:text-[20px] lg:text-[24px] text-gray-700 font-medium">
                  $0.00
                </p>
                <div className="w-[18px]" />
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              <div className="text-[18px] md:text-[22px] lg:text-[26px] font-semibold">
                Total
              </div>
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
    </div>
  );
};

const SubmitPayment = () => {
  const { cardFieldsForm } = usePayPalCardFields();

  const handleClick = async () => {
    if (!cardFieldsForm) {
      return alert("Payment internal issue");
    }
    const formState = await cardFieldsForm.getState();
    if (!formState.isFormValid) {
      return alert("The payment form is invalid");
    }

    cardFieldsForm.submit();
  };

  return (
    <button
      className="w-full mt-5 bg-[#0043F1] text-white py-3 md:py-4 rounded-lg text-[16px] md:text-lg hover:bg-blue-600 font-semibold font-poppins shadow"
      onClick={handleClick}
    >
      Pay
    </button>
  );
};

export default DashCheckout;

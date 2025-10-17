import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { FaTag } from 'react-icons/fa';
import { db } from '../../../firebaseConfig';
import { formatCartItemDisplay } from '../../../utils/dateTypeFormatter';

const DashOrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const validatePurchase = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          navigate('/login');
          return;
        }

        // Security: Check session token from navigation state
        const sessionToken = location.state?.sessionToken;
        const stateOrderData = location.state?.orderData;
        
        if (stateOrderData && sessionToken && stateOrderData.sessionToken === sessionToken) {
          setOrderData(stateOrderData);
        } else {
          // Fallback: Check recent completed payments (within 10 minutes)
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          const paymentsRef = collection(db, 'users', user.uid, 'payments');
          const recentPaymentsQuery = query(
            paymentsRef,
            where('createdAt', '>=', tenMinutesAgo),
            where('status', '==', 'COMPLETED'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          
          const recentPayments = await getDocs(recentPaymentsQuery);
          
          if (recentPayments.empty) {
            setError('Access denied. Please complete a purchase to view this page.');
            return;
          }
          
          setOrderData(recentPayments.docs[0].data());
        }
      } catch (err) {
        console.error('Purchase validation error:', err);
        setError('Failed to validate purchase confirmation');
      } finally {
        setLoading(false);
      }
    };

    validatePurchase();
  }, [navigate, location.state]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col w-full min-h-screen px-2 sm:px-4 md:px-8 lg:px-10 py-6 md:py-10 bg-white rounded-3xl border border-gray-50 shadow-lg">
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-lg font-medium text-[#0043F1]">Validating your purchase...</p>
        </div>
      </div>
    );
  }

  // Error state - access denied
  if (error) {
    return (
      <div className="flex flex-col w-full min-h-screen px-2 sm:px-4 md:px-8 lg:px-10 py-6 md:py-10 bg-white rounded-3xl border border-gray-50 shadow-lg">
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          {/* Error Modal styled to match app's error patterns */}
          <div className="relative bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-indigo-950">Access Denied</h2>
            </div>
            
            {/* Error icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center">
                <span className="text-red-500 text-2xl">🔒</span>
              </div>
            </div>
            
            <p className="text-gray-700 text-center mb-6">{error}</p>
            
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/dashboard/dashDateCalendar')}
                className="px-6 py-3 text-sm font-medium text-white bg-[#0043F1] rounded-lg hover:bg-[#0034BD] transition-colors"
              >
                Go to Date Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract order data for display
  const cartItems = orderData?.cart || [];
  const baseTotal = orderData?.originalAmount || 0;
  const totalPrice = orderData?.amount || 0;

  return (
    <div className="flex flex-col w-full min-h-screen px-2 sm:px-4 md:px-8 lg:px-10 py-6 md:py-10 bg-white rounded-3xl border border-gray-50 shadow-lg">
      {/* Success header with updated copy */}
      <h2 className="text-3xl md:text-4xl font-semibold mb-6 md:mb-8 text-black">
        Order Confirmation
      </h2>
      
      {/* Success message */}
      <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-green-600 text-2xl">🎉</span>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-green-800">You're charged up!</h3>
            <p className="text-green-700 mt-1">
              Head to the Home tab and find an event to power your next connection.
            </p>
          </div>
        </div>
      </div>

      {/* Proof of payment notice */}
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-yellow-600 text-lg">📄</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800 font-medium">
              Proof of Payment
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              This page serves as your receipt. Please save or screenshot this page for your records.
            </p>
          </div>
        </div>
      </div>

      {/* Order summary - exact same styling as checkout page */}
      <div className="w-full lg:w-2/5 bg-[#F8FAFF] p-5 md:p-8 rounded-2xl shadow-md min-h-[400px] flex flex-col justify-between border border-gray-100 mx-auto">
        <div>
          <p className="text-[16px] md:text-[20px] font-medium text-gray-600 mb-2">
            You bought:
          </p>
          <p className="text-[36px] md:text-[48px] lg:text-[60px] font-bold text-[#0043F1]">
            ${totalPrice.toFixed(2)}
          </p>

          {/* Cart items with exact checkout styling */}
          <div className="mt-4">
            {cartItems.map((plan, index) => (
              <div
                key={index}
                className="relative group flex justify-between items-start pb-2 mb-2"
              >
                <div className="flex flex-col">
                  <p className="font-bold text-[18px] md:text-[22px] lg:text-[26px] leading-tight text-[#211F20]">
                    {formatCartItemDisplay(plan)}
                  </p>
                  <p className="text-gray-600 text-[15px] md:text-[18px] lg:text-[20px] font-poppins">
                    {plan.venue}
                  </p>
                </div>

                <div className="w-[90px] md:w-[120px] lg:w-[160px] flex justify-end items-center gap-3 pt-1">
                  <p className="text-[16px] md:text-[20px] lg:text-[24px] font-semibold text-[#0043F1]">
                    ${parseFloat(plan.price.replace("$", "")).toFixed(2)}
                  </p>
                  <div className="w-[18px]" />
                </div>
              </div>
            ))}
          </div>

          {/* Discount display - if applied */}
          {orderData?.appliedDiscount && (
            <div className="flex justify-between items-center mt-5">
              <div className="flex flex-col text-green-700 text-[15px] md:text-[18px] lg:text-[20px]">
                <div className="inline-flex items-center bg-gray-300 text-gray-800 px-3 py-1.5 rounded-md text-[13px] md:text-[15px] lg:text-[16px] font-semibold w-fit">
                  <FaTag className="mr-2 text-gray-600" />
                  {orderData.discountCode?.toUpperCase()}
                </div>
                <div className="mt-1 text-gray-500 text-[13px] md:text-[15px] lg:text-[16px]">
                  {orderData.appliedDiscount.type === 'percentage'
                    ? `${orderData.appliedDiscount.value}% off`
                    : orderData.appliedDiscount.type === 'fixed'
                    ? `$${orderData.appliedDiscount.value.toFixed(2)} off`
                    : orderData.appliedDiscount.percentOff
                      ? `${orderData.appliedDiscount.percentOff}% off`
                      : `$${orderData.appliedDiscount.amountOff.toFixed(2)} off`}
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

          {/* Tax and total - exact checkout styling */}
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

          {/* Payment Method Information */}
          {orderData?.paymentMethod && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-[16px] md:text-[18px] lg:text-[20px] font-medium text-gray-600">
                  Payment Method
                </div>
                <div className="text-[14px] md:text-[16px] lg:text-[18px] text-gray-700">
                  {orderData.paymentMethod.type === 'card' ? (
                    <div className="text-right">
                      <div className="font-medium">
                        {orderData.paymentMethod.brand?.toUpperCase()} •••• {orderData.paymentMethod.last4}
                      </div>
                    </div>
                  ) : orderData.paymentMethod.type === 'paypal' ? (
                    <div className="text-right">
                      <div className="font-medium">PayPal</div>
                      <div className="text-sm text-gray-500">{orderData.paymentMethod.email}</div>
                    </div>
                  ) : (
                    <span className="font-medium">Payment Processed</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Transaction ID */}
          {orderData?.paymentIntentId && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-[14px] md:text-[16px] text-gray-500">
                  Transaction ID
                </div>
                <div className="text-[12px] md:text-[14px] text-gray-600 font-mono">
                  {orderData.paymentIntentId}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashOrderConfirmation;
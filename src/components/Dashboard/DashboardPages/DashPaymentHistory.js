import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { FaTag } from 'react-icons/fa';
import { db } from '../../../firebaseConfig';
import { formatCartItemDisplay } from '../../../utils/dateTypeFormatter';

const DashPaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          navigate('/login');
          return;
        }

        // Fetch payments from Firebase, ordered by date (newest first)
        const paymentsRef = collection(db, 'users', user.uid, 'payments');
        const paymentsQuery = query(
          paymentsRef,
          where('status', '==', 'COMPLETED'),
          orderBy('createdAt', 'desc')
        );
        
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsData = paymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setPayments(paymentsData);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [navigate]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatPaymentMethod = (paymentMethod) => {
    if (!paymentMethod) return 'N/A';
    
    if (paymentMethod.type === 'card') {
      return `${paymentMethod.brand?.toUpperCase()} •••• ${paymentMethod.last4}`;
    } else if (paymentMethod.type === 'paypal') {
      return 'PayPal';
    } else if (paymentMethod.type === 'venmo') {
      return 'Venmo';
    } 
    return 'Payment Processed';
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full min-h-screen px-2 sm:px-4 md:px-8 lg:px-10 py-6 md:py-10 bg-white rounded-3xl border border-gray-50 shadow-lg">
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-lg font-medium text-[#0043F1]">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full min-h-screen px-2 sm:px-4 md:px-8 lg:px-10 py-6 md:py-10 bg-white rounded-3xl border border-gray-50 shadow-lg">
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          {/* Error Modal styled to match app's error patterns */}
          <div className="relative bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-indigo-950">Error</h2>
            </div>
            
            {/* Error icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center">
                <span className="text-red-500 text-2xl">❌</span>
              </div>
            </div>
            
            <p className="text-gray-700 text-center mb-6">{error}</p>
            
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/dashboard/dashSettings')}
                className="px-6 py-3 text-sm font-medium text-white bg-[#0043F1] rounded-lg hover:bg-[#0034BD] transition-colors"
              >
                Back to Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen px-2 sm:px-4 md:px-8 lg:px-10 py-6 md:py-10 bg-white rounded-3xl border border-gray-50 shadow-lg">
      <h2
        className="
          font-semibold
          text-[#211F20]
          leading-[110%]
          font-bricolage
          text-[24px] sm:text-[28px] md:text-[32px]
          mb-2
        "
      >
        Payment History
      </h2>

      {payments.length === 0 ? (
        <div className="flex flex-col justify-center items-center min-h-[400px] text-center">
          <div className="text-gray-400 text-6xl mb-6">💳</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Payment History</h3>
          <p className="text-gray-500 mb-6">You haven't made any purchases yet.</p>
          <button
            onClick={() => navigate('/dashboard/dashDateCalendar')}
            className="bg-[#0043F1] text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Browse Date Packages
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-[#F8FAFF] p-5 md:p-8 rounded-2xl shadow-md border border-gray-100"
            >
              {/* Payment Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[16px] md:text-[20px] font-medium text-gray-600 mb-2">
                    Payment #{payment.id.slice(-8)}
                  </p>
                  <p className="text-[36px] md:text-[48px] lg:text-[60px] font-bold text-[#0043F1]">
                    ${payment.amount.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] md:text-[16px] text-gray-500">
                    {formatDate(payment.createdAt)}
                  </p>
                  <p className="text-[12px] md:text-[14px] text-gray-400 mt-1">
                    {formatPaymentMethod(payment.paymentMethod)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {payment.cart?.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start"
                  >
                    <div className="flex flex-col">
                      <p className="font-bold text-[18px] md:text-[22px] lg:text-[26px] leading-tight text-[#211F20]">
                        {formatCartItemDisplay(item)}
                      </p>
                      <p className="text-gray-600 text-[15px] md:text-[18px] lg:text-[20px] font-poppins">
                        {item.venue}
                      </p>
                    </div>
                    <div className="w-[90px] md:w-[120px] lg:w-[160px] flex justify-end items-center gap-3 pt-1">
                      <p className="text-[16px] md:text-[20px] lg:text-[24px] font-semibold text-[#0043F1]">
                        ${parseFloat(item.price.replace("$", "")).toFixed(2)}
                      </p>
                      <div className="w-[18px]" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Applied */}
              {payment.appliedDiscount && (
                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col text-green-700 text-[15px] md:text-[18px] lg:text-[20px]">
                    <div className="inline-flex items-center bg-gray-300 text-gray-800 px-3 py-1.5 rounded-md text-[13px] md:text-[15px] lg:text-[16px] font-semibold w-fit">
                      <FaTag className="mr-2 text-gray-600" />
                      {payment.discountCode?.toUpperCase()}
                    </div>
                    <div className="mt-1 text-gray-500 text-[13px] md:text-[15px] lg:text-[16px]">
                      {payment.appliedDiscount.type === 'percentage'
                        ? `${payment.appliedDiscount.value}% off`
                        : payment.appliedDiscount.type === 'fixed'
                        ? `$${payment.appliedDiscount.value.toFixed(2)} off`
                        : payment.appliedDiscount.percentOff
                          ? `${payment.appliedDiscount.percentOff}% off`
                          : `$${payment.appliedDiscount.amountOff.toFixed(2)} off`}
                    </div>
                  </div>
                  <div className="w-[90px] md:w-[120px] lg:w-[160px] flex justify-end items-center gap-3">
                    <p className="text-[16px] md:text-[20px] lg:text-[24px] text-gray-500">
                      -${(payment.originalAmount - payment.amount).toFixed(2)}
                    </p>
                    <div className="w-[18px]" />
                  </div>
                </div>
              )}

              <hr className="my-3 border-gray-300" />

              {/* Tax and Total */}
              <div className="flex justify-between items-center mb-4">
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

              <div className="flex justify-between items-center">
                <div className="text-[18px] md:text-[22px] lg:text-[26px] font-semibold">
                  Total
                </div>
                <div className="w-[90px] md:w-[120px] lg:w-[160px] flex justify-end items-center gap-3">
                  <p className="text-[16px] md:text-[20px] lg:text-[24px] font-bold text-[#0043F1]">
                    ${payment.amount.toFixed(2)}
                  </p>
                  <div className="w-[18px]" />
                </div>
              </div>

              {/* Transaction ID */}
              {payment.paymentIntentId && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-[14px] md:text-[16px] text-gray-500">
                      Transaction ID
                    </div>
                    <div className="text-[12px] md:text-[14px] text-gray-600 font-mono">
                      {payment.paymentIntentId}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashPaymentHistory;

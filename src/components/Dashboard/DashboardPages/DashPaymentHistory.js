import React from 'react';
import { useNavigate } from 'react-router-dom';

const DashPaymentHistory = () => {
  const navigate = useNavigate();

  const payments = [
    {
      id: "#222",
      date: "01/24/2025",
      plan: "Individual (Happy Hour)",
      amount: "$28"
    },
    {
      id: "#223",
      date: "01/29/2025",
      plan: "Individual (Happy Hour)",
      amount: "$28"
    },
    {
      id: "#226",
      date: "03/24/2025",
      plan: "Individual (Dinner)",
      amount: "$38"
    },
    {
      id: "#245",
      date: "05/01/2025",
      plan: "Individual (Happy Hour)",
      amount: "$38"
    }
  ];

  return (
    <div className="p-8 rounded-lg shadow-md w-full min-h-[calc(100vh-100px)] bg-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">PAYMENT HISTORY</h1>

        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 mb-6 px-6 text-gray-600 font-semibold">
          <div>Payment ID</div>
          <div>Billing date</div>
          <div>Plan</div>
          <div className="text-right">Amount</div>
        </div>

        {/* Payment Rows */}
        <div className="space-y-4">
          {payments.map((payment) => (
            <div 
              key={payment.id}
              className="grid grid-cols-4 gap-4 p-6 rounded-lg border border-gray-300 hover:border-[#0043F1]/20 hover:bg-[#0043F1]/5 transition-colors"
            >
              <div className="font-medium">{payment.id}</div>
              <div>{payment.date}</div>
              <div>{payment.plan}</div>
              <div className="text-right font-semibold">{payment.amount}</div>
            </div>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-12">
          <button
            onClick={() => navigate('/dashboard/dashSettings')}
            className="px-8 py-3 bg-[#0043F1] text-white rounded-lg hover:bg-[#0034BD] transition-colors font-medium"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashPaymentHistory;

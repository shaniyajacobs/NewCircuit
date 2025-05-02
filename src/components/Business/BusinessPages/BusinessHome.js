import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../pages/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { FaPlus, FaChartLine, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const BusinessHome = () => {
  const [summary, setSummary] = useState({
    activeCoupons: 0,
    totalRedeemed: 0,
    recentActivity: []
  });

  const auth = getAuth();
  const businessId = auth.currentUser?.uid;
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, where('businessId', '==', businessId));
      const querySnapshot = await getDocs(q);

      let totalRedeemed = 0;
      let activeCoupons = 0;
      const now = new Date();

      querySnapshot.docs.forEach(doc => {
        const coupon = doc.data();
        totalRedeemed += coupon.redeemedCount || 0;
        if (new Date(coupon.validUntil) > now) {
          activeCoupons++;
        }
      });

      setSummary({
        activeCoupons,
        totalRedeemed,
        recentActivity: []
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const QuickActionCard = ({ icon: Icon, title, description, onClick, color }) => (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow text-left"
    >
      <div className={`p-3 rounded-lg ${color} w-fit mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-indigo-950 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </button>
  );

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-indigo-950">{value}</p>
    </div>
  );

  return (
    <div>
      <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5 mb-6">
        <h1 className="text-3xl font-semibold text-indigo-950 mb-8">Welcome Back!</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            icon={FaChartLine}
            title="Active Coupons"
            value={summary.activeCoupons}
            color="bg-blue-500"
          />
          <StatCard
            icon={FaUsers}
            title="Total Redeemed"
            value={summary.totalRedeemed}
            color="bg-green-500"
          />
        </div>
      </div>

      <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5 mb-6">
        <h2 className="text-2xl font-semibold text-indigo-950 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            icon={FaPlus}
            title="Create New Coupon"
            description="Add a new coupon to attract more customers"
            onClick={() => navigate('/enterprise-dash/coupons')}
            color="bg-blue-500"
          />
          <QuickActionCard
            icon={FaChartLine}
            title="View Analytics"
            description="Check your business performance metrics"
            onClick={() => navigate('/enterprise-dash/analytics')}
            color="bg-green-500"
          />
          <QuickActionCard
            icon={FaUsers}
            title="Manage Profile"
            description="Update your business information"
            onClick={() => navigate('/enterprise-dash/profile')}
            color="bg-purple-500"
          />
        </div>
      </div>

      <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
        <h2 className="text-xl font-semibold text-indigo-950 mb-4">Recent Activity</h2>
        {summary.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {summary.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaChartLine className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-800">{activity.description}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default BusinessHome;

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../pages/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { FaUsers, FaChartLine, FaMoneyBillWave, FaTicketAlt } from 'react-icons/fa';

const BusinessAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalCoupons: 0,
    totalRedeemed: 0,
    totalRevenue: 0,
    activeCoupons: 0,
    recentRedemptions: []
  });

  const auth = getAuth();
  const businessId = auth.currentUser?.uid;

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, where('businessId', '==', businessId));
      const querySnapshot = await getDocs(q);
      
      let totalRedeemed = 0;
      let totalRevenue = 0;
      let activeCoupons = 0;
      const now = new Date();

      querySnapshot.docs.forEach(doc => {
        const coupon = doc.data();
        totalRedeemed += coupon.redeemedCount || 0;
        totalRevenue += coupon.totalRevenue || 0;
        if (new Date(coupon.validUntil) > now) {
          activeCoupons++;
        }
      });

      setAnalytics({
        totalCoupons: querySnapshot.size,
        totalRedeemed,
        totalRevenue,
        activeCoupons,
        recentRedemptions: [] // This would be populated from a separate collection tracking redemptions
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

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
    <div className="p-7 pt-3 min-h-screen">
      <div className="bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] p-7">
        <h1 className="text-3xl font-semibold text-indigo-950 mb-8">Business Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FaTicketAlt}
            title="Total Coupons"
            value={analytics.totalCoupons}
            color="bg-blue-500"
          />
          <StatCard
            icon={FaUsers}
            title="Total Redeemed"
            value={analytics.totalRedeemed}
            color="bg-green-500"
          />
          <StatCard
            icon={FaMoneyBillWave}
            title="Total Revenue"
            value={`$${analytics.totalRevenue}`}
            color="bg-purple-500"
          />
          <StatCard
            icon={FaChartLine}
            title="Active Coupons"
            value={analytics.activeCoupons}
            color="bg-yellow-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-indigo-950 mb-4">Revenue Overview</h2>
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Revenue chart will be implemented here</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-indigo-950 mb-4">Redemption Trends</h2>
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Redemption trends chart will be implemented here</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-indigo-950 mb-4">Recent Redemptions</h2>
            {analytics.recentRedemptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Coupon</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentRedemptions.map((redemption, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-600">{redemption.date}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{redemption.coupon}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{redemption.customer}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">${redemption.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent redemptions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalytics; 
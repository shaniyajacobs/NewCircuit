import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../pages/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { FaUsers, FaChartLine, FaTicketAlt, FaEdit, FaTrash } from 'react-icons/fa';

const BusinessAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalCoupons: 0,
    totalRedeemed: 0,
    activeCoupons: 0,
    recentRedemptions: []
  });
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const auth = getAuth();
  const businessId = auth.currentUser?.uid;

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, where('businessId', '==', businessId));
      const querySnapshot = await getDocs(q);
      
      let totalRedeemed = 0;
      let activeCoupons = 0;
      const now = new Date();

      const couponsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      couponsList.forEach(coupon => {
        totalRedeemed += coupon.redeemedCount || 0;
        if (new Date(coupon.validUntil) > now) {
          activeCoupons++;
        }
      });

      setAnalytics({
        totalCoupons: querySnapshot.size,
        totalRedeemed,
        activeCoupons,
        recentRedemptions: [] // This would be populated from a separate collection tracking redemptions
      });
      setCoupons(couponsList);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
        <h1 className="text-3xl font-semibold text-indigo-950 mb-8">Business Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            icon={FaChartLine}
            title="Active Coupons"
            value={analytics.activeCoupons}
            color="bg-yellow-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-indigo-950 mb-4">Coupon Performance</h2>
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Coupon performance chart will be implemented here</p>
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
            <h2 className="text-xl font-semibold text-indigo-950 mb-4">My Coupons</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupon</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Redeemed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8">
                        <div className="text-gray-500">Loading coupons...</div>
                      </td>
                    </tr>
                  ) : coupons.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8">
                        <div className="text-gray-500">No coupons found.</div>
                      </td>
                    </tr>
                  ) : (
                    coupons.map((coupon) => {
                      const isValid = new Date(coupon.validUntil) > new Date();
                      return (
                        <tr key={coupon.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{coupon.title}</div>
                              <div 
                                className="text-sm text-gray-500 max-w-xs truncate cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => {
                                  setSelectedCoupon(coupon);
                                  setShowDescriptionModal(true);
                                }}
                                title="Click to view full description"
                              >
                                {coupon.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-bold text-[#0043F1]">{coupon.discount}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(coupon.validUntil).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.redeemedCount || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${coupon.totalRevenue || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isValid ? 'Active' : 'Expired'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Description Modal */}
        {showDescriptionModal && selectedCoupon && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Description</h2>
                <button
                  onClick={() => setShowDescriptionModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{selectedCoupon.description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default BusinessAnalytics; 
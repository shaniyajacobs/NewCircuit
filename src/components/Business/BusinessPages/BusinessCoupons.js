import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../pages/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { FaPlus, FaEdit, FaTrash, FaChartLine } from 'react-icons/fa';

const BusinessCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  //const [showAddModal, setShowAddModal] = useState(false);
  //const [showEditModal, setShowEditModal] = useState(false);
  //const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [newCoupon, setNewCoupon] = useState({
    title: '',
    description: '',
    discount: '',
    validUntil: '',
    terms: ''
  });

  const auth = getAuth();
  const businessId = auth.currentUser?.uid;

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, where('businessId', '==', businessId));
      const querySnapshot = await getDocs(q);
      const couponsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCoupons(couponsList);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  /* const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      const couponData = {
        ...newCoupon,
        businessId,
        createdAt: new Date().toISOString(),
        redeemedCount: 0,
        totalRevenue: 0
      };
      await addDoc(collection(db, 'coupons'), couponData);
      setShowAddModal(false);
      setNewCoupon({
        title: '',
        description: '',
        discount: '',
        validUntil: '',
        terms: ''
      });
      fetchCoupons();
    } catch (error) {
      console.error('Error adding coupon:', error);
    }
  };

  const handleEditCoupon = async (e) => {
    e.preventDefault();
    try {
      const couponRef = doc(db, 'coupons', selectedCoupon.id);
      await updateDoc(couponRef, {
        title: selectedCoupon.title,
        description: selectedCoupon.description,
        discount: selectedCoupon.discount,
        validUntil: selectedCoupon.validUntil,
        terms: selectedCoupon.terms
      });
      setShowEditModal(false);
      fetchCoupons();
    } catch (error) {
      console.error('Error updating coupon:', error);
    }
  };

  const handleDeleteCoupon = async () => {
    try {
      await deleteDoc(doc(db, 'coupons', selectedCoupon.id));
      setShowDeleteModal(false);
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  }; */

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
      {/* <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-indigo-950">Coupons</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#0043F1] text-white rounded-xl hover:bg-[#0034BD] transition-colors"
        >
          <FaPlus />
          Add New Coupon
        </button>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-indigo-950">{coupon.title}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedCoupon(coupon);
                    setShowAnalyticsModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <FaChartLine />
                </button>
                <button
                  onClick={() => {
                    setSelectedCoupon(coupon);
                    //setShowEditModal(true);
                  }}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => {
                    setSelectedCoupon(coupon);
                    //setShowDeleteModal(true);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{coupon.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-[#0043F1]">{coupon.discount}</span>
              <span className="text-sm text-gray-500">Valid until: {new Date(coupon.validUntil).toLocaleDateString()}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Redeemed: {coupon.redeemedCount}</span>
                <span>Revenue: ${coupon.totalRevenue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Coupon Modal */}
      {/* {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-semibold mb-6">Add New Coupon</h2>
            <form onSubmit={handleAddCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newCoupon.title}
                  onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                <input
                  type="text"
                  value={newCoupon.discount}
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 20% off or $10 off"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={newCoupon.validUntil}
                  onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                <textarea
                  value={newCoupon.terms}
                  onChange={(e) => setNewCoupon({ ...newCoupon, terms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0043F1] text-white rounded-lg hover:bg-[#0034BD] transition-colors"
                >
                  Add Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}

      {/* Other Modals for Edit, Delete, and Analytics can follow a similar structure */}
    </div>
  );
};

export default BusinessCoupons;

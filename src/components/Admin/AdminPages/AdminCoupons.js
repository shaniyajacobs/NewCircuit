import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, addDoc, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../pages/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { FaPlus, FaEdit, FaTrash, FaChartLine, FaCheck, FaTimes } from 'react-icons/fa';
import PopUp from '../../Dashboard/DashboardHelperComponents/PopUp';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [newCoupon, setNewCoupon] = useState({
    title: '',
    description: '',
    discount: '',
    validUntil: '',
    terms: '',
    businessId: ''
  });
  
  // Request management state
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const auth = getAuth();
  const businessId = auth.currentUser?.uid;

  useEffect(() => {
    fetchCoupons();
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const businessesSnapshot = await getDocs(collection(db, 'businesses'));
      const businessesList = businessesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Only show active businesses that have a business name (same criteria as the management table)
      .filter(business => 
        business.isActive === true && 
        business.legalBusinessName && 
        business.legalBusinessName.trim() !== ''
      );
      setBusinesses(businessesList);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      console.log('Fetching coupons...');
      const couponsRef = collection(db, 'coupons');
      const querySnapshot = await getDocs(couponsRef);
      console.log('Coupons found:', querySnapshot.docs.length);
      
      const couponsList = querySnapshot.docs.map(doc => {
        const couponData = doc.data();
        console.log('Coupon data:', couponData);
        return {
          id: doc.id,
          ...couponData
        };
      });
      console.log('Processed coupons:', couponsList);
      setCoupons(couponsList);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.businessId) {
      alert('Please select a business');
      return;
    }
    try {
      // Fetch the business document to get the legalBusinessName
      const businessDoc = await getDoc(doc(db, 'businesses', newCoupon.businessId));
      if (!businessDoc.exists()) {
        alert('Selected business not found');
        return;
      }
      
      const businessData = businessDoc.data();
      const legalBusinessName = businessData.legalBusinessName || 'Unknown Business';
      
      const couponData = {
        ...newCoupon,
        legalBusinessName: legalBusinessName,
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
        terms: '',
        businessId: ''
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
  };

  // Fetch requests for a specific coupon
  const fetchRequests = async (couponId) => {
    setLoadingRequests(true);
    try {
      const requestsRef = collection(db, 'coupons', couponId, 'redemptions');
      const querySnapshot = await getDocs(requestsRef);
      const requestsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for pending requests only (status === 'redeemed')
      const pendingRequests = requestsList.filter(request => request.status === 'redeemed');
      
      // Fetch user names for pending requests only
      const requestsWithNames = await Promise.all(
        pendingRequests.map(async (request) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', request.redeemedBy));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User';
              return {
                ...request,
                userName: userName
              };
            } else {
              return {
                ...request,
                userName: 'Unknown User'
              };
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            return {
              ...request,
              userName: 'Unknown User'
            };
          }
        })
      );
      
      setRequests(requestsWithNames);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Handle showing requests modal
  const handleShowRequests = async (coupon) => {
    setSelectedCoupon(coupon);
    setShowRequestsModal(true);
    await fetchRequests(coupon.id);
  };

  // Approve request
  const handleApproveRequest = async (request) => {
    try {
      // Update the coupon's redeemedCount only after approval
      const couponRef = doc(db, 'coupons', selectedCoupon.id);
      await updateDoc(couponRef, {
        redeemedCount: increment(1)
      });
      
      // Update the request status to approved instead of deleting
      const requestRef = doc(db, 'coupons', selectedCoupon.id, 'redemptions', request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: auth.currentUser.uid
      });
      
      // Delete the dates from conversations collection so they can't be used again
      await deleteDatesFromConversations(request.date1, request.date2);
      
      // Refresh requests
      await fetchRequests(selectedCoupon.id);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  // Function to delete dates from conversations collection after approval
  const deleteDatesFromConversations = async (date1, date2) => {
    try {
      // Delete date1 from conversations collection
      if (date1 && date1.convoId && date1.id) {
        const convoRef = doc(db, 'conversations', date1.convoId);
        const convoDoc = await getDoc(convoRef);
        if (convoDoc.exists()) {
          const convoData = convoDoc.data();
          const updatedDates = convoData.dates.filter(d => d.id !== date1.id);
          await updateDoc(convoRef, { dates: updatedDates });
        }
      }

      // Delete date2 from conversations collection
      if (date2 && date2.convoId && date2.id) {
        const convoRef = doc(db, 'conversations', date2.convoId);
        const convoDoc = await getDoc(convoRef);
        if (convoDoc.exists()) {
          const convoData = convoDoc.data();
          const updatedDates = convoData.dates.filter(d => d.id !== date2.id);
          await updateDoc(convoRef, { dates: updatedDates });
        }
      }
    } catch (error) {
      console.error('Error deleting dates from conversations:', error);
    }
  };

  // Reject request
  const handleRejectRequest = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
    setRejectReason('');
  };

  // Confirm rejection
  const confirmRejectRequest = async () => {
    if (!rejectReason.trim()) return;
    
    setRejecting(true);
    try {
      // Update the request status to rejected instead of deleting
      const requestRef = doc(db, 'coupons', selectedCoupon.id, 'redemptions', selectedRequest.id);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: auth.currentUser.uid,
        rejectionReason: rejectReason.trim()
      });
      
      // Refresh requests
      await fetchRequests(selectedCoupon.id);
      setShowRejectModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setRejecting(false);
    }
  };

  // Handle image click
  const handleImageClick = (imageUrl, userName, dateNumber) => {
    setSelectedImage({
      url: imageUrl,
      userName: userName,
      dateNumber: dateNumber
    });
    setShowImageModal(true);
  };

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-indigo-950">Coupons</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#0043F1] text-white rounded-xl hover:bg-[#0034BD] transition-colors"
        >
          <FaPlus />
          Add New Coupon
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Redeemed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-8">
                  <div className="text-gray-500">Loading coupons...</div>
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-8">
                  <div className="text-gray-500">No coupons found. Create your first coupon!</div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.legalBusinessName}</td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleShowRequests(coupon)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        View Requests
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setSelectedCoupon(coupon);
                            setShowAnalyticsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Analytics"
                        >
                          <FaChartLine />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCoupon(coupon);
                            setShowEditModal(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit Coupon"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCoupon(coupon);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Coupon"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Coupon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-6">Add New Coupon</h2>
            <form onSubmit={handleAddCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
                <select
                  value={newCoupon.businessId}
                  onChange={(e) => setNewCoupon({ ...newCoupon, businessId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a business</option>
                  {businesses.map(business => (
                    <option key={business.id} value={business.id}>
                      {business.legalBusinessName}
                    </option>
                  ))}
                </select>
              </div>
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
      )}

      {/* Edit Coupon Modal */}
      {showEditModal && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-6">Edit Coupon</h2>
            <form onSubmit={handleEditCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={selectedCoupon.title}
                  onChange={(e) => setSelectedCoupon({ ...selectedCoupon, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedCoupon.description}
                  onChange={(e) => setSelectedCoupon({ ...selectedCoupon, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                <input
                  type="text"
                  value={selectedCoupon.discount}
                  onChange={(e) => setSelectedCoupon({ ...selectedCoupon, discount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={selectedCoupon.validUntil}
                  onChange={(e) => setSelectedCoupon({ ...selectedCoupon, validUntil: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                <textarea
                  value={selectedCoupon.terms}
                  onChange={(e) => setSelectedCoupon({ ...selectedCoupon, terms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0043F1] text-white rounded-lg hover:bg-[#0034BD] transition-colors"
                >
                  Update Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-semibold mb-4">Delete Coupon</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedCoupon.title}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={handleDeleteCoupon}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-semibold mb-4">Coupon Analytics</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedCoupon.title}</h3>
                <p className="text-sm text-gray-600">{selectedCoupon.businessName || selectedCoupon.business || 'Unknown Business'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedCoupon.redeemedCount || 0}</div>
                  <div className="text-sm text-blue-600">Times Redeemed</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">${selectedCoupon.totalRevenue || 0}</div>
                  <div className="text-sm text-green-600">Total Revenue</div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>Valid Until:</strong> {new Date(selectedCoupon.validUntil).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> {new Date(selectedCoupon.validUntil) > new Date() ? 'Active' : 'Expired'}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                onClick={() => setShowAnalyticsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Requests Modal */}
      {showRequestsModal && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Pending Requests for "{selectedCoupon.title}"</h2>
                              <button
                  onClick={() => setShowRequestsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingRequests ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading pending requests...</div>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No pending requests found for this coupon.</div>
              </div>
            ) : (
              <div className="space-y-6">
                {requests.map((request) => (
                                    <div key={request.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Request by {request.userName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Requested on {request.redeemedAt?.toDate?.() ? 
                            request.redeemedAt.toDate().toLocaleString() : 
                            new Date(request.redeemedAt).toLocaleString()}
                        </p>
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 bg-yellow-100 text-yellow-800">
                          Pending Review
                        </div>
                      </div>
                      
                      {request.status === 'redeemed' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveRequest(request)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Date Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Date 1 */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Date 1</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Date:</strong> {request.date1?.timestamp?.toDate?.() ? 
                            request.date1.timestamp.toDate().toLocaleString() : 
                            new Date(request.date1?.timestamp).toLocaleString()}</p>
                          <p><strong>Location:</strong> {request.date1?.location}</p>
                          <p><strong>Partner:</strong> {request.date1?.partnerName}</p>
                        </div>
                        
                        {/* Date 1 Photos */}
                        {request.date1?.photos && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-700 mb-2">Photos:</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(request.date1.photos).map(([userId, photoData]) => (
                                <div key={userId} className="text-center">
                                  <img 
                                    src={photoData.url} 
                                    alt={`Date 1 photo by ${userId}`}
                                    className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => handleImageClick(
                                      photoData.url, 
                                      userId === request.redeemedBy ? request.userName : request.date1.partnerName,
                                      1
                                    )}
                                  />
                                  <p className="text-xs text-gray-600 mt-1">
                                    {userId === request.redeemedBy ? 'You' : 'Partner'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Date 2 */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Date 2</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Date:</strong> {request.date2?.timestamp?.toDate?.() ? 
                            request.date2.timestamp.toDate().toLocaleString() : 
                            new Date(request.date2?.timestamp).toLocaleString()}</p>
                          <p><strong>Location:</strong> {request.date2?.location}</p>
                          <p><strong>Partner:</strong> {request.date2?.partnerName}</p>
                        </div>
                        
                        {/* Date 2 Photos */}
                        {request.date2?.photos && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-700 mb-2">Photos:</h5>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(request.date2.photos).map(([userId, photoData]) => (
                                <div key={userId} className="text-center">
                                  <img 
                                    src={photoData.url} 
                                    alt={`Date 2 photo by ${userId}`}
                                    className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => handleImageClick(
                                      photoData.url, 
                                      userId === request.redeemedBy ? request.userName : request.date2.partnerName,
                                      2
                                    )}
                                  />
                                  <p className="text-xs text-gray-600 mt-1">
                                    {userId === request.redeemedBy ? 'You' : 'Partner'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>


                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      <PopUp
        isOpen={showRejectModal && selectedRequest}
        onClose={() => setShowRejectModal(false)}
        title="Reject Request"
        subtitle="Please provide a reason for rejection:"
        icon="✗"
        iconColor="red"
        maxWidth="max-w-md"
        primaryButton={{
          text: rejecting ? 'Rejecting...' : 'Reject',
          onClick: confirmRejectRequest
        }}
        secondaryButton={{
          text: "Cancel",
          onClick: () => setShowRejectModal(false)
        }}
      >
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          rows="3"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          placeholder="Enter rejection reason..."
        />
      </PopUp>

      {/* Image Modal */}
      <PopUp
        isOpen={showImageModal && selectedImage}
        onClose={() => setShowImageModal(false)}
        title={`Date ${selectedImage?.dateNumber} - ${selectedImage?.userName}`}
        maxWidth="max-w-4xl"
      >
        <img
          src={selectedImage?.url}
          alt={`Date ${selectedImage?.dateNumber} photo by ${selectedImage?.userName}`}
          className="max-w-full max-h-[70vh] object-contain rounded"
        />
      </PopUp>
    </div>
  );
};

export default AdminCoupons;

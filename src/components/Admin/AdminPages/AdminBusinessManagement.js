import React, { useState, useEffect } from 'react';
import { db } from '../../../pages/firebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { FaSearch, FaTrash } from 'react-icons/fa';
import { IoMdCheckmark, IoMdClose } from 'react-icons/io';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { formatUserName } from '../../../utils/nameFormatter';

const AdminBusinessManagement = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const businessesSnapshot = await getDocs(collection(db, 'businesses'));
      const businessesList = businessesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBusinesses(businessesList);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBusiness = (business) => {
    setSelectedBusiness(business);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      
      const functions = getFunctions();
      const deleteBusinessFunction = httpsCallable(functions, 'deleteBusinessAsAdmin');
      
      await deleteBusinessFunction({ businessId: selectedBusiness.id });

      // Update local state
      setBusinesses(businesses.filter(business => business.id !== selectedBusiness.id));
      setShowDeleteModal(false);
      setSelectedBusiness(null);

    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Failed to delete business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business => 
    business.legalBusinessName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Business Management</h1>
        <div className="relative flex-1 sm:flex-none">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search businesses..."
            className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[200px]">Business Name</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[150px]">User Name</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[200px]">Email</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[100px]">Status</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 text-left font-medium text-gray-600 min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-600">Loading...</td>
                </tr>
              ) : filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-600">No businesses found.</td>
                </tr>
              ) : (
                filteredBusinesses.map(business => (
                  <tr key={business.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="truncate max-w-[200px] sm:max-w-[300px]" title={business.legalBusinessName}>
                        {business.legalBusinessName}
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="truncate max-w-[150px] sm:max-w-[200px]" title={formatUserName(business)}>
                        {formatUserName(business)}
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <div className="truncate max-w-[200px] sm:max-w-[250px]" title={business.email}>
                        {business.email}
                      </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        business.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {business.isActive ? <IoMdCheckmark className="mr-1" /> : <IoMdClose className="mr-1" />}
                        {business.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteBusiness(business)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                        title="Delete Business"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-md w-full mx-4">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Delete Business</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedBusiness?.legalBusinessName}? 
              This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors order-2 sm:order-1"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors order-1 sm:order-2"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBusinessManagement; 
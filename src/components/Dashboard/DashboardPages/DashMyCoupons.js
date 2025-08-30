import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../../../pages/firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  addDoc,
  increment
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { formatUserName } from '../../../utils/nameFormatter';

export default function DashMyCoupons() {
  const me = auth.currentUser.uid;

  const [conversations, setConversations] = useState([]);
  const [acceptedDates, setAcceptedDates] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [rejectedDates, setRejectedDates] = useState([]); // NEW
  const [showRejectedPopup, setShowRejectedPopup] = useState(false); // NEW
  const [showCouponModal, setShowCouponModal] = useState(false); // NEW
  const [selectedCoupon, setSelectedCoupon] = useState(null); // NEW
  const [coupons, setCoupons] = useState([]); // Fetch from Firebase
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showApprovedCouponsModal, setShowApprovedCouponsModal] = useState(false);
  const [approvedCoupons, setApprovedCoupons] = useState([]);
  const [loadingApprovedCoupons, setLoadingApprovedCoupons] = useState(false);
  const [showRejectedCouponsModal, setShowRejectedCouponsModal] = useState(false);
  const [rejectedCoupons, setRejectedCoupons] = useState([]);
  const [loadingRejectedCoupons, setLoadingRejectedCoupons] = useState(false);

  // Function to fetch coupons from Firebase
  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const couponsRef = collection(db, 'coupons');
      const querySnapshot = await getDocs(couponsRef);
      const couponsList = querySnapshot.docs.map(doc => {
        const couponData = doc.data();
        return {
          id: doc.id,
          ...couponData,
          businessName: couponData.legalBusinessName || 'Unknown Business'
        };
      });
      
      // Filter out coupons that have been approved by this user
      const approvedCouponIds = await getApprovedCouponIds();
      const availableCoupons = couponsList.filter(coupon => !approvedCouponIds.includes(coupon.id));
      
      setCoupons(availableCoupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Function to get IDs of coupons that have been approved by this user
  const getApprovedCouponIds = async () => {
    try {
      const approvedIds = [];
      const couponsRef = collection(db, 'coupons');
      const couponsSnapshot = await getDocs(couponsRef);
      
      for (const couponDoc of couponsSnapshot.docs) {
        const redemptionsRef = collection(db, 'coupons', couponDoc.id, 'redemptions');
        const redemptionsQuery = query(redemptionsRef, where('redeemedBy', '==', me), where('status', '==', 'approved'));
        const redemptionsSnapshot = await getDocs(redemptionsQuery);
        
        if (!redemptionsSnapshot.empty) {
          // Only filter out approved coupons
          approvedIds.push(couponDoc.id);
        }
      }
      
      return approvedIds;
    } catch (error) {
      console.error('Error getting approved coupon IDs:', error);
      return [];
    }
  };

  // Function to fetch approved coupons for the current user
  const fetchApprovedCoupons = async () => {
    setLoadingApprovedCoupons(true);
    try {
      const approvedCouponsList = [];
      const couponsRef = collection(db, 'coupons');
      const couponsSnapshot = await getDocs(couponsRef);
      
      for (const couponDoc of couponsSnapshot.docs) {
        const redemptionsRef = collection(db, 'coupons', couponDoc.id, 'redemptions');
        const redemptionsQuery = query(redemptionsRef, where('redeemedBy', '==', me), where('status', '==', 'approved'));
        const redemptionsSnapshot = await getDocs(redemptionsQuery);
        
        if (!redemptionsSnapshot.empty) {
          const redemptionData = redemptionsSnapshot.docs[0].data();
          const couponData = couponDoc.data();
          
          approvedCouponsList.push({
            id: couponDoc.id,
            ...couponData,
            businessName: couponData.legalBusinessName || 'Unknown Business',
            approvedAt: redemptionData.approvedAt,
            date1: redemptionData.date1,
            date2: redemptionData.date2
          });
        }
      }
      
      setApprovedCoupons(approvedCouponsList);
    } catch (error) {
      console.error('Error fetching approved coupons:', error);
    } finally {
      setLoadingApprovedCoupons(false);
    }
  };

  // Function to fetch rejected coupons for the current user
  const fetchRejectedCoupons = async () => {
    setLoadingRejectedCoupons(true);
    try {
      const rejectedCouponsList = [];
      const couponsRef = collection(db, 'coupons');
      const couponsSnapshot = await getDocs(couponsRef);
      
      for (const couponDoc of couponsSnapshot.docs) {
        const redemptionsRef = collection(db, 'coupons', couponDoc.id, 'redemptions');
        const redemptionsQuery = query(redemptionsRef, where('redeemedBy', '==', me), where('status', '==', 'rejected'));
        const redemptionsSnapshot = await getDocs(redemptionsQuery);
        
        if (!redemptionsSnapshot.empty) {
          const redemptionData = redemptionsSnapshot.docs[0].data();
          const couponData = couponDoc.data();
          
          rejectedCouponsList.push({
            id: couponDoc.id,
            ...couponData,
            businessName: couponData.legalBusinessName || 'Unknown Business',
            rejectedAt: redemptionData.rejectedAt,
            rejectionReason: redemptionData.rejectionReason,
            date1: redemptionData.date1,
            date2: redemptionData.date2
          });
        }
      }
      
      setRejectedCoupons(rejectedCouponsList);
    } catch (error) {
      console.error('Error fetching rejected coupons:', error);
    } finally {
      setLoadingRejectedCoupons(false);
    }
  };

  // Function to request coupon redemption
  const requestCouponRedemption = async () => {
    if (!selectedCoupon || !sel1 || !sel2) {
      setError('Please select a coupon and two dates');
      return;
    }

    setRedeeming(true);
    setError('');

    try {
      // Get the selected dates data
      const date1 = acceptedDates.find(d => d.id === sel1);
      const date2 = acceptedDates.find(d => d.id === sel2);
      
      if (!date1 || !date2) {
        setError('Selected dates not found');
        return;
      }

      // Get the selected coupon data
      const couponData = coupons.find(c => c.id === selectedCoupon);
      if (!couponData) {
        setError('Selected coupon not found');
        return;
      }

      // Create a new document in the coupon's redemptions subcollection
      const redemptionRequestData = {
        couponTitle: couponData.title,
        couponDescription: couponData.description,
        couponDiscount: couponData.discount,
        businessId: couponData.businessId,
        businessName: couponData.businessName,
        redeemedBy: me,
        redeemedAt: new Date(),
        date1: {
          id: date1.id,
          timestamp: date1.timestamp,
          location: date1.location,
          partnerId: date1.partnerId,
          partnerName: usersMap[String(date1.partnerId)] || date1.partnerId,
          convoId: date1.convoId,
          // Include the submitted images
          photos: date1.photos || {}
        },
        date2: {
          id: date2.id,
          timestamp: date2.timestamp,
          location: date2.location,
          partnerId: date2.partnerId,
          partnerName: usersMap[String(date2.partnerId)] || date2.partnerId,
          convoId: date2.convoId,
          // Include the submitted images
          photos: date2.photos || {}
        },
        status: 'redeemed' // This will be changed to 'approved' when admin approves
      };

      // Add to the coupon's redemptions subcollection
      await addDoc(collection(db, 'coupons', selectedCoupon, 'redemptions'), redemptionRequestData);

      // Show success message and close modal after a delay
      setSuccessMessage('Coupon redemption requested successfully! 🎉');
      setSelectedCoupon(null);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowCouponModal(false);
        setSuccessMessage('');
      }, 2000);
      
    } catch (error) {
      console.error('Error requesting coupon redemption:', error);
      setError('Failed to request coupon redemption. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  // Function to check if selected dates are with the same person and both have photos uploaded
  const canAccessCoupons = () => {
    if (!sel1 || !sel2) return false;
    
    const date1 = acceptedDates.find(d => d.id === sel1);
    const date2 = acceptedDates.find(d => d.id === sel2);
    
    if (!date1 || !date2) return false;
    
    // Check if both dates are with the same person
    if (date1.partnerId !== date2.partnerId) return false;
    
    // Check if both users have uploaded photos for both selected dates
    const photos1 = date1.photos || {};
    const photos2 = date2.photos || {};
    
    return photos1[me]?.uploaded && photos1[date1.partnerId]?.uploaded &&
           photos2[me]?.uploaded && photos2[date2.partnerId]?.uploaded;
  };

  // Function to check if user has enough available dates for coupons
  const hasAvailableDatesForCoupons = () => {
    // Group dates by partner
    const datesByPartner = {};
    acceptedDates.forEach(date => {
      const partnerId = date.partnerId;
      if (!datesByPartner[partnerId]) {
        datesByPartner[partnerId] = [];
      }
      datesByPartner[partnerId].push(date);
    });

    // Check if any partner has at least 2 dates with photos uploaded
    return Object.values(datesByPartner).some(partnerDates => {
      const datesWithPhotos = partnerDates.filter(date => {
        const photos = date.photos || {};
        return photos[me]?.uploaded && photos[date.partnerId]?.uploaded;
      });
      return datesWithPhotos.length >= 2;
    });
  };

  // local preview + persisted URL
  const [date1Url, setDate1Url] = useState('');
  const [date2Url, setDate2Url] = useState('');
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);
  const [isResubmitting1, setIsResubmitting1] = useState(false);
  const [isResubmitting2, setIsResubmitting2] = useState(false);
  const [currentlyUploadingSlot, setCurrentlyUploadingSlot] = useState(null);

  const [sel1, setSel1] = useState('');
  const [sel2, setSel2] = useState('');
  const [error, setError] = useState('');
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  useEffect(() => {
    setSel1('');
    setSel2('');
    setDate1Url('');
    setDate2Url('');
    setPreview1(null);
    setPreview2(null);
  }, [me]);

  // 1️⃣ subscribe & extract
  useEffect(() => {
    const q = query(
      collection(db, 'conversations'),
      where('userIds', 'array-contains', me)
    );
    return onSnapshot(q, snap => {
      const convos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setConversations(convos);
      const dates = convos.flatMap(c =>
        (c.dates || [])
          .filter(d => d.status === 'accepted' && !d.consumedForCoupon)
          .map(d => ({
            ...d,
            convoId: c.id,
            partnerId: c.userIds.find(u => u !== me)
          }))
      );
      setAcceptedDates(dates);
      // NEW: rejected dates
      const rejected = convos.flatMap(c =>
        (c.dates || [])
          .filter(d => d.adminRejected)
          .map(d => ({
            ...d,
            convoId: c.id,
            partnerId: c.userIds.find(u => u !== me)
          }))
      );
      setRejectedDates(rejected);
    });
  }, [me]);

  // Show popup if there are rejected dates
  useEffect(() => {
    if (rejectedDates.length > 0) {
      setShowRejectedPopup(true);
    }
  }, [rejectedDates]);

  // 2️⃣ fetch partner names
  useEffect(() => {
  acceptedDates.forEach(d => {
    const uid = String(d.partnerId); // force string
    if (!uid || usersMap[uid]) return;

    getDoc(doc(db, 'users', uid)).then(uDoc => {
      if (uDoc.exists()) {
        const userData = uDoc.data();
        setUsersMap(m => ({ ...m, [uid]: formatUserName(userData) }));
      } else {
        setUsersMap(m => ({ ...m, [uid]: uid }));
      }
    });
  });
}, [acceptedDates]);
  

  // 3️⃣ whenever sel1 changes, reset slot1 state unless that date really has a URL
  useEffect(() => {
    // Don't update slot1 if slot1 is currently being uploaded
    if (currentlyUploadingSlot === 1) return;
    
    const d = acceptedDates.find(d => d.id === sel1);
    if (d?.photos?.[me]?.uploaded) {
      setDate1Url(d.photos[me].url);
      setPreview1(null);
      // Only reset resubmission state if we're not currently resubmitting
      if (!isResubmitting1) {
        setIsResubmitting1(false);
      }
    } else {
      setDate1Url('');
      setPreview1(null);
      // Only reset resubmission state if we're not currently resubmitting
      if (!isResubmitting1) {
        setIsResubmitting1(false);
      }
    }
  }, [sel1, acceptedDates, me, isResubmitting1, currentlyUploadingSlot]);

  // 4️⃣ same for slot2
  useEffect(() => {
    // Don't update slot2 if slot2 is currently being uploaded
    if (currentlyUploadingSlot === 2) return;
    
    const d = acceptedDates.find(d => d.id === sel2);
    if (d?.photos?.[me]?.uploaded) {
      setDate2Url(d.photos[me].url);
      setPreview2(null);
      // Only reset resubmission state if we're not currently resubmitting
      if (!isResubmitting2) {
        setIsResubmitting2(false);
      }
    } else {
      setDate2Url('');
      setPreview2(null);
      // Only reset resubmission state if we're not currently resubmitting
      if (!isResubmitting2) {
        setIsResubmitting2(false);
      }
    }
  }, [sel2, acceptedDates, me, isResubmitting2, currentlyUploadingSlot]);

  const onFile = (slot, e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      slot === 1 ? setPreview1(ev.target.result) : setPreview2(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const upload = async slot => {
    setError('');
    const selected = slot === 1 ? sel1 : sel2;
    const preview  = slot === 1 ? preview1 : preview2;
    const setLoading = slot === 1 ? setLoading1 : setLoading2;
    if (!selected) { setError(`Select date ${slot}`); return; }
    if (!preview)  { setError(`Upload your photo for date ${slot}`); return; }

    setCurrentlyUploadingSlot(slot);
    setLoading(true);
    try {
      const d = acceptedDates.find(x => x.id === selected);
      const path = `datePictures/${d.convoId}/${d.id}/${me}`;
      const ref  = storageRef(storage, path);
      const blob = await fetch(preview).then(r => r.blob());
      await uploadBytes(ref, blob);
      const url = await getDownloadURL(ref);

      // update Firestore
      const convoRef = doc(db, 'conversations', d.convoId);
      const snap     = await getDoc(convoRef);
      const data     = snap.data();
      const updated  = (data.dates || []).map(x =>
        x.id === d.id
          ? {
              ...x,
              photos: {
                ...x.photos,
                [me]: { uploaded: true, url }
              }
            }
          : x
      );
      await updateDoc(convoRef, { dates: updated });

      // persist locally
      if (slot === 1) {
        setDate1Url(url);
        setPreview1(null);
        setIsResubmitting1(false);
      } else {
        setDate2Url(url);
        setPreview2(null);
        setIsResubmitting2(false);
      }
    } catch (err) {
      console.error(err);
      setError('Upload failed');
    } finally {
      setLoading(false);
      setCurrentlyUploadingSlot(null);
    }
  };

  const startResubmit = (slot) => {
    if (slot === 1) {
      setIsResubmitting1(true);
      setDate1Url('');
      setPreview1(null);
    } else {
      setIsResubmitting2(true);
      setDate2Url('');
      setPreview2(null);
    }
  };

  return (
    <div className="p-7 bg-white rounded shadow-lg relative">

      {/* Coupon Modal/Panel */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white border-2 border-indigo-400 rounded-lg p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none z-10"
              onClick={() => {
                setShowCouponModal(false);
                setError('');
                setSuccessMessage('');
                setSelectedCoupon(null);
              }}
              aria-label="Close"
            >
              &times;
            </button>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {successMessage}
              </div>
            )}
            {canAccessCoupons() ? (
              <>
                <div className="font-semibold text-lg mb-4">Request Your Coupon</div>
                <div className="flex-1 overflow-y-auto">
                  {loadingCoupons ? (
                    <div className="text-center py-8">
                      <div className="text-gray-500">Loading available coupons...</div>
                    </div>
                  ) : coupons.length > 0 ? (
                    <div className="space-y-4">
                      {coupons.map(coupon => (
                        <label key={coupon.id} className={`block border rounded p-4 cursor-pointer transition ${selectedCoupon === coupon.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 bg-white'}`}>
                          <input
                            type="radio"
                            name="coupon"
                            value={coupon.id}
                            checked={selectedCoupon === coupon.id}
                            onChange={() => setSelectedCoupon(coupon.id)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-lg">{coupon.title}</div>
                            <div className="text-gray-600 text-sm mt-1">{coupon.description}</div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-indigo-600 font-semibold">{coupon.discount}</span>
                              <span className="text-gray-500 text-xs">{coupon.businessName}</span>
                            </div>
                            {coupon.validUntil && (
                              <div className="text-gray-500 text-xs mt-1">
                                Valid until: {new Date(coupon.validUntil).toLocaleDateString()}
                              </div>
                            )}
                            {coupon.terms && coupon.terms !== "None" && coupon.terms !== "none" && (
                              <div className="text-gray-500 text-xs mt-1">
                                Terms: {coupon.terms}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500">No coupons available at the moment.</div>
                    </div>
                  )}
                </div>
                {coupons.length > 0 && (
                  <button
                    className={`mt-6 w-full py-2 rounded text-white ${selectedCoupon && !redeeming ? 'bg-indigo-600 hover:bg-indigo-800' : 'bg-gray-400 cursor-not-allowed'}`}
                    disabled={!selectedCoupon || redeeming}
                    onClick={requestCouponRedemption}
                  >
                    {redeeming ? 'Requesting...' : 'Request Coupon Redemption'}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center">
                <div className="font-semibold text-lg mb-2 text-red-600">
                  {!sel1 || !sel2 
                    ? "Please select 2 dates with the same person."
                    : "Both you and your date partner need to upload photos for the selected dates."
                  }
                </div>
                <div className="text-gray-600">
                  {!sel1 || !sel2 
                    ? "Select 2 dates with the same person to access coupons."
                    : "Once both users upload photos for the selected dates, you can select your coupon here!"
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* REJECTED DATE POPUP OVERLAY */}
      {showRejectedPopup && rejectedDates.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white border-2 border-red-400 rounded-lg p-6 max-w-lg w-full relative shadow-xl">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none"
              onClick={() => setShowRejectedPopup(false)}
              aria-label="Close"
            >
              &times;
            </button>
            {(() => {
              const d = rejectedDates[0]; // Most recent
              const partner = d.partnerId ? usersMap[String(d.partnerId)] || d.partnerId : null;
              return (
                <div>
                  <div className="font-semibold text-lg mb-1">Date: {d.timestamp && d.timestamp.toDate ? d.timestamp.toDate().toLocaleString() : ''}</div>
                  <div className="text-gray-600 mb-1">Location: {d.location || 'N/A'}</div>
                  <div className="text-gray-600 mb-1">Partner: {partner || d.partnerId || 'N/A'}</div>
                  <div className="font-semibold text-red-600 mb-1">Status: Rejected</div>
                  {d.rejectionReason && (
                    <div className="text-red-700 bg-red-100 border border-red-300 rounded p-2 mt-2">
                      <span className="font-semibold">Admin message:</span> {d.rejectionReason}
                    </div>
                  )}
                  <button
                    className="mt-6 w-full py-2 rounded bg-red-600 hover:bg-red-800 text-white font-semibold"
                    onClick={() => setShowRejectedPopup(false)}
                  >
                    I understand
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
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
        My Coupons
      </h2>
      <p className="text-gray-600 mb-6 text-sm font-poppins">
        Upload a picture of your first 2 dates with a spark. Then, we offer you both a drink for your 3rd date.
      </p>

      {/* View Approved/Rejected Coupons buttons */}
      <div className="mb-6 flex gap-4">
        <button
          className="self-start px-4 py-2 text-white rounded-lg font-medium text-sm bg-black hover:bg-gray-800"
          onClick={async () => {
            await fetchApprovedCoupons();
            setShowApprovedCouponsModal(true);
          }}
        >
          View Approved Coupons
        </button>
        <button
          className="self-start px-4 py-2 text-white rounded-lg font-medium text-sm bg-black hover:bg-gray-800"
          onClick={async () => {
            await fetchRejectedCoupons();
            setShowRejectedCouponsModal(true);
          }}
        >
          View Rejected Coupons
        </button>
      </div>
      {error && <div className="mb-4 text-red-500">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[1,2].map(slot => {
          const sel       = slot===1 ? sel1      : sel2;
          const setSel    = slot===1 ? setSel1    : setSel2;
          const preview   = slot===1 ? preview1   : preview2;
          const persisted = slot===1 ? date1Url   : date2Url;
          const otherSel  = slot===1 ? sel2       : sel1;
          const loading   = slot===1 ? loading1   : loading2;
          const dateObj = acceptedDates.find(d => String(d.id) === sel);
          const partnerId = dateObj?.partnerId;
          const partner = partnerId ? usersMap[String(partnerId)] || partnerId : null;
          return (
            <div 
              key={slot} 
              className="rounded-[16px] border p-6 h-fit"
              style={{
                border: "1px solid rgba(33, 31, 32, 0.10)",
                borderRadius: "16px",
                background: slot === 1 
                  ? "radial-gradient(50% 50% at 50% 50%, rgba(176,238,255,0.50) 0%, rgba(231,233,255,0.50) 100%)"
                  : "radial-gradient(50% 50% at 50% 50%, rgba(226,255,101,0.50) 0%, rgba(210,255,215,0.50) 100%)"
              }}
            >
              {/* Date Title */}
              <div className="mb-4">
                <h3 className="font-semibold text-lg text-[#211F20]">
                  {partner ? `Date with ${partner}` : `Date ${slot}`}
                </h3>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <select
                  className="w-full h-12 px-6 py-3 rounded-lg border border-gray-300 bg-white bg-opacity-20 font-poppins font-medium text-base text-[#211F20] outline-none"
                  value={sel}
                  onChange={e => setSel(e.target.value)}
                >
                  <option value="">Pick a date</option>
                  {acceptedDates
                    .filter(d => d.id !== otherSel)
                    .map(d => {
                      const name = usersMap[String(d.partnerId)] || d.partnerId;
                      return (
                        <option key={d.id} value={d.id}>
                          {new Date(d.timestamp.toDate()).toLocaleString()}{' '}
                          — with {name} at {d.location}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Photo Upload Stack */}
              <div className="flex flex-row gap-4 mb-6">
                {/* YOU */}
                <div className="border-2 border-dashed rounded-lg w-80 h-80 flex items-center justify-center relative">
                  {persisted && !(slot === 1 ? isResubmitting1 : isResubmitting2) ? (
                    <>
                      <img src={persisted} className="w-full h-full object-cover rounded-lg" />
                      <button
                        onClick={() => startResubmit(slot)}
                        className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm hover:bg-opacity-90 transition-all"
                      >
                        Change Photo
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        id={`you-${slot}`}
                        className="hidden"
                        onChange={e => onFile(slot, e)}
                      />
                      <label
                        htmlFor={`you-${slot}`}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                      >
                        {preview
                          ? <img src={preview} className="w-full h-full object-cover rounded-lg" />
                          : <>
                              <div className="relative">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                                    <path d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M13 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M15.75 5H21.25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                    <path d="M18.5 7.75V2.25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                    <path d="M2.66992 18.9486L7.59992 15.6386C8.38992 15.1086 9.52992 15.1686 10.2399 15.7786L10.5699 16.0686C11.3499 16.7386 12.6099 16.7386 13.3899 16.0686L17.5499 12.4986C18.3299 11.8286 19.5899 11.8286 20.3699 12.4986L21.9999 13.8986" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                              </div>
                              <span className="mt-2 text-xs">
                                {(slot === 1 ? isResubmitting1 : isResubmitting2) ? 'Upload new photo' : 'Upload a photo'}
                              </span>
                            </>}
                      </label>
                    </>
                  )}
                </div>
                {/* PARTNER */}
                <div className="border-2 border-dashed rounded-lg w-80 h-80 flex items-center justify-center text-gray-400">
                  {dateObj?.photos?.[partnerId]?.uploaded ? (
                    <img 
                      src={dateObj.photos[partnerId].url} 
                      className="w-full h-full object-cover rounded-lg" 
                      alt={`${partner}'s photo`}
                    />
                  ) : persisted ? (
                    <div className="text-center">
                      <div className="text-xl mb-1">⏳</div>
                      <div className="text-xs">Waiting for {partner}</div>
                      <div className="text-xs text-gray-500">to upload their photo</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-xl mb-1">🔒</div>
                      <div className="text-xs">Upload your photo first</div>
                      <div className="text-xs text-gray-500">to unlock partner's upload</div>
                    </div>
                  )}
                </div>
              </div>

                          {/* Submit Button */}
            <button
              onClick={() => upload(slot)}
              disabled={loading || (!!persisted && !(slot === 1 ? isResubmitting1 : isResubmitting2))}
              className={`self-start px-4 py-2 text-white rounded-lg font-medium text-sm ${
                persisted && !(slot === 1 ? isResubmitting1 : isResubmitting2)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : loading
                    ? 'bg-gray-600'
                    : 'bg-black hover:bg-gray-800'
              }`}
            >
              {persisted && !(slot === 1 ? isResubmitting1 : isResubmitting2) 
                ? 'Submitted ✅' 
                : loading 
                  ? 'Uploading…' 
                  : (slot === 1 ? isResubmitting1 : isResubmitting2) 
                    ? 'Resubmit' 
                    : 'Submit'
              }
            </button>
            </div>
          );
        })}
      </div>

      {/* View Coupons button - only show when selected dates are with same person and both have photos */}
      {canAccessCoupons() && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm leading-relaxed">
              You're eligible for a Third Date On Us coupon. Chat with your spark to come to an agreement, and select your preferred coupon below.
            </p>
          </div>
          <button
            className="self-start px-4 py-2 text-white rounded-lg font-medium text-sm bg-black hover:bg-gray-800"
            onClick={async () => {
              setError('');
              setSuccessMessage('');
              await fetchCoupons();
              setShowCouponModal(true);
            }}
          >
            🎫 View Available Coupons
          </button>
        </div>
      )}

      {/* Message when no available dates for coupons */}
      {!hasAvailableDatesForCoupons() && acceptedDates.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 font-medium mb-2">No Available Dates for Coupons</div>
            <div className="text-yellow-700 text-sm">
              You need at least 2 dates with the same person where both of you have uploaded photos. 
              Some of your dates may have already been used for previous approved coupon requests and are no longer available.
            </div>
          </div>
        </div>
      )}

      {/* Approved Coupons Modal */}
      {showApprovedCouponsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white border-2 border-green-400 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-green-800">My Approved Coupons</h2>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowApprovedCouponsModal(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingApprovedCoupons ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading your approved coupons...</div>
              </div>
            ) : approvedCoupons.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">You don't have any approved coupons yet.</div>
                <div className="text-sm text-gray-400 mt-2">Complete your dates and request coupons to see them here!</div>
              </div>
            ) : (
              <div className="space-y-6">
                {approvedCoupons.map((coupon) => (
                  <div key={coupon.id} className="border border-green-200 rounded-lg p-6 bg-green-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-green-800">{coupon.title}</h3>
                        <p className="text-green-600 text-sm mt-1">{coupon.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-lg font-bold text-green-700">{coupon.discount}</span>
                          <span className="text-green-600 text-sm">{coupon.businessName}</span>
                        </div>
                        <div className="text-green-600 text-sm mt-2">
                          Approved on: {coupon.approvedAt?.toDate?.() ? 
                            coupon.approvedAt.toDate().toLocaleString() : 
                            new Date(coupon.approvedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        ✅ Approved
                      </div>
                    </div>

                    {/* Date Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Date 1 */}
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">Date 1</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Date:</strong> {coupon.date1?.timestamp?.toDate?.() ? 
                            coupon.date1.timestamp.toDate().toLocaleString() : 
                            new Date(coupon.date1?.timestamp).toLocaleString()}</p>
                          <p><strong>Location:</strong> {coupon.date1?.location}</p>
                          <p><strong>Partner:</strong> {coupon.date1?.partnerName}</p>
                        </div>
                      </div>

                      {/* Date 2 */}
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">Date 2</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Date:</strong> {coupon.date2?.timestamp?.toDate?.() ? 
                            coupon.date2.timestamp.toDate().toLocaleString() : 
                            new Date(coupon.date2?.timestamp).toLocaleString()}</p>
                          <p><strong>Location:</strong> {coupon.date2?.location}</p>
                          <p><strong>Partner:</strong> {coupon.date2?.partnerName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Coupon Details */}
                    <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">Coupon Details</h4>
                      <div className="space-y-1 text-sm">
                        {coupon.validUntil && (
                          <p><strong>Valid Until:</strong> {new Date(coupon.validUntil).toLocaleDateString()}</p>
                        )}
                        {coupon.terms && coupon.terms !== "None" && coupon.terms !== "none" && (
                          <p><strong>Terms:</strong> {coupon.terms}</p>
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

      {/* Rejected Coupons Modal */}
      {showRejectedCouponsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white border-2 border-red-400 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-red-800">My Rejected Coupons</h2>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowRejectedCouponsModal(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingRejectedCoupons ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading your rejected coupons...</div>
              </div>
            ) : rejectedCoupons.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">You don't have any rejected coupons.</div>
                <div className="text-sm text-gray-400 mt-2">Great job on your date submissions!</div>
              </div>
            ) : (
              <div className="space-y-6">
                {rejectedCoupons.map((coupon) => (
                  <div key={coupon.id} className="border border-red-200 rounded-lg p-6 bg-red-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-red-800">{coupon.title}</h3>
                        <p className="text-red-600 text-sm mt-1">{coupon.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-lg font-bold text-red-700">{coupon.discount}</span>
                          <span className="text-red-600 text-sm">{coupon.businessName}</span>
                        </div>
                        <div className="text-red-600 text-sm mt-2">
                          Rejected on: {coupon.rejectedAt?.toDate?.() ? 
                            coupon.rejectedAt.toDate().toLocaleString() : 
                            new Date(coupon.rejectedAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                        ❌ Rejected
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {coupon.rejectionReason && (
                      <div className="mb-4 p-4 bg-red-100 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">Rejection Reason</h4>
                        <p className="text-red-700 text-sm">{coupon.rejectionReason}</p>
                      </div>
                    )}

                    {/* Date Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Date 1 */}
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <h4 className="font-semibold text-red-800 mb-2">Date 1</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Date:</strong> {coupon.date1?.timestamp?.toDate?.() ? 
                            coupon.date1.timestamp.toDate().toLocaleString() : 
                            new Date(coupon.date1?.timestamp).toLocaleString()}</p>
                          <p><strong>Location:</strong> {coupon.date1?.location}</p>
                          <p><strong>Partner:</strong> {coupon.date1?.partnerName}</p>
                        </div>
                      </div>

                      {/* Date 2 */}
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <h4 className="font-semibold text-red-800 mb-2">Date 2</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Date:</strong> {coupon.date2?.timestamp?.toDate?.() ? 
                            coupon.date2.timestamp.toDate().toLocaleString() : 
                            new Date(coupon.date2?.timestamp).toLocaleString()}</p>
                          <p><strong>Location:</strong> {coupon.date2?.location}</p>
                          <p><strong>Partner:</strong> {coupon.date2?.partnerName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Coupon Details */}
                    <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-2">Coupon Details</h4>
                      <div className="space-y-1 text-sm">
                        {coupon.validUntil && (
                          <p><strong>Valid Until:</strong> {new Date(coupon.validUntil).toLocaleDateString()}</p>
                        )}
                        {coupon.terms && coupon.terms !== "None" && coupon.terms !== "none" && (
                          <p><strong>Terms:</strong> {coupon.terms}</p>
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

    </div>
  );
}


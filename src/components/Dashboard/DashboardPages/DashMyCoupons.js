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
      setCoupons(couponsList);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoadingCoupons(false);
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

  // local preview + persisted URL
  const [date1Url, setDate1Url] = useState('');
  const [date2Url, setDate2Url] = useState('');
  const [preview1, setPreview1] = useState(null);
  const [preview2, setPreview2] = useState(null);

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
          .filter(d => d.status === 'accepted')
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
        const { firstName, lastName } = uDoc.data();
        setUsersMap(m => ({ ...m, [uid]: `${firstName} ${lastName}`.trim() }));
      } else {
        setUsersMap(m => ({ ...m, [uid]: uid }));
      }
    });
  });
}, [acceptedDates]);
  

  // 3️⃣ whenever sel1 changes, reset slot1 state unless that date really has a URL
  useEffect(() => {
    const d = acceptedDates.find(d => d.id === sel1);
    if (d?.photos?.[me]?.uploaded) {
      setDate1Url(d.photos[me].url);
      setPreview1(null);
    } else {
      setDate1Url('');
      setPreview1(null);
    }
  }, [sel1, acceptedDates, me]);

  // 4️⃣ same for slot2
  useEffect(() => {
    const d = acceptedDates.find(d => d.id === sel2);
    if (d?.photos?.[me]?.uploaded) {
      setDate2Url(d.photos[me].url);
      setPreview2(null);
    } else {
      setDate2Url('');
      setPreview2(null);
    }
  }, [sel2, acceptedDates, me]);

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
      } else {
        setDate2Url(url);
        setPreview2(null);
      }
    } catch (err) {
      console.error(err);
      setError('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-7 bg-white rounded shadow-lg relative">

      {/* Coupon Modal/Panel */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                      <div className="bg-white border-2 border-indigo-400 rounded-lg p-6 max-w-lg w-full relative shadow-xl">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none"
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
                <div className="font-semibold text-lg mb-4">Select Your Coupon</div>
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
      <h2 className="text-2xl mb-4">My Coupons</h2>
      {error && <div className="mb-4 text-red-500">{error}</div>}

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
          <div key={slot} className="mb-8">
            <h3 className="font-semibold mb-2">
            {partner ? `Date with ${partner}` : `Date ${slot}`}
            </h3>
            <select
              className="border p-2 rounded w-full mb-4"
              value={sel}
              onChange={e => setSel(e.target.value)}
            >
              <option value="">Select a scheduled date…</option>
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

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* YOU */}
              <div className="border-2 border-dashed rounded h-48 flex items-center justify-center">
                {persisted ? (
                  <img src={persisted} className="w-full h-full object-cover rounded" />
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
                        ? <img src={preview} className="w-full h-full object-cover rounded" />
                        : <>
                            <div className="text-4xl text-gray-400">+</div>
                            <span>Your photo</span>
                          </>}
                    </label>
                  </>
                )}
              </div>
              {/* PARTNER */}
              <div className="border-2 border-dashed rounded h-48 flex items-center justify-center text-gray-400">
                {dateObj?.photos?.[partnerId]?.uploaded ? (
                  <img 
                    src={dateObj.photos[partnerId].url} 
                    className="w-full h-full object-cover rounded" 
                    alt={`${partner}'s photo`}
                  />
                ) : persisted ? (
                  <div className="text-center">
                    <div className="text-2xl mb-2">⏳</div>
                    <div className="text-sm">Waiting for {partner}</div>
                    <div className="text-xs text-gray-500">to upload their photo</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔒</div>
                    <div className="text-sm">Upload your photo first</div>
                    <div className="text-xs text-gray-500">to unlock partner's upload</div>
                  </div>
                )}
              </div>

            </div>

            <button
              onClick={() => upload(slot)}
              disabled={loading || !!persisted}
              className={`w-full py-2 text-white rounded ${
                persisted
                  ? 'bg-gray-400 cursor-not-allowed'
                  : loading
                    ? 'bg-indigo-300'
                    : 'bg-indigo-600 hover:bg-indigo-800'
              }`}
            >
              {persisted ? 'Submitted ✅' : loading ? 'Uploading…' : `Submit Date ${slot}`}
            </button>
          </div>
        );
      })}

      {/* View Coupons button - only show when selected dates are with same person and both have photos */}
      {canAccessCoupons() && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            className="w-full bg-indigo-600 hover:bg-indigo-800 text-white px-6 py-3 rounded-lg shadow-lg font-semibold text-lg"
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

    </div>
  );
}


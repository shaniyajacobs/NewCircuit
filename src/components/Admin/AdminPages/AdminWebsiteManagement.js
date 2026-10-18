import React, { useState, useEffect } from 'react';
import AdminHeader from '../AdminHelperComponents/AdminHeader';
import AdminSidebar from '../AdminHelperComponents/AdminSidebar';
import { db } from '../../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AdminWebsiteManagement = () => {
  // Single editable item: Navbar banner configuration
  const [loading, setLoading] = useState(true);
  const [bannerText, setBannerText] = useState('The #1 Speed Dating App');
  const [bannerEnabled, setBannerEnabled] = useState(true);
  // Drafts to avoid re-rendering global state on every keystroke
  const [draftBannerText, setDraftBannerText] = useState('The #1 Speed Dating App');
  const [draftBannerEnabled, setDraftBannerEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ref = doc(db, 'config', 'navbarBanner');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data?.text === 'string') {
            setBannerText(data.text);
            setDraftBannerText(data.text);
          }
          if (typeof data?.enabled === 'boolean') {
            setBannerEnabled(data.enabled);
            setDraftBannerEnabled(data.enabled);
          }
        } else {
          setDraftBannerText(bannerText);
          setDraftBannerEnabled(bannerEnabled);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    const payload = { text: draftBannerText, enabled: draftBannerEnabled, updatedAt: Date.now() };
    try {
      const ref = doc(db, 'config', 'navbarBanner');
      await setDoc(ref, payload, { merge: true });
      setBannerText(draftBannerText);
      setBannerEnabled(draftBannerEnabled);
    } catch {}
  };

  // Simpler inline rendering below

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="grid grid-cols-[280px_1fr] gap-6">
        {/* Content column: span both columns so it stretches full width */}
        <div className="col-span-2 bg-white p-6 rounded-none border-0">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <div className="flex flex-col p-4 border rounded-lg shadow-sm bg-white">
                <div className="mb-4">
                  <div className="font-medium text-lg">Navbar Banner</div>
                  <div className="text-sm text-slate-500 mt-1">Controls the announcement text shown at the top of the navigation.</div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Banner text</label>
                    <input
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter banner text..."
                      value={draftBannerText}
                      onChange={(e) => setDraftBannerText(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="bannerEnabled"
                      type="checkbox"
                      checked={draftBannerEnabled}
                      onChange={(e) => setDraftBannerEnabled(e.target.checked)}
                    />
                    <label htmlFor="bannerEnabled" className="text-sm text-slate-700">Show banner</label>
                  </div>
                  <div>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save</button>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500">Saves to Firestore doc <code>config/navbarBanner</code>.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWebsiteManagement;

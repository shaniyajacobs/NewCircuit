import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../pages/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const ProfileContext = createContext();

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Fetch user profile
                const profileDoc = await getDoc(doc(db, "profiles", user.uid));
                if (profileDoc.exists()) {
                    setProfile(profileDoc.data());
                }
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const updateProfile = async (data) => {
        if (!auth.currentUser) return;

        const userRef = doc(db, "profiles", auth.currentUser.uid);
        await updateDoc(userRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });

        setProfile(prev => ({
            ...prev,
            ...data
        }));
    };

    return (
        <ProfileContext.Provider value={{ profile, loading, updateProfile }}>
            {children}
        </ProfileContext.Provider>
    );
}; 
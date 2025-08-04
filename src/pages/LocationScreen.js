import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';
import whiteLogo from '../images/logomark_white.png';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

// Import all images at the top
import atlantaImg from '../images/atlanta.jpeg';
import chicagoImg from '../images/chicago.jpeg';
import dallasImg from '../images/dallas.jpg';
import houstonImg from '../images/houston.jpeg';
import losAngelesImg from '../images/la.jpeg';
import louisvilleImg from '../images/louisville.jpg';
import miamiImg from '../images/miami.jpeg';
import newYorkImg from '../images/nyc.jpeg';
import sacramentoImg from '../images/sacremento.jpg';
import seattleImg from '../images/seattle.jpeg';
import washingtonDCImg from '../images/washington.jpeg';
import sanfranciscoImg from '../images/sf.jpeg';

const cities = [
    { name: 'Atlanta', image: atlantaImg },
    { name: 'Chicago', image: chicagoImg },
    { name: 'Dallas', image: dallasImg },
    { name: 'Houston', image: houstonImg },
    { name: 'Los Angeles', image: losAngelesImg },
    { name: 'Louisville', image: louisvilleImg },
    { name: 'Miami', image: miamiImg },
    { name: 'New York City', image: newYorkImg },
    { name: 'Sacramento', image: sacramentoImg },
    { name: 'San Francisco / Bay Area', image: sanfranciscoImg },
    { name: 'Seattle', image: seattleImg },
    { name: 'Washington D.C.', image: washingtonDCImg }
];

const LocationScreen = () => {
    const navigate = useNavigate();
     // Access the location state
    const location = useLocation();
    // Destructure userData, and provide a fallback if it's undefined
    const initialUserData = location.state?.userData || {};
    const [userData, setUserData] = useState(initialUserData || {});
    const [selectedCity, setSelectedCity] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    useEffect(() => {
        // Preload all images
        Promise.all(cities.map(city => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = city.image;
                img.onload = resolve;
                img.onerror = reject;
            });
        }))
        .then(() => {
            setImagesLoaded(true);
        })
        .catch(err => console.log("Error loading images", err));
    }, []);

    // First click: just store selection and open confirmation modal
    const handleCityClick = (cityName) => {
      setSelectedCity(cityName);
      setShowModal(true);
    };

    // Second click (Yes button): write to Firestore then move on
    const handleConfirm = async () => {
      try {
        const uid = userData.userId || (auth.currentUser && auth.currentUser.uid);
        if (!uid) throw new Error('No user ID available');

        await updateDoc(doc(db, 'users', uid), {
          location: selectedCity,
          locationSet: true,
        });
        console.log(`User location updated to ${selectedCity}`);
      } catch (error) {
        console.error('Error updating user location:', error);
      }

      setShowModal(false);
      navigate('/quiz-start');
    };

    // Show loading state while images are loading
    if (!imagesLoaded) {
        return (
            <div className="min-h-screen bg-[#85A2F2] flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <HeaderBar 
                title="Location" 
                logo={whiteLogo}
                logoHeight="h-20"
                titleSize="text-4xl"
            />

            <div className="bg-white p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-[#151D48] text-3xl font-semibold mb-2">Select City</h2>
                        <p className="text-[#151D48] text-lg">You can change this later</p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 mx-[-2rem]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {cities.map((city) => (
                                <div 
                                    key={city.name}
                                    className="relative rounded-2xl overflow-hidden aspect-square cursor-pointer group"
                                    onClick={() => handleCityClick(city.name)}
                                >
                                    <img 
                                        src={city.image} 
                                        alt={city.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <h3 className="text-white text-2xl font-semibold text-center">{city.name}</h3>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <h3 className="text-2xl font-semibold text-[#151D48] mb-4">
                            You have selected {selectedCity}
                        </h3>
                        <p className="text-gray-600 mb-6">Please confirm your selection</p>
                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                            >
                                No
                            </button>
                            <button 
                                onClick={handleConfirm}
                                className="px-6 py-2 rounded-lg bg-[#85A2F2] text-white hover:bg-[#7491e1]"
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationScreen;

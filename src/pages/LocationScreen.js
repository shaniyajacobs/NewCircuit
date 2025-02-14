import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';
import blackLogo from '../images/black.svg';

const cities = [
    {
        name: 'Atlanta',
        image: 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?ixlib=rb-4.0.3'
    },
    {
        name: 'Chicago',
        image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3'
    },
    {
        name: 'Dallas',
        image: 'https://media.istockphoto.com/id/479756412/photo/dallas-skyline-at-sunset.jpg?s=612x612&w=0&k=20&c=ktZhWB87hBG5YJ3Q90NbZKEGlWbY4YmcknY_3PyR1p0='
    },
    {
        name: 'Houston',
        image: 'https://images.unsplash.com/photo-1622007151631-25aa98ab394b?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aG91c3RvbiUyMHNreWxpbmV8ZW58MHx8MHx8fDA%3D'
    },
    {
        name: 'Los Angeles',
        image: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?ixlib=rb-4.0.3'
    },
    {
        name: 'Louisville',
        image: 'https://media.istockphoto.com/id/587194676/photo/louisville-kentucky-skyline.jpg?s=612x612&w=0&k=20&c=hrSGLVOqHkOdyjQrfvaHAwAcvCiWWK_AnzFZDDgGLEg='
    },
    {
        name: 'Miami',
        image: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?ixlib=rb-4.0.3'
    },
    {
        name: 'New York City',
        image: 'https://images.unsplash.com/photo-1522083165195-3424ed129620?ixlib=rb-4.0.3'
    },
    {
        name: 'Sacramento',
        image: 'https://media.istockphoto.com/id/956590696/photo/sacramento-city-scape.jpg?s=612x612&w=0&k=20&c=CWkjvhwrI439YTtv0_Xg_zmYXTnlNF_yO6HAHaF_Ceo='
    },
    {
        name: 'San Francisco',
        image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3'
    },
    {
        name: 'Seattle',
        image: 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?ixlib=rb-4.0.3'
    },
    {
        name: 'Washington D.C.',
        image: 'https://images.unsplash.com/photo-1617581629397-a72507c3de9e?ixlib=rb-4.0.3'
    },
];

const LocationScreen = () => {
    const navigate = useNavigate();
    const [selectedCity, setSelectedCity] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleCityClick = (city) => {
        setSelectedCity(city);
        setShowModal(true);
    };

    const handleConfirm = () => {
        setShowModal(false);
        navigate('/quiz-start');
    };

    return (
        <div className="min-h-screen">
            <HeaderBar 
                title="Location" 
                logo={blackLogo}
                logoHeight="h-32"
                titleSize="text-6xl"
            />

            {/* Main content */}
            <div className="bg-[#85A2F2] p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-[#151D48] text-3xl font-semibold mb-2">Select City</h2>
                        <p className="text-[#151D48] text-lg">You can change this later</p>
                    </div>

                    {/* City Grid */}
                    <div className="bg-white rounded-3xl p-8 mx-[-2rem]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {cities.map((city) => (
                                <div 
                                    key={city.name} 
                                    className="relative rounded-2xl overflow-hidden aspect-square cursor-pointer group"
                                    onClick={() => handleCityClick(city)}
                                >
                                    <img 
                                        src={city.image} 
                                        alt={city.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-opacity">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <h3 className="text-white text-2xl font-semibold z-10">{city.name}</h3>
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
                            You have selected {selectedCity.name}
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

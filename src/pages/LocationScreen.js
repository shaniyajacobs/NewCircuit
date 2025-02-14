import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';
import blackLogo from '../images/black.svg';
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
    {
        name: 'Atlanta',
        image: atlantaImg
    },
    {
        name: 'Chicago',
        image: chicagoImg
    },
    {
        name: 'Dallas',
        image: dallasImg
    },
    {
        name: 'Houston',
        image: houstonImg
    },
    {
        name: 'Los Angeles',
        image: losAngelesImg
    },
    {
        name: 'Louisville',
        image: louisvilleImg
    },
    {
        name: 'Miami',
        image: miamiImg
    },
    {
        name: 'New York City',
        image: newYorkImg
    },
    {
        name: 'Sacramento',
        image: sacramentoImg
    },
    {
        name: 'San Francisco',
        image: sanfranciscoImg
    },
    {
        name: 'Seattle',
        image: seattleImg
    },
    {
        name: 'Washington D.C.',
        image: washingtonDCImg
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
                                    <div 
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{ 
                                            backgroundImage: `url(${city.blurHash})`,
                                            filter: 'blur(20px)',
                                            transform: 'scale(1.1)'
                                        }}
                                    />
                                    <img 
                                        src={city.image} 
                                        alt={city.name}
                                        loading="lazy"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        onLoad={(e) => e.target.parentElement.querySelector('div').style.display = 'none'}
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

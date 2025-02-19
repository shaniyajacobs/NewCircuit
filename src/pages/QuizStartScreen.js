import React from 'react';
import HeaderBar from '../components/HeaderBar';
import blackLogo from '../images/black.svg';

const QuizStartScreen = () => {
    return (
        <div className="min-h-screen">
            <HeaderBar 
                showBack={true}
                logo={blackLogo}
                logoHeight="h-32"
            />

            {/* Main content */}
            <div className="bg-[#85A2F2] p-8 flex-grow flex items-center justify-center min-h-[calc(100vh-6rem)]">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-[#151D48] text-5xl font-bold mb-8">
                        Let's get to know you better
                    </h1>
                    <p className="text-[#151D48] text-xl mb-12">
                        Take our personality quiz to help us find your perfect connection
                    </p>
                    <button 
                        className="bg-white text-[#151D48] px-8 py-4 rounded-xl text-xl font-semibold hover:bg-opacity-90 transition-all shadow-lg"
                    >
                        Begin Your Journey
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizStartScreen;

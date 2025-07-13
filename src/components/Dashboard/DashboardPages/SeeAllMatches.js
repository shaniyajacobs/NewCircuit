import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SeeAllMatches = () => {
  const navigate = useNavigate();
  
  // Example matches data with compatibility scores
  const [matches, setMatches] = useState([
    { id: 1, name: 'Kayla', age: 27, image: '/path_to_image', selected: true, compatibility: 95 },
    { id: 2, name: 'Kayla', age: 27, image: '/path_to_image', selected: false, compatibility: 92 },
    { id: 3, name: 'Kayla', age: 27, image: '/path_to_image', selected: false, compatibility: 88 },
    { id: 4, name: 'Kayla', age: 27, image: '/path_to_image', selected: true, compatibility: 5 },
    { id: 5, name: 'Kayla', age: 27, image: '/path_to_image', selected: false, compatibility: 82 },
    { id: 6, name: 'Kayla', age: 27, image: '/path_to_image', selected: false, compatibility: 43 },
    { id: 7, name: 'Kayla', age: 27, image: '/path_to_image', selected: true, compatibility: 61 },
    { id: 8, name: 'Kayla', age: 27, image: '/path_to_image', selected: false, compatibility: 50 },
    { id: 9, name: 'Kayla', age: 27, image: '/path_to_image', selected: false, compatibility: 72 },
    { id: 10, name: 'Kayla', age: 27, image: '/path_to_image', selected: false, compatibility: 20 },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Select your Matches</h1>
      
      <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
        {matches.map(match => (
          <div 
            key={match.id}
            className={`flex items-center bg-white rounded-2xl overflow-hidden border-2 ${
              match.selected ? 'border-[#0043F1] bg-[#0043F1]' : 'border-[#85A2F2]'
            }`}
          >
            <div className={`w-20 flex items-center justify-center p-4 ${
              match.selected ? 'bg-[#0043F1]' : 'bg-[#85A2F2]'
            }`}>
              <div className={`h-10 w-10 ${
                match.selected ? 'text-[#9FE870]' : 'text-white'
              }`}>
                ♥
              </div>
            </div>
            <div className="flex flex-col p-4 flex-grow bg-white">
              <div className="flex items-center mb-2">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <img 
                    src={match.image} 
                    alt={match.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold mr-2">{match.name},</span>
                    <span className="text-2xl">{match.age}</span>
                  </div>
                  
                  {/* Compatibility Score */}
                  <div className="flex items-center mt-1">
                    <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                      <div 
                        className="h-full bg-[#85A2F2] rounded-full"
                        style={{ width: `${match.compatibility}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {match.compatibility}% Match
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between mt-8 max-w-5xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="bg-[#85A2F2] text-white px-8 py-2 rounded-lg text-lg font-semibold hover:bg-[#7491e0] transition-colors"
        >
          Back
        </button>
        <button 
          className="bg-[#85A2F2] text-white px-8 py-2 rounded-lg text-lg font-semibold hover:bg-[#7491e0] transition-colors"
        >
          SELECT
        </button>
      </div>
    </div>
  );
};

export default SeeAllMatches;

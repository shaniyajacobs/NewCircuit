import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MyMatches = () => {
  const navigate = useNavigate();
  const [visibleMatches, setVisibleMatches] = useState([]);
  
  const matches = [
    { id: 1, name: 'Kayla', age: 27, image: 'path_to_image', compatibility: 95 },
    { id: 2, name: 'Kayla', age: 27, image: 'path_to_image', compatibility: 92 },
    { id: 3, name: 'Kayla', age: 27, image: 'path_to_image', compatibility: 88 }
  ];

  useEffect(() => {
    setVisibleMatches([]);

    const timeouts = [
      setTimeout(() => setVisibleMatches([2]), 500),
      setTimeout(() => setVisibleMatches([2, 1]), 1500),
      setTimeout(() => setVisibleMatches([2, 1, 0]), 2500)
    ];

    return () => timeouts.forEach(timeout => clearTimeout(timeout));
  }, []);

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-center mb-2">Matched in Heaven</h1>
        <p className="text-xl text-center text-gray-700">Here are your suggestions powered by AI</p>
      </div>

      {/* Matches Container */}
      <div className="max-w-3xl mx-auto space-y-6">
        {matches.map((match, index) => (
          <div 
            key={match.id}
            className={`flex items-center bg-white rounded-lg overflow-hidden border-2 border-[#85A2F2] transition-all duration-500 transform
              ${visibleMatches.includes(index) 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-full'
              }`}
          >
            {/* Ranking Number */}
            <div className="w-12 flex items-center justify-center">
              <span className={`text-2xl font-bold text-[#85A2F2] transition-all duration-500 transform
                ${visibleMatches.includes(index) 
                  ? 'scale-100' 
                  : 'scale-0'
                }`}>
                #{index + 1}
              </span>
            </div>
            
            <div className="w-20 bg-[#85A2F2] h-full flex items-center justify-center p-4">
              <div className={`text-white text-3xl transition-transform duration-500
                ${visibleMatches.includes(index) 
                  ? 'scale-100' 
                  : 'scale-0'
                }`}>
                ♥
              </div>
            </div>
            
            <div className="flex flex-col p-4 flex-grow">
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
                    <div className="w-48 h-2 bg-gray-200 rounded-full mr-3 overflow-hidden">
                      <div 
                        className={`h-full bg-[#85A2F2] rounded-full transition-all duration-1000
                          ${visibleMatches.includes(index) 
                            ? 'w-[' + match.compatibility + '%]' 
                            : 'w-0'
                          }`}
                      />
                    </div>
                    <span className={`text-sm font-medium text-gray-600 transition-opacity duration-500
                      ${visibleMatches.includes(index) 
                        ? 'opacity-100' 
                        : 'opacity-0'
                      }`}>
                      {match.compatibility}% Match
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* See All Button */}
      <div className="flex justify-end mt-8 max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('seeAllMatches')}
          className="bg-[#85A2F2] text-white px-8 py-2 rounded-lg text-lg font-semibold hover:bg-[#7491e0] transition-colors"
        >
          SEE ALL
        </button>
      </div>
    </div>
  );
};

export default MyMatches;

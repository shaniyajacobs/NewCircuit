import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SeeAllMatches = () => {
  const navigate = useNavigate();
  
  // Example matches data with compatibility scores
  const [matches, setMatches] = useState([
    { id: 1, name: 'Kayla', age: 27, image: '/path_to_image', selected: false, compatibility: 95 },
    { id: 2, name: 'Sarah', age: 29, image: '/path_to_image', selected: false, compatibility: 92 },
    { id: 3, name: 'Emma', age: 25, image: '/path_to_image', selected: false, compatibility: 88 },
    { id: 4, name: 'Olivia', age: 28, image: '/path_to_image', selected: false, compatibility: 85 },
    { id: 5, name: 'Sophia', age: 26, image: '/path_to_image', selected: false, compatibility: 82 },
    { id: 6, name: 'Isabella', age: 30, image: '/path_to_image', selected: false, compatibility: 80 },
    { id: 7, name: 'Mia', age: 27, image: '/path_to_image', selected: false, compatibility: 78 },
    { id: 8, name: 'Charlotte', age: 29, image: '/path_to_image', selected: false, compatibility: 75 },
    { id: 9, name: 'Amelia', age: 26, image: '/path_to_image', selected: false, compatibility: 72 },
    { id: 10, name: 'Harper', age: 28, image: '/path_to_image', selected: false, compatibility: 70 },
  ]);

  const [selectedCount, setSelectedCount] = useState(0);
  const maxSelections = 3;

  const handleMatchClick = (matchId) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    if (match.selected) {
      // If already selected, deselect
      setSelectedCount(prev => prev - 1);
      setMatches(prevMatches => 
        prevMatches.map(m => 
          m.id === matchId ? { ...m, selected: false } : m
        )
      );
    } else if (selectedCount < maxSelections) {
      // If not selected and under max selections, select
      setSelectedCount(prev => prev + 1);
      setMatches(prevMatches => 
        prevMatches.map(m => 
          m.id === matchId ? { ...m, selected: true } : m
        )
      );
    }
  };

  const handleSubmit = () => {
    const selectedMatches = matches.filter(match => match.selected);
    // Here you would typically save the selected matches to your backend
    console.log('Selected matches:', selectedMatches);
    // Navigate back to dashboard or to a success page
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-center">Select your Matches</h1>
          <div className="text-lg font-semibold text-[#0043F1]">
            {selectedCount}/{maxSelections} Selected
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map(match => (
            <div 
              key={match.id}
              onClick={() => handleMatchClick(match.id)}
              className={`flex items-center bg-white rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                match.selected ? 'border-[#0043F1] bg-[#0043F1]' : 'border-[#85A2F2] hover:border-[#0043F1]'
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
                  <div className="w-16 h-16 rounded-full overflow-hidden mr-4 bg-gray-200">
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

        <div className="flex justify-between mt-8">
          <button 
            onClick={() => navigate(-1)}
            className="bg-[#85A2F2] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#7491e0] transition-colors"
          >
            Back
          </button>
          <button 
            onClick={handleSubmit}
            disabled={selectedCount === 0}
            className={`px-8 py-3 rounded-lg text-lg font-semibold transition-colors ${
              selectedCount > 0 
                ? 'bg-[#0043F1] text-white hover:bg-[#0034BD]' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit Matches
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeeAllMatches;

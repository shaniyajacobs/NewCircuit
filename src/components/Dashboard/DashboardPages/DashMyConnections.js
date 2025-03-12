import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { DashMessages } from './DashMessages';

const DashMyConnections = () => {

  return (

    <div className="flex flex-col pt-10 pb-20 mt-5 mr-5 ml-5 bg-white rounded-3xl border border-gray-200 shadow-lg max-md:pb-24 max-md:mr-2.5 max-md:max-w-full">
        <div className="flex flex-col ml-10 max-w-full text-3xl w-[90%]">
        <div className="self-start font-semibold text-indigo-950">
            Current Connections
        </div>
        <div className="flex gap-5 justify-between mt-6 text-lg font-medium text-gray-400 w-full">
            <div>Name</div>
            <div>Connection Level</div>
            <div>Compatibility</div>
        </div>
        </div>
        <ConnectionList />
    </div>
  );
}

// ConnectionList Component
const ConnectionList = () => {
  const [selectedConnection, setSelectedConnection] = useState(null);

  const selectConnection = (connectionName) => {
    setSelectedConnection(connectionName);
  }
  
  const connections = [
    { id: 1, name: "Alice Johnson", compatibility: 85, img: "https://randomuser.me/api/portraits/women/1.jpg" },
    { id: 2, name: "Michael Smith", compatibility: 72, img: "https://randomuser.me/api/portraits/men/2.jpg" },
    { id: 3, name: "Sophia Martinez", compatibility: 50, img: "https://randomuser.me/api/portraits/women/3.jpg" },
  ];

  return (
    <div className="flex flex-col px-10 mt-5 w-full max-md:px-5">
      
      {connections.map( (connection) => (
        <div
          key={connection.id}
          className="flex items-center py-4 px-6 bg-gray-100 rounded-xl my-2 shadow-sm"
        >
    
          {/* Profile Image & Name */}
          <div className="flex items-center gap-4 w-1/3 min-w-[200px]">
            <img
              src={connection.img}
              alt={connection.name}
              className="w-12 h-12 rounded-full border border-gray-300"
            />
            <div className="text-lg font-semibold">{connection.name}</div>
          </div>

          {/* Compatibility Bar */}
          <div className="flex-1 px-4">
            <div className="w-full bg-gray-300 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full"
                style={{
                  width: `${connection.compatibility}%`,
                  backgroundColor: getCompatibilityColor(connection.compatibility),
                }}
              />
            </div>
          </div>

          {/* Compatibility Percentage Box & Icon */}
          <div className="flex items-center justify-end w-1/3 min-w-[120px] gap-3">
            <span
              className="px-3 py-1 text-sm font-semibold text-gray-900 rounded-lg shadow-sm border border-gray-300"
              style={{
                backgroundColor: getCompatibilityColor(connection.compatibility),
              }}
            >
              {connection.compatibility}%
            </span>
            
            <button onClick={() => selectConnection(connection)}>
              <FaPaperPlane className="text-indigo-600 cursor-pointer hover:text-indigo-800" />
            </button>
          </div>
        </div>
      ))}

      {selectedConnection != null ?
        <DashMessages connection={selectedConnection}/> :
        <div/>
      }
    </div>
  );
};

// Function to set color based on compatibility score
const getCompatibilityColor = (score) => {
  if (score >= 80) return "#00E096";
  if (score >= 60) return "#0095FF";
  return "#C5A8FF";
};

export default DashMyConnections;
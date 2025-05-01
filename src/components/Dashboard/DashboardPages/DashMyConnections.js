import React, { useEffect, useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { DashMessages } from './DashMessages';
import { IoChevronBackCircleOutline } from 'react-icons/io5';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../pages/firebaseConfig';
import { toBeInTheDocument } from '@testing-library/jest-dom/dist/matchers';

const DashMyConnections = () => {
  const [selectedConnection, setSelectedConnection] = useState(null);

  const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      birthDate: '',
      phoneNumber: '',
      connections: null,
    });;
  
    // Fetch user data on component mount
    useEffect(() => {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const newFormData = {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              birthDate: userData.birthDate ? new Date(userData.birthDate.seconds * 1000).toISOString().split('T')[0] : '',
              phoneNumber: userData.phoneNumber || '',
              // connections: userData.connections,
              connections: connections,
            };
            setFormData(newFormData);
            if (newFormData.connections) {
              newFormData.connections.forEach(async connection => {
                const CONVERSATION_ID = () => {
                      if (auth.currentUser.uid < connection.id) {
                        return `${auth.currentUser.uid}${connection.id}`
                      } else {
                        return `${connection.id}${auth.currentUser.uid}`
                      }
                    };
                const userConversation = await getDoc(doc(db, "conversations", CONVERSATION_ID()));
                if (!userConversation.exists()) {
                  await setDoc(doc(db, "conversations", CONVERSATION_ID()), {
                    conversationId: CONVERSATION_ID(),
                    userIds: [auth.currentUser.uid, connection.id],
                    messages: [],
                  });
                  console.log(`Added a new conversation between ${auth.currentUser} and ${connection.name}`)
                } else {
                  console.log(`${connection.name} has an existing conversation with ${auth.currentUser}`);
                }
              });
            }
          }
          
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
  
      if (auth.currentUser) {
        fetchUserData();
        } else {
          console.log("No Connections");
        }
    }, []);

  const connections = [
    { id: 1, name: "Alice Johnson", compatibility: 85, img: "https://randomuser.me/api/portraits/women/1.jpg" },
    { id: 2, name: "Michael Smith", compatibility: 72, img: "https://randomuser.me/api/portraits/men/2.jpg" },
    { id: 3, name: "Sophia Martinez", compatibility: 50, img: "https://randomuser.me/api/portraits/women/3.jpg" },
    { id: "mSkhXidLxpW7QZFJgkERDSI8N8m2", name: "Marco Polo", compatibility: 100, img: "https://randomuser.me/api/portraits/men/1.jpg" },
    { id: "s1K8XeLj4PUXWLEEb5WLwGFtkx73", name: "Marco Berk Monfiglio", compatibility: 100, img: "https://randomuser.me/api/portraits/men/3.jpg" },
  ];

  // ConnectionList Component
  const ConnectionList = () => {    

    const selectConnection = async (connection) => {
        setSelectedConnection(connection);
    }

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
              <div className="text-base font-semibold">{connection.name}</div>
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
      </div>
    );
  };

  return (
    <div className="flex flex-col pt-10 pb-10 mt-1 mr-5 ml-5 bg-white rounded-3xl border border-gray-200 shadow-lg max-md:pb-24 max-md:mr-2.5 max-md:max-w-full">
        {selectedConnection == null ? 
        <div>
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
          : 
          <div>
            <div className="flex items-center gap-4 pl-2">
              <button onClick={() => setSelectedConnection(null)}>
                <IoChevronBackCircleOutline size={50} className="text-indigo-900 hover:text-indigo-700" />
              </button>
              <div className="text-2xl font-semibold">
                {selectedConnection.name}
              </div>
            </div>
            <DashMessages connection={selectedConnection}/>
          </div>
        }
    </div>
  );
}

// Function to set color based on compatibility score
const getCompatibilityColor = (score) => {
  if (score >= 80) return "#00E096";
  if (score >= 60) return "#0095FF";
  return "#C5A8FF";
};

export default DashMyConnections;
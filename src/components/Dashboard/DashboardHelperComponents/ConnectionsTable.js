import React from "react";
import { useNavigate } from "react-router-dom";
import { IoPersonCircle } from "react-icons/io5";
import { ReactComponent as SendIcon } from "../../../images/send-2.svg";
import { formatUserName } from "../../../utils/nameFormatter";

const ConnectionsTable = ({ connections, onMessageClick }) => {
  const navigate = useNavigate();

  if (!connections.length)
    return <div className="p-4 text-gray-600">No connections yet.</div>;

  const handleMessageClick = (connection) => {
    if (onMessageClick) {
      onMessageClick(connection);
    } else {
      // Default behavior: navigate to My Sparks page with the selected connection
      navigate('/dashboard/dashMyConnections', { 
        state: { selectedConnectionId: connection.userId } 
      });
    }
  };

  const badgeBackgrounds = [
    {
      style: {
        background:
          "radial-gradient(50% 50% at 50% 50%, #E2FF6580 0%, #D2FFD780 100%)",
      },
      className: "border border-[rgba(33,31,32,0.10)]",
    },
    {
      style: {
        background:
          "radial-gradient(50% 50% at 50% 50%, #B4FFF280 0%, #E1FFD680 100%)",
      },
      className: "border border-[rgba(33,31,32,0.10)]",
    },
    {
      style: {
        background:
          "radial-gradient(50% 50% at 50% 50%, #B0EEFF80 0%, #E7E9FF80 100%)",
      },
      className: "border border-[rgba(33,31,32,0.10)]",
    },
    {
      style: {
        background:
          "radial-gradient(50% 50% at 50% 50%, #8EFF7A80 0%, #D7FFF880 100%)",
      },
      className: "border border-[rgba(33,31,32,0.10)]",
    },
    {
      style: {
        background:
          "radial-gradient(50% 50% at 50% 50%, #79FFC780 0%, #FFF9A180 100%)",
      },
      className: "border border-[rgba(33,31,32,0.10)]",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {connections.slice(0, 5).map((conn, index) => {
        const compatibility = typeof conn.compatibility === "number" ? conn.compatibility : 0;
        const formattedName = formatUserName(conn);
        return (
          <div
            key={conn.userId}
            className="flex flex-col lg:flex-row lg:items-center p-6 w-full bg-white rounded-2xl shadow-sm border border-[rgba(33,31,32,0.25)] gap-4 lg:gap-0"
          >
            {/* Profile picture and name - always on same line */}
            <div className="flex items-center gap-2 lg:mr-6">
              {/* Red dot for new sparks */}
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '100px',
                  background: conn.isNewSpark ? '#FF4848' : '#FFF',
                  display: 'inline-block',
                  border: '1px solid #E5E7EB',
                }}
              />
              
              {/* Profile picture */}
              {conn.image ? (
                <img
                  src={conn.image}
                  alt={formattedName}
                  className="w-12 h-12 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <IoPersonCircle className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Name and age */}
              <div className="text-[#211F20] font-poppins text-body-m-med font-medium leading-[110%]">
                {formattedName}, {conn.age}
              </div>
            </div>

            {/* Compatibility badge - on its own line on mobile */}
            <div className="flex justify-center lg:justify-start lg:mr-6">
              <div
                className="flex justify-center items-center px-2 py-2 gap-2 rounded-[100px] border border-[rgba(33,31,32,0.10)]"
                style={{
                  background:
                    'radial-gradient(50% 50% at 50% 50%, rgba(226, 255, 101, 0.50) 0%, rgba(210, 255, 215, 0.50) 100%)'
                }}
              >
                <span className="text-[#211F20] font-bricolage text-h8 font-medium leading-[130%] uppercase">
                  {compatibility}% COMPATIBILITY
                </span>
              </div>
            </div>

            {/* Progress bar - on its own line on mobile */}
            <div className="w-full lg:flex-1 lg:mr-6">
              <div className="w-full h-1 rounded-[24px] bg-gray-200 relative">
                <div
                  className="h-1 rounded-[24px] bg-[#211F20] absolute top-0 left-0"
                  style={{ width: `${compatibility}%` }}
                ></div>
              </div>
            </div>

            {/* Message button - on its own line on mobile */}
            <div className="flex justify-center lg:justify-start">
              <button
                onClick={() => handleMessageClick(conn)}
                className="w-full lg:w-auto flex px-6 py-3 justify-center items-center gap-3 rounded-lg bg-[#211F20]"
              >
                <SendIcon className="w-5 h-5" />
                <span className="text-white font-poppins text-body-s-med font-medium leading-normal">
                  Message
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConnectionsTable;


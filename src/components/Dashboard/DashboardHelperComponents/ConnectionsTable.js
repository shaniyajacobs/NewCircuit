import React from "react";
import { IoPersonCircle } from 'react-icons/io5';

const ConnectionsTable = ({ connections }) => {
  if (!connections.length) return <div className="p-4 text-gray-600">No connections yet.</div>;
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {connections.map((conn) => (
          <tr key={conn.userId}>
            <td className="px-6 py-4 whitespace-nowrap">
              {conn.image ? (
                <img
                  src={conn.image}
                  alt={conn.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <IoPersonCircle className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">{conn.name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{conn.age}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ConnectionsTable;

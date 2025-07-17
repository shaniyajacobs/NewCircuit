import React from "react";

const ConnectionsTable = ({ connections }) => {
  if (!connections.length) return <div className="p-4 text-gray-600">No connections yet.</div>;
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {connections.map((conn) => (
          <tr key={conn.userId}>
            <td className="px-6 py-4 whitespace-nowrap">{conn.name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{conn.age}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ConnectionsTable;

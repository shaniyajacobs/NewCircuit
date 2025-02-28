import React from "react";

const ConnectionsTable = ({ connections }) => {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="px-0 py-4 text-sm text-left text-slate-400 max-sm:px-0 max-sm:py-2.5">
            #
          </th>
          <th className="px-0 py-4 text-sm text-left text-slate-400 max-sm:px-0 max-sm:py-2.5">
            Name
          </th>
          <th className="px-0 py-4 text-sm text-left text-slate-400 max-sm:px-0 max-sm:py-2.5">
            Match Level
          </th>
          <th className="px-0 py-4 text-sm text-left text-slate-400 max-sm:px-0 max-sm:py-2.5">
            Compatibility
          </th>
        </tr>
      </thead>
      <tbody>
        {connections.map((connection) => (
          <tr
            key={connection.id}
            className="border-b border-solid border-b-slate-100"
          >
            <td className="px-0 py-4 text-sm text-slate-600 max-sm:px-0 max-sm:py-2.5">
              {connection.id}
            </td>
            <td className="px-0 py-4 text-sm text-slate-600 max-sm:px-0 max-sm:py-2.5">
              {connection.name}
            </td>
            <td className="px-0 py-4 text-sm text-slate-600 max-sm:px-0 max-sm:py-2.5">
              <div className="relative bg-blue-100 rounded-lg h-[3px] w-[325px]">
                <div
                  className="absolute h-full bg-sky-500 rounded-lg"
                  style={{ width: `${connection.matchLevel}%` }}
                />
              </div>
            </td>
            <td className="px-0 py-4 text-sm text-center rounded-lg text-slate-600 max-sm:px-0 max-sm:py-2.5">
              {connection.matchLevel}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ConnectionsTable;

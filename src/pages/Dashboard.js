import React from "react";
import Sidebar from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import EventCard from "../components/Dashboard/EventCard";
import ConnectionsTable from "../components/Dashboard/ConnectionsTable";

const Dashboard = () => {
  const upcomingEvents = [
    {
      title: "25-34 yrs old SF",
      date: "01/24/25",
      time: "5:00pm",
      status: "10/10 sign ups",
      action: "Join Now",
      isActive: false,
    },
    {
      title: "35-44 yrs old SF",
      date: "01/27/25",
      time: "7:00pm",
      status: "10/10 sign ups",
      action: "Join in 24 hours",
      isActive: true,
    },
    {
      title: "45-55 yrs old SF",
      date: "01/27/25",
      time: "7:00pm",
      status: "10/10 sign ups",
      action: "Join in 24 hours",
      isActive: false,
    },
  ];

  const signUpEvents = [
    {
      title: "25-34 yrs old SF",
      date: "01/24/25",
      time: "5:00pm",
      menSpots: "5/10",
      womenSpots: "7/10",
      isActive: true,
    },
    {
      title: "35-44 yrs old SF",
      date: "01/27/25",
      time: "7:00pm",
      menSpots: "10/10",
      womenSpots: "10/10",
      isActive: false,
    },
    {
      title: "45-55 yrs old SF",
      date: "01/27/25",
      time: "7:00pm",
      menSpots: "4/10",
      womenSpots: "9/10",
      isActive: true,
    },
  ];

  const connections = [
    {
      id: "01",
      name: "Kelly Rachel",
      matchLevel: 65,
    },
    {
      id: "02",
      name: "Taylor Swift",
      matchLevel: 29,
    },
    {
      id: "03",
      name: "Jennifer Lopex",
      matchLevel: 48,
    },
  ];

  return (
    <div className="flex gap-5 p-5 min-h-screen bg-gray-50 max-md:flex-col">
      <Sidebar />
      <div className="flex flex-col flex-1 gap-8">
        <Header />

        <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
          <div className="mb-6 text-xl font-semibold text-indigo-950">
            Upcoming Events
          </div>
          <div className="flex bg-[#F3F3F3] rounded-xl">
            {upcomingEvents.map((event, index) => (
              <EventCard key={index} event={event} type="upcoming" />
            ))}
          </div>
        </div>

        <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
          <div className="mb-6 text-xl font-semibold text-indigo-950">
            Sign-Up for Dates
          </div>
          <div className="grid gap-5 grid-cols-[repeat(3,1fr)] max-md:grid-cols-[1fr]">
            {signUpEvents.map((event, index) => (
              <EventCard key={index} event={event} type="signup" />
            ))}
          </div>
          <div className="mt-5 text-xs text-right text-blue-500 cursor-pointer">
            Purchase More Dates
          </div>
          <div className="text-right">Dates Remaining: 3</div>
        </div>

        <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
          <div className="mb-6 text-xl font-semibold text-indigo-950">
            Current Connections
          </div>
          <ConnectionsTable connections={connections} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { db } from '../../../pages/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { FaUsers, FaCalendarAlt, FaBuilding, FaChartLine, FaTicketAlt, FaUserFriends } from 'react-icons/fa';

const TIME_PERIODS = {
  WEEK: '7 Days',
  MONTH: '30 Days',
  QUARTER: '3 Months',
  YEAR: '12 Months',
  ALL: 'All Time'
};

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS.MONTH);
  
  // User Analytics
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [userGrowthRate, setUserGrowthRate] = useState(0);
  
  // Event Analytics
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalEventSignups, setTotalEventSignups] = useState(0);
  
  // Business Analytics
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [businessGrowthRate, setBusinessGrowthRate] = useState(0);
  
  // System Analytics
  const [systemMetrics, setSystemMetrics] = useState({
    totalCoupons: 0,
    totalConnections: 0,
    totalConversations: 0
  });

  useEffect(() => {
    fetchAllData();
  }, [selectedPeriod]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserData(),
        fetchEventData(),
        fetchBusinessData(),
        fetchSystemData()
      ]);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt;
        if (data.createdAt instanceof Timestamp) {
          createdAt = data.createdAt.toDate();
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt.split(' at ')[0]);
        } else {
          createdAt = new Date();
        }
        return { id: doc.id, createdAt, ...data };
      });

      // Filter users by time period
      const filteredUsers = filterDataByTimePeriod(fetchedUsers);
      
      // Process user growth
      const growthData = processGrowthData(filteredUsers, 'users');
      setTotalUsers(fetchedUsers.length);
      setUserGrowthRate(calculateGrowthRate(growthData));
      
      // Calculate active users (users with recent activity)
      const activeUsersCount = calculateActiveUsers(fetchedUsers);
      setActiveUsers(activeUsersCount);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchEventData = async () => {
    try {
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const fetchedEvents = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTotalEvents(fetchedEvents.length);
      
      // Calculate total signups
      const totalSignups = await calculateTotalEventSignups();
      setTotalEventSignups(totalSignups);
    } catch (error) {
      console.error('Error fetching event data:', error);
    }
  };

  const fetchBusinessData = async () => {
    try {
      const businessesSnapshot = await getDocs(collection(db, 'businesses'));
      const fetchedBusinesses = businessesSnapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt;
        if (data.createdAt instanceof Timestamp) {
          createdAt = data.createdAt.toDate();
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt.split(' at ')[0]);
        } else {
          createdAt = new Date();
        }
        return { id: doc.id, createdAt, ...data };
      });

      // Filter businesses by time period
      const filteredBusinesses = filterDataByTimePeriod(fetchedBusinesses);
      
      // Process business growth
      const businessGrowthData = processGrowthData(filteredBusinesses, 'businesses');
      setTotalBusinesses(fetchedBusinesses.length);
      setBusinessGrowthRate(calculateGrowthRate(businessGrowthData));
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const fetchSystemData = async () => {
    try {
      // Fetch coupons
      const couponsSnapshot = await getDocs(collection(db, 'coupons'));
      const totalCoupons = couponsSnapshot.size;
      
      // Fetch connections (approximate)
      const connectionsSnapshot = await getDocs(collection(db, 'users'));
      let totalConnections = 0;
      for (const userDoc of connectionsSnapshot.docs) {
        const connectionsRef = collection(db, 'users', userDoc.id, 'connections');
        const userConnections = await getDocs(connectionsRef);
        totalConnections += userConnections.size;
      }
      
      // Fetch conversations
      const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
      const totalConversations = conversationsSnapshot.size;
      
      setSystemMetrics({
        totalCoupons,
        totalConnections,
        totalConversations
      });
    } catch (error) {
      console.error('Error fetching system data:', error);
    }
  };

  const filterDataByTimePeriod = (data) => {
    if (selectedPeriod === TIME_PERIODS.ALL) return data;
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (selectedPeriod) {
      case TIME_PERIODS.WEEK:
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case TIME_PERIODS.MONTH:
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case TIME_PERIODS.QUARTER:
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case TIME_PERIODS.YEAR:
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return data.filter(item => item.createdAt >= cutoffDate);
  };

  const processGrowthData = (data, type) => {
    const groupedData = {};
    data.forEach(item => {
      const date = item.createdAt;
      let timeLabel;
      
      switch (selectedPeriod) {
        case TIME_PERIODS.WEEK:
          timeLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          break;
        case TIME_PERIODS.MONTH:
          timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case TIME_PERIODS.QUARTER:
          timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case TIME_PERIODS.YEAR:
        case TIME_PERIODS.ALL:
          timeLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          break;
        default:
          timeLabel = date.toLocaleDateString();
      }
      
      groupedData[timeLabel] = (groupedData[timeLabel] || 0) + 1;
    });

    const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));
    let cumulative = 0;
    const cumulativeData = sortedDates.map(date => {
      cumulative += groupedData[date];
      return { timeLabel: date, total: cumulative };
    });

    return {
      labels: cumulativeData.map(d => d.timeLabel),
      datasets: [{
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Growth`,
        data: cumulativeData.map(d => d.total),
        fill: true,
        borderColor: type === 'users' ? 'rgb(75, 192, 192)' : 'rgb(255, 99, 132)',
        backgroundColor: type === 'users' ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)',
        tension: 0.4
      }]
    };
  };

  const calculateGrowthRate = (growthData) => {
    const data = growthData.datasets[0].data;
    if (data.length < 2) return 0;
    const lastTwoPoints = data.slice(-2);
    if (lastTwoPoints[0] === 0) return 0;
    return ((lastTwoPoints[1] - lastTwoPoints[0]) / lastTwoPoints[0] * 100).toFixed(1);
  };

  const calculateActiveUsers = (users) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return users.filter(user => user.createdAt >= thirtyDaysAgo).length;
  };

  const calculateTotalEventSignups = async () => {
    let totalSignups = 0;
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    
    for (const eventDoc of eventsSnapshot.docs) {
      try {
        const signedUpUsersRef = collection(db, 'events', eventDoc.id, 'signedUpUsers');
        const signedUpUsers = await getDocs(signedUpUsersRef);
        totalSignups += signedUpUsers.size;
      } catch (error) {
        console.error(`Error fetching signups for event ${eventDoc.id}:`, error);
      }
    }
    
    return totalSignups;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Analytics Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          {Object.values(TIME_PERIODS).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium opacity-90">Total Users</h3>
                  <p className="text-3xl font-bold mt-2">{totalUsers.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">+{userGrowthRate}% growth</p>
                </div>
                <FaUsers className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium opacity-90">Active Users</h3>
                  <p className="text-3xl font-bold mt-2">{activeUsers.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">Last 30 days</p>
                </div>
                <FaUserFriends className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium opacity-90">Total Events</h3>
                  <p className="text-3xl font-bold mt-2">{totalEvents.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">{totalEventSignups} signups</p>
                </div>
                <FaCalendarAlt className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium opacity-90">Total Businesses</h3>
                  <p className="text-3xl font-bold mt-2">{totalBusinesses.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">+{businessGrowthRate}% growth</p>
                </div>
                <FaBuilding className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium opacity-90">Total Coupons</h3>
                  <p className="text-3xl font-bold mt-2">{systemMetrics.totalCoupons.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">Active coupons</p>
                </div>
                <FaTicketAlt className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium opacity-90">Total Connections</h3>
                  <p className="text-3xl font-bold mt-2">{systemMetrics.totalConnections.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">User connections</p>
                </div>
                <FaChartLine className="w-8 h-8 opacity-80" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics; 
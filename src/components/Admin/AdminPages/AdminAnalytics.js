import React, { useState, useEffect } from 'react';
import { db } from '../../../pages/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Timestamp } from 'firebase/firestore';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TIME_PERIODS = {
  WEEK: '7 Days',
  MONTH: '30 Days',
  QUARTER: '3 Months',
  YEAR: '12 Months',
  ALL: 'All Time'
};

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [userGrowthData, setUserGrowthData] = useState({
    labels: [],
    datasets: []
  });
  const [totalUsers, setTotalUsers] = useState(0);
  const [monthlyGrowth, setMonthlyGrowth] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState(TIME_PERIODS.MONTH);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      processUserData(users);
    }
  }, [selectedPeriod, users]);

  const fetchUserData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore timestamp to Date
        let createdAt;
        if (data.createdAt instanceof Timestamp) {
          createdAt = data.createdAt.toDate();
        } else if (typeof data.createdAt === 'string') {
          // Parse the string format "April 22, 2025 at 7:45:50 PM UTC-7"
          createdAt = new Date(data.createdAt.split(' at ')[0]);
        } else {
          createdAt = new Date();
        }

        return {
          id: doc.id,
          createdAt,
          ...data
        };
      });

      console.log('Fetched Users with dates:', fetchedUsers.map(u => ({
        id: u.id,
        createdAt: u.createdAt.toISOString()
      })));
      
      setUsers(fetchedUsers);
      processUserData(fetchedUsers);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const processUserData = (userData) => {
    // Sort users by creation date
    userData.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Filter users based on selected time period
    const filteredUsers = filterUsersByTimePeriod(userData);

    // Group users by appropriate time interval
    const groupedUsers = groupUsersByTimeInterval(filteredUsers);

    // Calculate cumulative growth
    let cumulative = 0;
    const sortedDates = Object.keys(groupedUsers).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB;
    });

    const cumulativeGrowth = sortedDates.map(date => {
      cumulative += groupedUsers[date];
      return { timeLabel: date, total: cumulative };
    });

    // Calculate growth rate
    const lastTwoPoints = cumulativeGrowth.slice(-2);
    const growthRate = lastTwoPoints.length > 1
      ? ((lastTwoPoints[1].total - lastTwoPoints[0].total) / lastTwoPoints[0].total * 100).toFixed(1)
      : 0;

    const chartData = {
      labels: cumulativeGrowth.map(data => data.timeLabel),
      datasets: [
        {
          label: 'Total Users',
          data: cumulativeGrowth.map(data => data.total),
          fill: true,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        }
      ]
    };

    setUserGrowthData(chartData);
    setTotalUsers(userData.length);
    setMonthlyGrowth(growthRate);
    setLoading(false);
  };

  const filterUsersByTimePeriod = (userData) => {
    if (selectedPeriod === TIME_PERIODS.ALL) {
      return userData;
    }

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

    return userData.filter(user => user.createdAt >= cutoffDate);
  };

  const groupUsersByTimeInterval = (userData) => {
    const groupedUsers = {};
    
    userData.forEach(user => {
      let timeLabel;
      const date = user.createdAt;
      
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
      
      groupedUsers[timeLabel] = (groupedUsers[timeLabel] || 0) + 1;
    });

    return groupedUsers;
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `User Growth (${selectedPeriod})`
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Users'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time Period'
        }
      }
    }
  };

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
        <div className="flex gap-2">
          {Object.values(TIME_PERIODS).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg transition-colors ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-medium opacity-90">Total Users</h3>
              <p className="text-3xl font-bold mt-2">{totalUsers}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-medium opacity-90">Growth Rate</h3>
              <p className="text-3xl font-bold mt-2">{monthlyGrowth}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="h-[400px]">
              <Line data={userGrowthData} options={chartOptions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics; 
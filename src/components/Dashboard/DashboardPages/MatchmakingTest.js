import React, { useState } from 'react';
import { testMatchmakingLogic, testNewConnectionScenario, testRealWorldScenario, runAllMatchmakingTests, cleanupTestUsers } from '../../../utils/matchmakingTest';

const MatchmakingTest = () => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTest, setActiveTest] = useState('');
  const [autoCleanup, setAutoCleanup] = useState(false);

  const runTest = async (testFunction, testName, ...args) => {
    setIsRunning(true);
    setActiveTest(testName);
    setTestResults(null);
    
    try {
      const results = await testFunction(...args);
      setTestResults(results);
      console.log(`${testName} results:`, results);
    } catch (error) {
      console.error(`Error running ${testName}:`, error);
      setTestResults({ success: false, error: error.message });
    } finally {
      setIsRunning(false);
      setActiveTest('');
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setActiveTest('All Tests');
    setTestResults(null);
    
    try {
      const results = await runAllMatchmakingTests();
      setTestResults(results);
      console.log('All tests results:', results);
    } catch (error) {
      console.error('Error running all tests:', error);
      setTestResults({ allPassed: false, error: error.message });
    } finally {
      setIsRunning(false);
      setActiveTest('');
    }
  };

  const handleCleanup = async () => {
    setIsRunning(true);
    setActiveTest('Cleanup');
    setTestResults(null);
    try {
      const results = await cleanupTestUsers();
      setTestResults(results);
      console.log('Cleanup results:', results);
    } catch (error) {
      console.error('Error during cleanup:', error);
      setTestResults({ success: false, error: error.message });
    } finally {
      setIsRunning(false);
      setActiveTest('');
    }
  };

  return (
    <div className="p-7 bg-white rounded-3xl border border-gray-50 border-solid shadow-[0_4px_20px_rgba(238,238,238,0.502)] max-sm:p-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-indigo-950">Matchmaking Test Suite</h1>
      </div>

      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => runTest(testMatchmakingLogic, 'Matchmaking Logic')}
            disabled={isRunning}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning && activeTest === 'Matchmaking Logic' ? 'Running...' : 'Test Matchmaking Logic'}
          </button>
          
          <button
            onClick={() => runTest(testNewConnectionScenario, 'New Connection')}
            disabled={isRunning}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning && activeTest === 'New Connection' ? 'Running...' : 'Test New Connection'}
          </button>
          
          <button
            onClick={() => runTest(testRealWorldScenario, 'Real-World Simulation', autoCleanup)}
            disabled={isRunning}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning && activeTest === 'Real-World Simulation' ? 'Running...' : 'Real-World Test'}
          </button>
          
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning && activeTest === 'All Tests' ? 'Running...' : 'Run All Tests'}
          </button>

          <button
            onClick={handleCleanup}
            disabled={isRunning}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning && activeTest === 'Cleanup' ? 'Running...' : 'Cleanup Test Users'}
          </button>
        </div>

        {/* Cleanup option for real-world test */}
        <div className="flex items-center space-x-2 p-4 bg-purple-50 rounded-lg">
          <input
            type="checkbox"
            id="autoCleanup"
            checked={autoCleanup}
            onChange={(e) => setAutoCleanup(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <label htmlFor="autoCleanup" className="text-sm font-medium text-purple-900">
            Auto-cleanup test data after Real-World Test (removes test users and connections)
          </label>
        </div>
      </div>

      {testResults && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {testResults.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {testResults.error}
            </div>
          )}

          {testResults.allPassed !== undefined && (
            <div className={`border px-4 py-3 rounded mb-4 ${testResults.allPassed ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`}>
              <strong>Overall Result:</strong> {testResults.allPassed ? '✅ All Tests Passed' : '❌ Some Tests Failed'}
            </div>
          )}

          {testResults.success !== undefined && (
            <div className={`border px-4 py-3 rounded mb-4 ${testResults.success ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`}>
              <strong>Test Result:</strong> {testResults.success ? '✅ Passed' : '❌ Failed'}
            </div>
          )}

          {testResults.message && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
              <strong>Message:</strong> {testResults.message}
            </div>
          )}

          {testResults.cleanupPerformed !== undefined && (
            <div className={`border px-4 py-3 rounded mb-4 ${testResults.cleanupPerformed ? 'bg-green-100 border-green-400 text-green-700' : 'bg-yellow-100 border-yellow-400 text-yellow-700'}`}>
              <strong>Cleanup:</strong> {testResults.cleanupPerformed ? '✅ Test data cleaned up automatically' : '📝 Test data preserved for manual inspection'}
            </div>
          )}

          {testResults.issues && testResults.issues.length > 0 && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <strong>Issues Found:</strong>
              <ul className="list-disc list-inside mt-2">
                {testResults.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {testResults.testUsers && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Test Users Created:</h3>
              <div className="bg-white p-3 rounded border">
                <ul className="list-disc list-inside">
                  {testResults.testUsers.map((user, index) => (
                    <li key={index}>
                      <strong>{user.firstName} {user.lastName}</strong> ({user.email}) - {user.gender}, {user.sexualPreference}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {testResults.matches && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Calculated Matches:</h3>
              <div className="bg-white p-3 rounded border">
                <ul className="list-disc list-inside">
                  {testResults.matches.map((match, index) => (
                    <li key={index}>
                      <strong>{match.userId}:</strong> {match.score}% compatibility
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {testResults.existingConnections && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Existing Connections:</h3>
              <div className="bg-white p-3 rounded border">
                {Object.keys(testResults.existingConnections).length > 0 ? (
                  <ul className="list-disc list-inside">
                    {Object.entries(testResults.existingConnections).map(([userId, score]) => (
                      <li key={userId}>
                        <strong>{userId}:</strong> {score}% compatibility
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No existing connections found</p>
                )}
              </div>
            </div>
          )}

          {testResults.mergedMatches && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Merged Matches:</h3>
              <div className="bg-white p-3 rounded border">
                <ul className="list-disc list-inside">
                  {testResults.mergedMatches.map((match, index) => (
                    <li key={index}>
                      <strong>{match.userId}:</strong> {match.score}% compatibility
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {testResults.preservedConnections && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Preserved Connections:</h3>
              <div className="bg-white p-3 rounded border">
                <ul className="list-disc list-inside">
                  {Object.entries(testResults.preservedConnections).map(([userId, data]) => (
                    <li key={userId}>
                      <strong>{userId}:</strong> Existing: {data.existingScore}%, Calculated: {data.calculatedScore}%, Difference: {data.difference}%
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {testResults.beforeConnections && testResults.afterConnections && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Before Test:</h3>
                <div className="bg-white p-3 rounded border">
                  {Object.keys(testResults.beforeConnections).length > 0 ? (
                    <ul className="list-disc list-inside">
                      {Object.entries(testResults.beforeConnections).map(([userId, score]) => (
                        <li key={userId}>
                          <strong>{userId}:</strong> {score}%
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No connections</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">After Test:</h3>
                <div className="bg-white p-3 rounded border">
                  {Object.keys(testResults.afterConnections).length > 0 ? (
                    <ul className="list-disc list-inside">
                      {Object.entries(testResults.afterConnections).map(([userId, score]) => (
                        <li key={userId}>
                          <strong>{userId}:</strong> {score}%
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No connections</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li><strong>Test Matchmaking Logic:</strong> Tests the core algorithm without creating real data</li>
          <li><strong>Test New Connection:</strong> Tests that existing connections are preserved when adding new ones</li>
          <li><strong>Real-World Test:</strong> Creates actual test users and connections to simulate real scenarios</li>
          <li><strong>Run All Tests:</strong> Runs all tests together for comprehensive validation</li>
          <li>Check the console for detailed logs and the results above</li>
          <li>If any tests fail, the issues will be displayed above</li>
        </ol>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold mb-2">Real-World Test Details:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Creates 3 test users with realistic quiz responses</li>
          <li>Runs the actual matchmaking algorithm on these users</li>
          <li>Creates real connections in your Firestore database</li>
          <li>Tests that existing connections are preserved when adding new ones</li>
          <li>Option to auto-cleanup test data after completion</li>
          <li>This is the most comprehensive test - it simulates exactly what real users would experience</li>
        </ul>
      </div>
    </div>
  );
};

export default MatchmakingTest; 
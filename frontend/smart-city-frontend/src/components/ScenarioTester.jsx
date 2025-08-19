import React, { useState } from 'react';
import { Play, AlertTriangle } from 'lucide-react';

const ScenarioTester = ({ onTestScenario }) => {
  const [scenario, setScenario] = useState({
    zone: 'A',
    event: 'road_closure',
    duration: 30
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const testData = {
      ts: Date.now(),
      zones: [{
        id: scenario.zone,
        traffic: 50,
        pollution: 30,
        event: scenario.event
      }]
    };

    try {
      const response = await onTestScenario(testData);
      setResult(response);
    } catch (error) {
      console.error('Scenario test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Play className="w-6 h-6 mr-2" />
        Scenario Testing
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
            <select
              value={scenario.zone}
              onChange={(e) => setScenario({ ...scenario, zone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="A">Zone A</option>
              <option value="B">Zone B</option>
              <option value="C">Zone C</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <select
              value={scenario.event}
              onChange={(e) => setScenario({ ...scenario, event: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="road_closure">Road Closure</option>
              <option value="pollution_spike">Pollution Spike</option>
              <option value="traffic_accident">Traffic Accident</option>
              <option value="construction">Construction</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={scenario.duration}
              onChange={(e) => setScenario({ ...scenario, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min="5"
              max="480"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Testing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Scenario</span>
            </>
          )}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="font-semibold mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            AI Prediction Results
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Reroute Suggested:</span>
              <span className={`font-medium ${result.reroute_suggested ? 'text-red-600' : 'text-green-600'}`}>
                {result.reroute_suggested ? 'Yes' : 'No'}
              </span>
            </div>

            <div>
              <span className="text-gray-600 block mb-2">Analysis:</span>
              <p className="text-sm bg-white p-3 rounded border">{result.analysis}</p>
            </div>

            {result.predicted_traffic && (
              <div>
                <span className="text-gray-600 block mb-2">Predicted Traffic Impact:</span>
                <div className="space-y-1">
                  {result.predicted_traffic.map((zone, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>Zone {zone.id}:</span>
                      <span className="font-medium">{Math.round(zone.predicted_traffic)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioTester;

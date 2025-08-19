import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { POLLING_INTERVAL } from '../utils/constants';

export const useRealTimeData = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [weather, traffic] = await Promise.all([
        api.getWeatherLatest().catch(() => null),
        api.getTrafficLatest().catch(() => null)
      ]);
      if (weather) setWeatherData(weather);
      if (traffic) setTrafficData(traffic);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch real-time data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { weatherData, trafficData, loading, error, refetch: fetchData };
};

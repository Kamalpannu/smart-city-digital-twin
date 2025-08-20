import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { POLLING_INTERVAL } from '../utils/constants';

export const useRealTimeData = () => {
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getLatest();
      setLatestData(data);
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

  return { latestData, loading, error, refetch: fetchData };
};

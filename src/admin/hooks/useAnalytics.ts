import { useState, useEffect, useCallback } from 'react';
import { AnalyticsData } from '../types';
import { analyticsService } from '../services/analytics';

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const metrics = await analyticsService.getMetrics();
      setData(metrics);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics trend data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    data,
    loading,
    error,
    refresh: fetchMetrics
  };
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { queryApi, historyApi } from '../services/api';
import { useAuth } from './AuthContext';

const QueryContext = createContext(null);

export const QueryProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [currentQuery, setCurrentQuery] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const [contextMemory, setContextMemory] = useState(null);

  // Fetch history when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    } else {
      setQueryHistory([]);
    }
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    try {
      const res = await historyApi.getHistory();
      if (res.data.success) {
        setQueryHistory(res.data.history);
      }
    } catch (err) {
      console.warn('[QueryContext] Error fetching history', err);
    }
  };

  const executeQuery = async (queryText) => {
    if (!queryText || !queryText.trim()) return;

    setIsLoading(true);
    setError(null);
    setCurrentQuery(queryText);

    try {
      const res = await queryApi.submitQuery(queryText, contextMemory);
      if (res.data.success) {
        setResult(res.data);
        if (res.data.context) {
          setContextMemory(res.data.context);
        }
        if (isAuthenticated) {
          fetchHistory();
        }
      } else {
        setError(res.data.message || 'Failed to process oceanographic query');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to reach oceanographic query service. Please check connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setCurrentQuery('');
    setResult(null);
    setError(null);
    setContextMemory(null);
  };

  const loadFromHistory = (item) => {
    setCurrentQuery(item.query);
    setResult({
      success: true,
      type: item.intent,
      answer: item.summaryAnswer,
      keyFindings: item.keyFindings,
      dataUsed: {
        parameter: item.parameter,
        region: item.region,
        depth: item.depth ? `${item.depth}m` : '0–2000m',
        ...item.dataSummary,
      },
      visualization: item.chartData,
      prediction: item.predictionData,
      suggestedFollowUps: [
        'Compare with another ocean basin',
        'Show vertical depth profile',
        'Predict 12-month future trend',
      ],
    });
    setContextMemory({
      region: item.region,
      parameter: item.parameter,
      depth: item.depth,
    });
  };

  const deleteHistoryItem = async (id) => {
    try {
      await historyApi.deleteItem(id);
      setQueryHistory((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error('[QueryContext] Error deleting history item', err);
    }
  };

  const clearHistory = async () => {
    try {
      await historyApi.clearAll();
      setQueryHistory([]);
    } catch (err) {
      console.error('[QueryContext] Error clearing history', err);
    }
  };

  return (
    <QueryContext.Provider
      value={{
        currentQuery,
        setCurrentQuery,
        result,
        isLoading,
        error,
        queryHistory,
        contextMemory,
        executeQuery,
        resetAnalysis,
        loadFromHistory,
        deleteHistoryItem,
        clearHistory,
      }}
    >
      {children}
    </QueryContext.Provider>
  );
};

export const useQuery = () => useContext(QueryContext);

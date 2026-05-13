import { useState, useCallback } from "react";

/**
 * Custom hook for handling async operations with loading and error states
 * @param {Function} asyncFn - Async function to execute
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, execute }
 */
export const useAsync = (asyncFn, options = {}) => {
  const { onSuccess, onError, initialData = null } = options;

  const [state, setState] = useState({
    data: initialData,
    loading: false,
    error: null
  });

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFn(...args);
      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null
      }));

      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err?.response?.data?.message || err?.message || "An error occurred";
      setState(prev => ({
        ...prev,
        loading: false,
        error
      }));

      onError?.(error);
      throw error;
    }
  }, [asyncFn, onSuccess, onError]);

  return {
    ...state,
    execute,
    reset: () => setState({ data: initialData, loading: false, error: null })
  };
};

/**
 * Usage example:
 * 
 * const { data, loading, error, execute } = useAsync(fetchUser);
 * 
 * useEffect(() => {
 *   execute(userId);
 * }, [userId, execute]);
 * 
 * if (loading) return <Loader />;
 * if (error) return <ErrorMessage message={error} />;
 * return <UserCard user={data} />;
 */

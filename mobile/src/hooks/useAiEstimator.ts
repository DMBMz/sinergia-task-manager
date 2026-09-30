import { useState, useEffect, useMemo } from 'react';
import { aiEstimator, TaskFeatures, EstimationResult } from '../services/aiEstimator';

export function useAiEstimator(features: TaskFeatures, debounceMs: number = 300) {
  const [estimate, setEstimate] = useState<EstimationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  useEffect(() => {
    if (!features.title || features.title.trim().length === 0) {
      setEstimate(null);
      return;
    }

    setIsCalculating(true);
    const timer = setTimeout(() => {
      try {
        const result = aiEstimator.predict(features);
        setEstimate(result);
      } catch (err) {
        console.error('[useAiEstimator Error]', err);
      } finally {
        setIsCalculating(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [
    features.title,
    features.description,
    features.subtasksCount,
    features.priority,
    features.tagsCount,
    debounceMs
  ]);

  return {
    estimate,
    isCalculating,
    suggestedHours: estimate?.estimatedHours ?? null,
    confidence: estimate?.confidence ?? 0,
    explanation: estimate?.explanation ?? ''
  };
}

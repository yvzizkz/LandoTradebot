"use client";
import { useState } from 'react';
import { AnalysisRequest, AnalysisResponse } from '@/types/ai';

export function useAiAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async (request: AnalysisRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = request.includeReasoning ? '/api/ai/reason' : '/api/ai/analyze';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Analysis failed');
      }
      const result: AnalysisResponse = await res.json();
      setAnalyses((prev) => [result, ...prev]);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { runAnalysis, isLoading, analyses, error };
}

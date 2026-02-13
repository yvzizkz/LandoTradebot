"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketStore } from "@/stores/market-store";
import { useMarketData } from "@/hooks/use-market-data";
import { useAiAnalysis } from "@/hooks/use-ai-analysis";
import { MARKET_TYPES, MARKET_LABELS, MarketType } from "@/types/market";
import { AnalysisType, AnalysisResponse } from "@/types/ai";
import { Brain, Loader2, Zap, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const ANALYSIS_TYPES: { value: AnalysisType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "market_overview", label: "Market Overview", icon: TrendingUp },
  { value: "trade_signal", label: "Trade Signals", icon: Zap },
  { value: "risk_assessment", label: "Risk Assessment", icon: Shield },
  { value: "custom", label: "Custom Prompt", icon: Brain },
];

function AnalysisCard({ analysis }: { analysis: AnalysisResponse }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{analysis.model}</Badge>
            <Badge variant="outline" className="text-xs">{MARKET_LABELS[analysis.request.marketType]}</Badge>
            <Badge className="text-xs">{analysis.request.analysisType.replace('_', ' ')}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{format(new Date(analysis.timestamp), 'HH:mm:ss')}</span>
            <Badge variant={analysis.confidence >= 70 ? "default" : analysis.confidence >= 40 ? "secondary" : "destructive"}>
              {analysis.confidence}% conf.
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium mb-2">{analysis.summary}</p>
        {expanded && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm whitespace-pre-wrap">{analysis.analysis}</p>
            </div>
            {analysis.signals && analysis.signals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Trade Signals</p>
                <div className="space-y-1">
                  {analysis.signals.map((signal, i) => (
                    <div key={i} className="flex items-center justify-between rounded border border-border p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{signal.assetSymbol}</span>
                        <Badge variant={signal.action.includes('buy') ? 'default' : signal.action.includes('sell') ? 'destructive' : 'secondary'} className="text-xs">
                          {signal.action.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{signal.confidence}% conf.</span>
                        <span className="text-muted-foreground">{signal.rationale}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.reasoning && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Reasoning Chain</p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs whitespace-pre-wrap max-h-[300px] overflow-auto">
                  {analysis.reasoning}
                </div>
              </div>
            )}
          </div>
        )}
        {!expanded && <p className="text-xs text-muted-foreground cursor-pointer">Click to expand...</p>}
      </CardContent>
    </Card>
  );
}

export default function AiAnalysisPage() {
  useMarketData();
  const { selectedMarket } = useMarketStore();
  const { runAnalysis, isLoading, analyses, error } = useAiAnalysis();

  const [marketType, setMarketType] = useState<MarketType>(selectedMarket);
  const [analysisType, setAnalysisType] = useState<AnalysisType>("market_overview");
  const [customPrompt, setCustomPrompt] = useState("");
  const [useReasoning, setUseReasoning] = useState(false);

  const handleSubmit = async () => {
    await runAnalysis({
      marketType,
      analysisType,
      customPrompt: analysisType === "custom" ? customPrompt : undefined,
      includeReasoning: useReasoning,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          AI Analysis
        </h1>
        <p className="text-sm text-muted-foreground">AI-powered market analysis using GPT-4o and o4-mini</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Market</Label>
              <Select value={marketType} onValueChange={(v) => setMarketType(v as MarketType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MARKET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{MARKET_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Analysis Type</Label>
              <Select value={analysisType} onValueChange={(v) => setAnalysisType(v as AnalysisType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANALYSIS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {analysisType === "custom" && (
            <div className="space-y-2">
              <Label>Your Question</Label>
              <Textarea placeholder="Ask anything about the market..." value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={3} />
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={useReasoning} onChange={(e) => setUseReasoning(e.target.checked)} className="rounded border-border" />
              <span className="text-sm">Use o4-mini deep reasoning</span>
            </label>
          </div>

          <Button onClick={handleSubmit} disabled={isLoading || (analysisType === "custom" && !customPrompt)} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>

          {error && (
            <div className="rounded-lg bg-[var(--color-negative)]/10 p-3 text-sm text-[var(--color-negative)]">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {analyses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Analysis Results</h2>
          {analyses.map((analysis) => (
            <AnalysisCard key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </div>
  );
}

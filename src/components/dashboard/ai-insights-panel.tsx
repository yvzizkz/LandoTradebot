"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight } from "lucide-react";

export function AiInsightsPanel() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Get AI-powered market analysis across all 5 market types. Our engine uses GPT-4o for general
            analysis and o4-mini for complex multi-factor reasoning.
          </p>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Available Analysis Types</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Market Overview</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Trade Signals</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Risk Assessment</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Custom Prompt</span>
            </div>
          </div>
          <Link href="/ai-analysis">
            <Button variant="outline" className="w-full" size="sm">
              Open AI Analysis
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

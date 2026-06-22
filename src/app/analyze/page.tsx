import { AnalyzeForm } from "@/components/analyze-form";

export default function AnalyzePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analyze Property</h1>
        <p className="text-muted-foreground">
          Underwrite a flip in seconds. Max offer, profit, and a 0–100 score.
        </p>
      </div>
      <AnalyzeForm />
    </div>
  );
}

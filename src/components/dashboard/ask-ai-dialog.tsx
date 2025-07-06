'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, BookOpenCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/components/providers/tenant-provider';
import { askAiAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AskAiDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AskAiDialog({ open, onOpenChange }: AskAiDialogProps) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ answer: string; sources: string[] } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);

    const actionResult = await askAiAction(query, tenant.id);

    if (actionResult.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: actionResult.error,
      });
    } else if (actionResult.answer) {
      setResult({
        answer: actionResult.answer,
        sources: actionResult.sources || [],
      });
    }
    setIsLoading(false);
  };
  
  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setTimeout(() => {
        setQuery('');
        setResult(null);
      }, 300); // Delay to allow fade-out animation
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ask AI</DialogTitle>
          <DialogDescription>
            Get instant answers from your knowledge base. Ask a question about your products, security, or company policies.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="e.g., What is our policy on data encryption at rest?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !query.trim()}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Ask
          </Button>
        </form>
        {result && (
          <div className="mt-4 space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-muted p-4">
                <p>{result.answer}</p>
            </div>
            {result.sources.length > 0 && (
              <Alert variant="secondary">
                <BookOpenCheck className="h-4 w-4" />
                <AlertTitle>Sources</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-xs font-mono">
                    {result.sources.map((source, index) => (
                      <li key={index}>{source}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

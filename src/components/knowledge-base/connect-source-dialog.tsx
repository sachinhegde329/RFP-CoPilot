
'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, FolderSync, Network, Box, BookOpen, BookText, Github } from 'lucide-react';
import type { DataSource, DataSourceType } from '@/lib/knowledge-base';
import { useTenant } from '@/components/providers/tenant-provider';
import { useToast } from '@/hooks/use-toast';
import { addWebsiteSourceAction } from '@/app/actions';

const sourceDetails = {
  website: { name: "Website", description: "Crawl and index content from a public website.", icon: Globe },
  sharepoint: { name: "SharePoint", description: "Connect to your organization's SharePoint sites.", icon: Network },
  gdrive: { name: "Google Drive", description: "Ingest documents from selected Drive folders.", icon: FolderSync },
  dropbox: { name: "Dropbox", description: "Sync files and folders from your Dropbox account.", icon: Box },
  confluence: { name: "Confluence", description: "Sync pages from your Confluence workspace.", icon: BookOpen },
  notion: { name: "Notion", description: "Import pages and databases from your Notion workspace.", icon: BookText },
  github: { name: "GitHub", description: "Index content from repository wikis or markdown files.", icon: Github },
};


type ConnectSourceDialogProps = {
  sourceType: DataSourceType | null;
  onOpenChange: (isOpen: boolean) => void;
  onSourceAdded: (source: DataSource) => void;
};

export function ConnectSourceDialog({ sourceType, onOpenChange, onSourceAdded }: ConnectSourceDialogProps) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const currentUser = tenant.members[0];

  // State for Website form
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(10);
  const [filterKeywords, setFilterKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClose = () => {
    onOpenChange(false);
    // Reset form state after a delay to allow for fade-out animation
    setTimeout(() => {
        setWebsiteUrl('');
        setFilterKeywords('');
        setIsLoading(false);
    }, 300);
  }
  
  const handleConnect = () => {
    if (!sourceType) return;
    
    setIsLoading(true);

    if (sourceType === 'gdrive') {
        window.location.href = `/api/auth/google/initiate?tenantId=${tenant.id}`;
    } else if (sourceType === 'sharepoint') {
        window.location.href = `/api/auth/microsoft/initiate?tenantId=${tenant.id}`;
    } else if (sourceType === 'dropbox') {
        window.location.href = `/api/auth/dropbox/initiate?tenantId=${tenant.id}`;
    } else {
        toast({
            title: "Connector Coming Soon",
            description: `The ${sourceType} connector is under development.`,
        });
        setIsLoading(false);
    }
  };

  const handleSyncWebsite = async () => {
    if (!websiteUrl || !/^(https?:\/\/)/.test(websiteUrl)) {
        toast({ variant: "destructive", title: "Invalid URL", description: "Please enter a valid URL." });
        return;
    }
    setIsLoading(true);
    const result = await addWebsiteSourceAction(websiteUrl, tenant.id, currentUser, { 
        maxDepth, 
        maxPages,
        filterKeywords: filterKeywords.split(',').map(k => k.trim()).filter(Boolean)
    });

    if(result.error || !result.source) {
        toast({ variant: "destructive", title: "Sync Failed", description: result.error });
        setIsLoading(false);
    } else {
        onSourceAdded(result.source);
        toast({ title: "Sync Started", description: `Started syncing content from ${websiteUrl}` });
        handleClose();
    }
  }

  const details = sourceType ? sourceDetails[sourceType] : null;
  const Icon = details?.icon || Globe;

  const renderContent = () => {
    if (!sourceType) return null;

    if (sourceType === 'website') {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Icon /> Connect to {details?.name}</DialogTitle>
            <DialogDescription>{details?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <div className="space-y-2"><Label htmlFor="website-url">Root URL</Label><Input id="website-url" placeholder="https://www.example.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="filter-keywords">Topic Keywords (optional)</Label><Input id="filter-keywords" placeholder="e.g., ITSM, compliance" value={filterKeywords} onChange={(e) => setFilterKeywords(e.target.value)} /><p className="text-xs text-muted-foreground">Comma-separated. Only pages with these keywords in the URL or title will be crawled.</p></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSyncWebsite} disabled={!websiteUrl || isLoading}>
              {isLoading && <Loader2 className="animate-spin mr-2"/>}
              Sync Website
            </Button>
          </DialogFooter>
        </>
      );
    }
    
    const isImplemented = ['gdrive', 'sharepoint', 'dropbox'].includes(sourceType);

    if (isImplemented) {
        return (
            <>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Icon /> Connect to {details?.name}</DialogTitle>
                    <DialogDescription>You will be redirected to {details?.name} to authorize the connection.</DialogDescription>
                </DialogHeader>
                <div className="py-4 text-sm text-muted-foreground">
                    <p>Once authorized, RFP CoPilot will begin syncing your files. This may take a few minutes depending on the number of files.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleConnect} disabled={isLoading}>
                         {isLoading && <Loader2 className="animate-spin mr-2"/>}
                        Continue
                    </Button>
                </DialogFooter>
            </>
        );
    }

    // Fallback for unimplemented connectors
    return (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Icon /> {details?.name} Connector</DialogTitle>
                <DialogDescription>{details?.description}</DialogDescription>
            </DialogHeader>
            <div className="py-4 text-sm text-center bg-muted/50 rounded-lg p-8">
                <p className="font-semibold">Coming Soon!</p>
                <p className="text-muted-foreground">This connector is under development.</p>
            </div>
            <DialogFooter>
                 <Button variant="outline" onClick={handleClose}>Close</Button>
            </DialogFooter>
        </>
    );
  };

  return (
    <Dialog open={!!sourceType} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent>
            {renderContent()}
        </DialogContent>
    </Dialog>
  )
}

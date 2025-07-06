
'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, FolderSync, Network, Box, BookOpen, BookText, Github, TrendingUp, Presentation, Activity, BrainCircuit, Zap } from 'lucide-react';
import type { DataSource, DataSourceType } from '@/lib/knowledge-base';
import { useTenant } from '@/components/providers/tenant-provider';
import { useToast } from '@/hooks/use-toast';
import { addWebsiteSourceAction, addGitHubSourceAction, addConfluenceSourceAction, addNotionSourceAction } from '@/app/actions';
import { Checkbox } from '@/components/ui/checkbox';


const sourceDetails = {
  website: { name: "Website", description: "Crawl and index content from a public website.", icon: Globe },
  sharepoint: { name: "SharePoint", description: "Connect to your organization's SharePoint sites.", icon: Network },
  gdrive: { name: "Google Drive", description: "Ingest documents from selected Drive folders.", icon: FolderSync },
  dropbox: { name: "Dropbox", description: "Sync files and folders from your Dropbox account.", icon: Box },
  confluence: { name: "Confluence", description: "Sync pages from your Confluence workspace.", icon: BookOpen },
  notion: { name: "Notion", description: "Import pages and databases from your Notion workspace.", icon: BookText },
  github: { name: "GitHub", description: "Index content from repository wikis or markdown files.", icon: Github },
  highspot: { name: "Highspot", description: "Sync content from your Highspot spaces.", icon: TrendingUp },
  showpad: { name: "Showpad", description: "Connect to your Showpad experiences and assets.", icon: Presentation },
  seismic: { name: "Seismic", description: "Pull documents and pages from Seismic libraries.", icon: Activity },
  mindtickle: { name: "Mindtickle", description: "Ingest training materials and sales content.", icon: BrainCircuit },
  enableus: { name: "Enable.us", description: "Sync playbooks and other sales collateral.", icon: Zap },
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
  const [isLoading, setIsLoading] = useState(false);

  // Website form state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [scopePath, setScopePath] = useState('');
  const [excludePaths, setExcludePaths] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(10);
  const [filterKeywords, setFilterKeywords] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);
  
  // Confluence form state
  const [confluenceUrl, setConfluenceUrl] = useState('');
  const [confluenceUser, setConfluenceUser] = useState('');
  const [confluenceToken, setConfluenceToken] = useState('');

  // GitHub form state
  const [githubRepo, setGithubRepo] = useState('');
  const [githubToken, setGithubToken] = useState('');

  // Notion form state
  const [notionToken, setNotionToken] = useState('');

  
  const handleClose = () => {
    onOpenChange(false);
    // Reset all form states after a delay to allow for fade-out animation
    setTimeout(() => {
        setIsLoading(false);
        // Website
        setWebsiteUrl('');
        setScopePath('');
        setExcludePaths('');
        setFilterKeywords('');
        setMaxDepth(2);
        setMaxPages(10);
        setTosAccepted(false);
        // Confluence
        setConfluenceUrl('');
        setConfluenceUser('');
        setConfluenceToken('');
        // GitHub
        setGithubRepo('');
        setGithubToken('');
        // Notion
        setNotionToken('');
    }, 300);
  }
  
  const handleOAuthRedirect = () => {
    if (!sourceType) return;
    setIsLoading(true);
    if (sourceType === 'gdrive') {
        window.location.href = `/api/auth/google/initiate?tenantId=${tenant.id}`;
    } else if (sourceType === 'sharepoint') {
        window.location.href = `/api/auth/microsoft/initiate?tenantId=${tenant.id}`;
    } else if (sourceType === 'dropbox') {
        window.location.href = `/api/auth/dropbox/initiate?tenantId=${tenant.id}`;
    }
  };

  const handleSyncWebsite = async () => {
    if (!websiteUrl || !/^(https?:\/\/)/.test(websiteUrl)) {
        toast({ variant: "destructive", title: "Invalid URL", description: "Please enter a valid URL." });
        return;
    }
     if (!tosAccepted) {
        toast({ variant: "destructive", title: "Accept Terms", description: "You must confirm you have the right to crawl this domain." });
        return;
    }
    setIsLoading(true);
    const result = await addWebsiteSourceAction(websiteUrl, tenant.id, currentUser, { 
        maxDepth, 
        maxPages,
        scopePath: scopePath.trim(),
        excludePaths: excludePaths.split(',').map(p => p.trim()).filter(Boolean),
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

  const handleConnectConfluence = async () => {
    if (!confluenceUrl || !confluenceUser || !confluenceToken) {
        toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all required fields.' });
        return;
    }
    setIsLoading(true);
    const result = await addConfluenceSourceAction(tenant.id, currentUser, { url: confluenceUrl, username: confluenceUser, apiKey: confluenceToken });
    if(result.error || !result.source) {
        toast({ variant: 'destructive', title: 'Connection Failed', description: result.error });
        setIsLoading(false);
    } else {
        onSourceAdded(result.source);
        toast({ title: 'Connection Successful', description: `Started syncing from ${result.source.name}`});
        handleClose();
    }
  }

  const handleConnectGithub = async () => {
    if (!githubRepo || !githubToken) {
        toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all required fields.' });
        return;
    }
    setIsLoading(true);
    const result = await addGitHubSourceAction(tenant.id, currentUser, { repo: githubRepo, token: githubToken });
    if(result.error || !result.source) {
        toast({ variant: 'destructive', title: 'Connection Failed', description: result.error });
        setIsLoading(false);
    } else {
        onSourceAdded(result.source);
        toast({ title: 'Connection Successful', description: `Started syncing from ${result.source.name}`});
        handleClose();
    }
  }
  
  const handleConnectNotion = async () => {
    if (!notionToken) {
        toast({ variant: 'destructive', title: 'Missing Field', description: 'Please provide your Notion Integration Token.' });
        return;
    }
    setIsLoading(true);
    const result = await addNotionSourceAction(tenant.id, currentUser, { apiKey: notionToken });
     if(result.error || !result.source) {
        toast({ variant: 'destructive', title: 'Connection Failed', description: result.error });
        setIsLoading(false);
    } else {
        onSourceAdded(result.source);
        toast({ title: 'Connection Successful', description: `Started syncing from ${result.source.name}`});
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
            <DialogTitle className="flex items-center gap-2"><Icon /> Connect Website</DialogTitle>
            <DialogDescription>Configure the settings to crawl and ingest a public website.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
              <div className="space-y-2">
                  <Label htmlFor="website-url">Root URL <span className="text-destructive">*</span></Label>
                  <Input id="website-url" placeholder="https://www.example.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="scope-path">Scope Path (Optional)</Label>
                      <Input id="scope-path" placeholder="/docs" value={scopePath} onChange={(e) => setScopePath(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="exclude-paths">Exclude Paths (Optional)</Label>
                      <Input id="exclude-paths" placeholder="/legal, /private" value={excludePaths} onChange={(e) => setExcludePaths(e.target.value)} />
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="max-depth">Crawl Depth</Label>
                      <Input id="max-depth" type="number" min="0" value={maxDepth} onChange={(e) => setMaxDepth(parseInt(e.target.value, 10) || 0)} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="max-pages">Max Pages</Label>
                      <Input id="max-pages" type="number" min="1" value={maxPages} onChange={(e) => setMaxPages(parseInt(e.target.value, 10) || 1)} />
                  </div>
              </div>
              
              <div className="space-y-2">
                  <Label htmlFor="filter-keywords">Topic Keywords (Optional)</Label>
                  <Input id="filter-keywords" placeholder="e.g., ITSM, compliance" value={filterKeywords} onChange={(e) => setFilterKeywords(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Comma-separated. Only pages with these keywords in the URL or title will be crawled.</p>
              </div>
              
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox id="tos" checked={tosAccepted} onCheckedChange={(checked) => setTosAccepted(Boolean(checked))} />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="tos" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I confirm I have the right to crawl this domain.
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Please ensure you comply with the website's terms of service and robots.txt.
                  </p>
                </div>
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSyncWebsite} disabled={!websiteUrl || !tosAccepted || isLoading}>
              {isLoading && <Loader2 className="animate-spin mr-2"/>}
              Start Ingestion
            </Button>
          </DialogFooter>
        </>
      );
    }
    
    if (sourceType === 'confluence') {
        return (
             <>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Icon /> Connect to Confluence</DialogTitle>
                    <DialogDescription>Provide your Confluence Cloud credentials to sync your spaces.</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                     <div className="space-y-2">
                         <Label htmlFor="confluence-url">Base URL <span className="text-destructive">*</span></Label>
                         <Input id="confluence-url" placeholder="https://your-company.atlassian.net" value={confluenceUrl} onChange={(e) => setConfluenceUrl(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="confluence-user">Username (Email) <span className="text-destructive">*</span></Label>
                         <Input id="confluence-user" placeholder="name@company.com" value={confluenceUser} onChange={(e) => setConfluenceUser(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="confluence-token">API Token <span className="text-destructive">*</span></Label>
                         <Input id="confluence-token" type="password" value={confluenceToken} onChange={(e) => setConfluenceToken(e.target.value)} />
                     </div>
                 </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleConnectConfluence} disabled={isLoading}>
                         {isLoading && <Loader2 className="animate-spin mr-2"/>}
                        Connect and Sync
                    </Button>
                </DialogFooter>
            </>
        )
    }

    if (sourceType === 'github') {
        return (
             <>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Icon /> Connect to GitHub</DialogTitle>
                    <DialogDescription>Provide repository details and a personal access token.</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                     <div className="space-y-2">
                         <Label htmlFor="github-repo">Repository <span className="text-destructive">*</span></Label>
                         <Input id="github-repo" placeholder="owner/repo-name" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} />
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="github-token">Personal Access Token <span className="text-destructive">*</span></Label>
                         <Input id="github-token" type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
                     </div>
                 </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleConnectGithub} disabled={isLoading}>
                         {isLoading && <Loader2 className="animate-spin mr-2"/>}
                        Connect and Sync
                    </Button>
                </DialogFooter>
            </>
        )
    }
    
    if (sourceType === 'notion') {
        return (
             <>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Icon /> Connect to Notion</DialogTitle>
                    <DialogDescription>Provide your Notion integration token to get started.</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                     <div className="space-y-2">
                         <Label htmlFor="notion-token">Integration Token <span className="text-destructive">*</span></Label>
                         <Input id="notion-token" type="password" value={notionToken} onChange={(e) => setNotionToken(e.target.value)} />
                     </div>
                 </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleConnectNotion} disabled={isLoading}>
                         {isLoading && <Loader2 className="animate-spin mr-2"/>}
                        Connect and Sync
                    </Button>
                </DialogFooter>
            </>
        )
    }
    
    const isOAuth = ['gdrive', 'sharepoint', 'dropbox'].includes(sourceType);

    if (isOAuth) {
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
                    <Button onClick={handleOAuthRedirect} disabled={isLoading}>
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
        <DialogContent className="sm:max-w-xl">
            {renderContent()}
        </DialogContent>
    </Dialog>
  )
}

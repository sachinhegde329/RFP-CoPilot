'use client'

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { DataSource } from '@/lib/knowledge-base';
import { useTenant } from '@/components/providers/tenant-provider';
import { useToast } from '@/hooks/use-toast';
import { updateKnowledgeSourceConfigAction } from '@/app/actions';

type ConfigureSourceDialogProps = {
  source: DataSource | null;
  onOpenChange: (isOpen: boolean) => void;
  onSourceUpdated: (source: DataSource) => void;
};

export function ConfigureSourceDialog({ source, onOpenChange, onSourceUpdated }: ConfigureSourceDialogProps) {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const currentUser = tenant.members[0];
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState(source?.config || {});

  useEffect(() => {
    setConfig(source?.config || {});
  }, [source]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!source) return;
    setIsLoading(true);
    const result = await updateKnowledgeSourceConfigAction(tenant.id, source.id, config, currentUser);
    
    if (result.error || !result.source) {
      toast({ variant: 'destructive', title: 'Save Failed', description: result.error });
    } else {
      onSourceUpdated(result.source);
      toast({ title: 'Configuration Saved', description: 'Your changes have been saved. A re-sync has been started.' });
      handleClose();
    }
    setIsLoading(false);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const renderContent = () => {
    if (!source) return null;

    switch (source.type) {
      case 'website':
        const excludePaths = Array.isArray(config.excludePaths) ? config.excludePaths.join(', ') : '';
        return (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-2"><Label htmlFor="website-url">Root URL</Label><Input id="website-url" value={config.url || ''} onChange={(e) => handleConfigChange('url', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="scope-path">Scope Path</Label><Input id="scope-path" placeholder="/docs" value={config.scopePath || ''} onChange={(e) => handleConfigChange('scopePath', e.target.value)} /></div><div className="space-y-2"><Label htmlFor="exclude-paths">Exclude Paths</Label><Input id="exclude-paths" placeholder="/legal, /private" value={excludePaths} onChange={(e) => handleConfigChange('excludePaths', e.target.value.split(',').map(p => p.trim()))} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="max-depth">Crawl Depth</Label><Input id="max-depth" type="number" min="0" value={config.maxDepth || 2} onChange={(e) => handleConfigChange('maxDepth', parseInt(e.target.value))} /></div><div className="space-y-2"><Label htmlFor="max-pages">Max Pages</Label><Input id="max-pages" type="number" min="1" value={config.maxPages || 10} onChange={(e) => handleConfigChange('maxPages', parseInt(e.target.value))} /></div></div>
          </div>
        );
      case 'gdrive':
        return <div className="space-y-2 py-4"><Label htmlFor="gdrive-folder">Folder ID to Sync (Optional)</Label><Input id="gdrive-folder" placeholder="Leave blank to sync all files" value={config.folderId || ''} onChange={(e) => handleConfigChange('folderId', e.target.value)} /><p className="text-xs text-muted-foreground">You can find the Folder ID in the URL of a Google Drive folder.</p></div>
      case 'dropbox':
        return <div className="space-y-2 py-4"><Label htmlFor="dropbox-folder">Folder Path to Sync (Optional)</Label><Input id="dropbox-folder" placeholder="/path/to/folder or blank for all" value={config.path || ''} onChange={(e) => handleConfigChange('path', e.target.value)} /></div>
      case 'sharepoint':
        return <div className="space-y-2 py-4"><Label htmlFor="sharepoint-drive">Document Library (Drive) Name</Label><Input id="sharepoint-drive" placeholder="Leave blank to sync from all libraries" value={config.driveName || ''} onChange={(e) => handleConfigChange('driveName', e.target.value)} /></div>
      default:
        return <p className="py-4 text-center text-muted-foreground">This source type does not have any configurable settings.</p>;
    }
  };

  return (
    <Dialog open={!!source} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure: {source?.name}</DialogTitle>
          <DialogDescription>
            Update the settings for this data source. Changes will be applied on the next sync.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin mr-2"/>}
            Save and Re-sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

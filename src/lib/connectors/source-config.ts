
import type { DataSourceType } from '@/lib/knowledge-base';
import { Globe, FolderSync, Network, Box, BookOpen, BookText, Github, TrendingUp, Presentation, Activity, BrainCircuit, Zap } from 'lucide-react';

export type SourceDetail = {
    name: string;
    type: DataSourceType;
    description: string;
    icon: React.ElementType;
};

export const potentialSources: SourceDetail[] = [
    { name: "Website", type: 'website', description: "Crawl and index content from a public website.", icon: Globe },
    { name: "SharePoint", type: 'sharepoint', description: "Connect to your organization's SharePoint sites.", icon: Network },
    { name: "Google Drive", type: 'gdrive', description: "Ingest documents from selected Drive folders.", icon: FolderSync },
    { name: "Dropbox", type: 'dropbox', description: "Sync files and folders from your Dropbox account.", icon: Box },
    { name: "Confluence", type: 'confluence', description: "Sync pages from your Confluence workspace.", icon: BookOpen },
    { name: "Notion", type: 'notion', description: "Import pages and databases from your Notion workspace.", icon: BookText },
    { name: "GitHub", type: 'github', description: "Index content from repository wikis or markdown files.", icon: Github },
];

export const salesEnablementSources: SourceDetail[] = [
    { name: "Highspot", type: 'highspot', description: "Sync content from your Highspot spaces.", icon: TrendingUp },
    { name: "Showpad", type: 'showpad', description: "Connect to your Showpad experiences and assets.", icon: Presentation },
    { name: "Seismic", type: 'seismic', description: "Pull documents and pages from Seismic libraries.", icon: Activity },
    { name: "Mindtickle", type: 'mindtickle', description: "Ingest training materials and sales content.", icon: BrainCircuit },
    { name: "Enable.us", type: 'enableus', description: "Sync playbooks and other sales collateral.", icon: Zap },
];

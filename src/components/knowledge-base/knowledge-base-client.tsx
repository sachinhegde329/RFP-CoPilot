
'use client'

import { useState, useRef, ChangeEvent, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Upload, Link as LinkIcon, FileText, CheckCircle, Clock, Search, Globe, FolderSync, BookOpen, Network, AlertTriangle, RefreshCw, Box, BookText, Github, Settings, Trash2, Loader2, Info } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useTenant } from "@/components/providers/tenant-provider"
import { addDocumentSourceAction, getKnowledgeSourcesAction, deleteKnowledgeSourceAction, checkSourceStatusAction, resyncKnowledgeSourceAction } from "@/app/actions"
import type { DataSource, DataSourceType, SyncStatus } from "@/lib/knowledge-base"
import { Skeleton } from "@/components/ui/skeleton"
import { canPerformAction } from "@/lib/access-control"
import { ConnectSourceDialog } from "./connect-source-dialog"

const knowledgeBaseStats = {
  totalAnswers: 2345,
  approvedAnswers: 2100,
  needsReview: 45,
  contentHealth: 89,
}

const initialAnswerLibrary = [
  { id: 1, question: "What is your data encryption policy?", snippet: "All customer data is encrypted at rest using AES-256 and in transit using TLS 1.2+.", category: "Security", usage: 128, status: "Approved" },
  { id: 2, question: "Do you offer an SLA for uptime?", snippet: "Yes, our Enterprise plan includes a 99.95% uptime SLA.", category: "Legal", usage: 97, status: "Approved" },
  { id: 3, question: "How do you handle user authentication?", snippet: "We support SSO via SAML 2.0 and OpenID Connect, as well as password-based auth.", category: "Product", usage: 85, status: "In Review" },
  { id: 4, question: "What are your support hours?", snippet: "Standard support is 9am-5pm on business days. Premium support is 24/7.", category: "Company", usage: 52, status: "Approved" },
  { id: 5, question: "Can we export our data?", snippet: "Yes, data can be exported in CSV or JSON format at any time.", category: "Product", usage: 34, status: "Draft" },
]

const potentialSources: { name: string; type: DataSourceType, description: string; icon: React.ElementType }[] = [
  { name: "Website", type: 'website', description: "Crawl and index content from a public website.", icon: Globe },
  { name: "SharePoint", type: 'sharepoint', description: "Connect to your organization's SharePoint sites.", icon: Network },
  { name: "Google Drive", type: 'gdrive', description: "Ingest documents from selected Drive folders.", icon: FolderSync },
  { name: "Dropbox", type: 'dropbox', description: "Sync files and folders from your Dropbox account.", icon: Box },
  { name: "Confluence", type: 'confluence', description: "Sync pages from your Confluence workspace.", icon: BookOpen },
  { name: "Notion", type: 'notion', description: "Import pages and databases from your Notion workspace.", icon: BookText },
  { name: "GitHub", type: 'github', description: "Index content from repository wikis or markdown files.", icon: Github },
];

const initialReviewQueue = [
    { id: 1, type: "New Answer", content: "What is the process for GDPR data deletion requests?", author: "John Doe", date: "2024-06-29" },
    { id: 2, type: "Document Update", content: "Security Whitepaper Q2 2024.pdf", author: "Alex Green", date: "2024-06-28" },
    { id: 3, type: "Answer Edit", content: "How do you handle user authentication?", author: "Jane Smith", date: "2024-06-28" },
]

function getStatusBadge(status: SyncStatus | string) {
    switch (status) {
        case "Approved": return <Badge variant="secondary" className="text-green-600"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
        case "In Review": return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />In Review</Badge>;
        case "Draft": return <Badge variant="secondary">Draft</Badge>;
        case "Synced": return <Badge variant="secondary" className="text-green-600"><CheckCircle className="mr-1 h-3 w-3" />Synced</Badge>;
        case "Syncing": return <Badge variant="outline"><RefreshCw className="mr-1 h-3 w-3 animate-spin" />Syncing</Badge>;
        case "Pending": return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
        case "Error": return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Error</Badge>;
        default: return <Badge>{status}</Badge>;
    }
}

function getSourceIcon(type: string, className?: string) {
    const baseClass = "h-5 w-5";
    const classes = cn(baseClass, className);
    switch(type) {
        case 'confluence': return <BookOpen className={cn(classes, "text-blue-600")} />;
        case 'sharepoint': return <Network className={cn(classes, "text-teal-500")} />;
        case 'gdrive': return <FolderSync className={cn(classes, "text-yellow-500")} />;
        case 'website': return <Globe className={cn(classes, "text-indigo-500")} />;
        case 'github': return <Github className={cn(classes, "text-gray-800 dark:text-gray-200")} />;
        case 'notion': return <BookText className={cn(classes, "text-black dark:text-white")} />;
        case 'dropbox': return <Box className={cn(classes, "text-blue-500")} />;
        case 'document': return <FileText className={cn(classes, "text-muted-foreground")} />;
        default: return <Info className={cn(classes, "text-muted-foreground")}/>
    }
}

type KnowledgeBaseClientProps = {
    initialSources: DataSource[];
}

export function KnowledgeBaseClient({ initialSources }: KnowledgeBaseClientProps) {
  const [answerLibrary, setAnswerLibrary] = useState(initialAnswerLibrary);
  const [reviewQueue, setReviewQueue] = useState(initialReviewQueue);

  const [sources, setSources] = useState<DataSource[]>(initialSources);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [configuringSource, setConfiguringSource] = useState<DataSourceType | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const currentUser = tenant.members[0];
  const canManageIntegrations = canPerformAction(currentUser.role, 'manageIntegrations');
  const canEditContent = canPerformAction(currentUser.role, 'editContent');
  
  const fetchSources = async () => {
    setIsLoadingSources(true);
    const result = await getKnowledgeSourcesAction(tenant.id);
    if (result.error) {
        toast({ variant: "destructive", title: "Failed to load sources", description: result.error });
    } else if (result.sources) {
        setSources(result.sources);
    }
    setIsLoadingSources(false);
  };

   useEffect(() => {
    const syncingSources = sources.filter(s => s.status === 'Syncing');
    if (syncingSources.length === 0) return;

    const intervalId = setInterval(() => {
        syncingSources.forEach(async (syncingSource) => {
            const result = await checkSourceStatusAction(tenant.id, syncingSource.id);
            if (result.source && result.source.status !== 'Syncing') {
                setSources(prevSources => prevSources.map(s => s.id === result.source?.id ? result.source : s));
            }
        });
    }, 3000);

    return () => clearInterval(intervalId);
  }, [sources, tenant.id]);

  const handleResync = async (source: DataSource) => {
    setSources(prev => prev.map(s => s.id === source.id ? { ...s, status: 'Syncing' } : s));
    toast({ title: "Re-sync Started", description: `Re-syncing content from ${source.name}` });
    const result = await resyncKnowledgeSourceAction(tenant.id, source.id, currentUser);
    if (result.error) {
        toast({ variant: "destructive", title: "Sync Failed", description: result.error });
        fetchSources();
    }
  }

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const dataUri = reader.result as string;
        const result = await addDocumentSourceAction(dataUri, tenant.id, file.name, currentUser);
        if (result.error || !result.source) {
            toast({ variant: "destructive", title: "Upload Failed", description: result.error });
        } else {
            setSources(prev => [result.source!, ...prev]);
            toast({ title: "Upload Started", description: `Parsing ${file.name}. This may take a moment.` });
        }
        setIsUploading(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => {
        toast({ variant: "destructive", title: "Upload Failed", description: "Could not read the selected file." });
        setIsUploading(false);
    }
  }

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleDeleteSource = async (sourceId: string) => {
    const originalSources = sources;
    setSources(prev => prev.filter(s => s.id !== sourceId));
    const result = await deleteKnowledgeSourceAction(tenant.id, sourceId, currentUser);
    if (result.error) {
        setSources(originalSources);
        toast({ variant: "destructive", title: "Delete Failed", description: result.error });
    } else {
        toast({ title: "Source Removed" });
    }
  };

  const handleSourceAdded = (newSource: DataSource) => {
    setSources(prev => [newSource, ...prev]);
  };

  const uploadedFiles = useMemo(() => sources.filter(s => s.type === 'document'), [sources]);

  return (
    <>
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold">Knowledge Base</h1>
                <p className="text-muted-foreground">Your central repository of approved answers and company information.</p>
            </div>
            <Button disabled={!canEditContent}>Add New Answer</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Answers</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{knowledgeBaseStats.totalAnswers.toLocaleString()}</div><p className="text-xs text-muted-foreground">+20.1% from last month</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Approved Answers</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{knowledgeBaseStats.approvedAnswers.toLocaleString()}</div><p className="text-xs text-muted-foreground">{((knowledgeBaseStats.approvedAnswers/knowledgeBaseStats.totalAnswers)*100).toFixed(0)}% of total</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Needs Review</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{knowledgeBaseStats.needsReview}</div><p className="text-xs text-muted-foreground">+5 since yesterday</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Content Health</CardTitle><Badge className="text-xs" variant={knowledgeBaseStats.contentHealth > 80 ? 'secondary' : 'destructive'}>{knowledgeBaseStats.contentHealth}%</Badge></CardHeader><CardContent><div className="text-2xl font-bold">{knowledgeBaseStats.contentHealth}%</div><p className="text-xs text-muted-foreground">Based on recency & usage</p></CardContent></Card>
        </div>

        <Tabs defaultValue="sources">
            <TabsList className="mb-4 h-auto flex-wrap">
                <TabsTrigger value="sources">Content Sources</TabsTrigger>
                <TabsTrigger value="library">Answer Library</TabsTrigger>
                <TabsTrigger value="review">Review Queue <Badge className="ml-2">{reviewQueue.length}</Badge></TabsTrigger>
            </TabsList>

            <TabsContent value="sources">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Automated Integrations</CardTitle>
                            <CardDescription>Connect to your existing tools to keep your knowledge base automatically up-to-date.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {potentialSources.map(potential => {
                                    const connected = sources.find(s => s.type === potential.type);
                                    const Icon = potential.icon;
                                    
                                    if (connected) {
                                        return (
                                            <Card key={connected.id} className="flex flex-col">
                                                <CardHeader className="flex flex-row items-start justify-between pb-4">
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                                        <CardTitle className="text-lg">{connected.name}</CardTitle>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" disabled={!canManageIntegrations || connected.status === 'Syncing'}><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent><DropdownMenuItem onSelect={() => handleResync(connected)}><RefreshCw className="mr-2"/> Sync Now</DropdownMenuItem><DropdownMenuItem><Settings className="mr-2" /> Settings</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteSource(connected.id)}><Trash2 className="mr-2"/> Remove</DropdownMenuItem></DropdownMenuContent>
                                                    </DropdownMenu>
                                                </CardHeader>
                                                <CardContent className="flex-1">
                                                    <div className="space-y-2">
                                                        {getStatusBadge(connected.status)}
                                                        <p className="text-sm text-muted-foreground">{connected.itemCount?.toLocaleString() || 0} items synced</p>
                                                        <p className="text-xs text-muted-foreground">Last synced: {connected.lastSynced}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    }

                                    return (
                                        <Card key={potential.name} className="flex flex-col">
                                            <CardHeader className="pb-4">
                                                <div className="flex items-center gap-3">
                                                    <Icon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                                    <CardTitle className="text-lg">{potential.name}</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-1">
                                                <p className="text-sm text-muted-foreground">{potential.description}</p>
                                            </CardContent>
                                            <CardFooter>
                                                <Button 
                                                    className="w-full" 
                                                    variant="outline"
                                                    onClick={() => setConfiguringSource(potential.type)}
                                                    disabled={!canManageIntegrations}
                                                >
                                                    Connect
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <div><CardTitle>Uploaded Documents</CardTitle><CardDescription>Manage manually uploaded files.</CardDescription></div>
                            <div><input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.xlsx,.md,.txt,.html" disabled={isUploading || !canManageIntegrations}/><Button variant="outline" onClick={handleUploadClick} disabled={isUploading || !canManageIntegrations}>{isUploading ? <Loader2 className="mr-2 animate-spin" /> : <Upload className="mr-2" />}{isUploading ? 'Uploading...' : 'Upload Document'}</Button></div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead className="w-[50%]">File Name</TableHead><TableHead>Uploader</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingSources && initialSources.length === 0 ? (Array.from({length: 3}).map((_, i) => (<TableRow key={`skel-up-${i}`}><TableCell><Skeleton className="h-5 w-48" /></TableCell><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell></TableRow>))) 
                                    : uploadedFiles.length === 0 ? (<TableRow><TableCell colSpan={4} className="h-24 text-center">No documents uploaded yet.</TableCell></TableRow>) 
                                    : (uploadedFiles.map(file => (<TableRow key={file.id}><TableCell className="font-medium flex items-center gap-2">{getSourceIcon(file.type)}{file.name}</TableCell><TableCell>{file.uploader}</TableCell><TableCell>{getStatusBadge(file.status)}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={!canManageIntegrations}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>View Content</DropdownMenuItem><DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteSource(file.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="library">
                <Card>
                    <CardHeader><CardTitle>Answer Library</CardTitle><CardDescription>Search and manage your curated list of reusable answers.</CardDescription><div className="relative mt-2"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search answers..." className="pl-8" /></div></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead className="w-[40%]">Question</TableHead><TableHead>Category</TableHead><TableHead>Usage</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {answerLibrary.map(item => (<TableRow key={item.id}><TableCell><div className="font-medium">{item.question}</div><div className="text-sm text-muted-foreground truncate">{item.snippet}</div></TableCell><TableCell><Badge variant="outline">{item.category}</Badge></TableCell><TableCell>{item.usage}</TableCell><TableCell>{getStatusBadge(item.status)}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={!canEditContent}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Edit</DropdownMenuItem><DropdownMenuItem>View History</DropdownMenuItem><DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="review">
                <Card>
                    <CardHeader><CardTitle>Review Queue</CardTitle><CardDescription>Content additions and edits awaiting approval from SMEs.</CardDescription></CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader><TableRow><TableHead>Type</TableHead><TableHead className="w-[50%]">Content</TableHead><TableHead>Author</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {reviewQueue.map(item => (<TableRow key={item.id}><TableCell><Badge variant="secondary">{item.type}</Badge></TableCell><TableCell className="font-medium">{item.content}</TableCell><TableCell>{item.author}</TableCell><TableCell>{item.date}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm">Review</Button></TableCell></TableRow>))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <ConnectSourceDialog
            sourceType={configuringSource}
            onOpenChange={() => setConfiguringSource(null)}
            onSourceAdded={handleSourceAdded}
        />
    </>
  )
}

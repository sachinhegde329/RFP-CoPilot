'use client'

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, PlusCircle, Upload, Link as LinkIcon, FileText, CheckCircle, Clock, Search, Globe, FolderSync, BookOpen, Network, AlertTriangle, RefreshCw, Box, BookText, Github, Settings, Trash2, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"

// Mock data for the components
const knowledgeBaseStats = {
  totalAnswers: 2345,
  approvedAnswers: 2100,
  needsReview: 45,
  contentHealth: 89, // percentage
}

const answerLibrary = [
  { id: 1, question: "What is your data encryption policy?", snippet: "All customer data is encrypted at rest using AES-256 and in transit using TLS 1.2+.", category: "Security", usage: 128, status: "Approved" },
  { id: 2, question: "Do you offer an SLA for uptime?", snippet: "Yes, our Enterprise plan includes a 99.95% uptime SLA.", category: "Legal", usage: 97, status: "Approved" },
  { id: 3, question: "How do you handle user authentication?", snippet: "We support SSO via SAML 2.0 and OpenID Connect, as well as password-based auth.", category: "Product", usage: 85, status: "In Review" },
  { id: 4, question: "What are your support hours?", snippet: "Standard support is 9am-5pm on business days. Premium support is 24/7.", category: "Company", usage: 52, status: "Approved" },
  { id: 5, question: "Can we export our data?", snippet: "Yes, data can be exported in CSV or JSON format at any time.", category: "Product", usage: 34, status: "Draft" },
]

const initialConnectedSources = [
    { id: 1, name: "Confluence - Product Docs", type: "confluence", status: "Synced", lastSynced: "2 hours ago", docsSynced: 1254 },
    { id: 2, name: "SharePoint - Legal Contracts", type: "sharepoint", status: "Synced", lastSynced: "8 hours ago", docsSynced: 342 },
    { id: 3, name: "Google Drive - Marketing Assets", type: "gdrive", status: "Error", lastSynced: "1 day ago", docsSynced: 87 },
    { id: 4, name: "www.acme.com", type: "website", status: "Syncing", lastSynced: "5 minutes ago", docsSynced: 450 },
    { id: 5, name: "GitHub - Engineering Wiki", type: "github", status: "Synced", lastSynced: "3 days ago", docsSynced: 78 },
]

const potentialSources = [
  { name: "Confluence", description: "Sync pages from your Confluence workspace.", icon: BookOpen },
  { name: "SharePoint", description: "Connect to your organization's SharePoint sites.", icon: Network },
  { name: "Google Drive", description: "Ingest documents from selected Drive folders.", icon: FolderSync },
  { name: "Website", description: "Crawl and index content from a public website.", icon: Globe },
  { name: "Notion", description: "Import pages and databases from your Notion workspace.", icon: BookText },
  { name: "Dropbox", description: "Sync files and folders from your Dropbox account.", icon: Box },
  { name: "GitHub", description: "Index content from repository wikis or markdown files.", icon: Github },
];

const uploadedFiles = [
    { id: 1, name: "Security Whitepaper Q2 2024.pdf", uploader: "Alex Green", uploaded: "2024-06-28" },
    { id: 2, name: "Master Services Agreement.docx", uploader: "Sarah Lee", uploaded: "2024-06-25" },
]

const reviewQueue = [
    { id: 1, type: "New Answer", content: "What is the process for GDPR data deletion requests?", author: "John Doe", date: "2024-06-29" },
    { id: 2, type: "Document Update", content: "Security Whitepaper Q2 2024.pdf", author: "Alex Green", date: "2024-06-28" },
    { id: 3, type: "Answer Edit", content: "How do you handle user authentication?", author: "Jane Smith", date: "2024-06-28" },
]

function getStatusBadge(status: string) {
    switch (status) {
        case "Approved": return <Badge variant="secondary" className="text-green-600"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
        case "In Review": return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />In Review</Badge>;
        case "Draft": return <Badge variant="secondary">Draft</Badge>;
        case "Synced": return <Badge variant="secondary" className="text-green-600"><CheckCircle className="mr-1 h-3 w-3" />Synced</Badge>;
        case "Syncing": return <Badge variant="outline"><RefreshCw className="mr-1 h-3 w-3 animate-spin" />Syncing</Badge>;
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
        default: return <FileText className={cn(classes, "text-muted-foreground")}/>
    }
}

export default function KnowledgeBasePage() {
  const [connectedSources, setConnectedSources] = useState(initialConnectedSources);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleConnectSource = (sourceName: string) => {
    setIsConnecting(sourceName);

    setTimeout(() => {
        const sourceToConnect = potentialSources.find(p => p.name === sourceName);
        if (sourceToConnect) {
            const newSource = {
                id: connectedSources.length + 1,
                name: `${sourceToConnect.name} - New Connection`,
                type: sourceToConnect.name.toLowerCase(),
                status: "Synced",
                lastSynced: "Just now",
                docsSynced: Math.floor(Math.random() * 500)
            };
            setConnectedSources(prev => [...prev, newSource]);
        }

        toast({
            title: "Source Connected",
            description: `${sourceName} has been successfully connected.`,
        });

        setIsConnecting(null);
        setIsDialogOpen(false);
    }, 1500);
  }

  return (
    <SidebarInset className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold">Knowledge Base</h1>
                <p className="text-muted-foreground">Your central repository of approved answers and company information.</p>
            </div>
            <Button>
                <PlusCircle className="mr-2" />
                Add New Answer
            </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Answers</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{knowledgeBaseStats.totalAnswers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved Answers</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{knowledgeBaseStats.approvedAnswers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{((knowledgeBaseStats.approvedAnswers/knowledgeBaseStats.totalAnswers)*100).toFixed(0)}% of total</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{knowledgeBaseStats.needsReview}</div>
                    <p className="text-xs text-muted-foreground">+5 since yesterday</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Content Health</CardTitle>
                    <Badge className="text-xs" variant={knowledgeBaseStats.contentHealth > 80 ? 'secondary' : 'destructive'}>{knowledgeBaseStats.contentHealth}%</Badge>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{knowledgeBaseStats.contentHealth}%</div>
                     <p className="text-xs text-muted-foreground">Based on recency & usage</p>
                </CardContent>
            </Card>
        </div>

        <Tabs defaultValue="library">
            <TabsList className="mb-4">
                <TabsTrigger value="library">Answer Library</TabsTrigger>
                <TabsTrigger value="sources">Content Sources</TabsTrigger>
                <TabsTrigger value="review">Review Queue <Badge className="ml-2">{reviewQueue.length}</Badge></TabsTrigger>
            </TabsList>

            <TabsContent value="library">
                <Card>
                    <CardHeader>
                        <CardTitle>Answer Library</CardTitle>
                        <CardDescription>Search and manage your curated list of reusable answers.</CardDescription>
                         <div className="relative mt-2">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search answers..." className="pl-8" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Question</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Usage</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {answerLibrary.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.question}</div>
                                            <div className="text-sm text-muted-foreground truncate">{item.snippet}</div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                                        <TableCell>{item.usage}</TableCell>
                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem>View History</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="sources">
                 <Card>
                    <CardHeader className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>Content Sources</CardTitle>
                            <CardDescription>Manage automated and manual content sources for your knowledge base.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline">
                                <Upload className="mr-2"/>
                                Upload Files
                            </Button>
                             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <LinkIcon className="mr-2"/>
                                        Connect Source
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Connect a new data source</DialogTitle>
                                        <DialogDescription>
                                            Select a source to sync content with your Knowledge Base. Your existing content will not be affected.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                        {potentialSources.map(source => (
                                            <div key={source.name} className="flex items-center gap-4 p-3 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors">
                                                {getSourceIcon(source.name.toLowerCase(), "h-8 w-8 flex-shrink-0")}
                                                <div className="flex-1">
                                                    <p className="font-semibold">{source.name}</p>
                                                    <p className="text-sm text-muted-foreground">{source.description}</p>
                                                </div>
                                                <Button 
                                                    variant="outline" 
                                                    onClick={() => handleConnectSource(source.name)}
                                                    disabled={isConnecting !== null}
                                                >
                                                    {isConnecting === source.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                    {isConnecting === source.name ? 'Connecting...' : 'Connect'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <Tabs defaultValue="connected">
                            <TabsList>
                                <TabsTrigger value="connected">Connected Integrations</TabsTrigger>
                                <TabsTrigger value="uploaded">Uploaded Documents</TabsTrigger>
                            </TabsList>
                            <TabsContent value="connected" className="mt-4">
                               <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40%]">Source</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Docs Synced</TableHead>
                                            <TableHead>Last Synced</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {connectedSources.map(source => (
                                            <TableRow key={source.id}>
                                                <TableCell className="flex items-center gap-3">
                                                    {getSourceIcon(source.type)}
                                                    <span className="font-medium">{source.name}</span>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(source.status)}</TableCell>
                                                <TableCell>{source.docsSynced.toLocaleString()}</TableCell>
                                                <TableCell>{source.lastSynced}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem><RefreshCw className="mr-2"/> Sync Now</DropdownMenuItem>
                                                            <DropdownMenuItem><Settings className="mr-2" /> Settings</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2"/> Remove</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                             <TabsContent value="uploaded" className="mt-4">
                               <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50%]">File Name</TableHead>
                                            <TableHead>Uploader</TableHead>
                                            <TableHead>Date Uploaded</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {uploadedFiles.map(file => (
                                            <TableRow key={file.id}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    {file.name}
                                                </TableCell>
                                                <TableCell>{file.uploader}</TableCell>
                                                <TableCell>{file.uploaded}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                         <DropdownMenuContent>
                                                            <DropdownMenuItem>View Content</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="review">
                <Card>
                    <CardHeader>
                        <CardTitle>Review Queue</CardTitle>
                        <CardDescription>Content additions and edits awaiting approval from SMEs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="w-[50%]">Content</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviewQueue.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell><Badge variant="secondary">{item.type}</Badge></TableCell>
                                        <TableCell className="font-medium">{item.content}</TableCell>
                                        <TableCell>{item.author}</TableCell>
                                        <TableCell>{item.date}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">Review</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </main>
    </SidebarInset>
  )
}

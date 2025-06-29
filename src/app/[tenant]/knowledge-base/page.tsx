'use client'

import { SidebarInset } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, PlusCircle, Upload, Link as LinkIcon, FileText, Share2, CheckCircle, Clock, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

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

const connectedSources = [
    { id: 1, name: "Confluence - Product Docs", type: "confluence", status: "Synced", lastSynced: "2 hours ago" },
    { id: 2, name: "SharePoint - Legal Contracts", type: "sharepoint", status: "Synced", lastSynced: "8 hours ago" },
    { id: 3, name: "Google Drive - Marketing Assets", type: "gdrive", status: "Error", lastSynced: "1 day ago" },
]

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
        default: return <Badge>{status}</Badge>;
    }
}

function getSourceIcon(type: string) {
    switch(type) {
        case 'confluence': return <Share2 className="h-5 w-5 text-blue-600" />; // Simplified, in reality would use brand icons
        case 'sharepoint': return <Share2 className="h-5 w-5 text-teal-500" />;
        case 'gdrive': return <Share2 className="h-5 w-5 text-yellow-500" />;
        default: return <FileText className="h-5 w-5 text-muted-foreground"/>
    }
}

export default function KnowledgeBasePage() {
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
                <TabsTrigger value="sources">Connected Sources</TabsTrigger>
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
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connected Data Sources</CardTitle>
                            <CardDescription>Automatically sync content from your company's knowledge repositories.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ul className="space-y-4">
                                {connectedSources.map(source => (
                                    <li key={source.id} className="flex items-center gap-4">
                                        {getSourceIcon(source.type)}
                                        <div className="flex-1">
                                            <p className="font-medium">{source.name}</p>
                                            <p className={`text-sm ${source.status === 'Error' ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                {source.status} - Last sync: {source.lastSynced}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm">Manage</Button>
                                    </li>
                                ))}
                           </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full">
                                <LinkIcon className="mr-2"/>
                                Connect New Source
                            </Button>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Uploaded Documents</CardTitle>
                            <CardDescription>Manually uploaded files for the knowledge base.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                                {uploadedFiles.map(file => (
                                     <li key={file.id} className="flex items-center gap-4">
                                        <FileText className="h-5 w-5 text-muted-foreground"/>
                                        <div className="flex-1">
                                            <p className="font-medium">{file.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Uploaded by {file.uploader} on {file.uploaded}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full">
                                <Upload className="mr-2"/>
                                Upload Files
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
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

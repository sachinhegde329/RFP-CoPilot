'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';
import type { RfpInsightsOutput } from '@/ai/flows/rfp-insights-flow';
import { Target, Lightbulb, Swords, ThumbsDown } from 'lucide-react';

type RfpInsightsDashboardProps = {
    initialInsights: RfpInsightsOutput;
};

export function RfpInsightsDashboard({ initialInsights }: RfpInsightsDashboardProps) {
    const [insights] = useState(initialInsights);

    const themeChartData = insights.recurringThemes
        .map(theme => ({ name: theme.theme, count: theme.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Show top 10 themes

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">RFP Insights Dashboard</h1>
                    <p className="text-muted-foreground">Aggregated insights from your workspace's RFPs.</p>
                </div>
            </div>

            <Card className="col-span-1 md:col-span-2 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{insights.executiveSummary}</p>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Target /> Recurring Themes</CardTitle>
                        <CardDescription>Most frequently asked about topics.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={themeChartData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} interval={0} />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <Accordion type="single" collapsible className="w-full mt-4">
                            {insights.recurringThemes.map((theme, index) => (
                                <AccordionItem value={`theme-${index}`} key={index}>
                                    <AccordionTrigger>{theme.theme} ({theme.count} mentions)</AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                            {theme.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Lightbulb /> Identified Feature Gaps</CardTitle>
                            <CardDescription>Potential features your customers are asking for.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                               {insights.featureGaps.length > 0 ? insights.featureGaps.map((gap, index) => (
                                   <li key={index}>
                                       <span className="font-semibold text-foreground">{gap.gap}</span>
                                       <ul className="list-disc list-inside pl-5 mt-1">
                                           {gap.examples.map((ex, i) => <li key={i} className="italic">"{ex}"</li>)}
                                       </ul>
                                   </li>
                               )) : <p>No specific feature gaps identified.</p>}
                           </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Swords /> Competitive Mentions</CardTitle>
                             <CardDescription>Other companies mentioned in RFPs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                               {insights.competitiveMentions.length > 0 ? insights.competitiveMentions.map((comp, index) => (
                                   <Badge key={index} variant="secondary">{comp.competitor} ({comp.count})</Badge>
                               )) : <p className="text-sm text-muted-foreground">No competitors mentioned.</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ThumbsDown /> Common Objections</CardTitle>
                            <CardDescription>Recurring concerns or potential deal-breakers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                               {insights.commonObjections.length > 0 ? insights.commonObjections.map((obj, index) => (
                                   <li key={index}>
                                        <span className="font-semibold text-foreground">{obj.objection}</span>
                                        <ul className="list-disc list-inside pl-5 mt-1">
                                           {obj.examples.map((ex, i) => <li key={i} className="italic">"{ex}"</li>)}
                                       </ul>
                                   </li>
                               )) : <p>No common objections identified.</p>}
                           </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

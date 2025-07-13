'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertCircle, Tag, CheckCircle, XCircle, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Import types for recharts components
import type { 
  BarChart as BarChartType,
  Bar as BarType,
  XAxis as XAxisType,
  YAxis as YAxisType,
  Tooltip as TooltipType,
  ResponsiveContainer as ResponsiveContainerType,
  CartesianGrid as CartesianGridType
} from 'recharts';

type BarChartProps = React.ComponentProps<typeof BarChartType>;
type BarProps = React.ComponentProps<typeof BarType>;
type XAxisProps = React.ComponentProps<typeof XAxisType>;
type YAxisProps = React.ComponentProps<typeof YAxisType>;
type TooltipProps = React.ComponentProps<typeof TooltipType>;
type ResponsiveContainerProps = React.ComponentProps<typeof ResponsiveContainerType>;
type CartesianGridProps = React.ComponentProps<typeof CartesianGridType>;

// Dynamic imports with proper typing
const BarChart = dynamic<BarChartProps>(
  () => import('recharts').then(mod => mod.BarChart as React.ComponentType<BarChartProps>),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> }
);

const Bar = dynamic<BarProps>(
  () => import('recharts').then(mod => mod.Bar as React.ComponentType<BarProps>),
  { ssr: false }
);

const XAxis = dynamic<XAxisProps>(
  () => import('recharts').then(mod => mod.XAxis as React.ComponentType<XAxisProps>),
  { ssr: false }
);

const YAxis = dynamic<YAxisProps>(
  () => import('recharts').then(mod => mod.YAxis as React.ComponentType<YAxisProps>),
  { ssr: false }
);

const Tooltip = dynamic<TooltipProps>(
  () => import('recharts').then(mod => mod.Tooltip as React.ComponentType<TooltipProps>),
  { ssr: false }
);

const ResponsiveContainer = dynamic<ResponsiveContainerProps>(
  () => import('recharts').then(mod => mod.ResponsiveContainer as React.ComponentType<ResponsiveContainerProps>),
  { ssr: false }
);

type FeatureRequest = {
  id: string;
  title: string;
  description: string;
  rfpSource: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requestCount: number;
  firstSeen: string;
  lastSeen: string;
  tags: string[];
};

type FeatureRequestsData = {
  totalRequests: number;
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byMonth: { month: string; count: number }[];
  trend: { date: string; count: number }[];
  topFeatures: FeatureRequest[];
};

export function FeatureRequestsDashboard() {
  const [data, setData] = useState<FeatureRequestsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    // In a real app, this would be an API call to fetch the data
    // For demo purposes, we'll use mock data for the megacorp tenant
    const fetchData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data for demo
        const mockData: FeatureRequestsData = {
          totalRequests: 142,
          byStatus: [
            { status: 'Pending', count: 42 },
            { status: 'In Progress', count: 23 },
            { status: 'Completed', count: 64 },
            { status: 'Rejected', count: 13 },
          ],
          byPriority: [
            { priority: 'Low', count: 38 },
            { priority: 'Medium', count: 67 },
            { priority: 'High', count: 27 },
            { priority: 'Critical', count: 10 },
          ],
          byMonth: [
            { month: 'Jan', count: 8 },
            { month: 'Feb', count: 12 },
            { month: 'Mar', count: 18 },
            { month: 'Apr', count: 24 },
            { month: 'May', count: 32 },
            { month: 'Jun', count: 28 },
            { month: 'Jul', count: 20 },
          ],
          trend: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 10) + 2,
          })),
          topFeatures: [
            {
              id: 'feat-001',
              title: 'Multi-factor Authentication',
              description: 'Support for multiple authentication methods including SMS, authenticator apps, and security keys.',
              rfpSource: 'Enterprise Security RFP',
              status: 'in_progress',
              priority: 'high',
              requestCount: 27,
              firstSeen: '2025-03-15',
              lastSeen: '2025-07-10',
              tags: ['security', 'authentication', 'enterprise']
            },
            {
              id: 'feat-002',
              title: 'Custom Report Builder',
              description: 'Allow users to create and save custom reports with drag-and-drop interface.',
              rfpSource: 'Business Intelligence RFP',
              status: 'pending',
              priority: 'medium',
              requestCount: 19,
              firstSeen: '2025-04-02',
              lastSeen: '2025-07-08',
              tags: ['reporting', 'analytics', 'customization']
            },
            {
              id: 'feat-003',
              title: 'Offline Mode',
              description: 'Allow users to access and edit documents without an internet connection.',
              rfpSource: 'Field Operations RFP',
              status: 'completed',
              priority: 'high',
              requestCount: 34,
              firstSeen: '2025-01-10',
              lastSeen: '2025-06-28',
              tags: ['offline', 'productivity', 'mobile']
            },
          ]
        };

        setData(mockData);
      } catch (err) {
        console.error('Error fetching feature requests data:', err);
        setError('Failed to load feature requests data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Feature Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><TrendingUp className="h-3 w-3 mr-1" /> In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">High</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Critical</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feature Request Analytics</h1>
          <p className="text-muted-foreground">Insights from RFPs and customer feedback</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feature Requests</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRequests}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.byStatus.find(s => s.status === 'In Progress')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.byPriority.find(p => p.priority === 'High' || p.priority === 'Critical')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">+5 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Security, Analytics</div>
            <p className="text-xs text-muted-foreground">Most requested categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Requests by Status</CardTitle>
            <CardDescription>Distribution of feature requests by their current status</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byStatus}>
                <XAxis
                  dataKey="status"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests by Priority</CardTitle>
            <CardDescription>Distribution of feature requests by priority level</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byPriority}>
                <XAxis
                  dataKey="priority"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Feature Requests */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Top Requested Features</CardTitle>
          <CardDescription>Most requested features from recent RFPs</CardDescription>
        </CardHeader>
        <CardContent className="w-full overflow-x-auto">
          <div className="space-y-6">
            {data.topFeatures.map((feature) => (
              <div key={feature.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {feature.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div>{getStatusBadge(feature.status)}</div>
                    <div>{getPriorityBadge(feature.priority)}</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center text-xs text-muted-foreground gap-1 sm:gap-2">
                  <span>Requested {feature.requestCount} times</span>
                  <span className="hidden sm:inline">•</span>
                  <span>First seen {new Date(feature.firstSeen).toLocaleDateString()}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Source: {feature.rfpSource}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Feature Request Trend</CardTitle>
          <CardDescription>Number of feature requests over time</CardDescription>
        </CardHeader>
        <CardContent className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.trend}>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                labelFormatter={(value) => {
                  return `Date: ${new Date(value).toLocaleDateString()}`;
                }}
                formatter={(value) => [`${value} requests`, 'Count']}
              />
              <Bar
                dataKey="count"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

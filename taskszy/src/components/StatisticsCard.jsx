import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardToolbar } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ArrowDown, ArrowUp, MoreHorizontal, Pin, Settings, Share2, Trash, TriangleAlert } from 'lucide-react';

const stats = [
  {
    title: 'Total Tasks',
    value: 1523,
    delta: 15.1,
    lastMonth: 1322,
    positive: true,
    prefix: '',
    suffix: '',
  },
  {
    title: 'Active Users',
    value: 342,
    delta: 8.3,
    lastMonth: 316,
    positive: true,
    prefix: '',
    suffix: '',
  },
  {
    title: 'Completed',
    value: 856,
    delta: -2.1,
    lastMonth: 874,
    positive: false,
    prefix: '',
    suffix: '',
  },
  {
    title: 'Team Revenue',
    value: 48100,
    delta: 12.4,
    lastMonth: 42800,
    positive: true,
    prefix: '$',
    suffix: '',
    format: (v) => `$${(v / 1000).toFixed(1)}K`,
    lastFormat: (v) => `$${(v / 1000).toFixed(1)}K`,
  },
];

function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return n.toLocaleString();
  return n.toString();
}

export default function StatisticsCard() {
  return (
    <div className="w-full h-full p-4 bg-white overflow-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="border-0">
              <CardTitle className="text-muted-foreground text-sm font-medium">{stat.title}</CardTitle>
              <CardToolbar>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="dim" size="sm" mode="icon" className="-me-1.5">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="bottom">
                    <DropdownMenuItem>
                      <Settings />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <TriangleAlert /> Add Alert
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pin /> Pin to Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 /> Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <Trash />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardToolbar>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-medium text-foreground tracking-tight">
                  {stat.format ? stat.format(stat.value) : stat.prefix + formatNumber(stat.value) + stat.suffix}
                </span>
                <Badge variant={stat.positive ? 'success' : 'destructive'} appearance="light">
                  {stat.delta > 0 ? <ArrowUp /> : <ArrowDown />}
                  {Math.abs(stat.delta)}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2 border-t pt-2.5">
                Vs last month:{' '}
                <span className="font-medium text-foreground">
                  {stat.lastFormat
                    ? stat.lastFormat(stat.lastMonth)
                    : stat.prefix + formatNumber(stat.lastMonth) + stat.suffix}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

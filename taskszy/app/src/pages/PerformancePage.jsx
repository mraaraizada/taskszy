import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, Calendar, Wallet, CheckCircle, Clock, Users, AlertCircle, BarChart2, ChevronDown, X } from 'lucide-react';
import CustomerGrowth from '../components/CustomerGrowth';
import CustomerHabitsChart from '../components/BarChart';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { Line as ChartJSLine } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const DATE_RANGES = [
  { label: '7 Days',  value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: 'Quarter', value: 'quarter' },
  { label: 'Year',    value: 'year' },
];

// Generate real revenue data from tasks
const generateRevenueData = (tasks, range) => {
  const now = new Date();
  let periods = [];
  
  if (range === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      periods.push({
        label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()],
        start: new Date(d.setHours(0,0,0,0)),
        end: new Date(d.setHours(23,59,59,999))
      });
    }
  } else if (range === '30d') {
    for (let i = 4; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i * 7 + 6));
      const end = new Date(now);
      end.setDate(now.getDate() - (i * 7));
      periods.push({ label: `W${5-i}`, start, end });
    }
  } else if (range === 'quarter') {
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      periods.push({
        label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()],
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0)
      });
    }
  } else { // year
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      periods.push({
        label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()],
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0)
      });
    }
  }
  
  return periods.map(p => {
    const periodTasks = tasks.filter(t => {
      const date = new Date(t.createdDate || t.deadline);
      return date >= p.start && date <= p.end;
    });
    const revenue = periodTasks.reduce((sum, t) => sum + (t.totalBudget || 0), 0);
    const target = revenue * 0.85; // Target is 85% of actual
    return { month: p.label, revenue, target };
  });
};

// Generate team performance data from real tasks
const generateTeamData = (tasks) => {
  const categories = {};
  tasks.forEach(t => {
    const cat = t.category?.label || 'Other';
    const color = t.category?.color || '#C7D4FF';
    if (!categories[cat]) {
      categories[cat] = { name: cat, total: 0, completed: 0, color };
    }
    categories[cat].total++;
    if (t.stage === 'Complete') categories[cat].completed++;
  });
  
  return Object.values(categories).map(c => ({
    name: c.name,
    score: c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
    color: c.color
  })).sort((a, b) => b.score - a.score);
};

function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1A1D2E', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {'\u20B9'}{(p.value / 1000).toFixed(0)}k
        </p>
      ))}
    </div>
  );
}

export default function PerformancePage() {
  // All admin users get full access
  const isAdminA = false;
  
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [activeRange, setActiveRange] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Load saved selections from localStorage
  const [budgetView, setBudgetView] = useState(() => {
    const saved = localStorage.getItem('performanceBudgetView');
    return saved || 'tag';
  });
  const [selectedTags, setSelectedTags] = useState(() => {
    const saved = localStorage.getItem('performanceSelectedTags');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCats, setSelectedCats] = useState(() => {
    const saved = localStorage.getItem('performanceSelectedCats');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [isHoveringPie, setIsHoveringPie] = useState(false);
  const tagRef = useRef(null);
  const { tasks, team, dashStats, financials, payments } = useApp();

  // Save selections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('performanceBudgetView', budgetView);
  }, [budgetView]);

  useEffect(() => {
    localStorage.setItem('performanceSelectedTags', JSON.stringify(selectedTags));
  }, [selectedTags]);

  useEffect(() => {
    localStorage.setItem('performanceSelectedCats', JSON.stringify(selectedCats));
  }, [selectedCats]);

  const handleRangePill = (value) => {
    if (activeRange === value) {
      setActiveRange(''); setDateFrom(''); setDateTo('');
      return;
    }
    setActiveRange(value);
    const now = new Date();
    if (value === '7d') {
      const d = new Date(now); d.setDate(now.getDate() - 7);
      setDateFrom(d.toISOString().split('T')[0]); setDateTo(now.toISOString().split('T')[0]);
    } else if (value === '30d') {
      const d = new Date(now); d.setDate(now.getDate() - 30);
      setDateFrom(d.toISOString().split('T')[0]); setDateTo(now.toISOString().split('T')[0]);
    } else if (value === 'quarter') {
      const d = new Date(now); d.setMonth(now.getMonth() - 3);
      setDateFrom(d.toISOString().split('T')[0]); setDateTo(now.toISOString().split('T')[0]);
    } else if (value === 'year') {
      const d = new Date(now); d.setFullYear(now.getFullYear() - 1);
      setDateFrom(d.toISOString().split('T')[0]); setDateTo(now.toISOString().split('T')[0]);
    }
  };

  const overdueTasks   = tasks.filter(t => new Date(t.deadline) < new Date() && t.stage !== 'Complete').length;
  const completionRate = dashStats.totalTasks ? Math.round((dashStats.completedTasks / dashStats.totalTasks) * 100) : 0;
  const activeMembers  = team.filter(m => m.status === 'Active').length;

  // Calculate financial metrics from Payment page data - filtered by selection AND date range
  // Filter payments based on selected tags/categories AND date range
  const filteredPayments = (payments || []).filter(p => {
    // Date range filter
    if (dateFrom && dateTo) {
      let date = null;
      if (p.paidAt) {
        date = p.paidAt.seconds ? new Date(p.paidAt.seconds * 1000) : new Date(p.paidAt);
      } else if (p.createdAt) {
        date = p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt);
      } else if (p.dueDate) {
        date = new Date(p.dueDate);
      }
      
      if (date) {
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        if (date < fromDate || date > toDate) return false;
      }
    }
    
    // Tag/Category filter
    if (selectedTags.length === 0 && selectedCats.length === 0) return true; // No filter, show all
    
    const task = tasks.find(t => t.id === p.taskId);
    if (!task) return false;
    
    // If category is selected, include all payments for tasks in that category
    if (selectedCats.length > 0) {
      return selectedCats.includes(task.category?.label);
    }
    
    // If tags are selected, include payments for tasks with those tags
    if (selectedTags.length > 0) {
      return (task.tags || []).some(tag => selectedTags.includes(tag.label));
    }
    
    return true;
  });
  
  // ⭐ Total Budget = Sum of PAID task budget entries only (paymentType === 'task-budget' AND isPaid === true)
  const taskBudgetTotal = filteredPayments
    .filter(p => p.paymentType === 'task-budget' && p.isPaid)
    .reduce((sum, p) => sum + (p.paidAmount || p.amount || 0), 0);
  
  // ⭐ Total Amount = Sum of ALL (paid + unpaid) team member, additional, and investment payment amounts
  const totalAmountPaid = filteredPayments
    .filter(p => p.paymentType === 'member' || p.paymentType === 'additional' || p.paymentType === 'investment')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // ⭐ Paid = Sum of PAID team member, additional, and investment entries (isPaid === true)
  const paidAmount = filteredPayments
    .filter(p => p.isPaid && (p.paymentType === 'member' || p.paymentType === 'additional' || p.paymentType === 'investment'))
    .reduce((sum, p) => sum + (p.paidAmount || p.amount || 0), 0);
  
  const pendingAmount = totalAmountPaid - paidAmount;
  const paidRate = totalAmountPaid > 0 ? Math.round((paidAmount / totalAmountPaid) * 100) : 0;
  const profit = taskBudgetTotal - totalAmountPaid;

  // collect unique tags and categories from all tasks with their first occurrence date
  const allTags = [];
  const allCats = [];
  const tagFirstSeen = {}; // Track when each tag was first used
  const catFirstSeen = {}; // Track when each category was first used
  
  tasks.forEach(t => {
    const taskDate = t.createdDate ? new Date(t.createdDate) : new Date(t.deadline);
    
    (t.tags || []).forEach(tag => {
      if (!allTags.find(x => x.label === tag.label)) {
        allTags.push({ label: tag.label, color: tag.color });
        tagFirstSeen[tag.label] = taskDate;
      } else {
        // Update if this task is older
        if (taskDate < tagFirstSeen[tag.label]) {
          tagFirstSeen[tag.label] = taskDate;
        }
      }
    });
    
    const cat = t.category?.label;
    if (cat && !allCats.find(x => x.label === cat)) {
      allCats.push({ label: cat, color: t.category.color });
      catFirstSeen[cat] = taskDate;
    } else if (cat) {
      // Update if this task is older
      if (taskDate < catFirstSeen[cat]) {
        catFirstSeen[cat] = taskDate;
      }
    }
  });

  // Auto-select oldest tag if no selection exists (only on first load)
  useEffect(() => {
    const hasStoredSelection = localStorage.getItem('performanceSelectedTags') || localStorage.getItem('performanceSelectedCats');
    
    if (!hasStoredSelection && selectedTags.length === 0 && selectedCats.length === 0 && allTags.length > 0) {
      // Find the oldest tag
      let oldestTag = null;
      let oldestDate = new Date();
      
      allTags.forEach(tag => {
        const firstSeen = tagFirstSeen[tag.label];
        if (firstSeen && firstSeen < oldestDate) {
          oldestDate = firstSeen;
          oldestTag = tag.label;
        }
      });
      
      if (oldestTag) {
        setSelectedTags([oldestTag]);
        setBudgetView('tag');
      }
    }
  }, [allTags.length]); // Only run when tags are loaded

  // Filter tags based on selected category - only show tags that belong to tasks with the selected category
  const availableTags = selectedCats.length > 0 
    ? allTags.filter(tag => {
        return tasks.some(t => 
          selectedCats.includes(t.category?.label) && 
          (t.tags || []).some(tTag => tTag.label === tag.label)
        );
      })
    : allTags;

  // filtered tasks based on selections
  const filteredTasks = tasks.filter(t => {
    const tagMatch = selectedTags.length === 0 || (t.tags || []).some(tag => selectedTags.includes(tag.label));
    const catMatch = selectedCats.length === 0 || selectedCats.includes(t.category?.label);
    return tagMatch && catMatch;
  });

  // Calculate stats from filtered tasks
  const filteredTotalTasks = filteredTasks.length;
  const filteredCompletedTasks = filteredTasks.filter(t => t.stage === 'Complete').length;
  const filteredOverdueTasks = filteredTasks.filter(t => new Date(t.deadline) < new Date() && t.stage !== 'Complete').length;
  const filteredCompletionRate = filteredTotalTasks ? Math.round((filteredCompletedTasks / filteredTotalTasks) * 100) : 0;

  // Payment Trend — one line per tag or category, budget by month
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const hasRealData = allTags.length > 0 || allCats.length > 0;
  
  // Determine which keys to show in Payment Trend and Payment Wise charts
  let trendKeys = budgetView === 'tag' ? allTags : allCats;
  
  // If category is selected, show only that category (when viewing by category)
  if (selectedCats.length > 0 && budgetView === 'category') {
    trendKeys = allCats.filter(cat => selectedCats.includes(cat.label));
  }
  // If tags are selected, show only those tags (when viewing by tag)
  else if (selectedTags.length > 0 && budgetView === 'tag') {
    trendKeys = allTags.filter(tag => selectedTags.includes(tag.label));
  }
  // When no filters are selected, show ALL tags/categories (not just max)
  // trendKeys already contains all tags or all categories based on budgetView

  // Build real trend data from payments AND tasks created in each month
  const now = new Date();
  const fullTrendData = (() => {
    // If no trendKeys, return empty data
    if (trendKeys.length === 0) {
      return [];
    }
    
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const entry = { month: MONTHS[d.getMonth()] };
      
      // Filter payments for this month (only member, additional, investment types)
      const monthPayments = (payments || []).filter(p => {
        if (p.paymentType !== 'member' && p.paymentType !== 'additional' && p.paymentType !== 'investment') return false;
        
        // Handle different date formats
        let date = null;
        if (p.paidAt) {
          date = p.paidAt.seconds ? new Date(p.paidAt.seconds * 1000) : new Date(p.paidAt);
        } else if (p.createdAt) {
          date = p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt);
        } else if (p.dueDate) {
          date = new Date(p.dueDate);
        }
        
        if (!date) return false;
        return date >= monthStart && date <= monthEnd;
      });
      
      // Also include tasks created in this month (even without payments)
      const monthTasks = tasks.filter(t => {
        const createdDate = t.createdDate ? new Date(t.createdDate) : null;
        if (!createdDate) return false;
        return createdDate >= monthStart && createdDate <= monthEnd;
      });
      
      // Calculate amounts for each tag/category
      trendKeys.forEach(key => {
        if (budgetView === 'tag') {
          // Sum payments where the task has this tag
          const paymentAmount = monthPayments
            .filter(p => {
              const task = tasks.find(t => t.id === p.taskId);
              return task && (task.tags || []).some(tag => tag.label === key.label);
            })
            .reduce((s, p) => s + (p.amount || 0), 0);
          
          // Add task budget amounts for tasks created this month with this tag (if no payment exists)
          const taskAmount = monthTasks
            .filter(t => (t.tags || []).some(tag => tag.label === key.label))
            .reduce((s, t) => {
              // Only add task budget if there's no payment for this task in this month
              const hasPayment = monthPayments.some(p => p.taskId === t.id);
              return s + (hasPayment ? 0 : (t.taskBudgetAmount || 0));
            }, 0);
          
          entry[key.label] = paymentAmount + taskAmount;
        } else {
          // Sum payments where the task has this category
          const paymentAmount = monthPayments
            .filter(p => {
              const task = tasks.find(t => t.id === p.taskId);
              return task && task.category?.label === key.label;
            })
            .reduce((s, p) => s + (p.amount || 0), 0);
          
          // Add task budget amounts for tasks created this month with this category (if no payment exists)
          const taskAmount = monthTasks
            .filter(t => t.category?.label === key.label)
            .reduce((s, t) => {
              // Only add task budget if there's no payment for this task in this month
              const hasPayment = monthPayments.some(p => p.taskId === t.id);
              return s + (hasPayment ? 0 : (t.taskBudgetAmount || 0));
            }, 0);
          
          entry[key.label] = paymentAmount + taskAmount;
        }
      });
      months.push(entry);
    }
    return months;
  })();

  // Filter data based on date range if custom dates are selected
  let trendData = fullTrendData;
  if (dateFrom && dateTo) {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    const monthsDiff = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth()) + 1;
    trendData = fullTrendData.slice(-Math.min(monthsDiff, fullTrendData.length));
  }
  
  const activeRangeLabel = DATE_RANGES.find(r => r.value === activeRange)?.label || 'Custom';

  // Payment split donut — by tag/category using payment data (member, additional, investment)
  // Filter by date range as well
  const tagMap = {};
  const catMap = {};
  const tagBudgetMap = {}; // Track task budgets for profit calculation
  const catBudgetMap = {};
  
  // Helper function to check if payment is in date range
  const isInDateRange = (p) => {
    if (!dateFrom || !dateTo) return true;
    
    let date = null;
    if (p.paidAt) {
      date = p.paidAt.seconds ? new Date(p.paidAt.seconds * 1000) : new Date(p.paidAt);
    } else if (p.createdAt) {
      date = p.createdAt.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(p.createdAt);
    } else if (p.dueDate) {
      date = new Date(p.dueDate);
    }
    
    if (!date) return false;
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    return date >= fromDate && date <= toDate;
  };
  
  // First, calculate task budgets by tag/category
  (payments || [])
    .filter(p => p.paymentType === 'task-budget' && isInDateRange(p))
    .forEach(p => {
      const amount = p.amount || 0;
      const task = tasks.find(t => t.id === p.taskId);
      if (!task) return;
      
      if (task.tags && task.tags.length > 0) {
        const n = task.tags.length;
        const totalWeight = (n * (n + 1)) / 2;
        task.tags.forEach((tag, idx) => {
          const weight = (n - idx) / totalWeight;
          if (!tagBudgetMap[tag.label]) tagBudgetMap[tag.label] = 0;
          tagBudgetMap[tag.label] += amount * weight;
        });
      }
      
      // Category gets FULL amount (no weighting) since task belongs to only ONE category
      const cat = task.category?.label || 'Other';
      if (!catBudgetMap[cat]) catBudgetMap[cat] = 0;
      catBudgetMap[cat] += amount;
    });
  
  // Then, calculate payment amounts by tag/category
  (payments || [])
    .filter(p => (p.paymentType === 'member' || p.paymentType === 'additional' || p.paymentType === 'investment') && isInDateRange(p))
    .forEach(p => {
      const amount = p.amount || 0;
      const task = tasks.find(t => t.id === p.taskId);
      if (!task) return;
      
      if (task.tags && task.tags.length > 0) {
        const n = task.tags.length;
        const totalWeight = (n * (n + 1)) / 2;
        task.tags.forEach((tag, idx) => {
          const weight = (n - idx) / totalWeight;
          if (!tagMap[tag.label]) tagMap[tag.label] = { name: tag.label, value: 0, color: tag.color, budget: 0 };
          tagMap[tag.label].value += amount * weight;
          tagMap[tag.label].budget = tagBudgetMap[tag.label] || 0;
        });
      } else {
        if (!tagMap['Other']) tagMap['Other'] = { name: 'Other', value: 0, color: '#C7D4FF', budget: 0 };
        tagMap['Other'].value += amount;
      }
      
      // Category gets FULL amount (no weighting) since task belongs to only ONE category
      const cat = task.category?.label || 'Other';
      const color = task.category?.color || '#C7D4FF';
      if (!catMap[cat]) catMap[cat] = { name: cat, value: 0, color, budget: 0 };
      catMap[cat].value += amount;
      catMap[cat].budget = catBudgetMap[cat] || 0;
    });
    
  const sourceMap = budgetView === 'tag' ? tagMap : catMap;
  
  // Filter sourceMap based on selected tags/categories
  let filteredSourceMap = sourceMap;
  
  // When viewing by category and categories are selected, show only those categories
  if (selectedCats.length > 0 && budgetView === 'category') {
    filteredSourceMap = Object.fromEntries(
      Object.entries(sourceMap).filter(([key]) => selectedCats.includes(key))
    );
  } 
  // When viewing by tag and categories are selected, show all tags within those categories
  else if (selectedCats.length > 0 && budgetView === 'tag') {
    // Get all tags that belong to tasks with the selected categories
    const tagsInSelectedCategories = new Set();
    tasks.forEach(t => {
      if (selectedCats.includes(t.category?.label)) {
        (t.tags || []).forEach(tag => tagsInSelectedCategories.add(tag.label));
      }
    });
    filteredSourceMap = Object.fromEntries(
      Object.entries(sourceMap).filter(([key]) => tagsInSelectedCategories.has(key))
    );
  }
  // When viewing by tag and tags are selected, show only those tags
  else if (selectedTags.length > 0 && budgetView === 'tag') {
    filteredSourceMap = Object.fromEntries(
      Object.entries(sourceMap).filter(([key]) => selectedTags.includes(key))
    );
  }
  
  const totalBudget = Object.values(filteredSourceMap).reduce((s, c) => s + c.value, 0);
  const spendData = Object.values(filteredSourceMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(c => ({ 
      ...c, 
      pct: totalBudget ? Math.round((c.value / totalBudget) * 100) : 0,
      profit: c.budget - c.value // Calculate profit
    }));

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>

      {/* Date Range Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {DATE_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => handleRangePill(range.value)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: activeRange === range.value ? 'none' : '1.5px solid var(--border)',
                  background: activeRange === range.value ? '#3B5BFC' : 'var(--bg-surface)',
                  color: activeRange === range.value ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >{range.label}</button>
            ))}
          </div>
          <div style={{ height: 28, width: 1, background: 'var(--border)' }} />
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDatePicker(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${(dateFrom || dateTo) ? '#3B5BFC' : 'var(--border)'}`,
                background: (dateFrom || dateTo) ? '#EEF2FF' : 'var(--bg-surface)',
              }}
            >
              <Calendar size={14} color={(dateFrom || dateTo) ? '#3B5BFC' : 'var(--text-muted)'} />
              {(dateFrom || dateTo) && (
                <span style={{ fontSize: 11, fontWeight: 600, color: '#3B5BFC' }}>
                  {dateFrom && !isNaN(new Date(dateFrom + '-01').getTime()) && new Date(dateFrom + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {dateFrom && dateTo && !isNaN(new Date(dateFrom + '-01').getTime()) && !isNaN(new Date(dateTo + '-01').getTime()) && ' – '}
                  {dateTo && !isNaN(new Date(dateTo + '-01').getTime()) && new Date(dateTo + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </button>
            {showDatePicker && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, zIndex: 100,
                background: 'var(--bg-surface)', borderRadius: 12, padding: '14px 16px',
                border: '1.5px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                display: 'flex', flexDirection: 'column', gap: 10, minWidth: 220,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>From (Month)</span>
                  <input type="month" value={tempDateFrom} onChange={e => setTempDateFrom(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 12, color: 'var(--text-primary)', background: 'var(--bg-subtle)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>To (Month)</span>
                  <input type="month" value={tempDateTo} onChange={e => setTempDateTo(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 12, color: 'var(--text-primary)', background: 'var(--bg-subtle)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); setTempDateFrom(''); setTempDateTo(''); setActiveRange(''); setShowDatePicker(false); }}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => { setDateFrom(tempDateFrom); setDateTo(tempDateTo); setActiveRange(''); setShowDatePicker(false); }}
                    disabled={!tempDateFrom && !tempDateTo}
                    style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: (tempDateFrom || tempDateTo) ? '#3B5BFC' : 'var(--bg-subtle)', color: (tempDateFrom || tempDateTo) ? '#fff' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: (tempDateFrom || tempDateTo) ? 'pointer' : 'default' }}>
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Tag / Category toggle + merged filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>View by</span>

          {/* Toggle + Filter merged into one pill group */}
          <div ref={tagRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: 0, background: 'var(--bg-surface)', borderRadius: 10, padding: 3, border: `1.5px solid ${(selectedTags.length + selectedCats.length) > 0 ? '#3B5BFC' : 'var(--border)'}`, alignItems: 'center' }}>
              {['tag', 'category'].map(v => (
                <button key={v} onClick={() => setBudgetView(v)} style={{
                  padding: '5px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: budgetView === v ? '#3B5BFC' : 'transparent',
                  color: budgetView === v ? '#fff' : 'var(--text-secondary)',
                  boxShadow: budgetView === v ? '0 2px 8px rgba(59,91,252,0.25)' : 'none',
                  transition: 'all 0.15s', textTransform: 'capitalize',
                }}>{v}</button>
              ))}

              {/* Divider */}
              <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 2px' }} />

              {/* Arrow / filter indicator — click to toggle */}
              <button onClick={() => setShowTagDropdown(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', border: 'none', background: showTagDropdown ? 'var(--bg-subtle)' : 'transparent' }}>
                {(selectedTags.length + selectedCats.length) > 0 && (
                  <span style={{ background: '#3B5BFC', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>
                    {selectedTags.length + selectedCats.length}
                  </span>
                )}
                <ChevronDown size={12} color={showTagDropdown ? '#3B5BFC' : 'var(--text-muted)'} style={{ transition: 'transform 0.2s', transform: showTagDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
            </div>

            {showTagDropdown && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: 'var(--bg-surface)', borderRadius: 12, border: '1.5px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, padding: 8 }}>
                {(selectedTags.length + selectedCats.length) > 0 && (
                  <button onClick={() => { setSelectedTags([]); setSelectedCats([]); }} style={{ width: '100%', padding: '6px 10px', background: '#FEF2F2', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#EF4444', cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <X size={11} /> Clear all
                  </button>
                )}
                <div style={{ display: 'flex', gap: 0 }}>
                  {/* Tags column */}
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 10px 6px' }}>Tags</div>
                    {availableTags.map(tag => {
                      const checked = selectedTags.includes(tag.label);
                      const isDisabled = selectedCats.length > 0 || (!checked && selectedTags.length >= 5);
                      return (
                        <div key={tag.label} onClick={() => {
                          if (isDisabled) return;
                          const newTags = checked ? selectedTags.filter(t => t !== tag.label) : [...selectedTags, tag.label];
                          setSelectedTags(newTags);
                          // Auto-switch to tag view when selecting a tag
                          if (newTags.length > 0) {
                            setBudgetView('tag');
                          }
                        }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: isDisabled ? 'not-allowed' : 'pointer', background: checked ? '#EEF2FF' : 'transparent', opacity: isDisabled ? 0.4 : 1 }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? '#3B5BFC' : 'var(--border)'}`, background: checked ? '#3B5BFC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{tag.label}</span>
                        </div>
                      );
                    })}
                    {availableTags.length === 0 && selectedCats.length > 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 10px' }}>No tags for this category</div>}
                    {availableTags.length === 0 && selectedCats.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 10px' }}>No tags</div>}
                  </div>
                  <div style={{ width: 1, background: 'var(--border-light)', margin: '0 4px' }} />
                  {/* Category column */}
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 10px 6px' }}>Category</div>
                    {allCats.map(cat => {
                      const checked = selectedCats.includes(cat.label);
                      const isDisabled = selectedTags.length > 0;
                      return (
                        <div key={cat.label} onClick={() => {
                          if (isDisabled) return;
                          // Only allow ONE category selection
                          if (checked) {
                            // Deselect this category
                            setSelectedCats([]);
                          } else {
                            // Select only this category (replace any previous selection)
                            setSelectedCats([cat.label]);
                            // Auto-switch to category view when selecting a category
                            setBudgetView('category');
                          }
                        }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: isDisabled ? 'not-allowed' : 'pointer', background: checked ? '#F5F3FF' : 'transparent', opacity: isDisabled ? 0.4 : 1 }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? '#7C3AED' : 'var(--border)'}`, background: checked ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                            {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.label}</span>
                        </div>
                      );
                    })}
                    {allCats.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 10px' }}>No categories</div>}
                  </div>
                </div>
                {allTags.length === 0 && allCats.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 10px' }}>No tags or categories found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Stat Cards — Finance + Tasks & Team */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>

        {/* Finance */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '16px 18px', border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={15} color="#3B5BFC" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Payment & Budget</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Budget overview</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, flex: 1 }}>
            {[
              { label: 'Total Budget', value: `₹${taskBudgetTotal.toLocaleString()}`, icon: BarChart2,   color: '#7C3AED', bg: '#F5F3FF' },
              { label: 'Total Amount', value: `₹${totalAmountPaid.toLocaleString()}`, icon: Wallet,       color: '#3B5BFC', bg: '#EEF2FF' },
              { label: 'Profit',       value: `₹${profit.toLocaleString()}`, icon: TrendingUp,  color: profit >= 0 ? '#12C479' : '#EF4444', bg: profit >= 0 ? '#ECFDF5' : '#FEF2F2' },
              { label: 'Paid',         value: `₹${paidAmount.toLocaleString()}`,        icon: CheckCircle, color: '#10B981', bg: '#D1FAE5' },
              { label: 'Pending',      value: `₹${pendingAmount.toLocaleString()}`,         icon: Clock,       color: '#F97316', bg: '#FFF7ED' },
              { label: 'Paid Rate',    value: `${paidRate}%`,                          icon: BarChart2,  color: '#06B6D4', bg: '#ECFEFF' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={13} color={s.color} strokeWidth={2} />
                    <div style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>{s.label}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks & Team merged */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: 16, padding: '16px 18px', border: '1.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={15} color="#12C479" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Tasks & Team</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Progress & members</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Total Tasks',     value: String(filteredTotalTasks),     color: '#7C3AED', bg: '#EDE9FE', icon: BarChart2 },
              { label: 'Task Completed',  value: String(filteredCompletedTasks), color: '#0369A1', bg: '#E0F2FE', icon: CheckCircle },
              { label: 'Completion Rate', value: `${filteredCompletionRate}%`,             color: '#B45309', bg: '#FEF3C7', icon: TrendingUp },
              { label: 'Overdate Tasks',   value: String(filteredOverdueTasks),             color: filteredOverdueTasks === 0 ? '#15803D' : '#B91C1C', bg: filteredOverdueTasks === 0 ? '#DCFCE7' : '#FEE2E2', icon: AlertCircle },
              { label: 'Team Members',    value: String(team.length),              color: '#0F766E', bg: '#CCFBF1', icon: Users },
              { label: 'Active',          value: String(activeMembers),            color: '#9333EA', bg: '#F3E8FF', icon: Users },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={13} color={s.color} strokeWidth={2} />
                    <div style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>{s.label}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Payment Trend + Budget Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        <div className="card animate-fade-slide" style={{ padding: '16px 20px', border: '1.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Payment Trend</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Payment allocation over time by {budgetView === 'tag' ? 'tags' : 'categories'}
                {activeRange && ` · ${activeRangeLabel}`}
                {(dateFrom && dateTo) && ` · ${trendData.length} month${trendData.length > 1 ? 's' : ''}`}
                {(selectedTags.length > 0 || selectedCats.length > 0) && ` · ${selectedTags.length + selectedCats.length} filter${selectedTags.length + selectedCats.length > 1 ? 's' : ''} applied`}
              </p>
            </div>
          </div>
          
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {trendKeys.map(tag => (
              <div key={tag.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: tag.color, display: 'inline-block' }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{tag.label}</span>
              </div>
            ))}
          </div>
          
          {/* Chart.js Line Chart */}
          <div style={{ height: 160 }}>
            {trendKeys.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <TrendingUp size={24} color="var(--text-muted)" strokeWidth={1.5} />
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>No data yet</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Create tasks with tags or categories to see trends</div>
              </div>
            ) : (
            <ChartJSLine
              data={{
                labels: trendData.map(d => d.month),
                datasets: trendKeys.map(tag => ({
                  label: tag.label,
                  data: trendData.map(d => d[tag.label] || 0),
                  borderColor: tag.color,
                  backgroundColor: tag.color + '20',
                  borderWidth: 2.5,
                  tension: 0.4,
                  pointRadius: 5,
                  pointHoverRadius: 7,
                  pointBackgroundColor: tag.color,
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointHoverBackgroundColor: tag.color,
                  pointHoverBorderColor: '#fff',
                  pointHoverBorderWidth: 2.5,
                  spanGaps: false, // Don't connect points across gaps
                  showLine: true, // Always show the line
                }))
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#1A1D2E',
                    bodyColor: '#6B7280',
                    borderColor: '#E5E7EB',
                    borderWidth: 1.5,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                      label: function(context) {
                        return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString();
                      },
                      footer: function(tooltipItems) {
                        const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
                        return 'Total: ₹' + Math.round(total).toLocaleString();
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: '#9CA3AF',
                      font: {
                        size: 11,
                      }
                    }
                  },
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: '#F3F4F6',
                      drawBorder: false,
                    },
                    ticks: {
                      color: '#9CA3AF',
                      font: {
                        size: 11,
                      },
                      callback: function(value) {
                        if (value === 0) return '₹0';
                        if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L';
                        if (value >= 1000) return '₹' + (value / 1000).toFixed(0) + 'k';
                        return '₹' + value;
                      },
                      stepSize: (() => {
                        // Calculate max value from all datasets
                        const allValues = trendData.flatMap(d => trendKeys.map(k => d[k.label] || 0));
                        const maxValue = Math.max(...allValues, 0);
                        
                        if (maxValue === 0) return 100;
                        
                        // Get the order of magnitude
                        const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
                        
                        // Calculate a nice step size (1, 2, or 5 times the magnitude)
                        const ratio = maxValue / magnitude;
                        let step;
                        
                        if (ratio <= 2) {
                          step = magnitude / 5; // 5 divisions
                        } else if (ratio <= 5) {
                          step = magnitude; // 5 divisions
                        } else {
                          step = magnitude * 2; // 5 divisions
                        }
                        
                        return step;
                      })(),
                      precision: 0
                    }
                  }
                }
              }}
            />
            )}
          </div>
        </div>

        <div className="card animate-fade-slide" style={{ padding: '16px 20px', border: '1.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Payment Wise</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {budgetView === 'tag' ? 'Tags' : 'Categories'} payment
                {activeRange && ` · ${activeRangeLabel}`}
                {(selectedTags.length > 0 || selectedCats.length > 0) && ` · ${selectedTags.length + selectedCats.length} filter${selectedTags.length + selectedCats.length > 1 ? 's' : ''} applied`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
            {spendData.length === 0 ? (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wallet size={18} color="var(--text-muted)" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>No payment data</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>Create payments to see distribution</div>
              </div>
            ) : (
            <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width={180} height={180} minWidth={0}>
                <PieChart onMouseEnter={() => setIsHoveringPie(true)} onMouseLeave={() => setIsHoveringPie(false)}>
                  <Pie data={spendData} cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={0} dataKey="pct" strokeWidth={0} label={false} isAnimationActive={false}>
                    {spendData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 11, color: '#1A1D2E', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', border: '1px solid #E5E7EB', minWidth: 160 }}>
                          <div style={{ fontWeight: 700, marginBottom: 6, color: d.color, fontSize: 12 }}>{d.name}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ color: '#6B7280' }}>Total Amount:</span>
                            <span style={{ fontWeight: 700 }}>₹{Math.round(d.value).toLocaleString()}</span>
                          </div>
                          {d.budget > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ color: '#6B7280' }}>Task Budget:</span>
                              <span style={{ fontWeight: 700 }}>₹{Math.round(d.budget).toLocaleString()}</span>
                            </div>
                          )}
                          {d.profit > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid #E5E7EB' }}>
                              <span style={{ color: '#12C479', fontWeight: 600 }}>Profit:</span>
                              <span style={{ fontWeight: 700, color: '#12C479' }}>₹{Math.round(d.profit).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {!isHoveringPie && (
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>₹{totalBudget.toLocaleString()}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>Total</span>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Completion + Task Growth */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <CustomerHabitsChart 
          selectedCategory={selectedCats.length > 0 ? selectedCats[0] : null}
          selectedTags={selectedTags.length > 0 ? selectedTags : null}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
        <CustomerGrowth 
          key={`${selectedCats.join(',')}-${selectedTags.join(',')}-${dateFrom}-${dateTo}`}
          selectedCategory={selectedCats.length > 0 ? selectedCats[0] : null}
          selectedTags={selectedTags.length > 0 ? selectedTags : null}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </div>

    </div>
  );
}

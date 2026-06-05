import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from './ui/input';
import OrganizationListItem from './OrganizationListItem';

export default function OrganizationManagementPanel({ 
  organizations, 
  onSelectOrganization, 
  selectedOrganization, 
  isLoading 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // name, plan, status, joinDate
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter and sort organizations
  const filteredAndSortedOrganizations = useMemo(() => {
    if (!organizations || organizations.length === 0) return [];

    let filtered = organizations;

    // Apply search filter (by name and email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(query) ||
          org.email.toLowerCase().includes(query)
      );
    }

    // Apply plan filter
    if (planFilter !== 'All') {
      filtered = filtered.filter((org) => org.subscriptionPlan === planFilter);
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((org) => org.subscriptionStatus === statusFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'plan':
          const planOrder = { Free: 1, Starter: 2, Professional: 3, Business: 4, Enterprise: 5 };
          compareValue = (planOrder[a.subscriptionPlan] || 0) - (planOrder[b.subscriptionPlan] || 0);
          break;
        case 'status':
          compareValue = a.subscriptionStatus.localeCompare(b.subscriptionStatus);
          break;
        case 'joinDate':
          compareValue = new Date(a.joinDate) - new Date(b.joinDate);
          break;
        default:
          compareValue = 0;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [organizations, searchQuery, planFilter, statusFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOrganizations.length / itemsPerPage);
  const paginatedOrganizations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedOrganizations.slice(startIndex, endIndex);
  }, [filteredAndSortedOrganizations, currentPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePlanFilterChange = (value) => {
    setPlanFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if clicking the same sort option
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 4,
          }}
        >
          Organization Management
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          Search and filter organizations
        </p>
      </div>

      {/* Search and Filter Section */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 300px', minWidth: 200 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              paddingLeft: 36,
              width: '100%',
            }}
          />
        </div>

        {/* Plan Filter */}
        <select
          value={planFilter}
          onChange={(e) => handlePlanFilterChange(e.target.value)}
          style={{
            height: 32,
            padding: '0 12px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
        >
          <option value="All">All Plans</option>
          <option value="Free">Free</option>
          <option value="Starter">Starter</option>
          <option value="Professional">Professional</option>
          <option value="Business">Business</option>
          <option value="Enterprise">Enterprise</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          style={{
            height: 32,
            padding: '0 12px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
        >
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Sort Controls */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          Sort by:
        </span>
        {['name', 'plan', 'status', 'joinDate'].map((option) => (
          <button
            key={option}
            onClick={() => handleSortChange(option)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: sortBy === option ? '1px solid #3B5BFC' : '1px solid var(--border-color)',
              background: sortBy === option ? 'rgba(59, 91, 252, 0.1)' : 'var(--bg-surface)',
              color: sortBy === option ? '#3B5BFC' : 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {option === 'joinDate' ? 'Join Date' : option.charAt(0).toUpperCase() + option.slice(1)}
            {sortBy === option && (
              <span style={{ marginLeft: 4 }}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          marginBottom: 12,
        }}
      >
        Showing {paginatedOrganizations.length} of {filteredAndSortedOrganizations.length} organizations
      </div>

      {/* Organization List */}
      <div
        style={{
          maxHeight: 600,
          overflowY: 'auto',
          marginBottom: 16,
        }}
      >
        {organizations.length === 0 ? (
          <div
            style={{
              padding: '60px 40px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ width: 80, height: 80, borderRadius: 20, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3B5BFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                No Organizations Yet
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 400 }}>
                Organizations will appear here once they are added to the system
              </div>
            </div>
          </div>
        ) : paginatedOrganizations.length > 0 ? (
          paginatedOrganizations.map((org) => (
            <OrganizationListItem
              key={org.id}
              organization={org}
              onSelect={onSelectOrganization}
              isSelected={selectedOrganization?.id === org.id}
            />
          ))
        ) : (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            No organizations found matching your filters
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredAndSortedOrganizations.length > itemsPerPage && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 16,
            borderTop: '1px solid var(--border-color)',
            gap: 6,
          }}
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              border: '1.5px solid var(--border)',
              background: currentPage === 1 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={12} color="var(--text-muted)" />
          </button>

          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              minWidth: 50,
              textAlign: 'center',
            }}
          >
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              border: '1.5px solid var(--border)',
              background: currentPage === totalPages ? 'var(--bg-subtle)' : 'var(--bg-surface)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            <ChevronRight size={12} color="var(--text-muted)" />
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DeveloperMetrics {
  name: string;
  gitlabUsername?: string;
  totalPRs: number;
  mergedPRs: number;
  totalCommits: number;
  jiraTickets: number;
  jiraPoints: number;
  prDensity: number;
  prMergeRate: number;
  totalContributions: number;
}

interface DashboardData {
  jira?: any;
  jiraDateRange?: {
    totalIssues: number;
    completedIssues: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
    remainingStoryPoints: number;
  };
  gitlab?: any;
  firebase?: any;
  sonarqube?: any;
  developers?: DeveloperMetrics[];
  message?: string;
  availableSprints?: any[];
  selectedSprint?: any;
  filter?: string;
  filterLabel?: string;
  dateRange?: {
    start: string;
    end: string;
    label: string;
  };
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'team' | 'system' | 'individual'>('system');
  const [filter, setFilter] = useState<'all' | 'mobile' | 'web'>('all');
  const [dateRange, setDateRange] = useState<'30d' | '3m' | '6m' | 'year' | 'all'>('30d');

  // Calculate date range based on selection
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case '30d':
        start.setDate(start.getDate() - 30);
        return { start: start.toISOString(), end: end.toISOString(), label: 'Last 30 Days' };
      case '3m':
        start.setMonth(start.getMonth() - 3);
        return { start: start.toISOString(), end: end.toISOString(), label: 'Last 3 Months' };
      case '6m':
        start.setMonth(start.getMonth() - 6);
        return { start: start.toISOString(), end: end.toISOString(), label: 'Last 6 Months' };
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        return { start: start.toISOString(), end: end.toISOString(), label: 'Last Year' };
      case 'all':
        start.setFullYear(start.getFullYear() - 5); // Go back 5 years for "all"
        return { start: start.toISOString(), end: end.toISOString(), label: 'All Time' };
      default:
        start.setDate(start.getDate() - 30);
        return { start: start.toISOString(), end: end.toISOString(), label: 'Last 30 Days' };
    }
  };

  const fetchData = async (sprintId?: string, filterType?: string) => {
    try {
      const params = new URLSearchParams();
      if (sprintId) params.append('sprintId', sprintId);
      if (filterType) params.append('filter', filterType);
      
      // Add date range parameters
      const range = getDateRange();
      console.log('Date range being sent:', range);
      params.append('startDate', range.start);
      params.append('endDate', range.end);
      
      const url = `http://localhost:5001/api/dashboard/overview${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching URL:', url);
      
      const response = await axios.get(url);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedSprintId, filter);
  }, [selectedSprintId, filter, dateRange]); // Added dateRange to dependencies

  const handleSprintChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const sprintId = event.target.value;
    setSelectedSprintId(sprintId);
  };

  const handleFilterChange = (newFilter: 'all' | 'mobile' | 'web') => {
    setFilter(newFilter);
    setSelectedSprintId(''); // Reset sprint selection when filter changes
  };

  // Filter sprints based on current filter
  const getFilteredSprints = () => {
    if (!data?.availableSprints) return [];
    
    return data.availableSprints.filter(sprint => {
      if (filter === 'mobile') {
        // Only show MAM and HWS board sprints
        return sprint.boardName.includes('Mobile') || sprint.boardName.includes('HWS');
      } else if (filter === 'web') {
        // Only show CA board sprints  
        return sprint.boardName.includes('CA');
      } else {
        // Show all sprints
        return true;
      }
    });
  };

  const filteredSprints = getFilteredSprints();

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>eRecruit Development Dashboard</h1>
        
        {/* Date Range Filter */}
        <div style={{ margin: '15px 0' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>
            Date Range:
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <DateRangeButton 
              active={dateRange === '30d'}
              onClick={() => setDateRange('30d')}
              title="Last 30 Days"
            />
            <DateRangeButton 
              active={dateRange === '3m'}
              onClick={() => setDateRange('3m')}
              title="Last 3 Months"
            />
            <DateRangeButton 
              active={dateRange === '6m'}
              onClick={() => setDateRange('6m')}
              title="Last 6 Months"
            />
            <DateRangeButton 
              active={dateRange === 'year'}
              onClick={() => setDateRange('year')}
              title="Last Year"
            />
            <DateRangeButton 
              active={dateRange === 'all'}
              onClick={() => setDateRange('all')}
              title="All Time"
            />
          </div>
        </div>

        {/* Project Filter Buttons */}
        <div style={{ margin: '15px 0' }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '16px' }}>
            Project Filter:
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <FilterButton 
              active={filter === 'all'}
              onClick={() => handleFilterChange('all')}
              title="All Projects"
              subtitle="Full eRecruit platform"
              color="#6b7280"
            />
            <FilterButton 
              active={filter === 'mobile'}
              onClick={() => handleFilterChange('mobile')}
              title="Mobile Apps"
              subtitle="React Native (HWS + MaxView)"
              color="#16a34a"
            />
            <FilterButton 
              active={filter === 'web'}
              onClick={() => handleFilterChange('web')}
              title="Portals"
              subtitle="Web Frontend & Admin"
              color="#2563eb"
            />
          </div>
        </div>
        
        {/* Sprint Selector Dropdown - Filtered by project type */}
        {filteredSprints.length > 0 && (
          <div style={{ margin: '15px 0' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              Select Sprint ({filter === 'mobile' ? 'Mobile Projects' : filter === 'web' ? 'Portals' : 'All Projects'}):
            </label>
            <select 
              value={selectedSprintId}
              onChange={handleSprintChange}
              style={{ 
                padding: '10px 12px', 
                border: '2px solid #e5e7eb', 
                borderRadius: '8px', 
                fontSize: '14px',
                minWidth: '400px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">
                Auto-select (Current/Next Active Sprint for {filter === 'mobile' ? 'Mobile Apps' : filter === 'web' ? 'Portals' : 'All Projects'})
              </option>
              {filteredSprints.map((sprint) => {
                const startDate = new Date(sprint.startDate).toLocaleDateString();
                const endDate = new Date(sprint.endDate).toLocaleDateString();
                return (
                  <option key={`${sprint.boardId}-${sprint.id}`} value={sprint.id}>
                    {sprint.displayName} ({sprint.state}) - {startDate} to {endDate}
                  </option>
                );
              })}
            </select>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
              Showing {filteredSprints.length} sprint{filteredSprints.length !== 1 ? 's' : ''} for {filter === 'mobile' ? 'Mobile Apps (HWS & MaxView boards)' : filter === 'web' ? 'Portals (CA board)' : 'All Projects'}
            </div>
          </div>
        )}
        
        {data?.message && (
          <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '6px', color: '#166534', marginBottom: '20px' }}>
            {data.filterLabel && <strong>{data.filterLabel}</strong>}: {data.message.replace(/^[^:]*: /, '')}
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ 
          borderBottom: '3px solid #e5e7eb', 
          marginBottom: '30px',
          display: 'flex',
          gap: '0'
        }}>
          <TabButton 
            active={activeTab === 'system'}
            onClick={() => setActiveTab('system')}
            title="System Health"
            subtitle="Code quality, security, performance"
          />
          <TabButton 
            active={activeTab === 'team'}
            onClick={() => setActiveTab('team')}
            title="Team Performance"
            subtitle="Employee metrics, sprints, productivity"
          />
          <TabButton 
            active={activeTab === 'individual'}
            onClick={() => setActiveTab('individual')}
            title="Individual Performance"
            subtitle="Developer statistics"
          />
        </div>
      </div>

      {data && (
        <>
          {activeTab === 'system' && <SystemHealthTab data={data} />}
          {activeTab === 'team' && <TeamPerformanceTab data={data} />}
          {activeTab === 'individual' && <IndividualPerformanceTab data={data} />}
        </>
      )}
    </div>
  );
};

const SystemHealthTab = ({ data }: { data: DashboardData }) => (
  <>
    {/* System Health Metrics - Now filtered properly */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
      <MetricCard 
        title="Code Coverage" 
        value={`${data.sonarqube?.coverage || 0}%`} 
        subtitle={`${data.filterLabel || 'All projects'} test coverage`}
        color="#16a34a" 
      />
      <MetricCard 
        title="Code Issues" 
        value={data.sonarqube?.bugs || 0} 
        subtitle={`Bugs in ${data.filterLabel?.toLowerCase() || 'all projects'}`}
        color="#dc2626" 
      />
      
      {/* Firebase metrics only for mobile apps */}
      {data.firebase ? (
        <>
          <MetricCard 
            title="App Health Score" 
            value={data.firebase.score || 'N/A'} 
            subtitle="HealthTrust mobile health"
            color="#f59e0b" 
          />
          <MetricCard 
            title="Crash-Free Rate" 
            value={`${data.firebase.crashlytics?.crashFreeRate || 0}%`} 
            subtitle="Users without crashes" 
            color="#7c3aed" 
          />
        </>
      ) : (
        <>
          <MetricCard 
            title="Vulnerabilities" 
            value={data.sonarqube?.vulnerabilities || 0} 
            subtitle={`Security issues in ${data.filterLabel?.toLowerCase() || 'all projects'}`}
            color="#f59e0b" 
          />
          <MetricCard 
            title="Total Commits" 
            value={data.gitlab?.commits?.total || 0} 
            subtitle={`${data.filterLabel || 'All projects'} - Last 30 days`}
            color="#7c3aed" 
          />
        </>
      )}
    </div>

    {/* Firebase Performance Metrics (Mobile Apps Only) */}
    {data.firebase && (
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', display: 'flex', alignItems: 'center' }}>
          Firebase Performance Metrics - HealthTrust
          <span style={{ 
            background: data.firebase?.isLiveData ? '#16a34a' : '#f59e0b', 
            color: 'white', 
            fontSize: '10px', 
            padding: '4px 8px', 
            borderRadius: '12px', 
            marginLeft: '10px',
            fontWeight: 'normal'
          }}>
            {data.firebase?.isLiveData ? 'Live Data' : 'Demo Data'}
          </span>
        </h3>
        
        {/* Performance Grid */}
        {data.firebase?.performance && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <PerformanceMetric 
              title="App Start Time"
              value={`${data.firebase.performance.appStartTime.average}s`}
              status={data.firebase.performance.appStartTime.average <= 2.0 ? 'excellent' : data.firebase.performance.appStartTime.average <= 3.0 ? 'good' : 'warning'}
              description={`P95: ${data.firebase.performance.appStartTime.p95}s`}
              trend={data.firebase.performance.appStartTime.trend}
            />
            <PerformanceMetric 
              title="Network Latency"
              value={`${data.firebase.performance.networkLatency.average}ms`}
              status={data.firebase.performance.networkLatency.average <= 200 ? 'excellent' : data.firebase.performance.networkLatency.average <= 400 ? 'good' : 'warning'}
              description={`P95: ${data.firebase.performance.networkLatency.p95}ms`}
              trend={data.firebase.performance.networkLatency.trend}
            />
            <PerformanceMetric 
              title="Screen Render"
              value={`${data.firebase.performance.screenRenderTime.average}ms`}
              status={data.firebase.performance.screenRenderTime.average <= 200 ? 'excellent' : data.firebase.performance.screenRenderTime.average <= 400 ? 'good' : 'warning'}
              description={`P95: ${data.firebase.performance.screenRenderTime.p95}ms`}
              trend={data.firebase.performance.screenRenderTime.trend}
            />
            <PerformanceMetric 
              title="API Response"
              value={`${data.firebase.performance.apiResponseTime.average}ms`}
              status={data.firebase.performance.apiResponseTime.average <= 150 ? 'excellent' : data.firebase.performance.apiResponseTime.average <= 300 ? 'good' : 'warning'}
              description={`P95: ${data.firebase.performance.apiResponseTime.p95}ms`}
              trend={data.firebase.performance.apiResponseTime.trend}
            />
          </div>
        )}

        {/* Analytics Grid */}
        {data.firebase?.analytics && (
          <>
            <h4 style={{ margin: '20px 0 15px 0', fontSize: '16px' }}>User Engagement Metrics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <EngagementMetric 
                title="Monthly Active Users"
                value={data.firebase.analytics.activeUsers.monthly.toLocaleString()}
                trend={data.firebase.analytics.activeUsers.trend}
              />
              <EngagementMetric 
                title="Session Duration"
                value={`${data.firebase.analytics.sessionMetrics.averageSessionDuration} min`}
                trend="stable"
              />
              <EngagementMetric 
                title="Sessions/User"
                value={data.firebase.analytics.sessionMetrics.sessionsPerUser}
                trend="stable"
              />
              <EngagementMetric 
                title="Day 7 Retention"
                value={`${data.firebase.analytics.retention.day7}%`}
                trend={data.firebase.analytics.retention.day7 >= 50 ? 'up' : 'warning'}
              />
            </div>
          </>
        )}

        {/* Crashlytics Issues */}
        {data.firebase?.crashlytics?.topCrashes && (
          <>
            <h4 style={{ margin: '20px 0 15px 0', fontSize: '16px' }}>Top Crash Issues</h4>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
              {data.firebase.crashlytics.topCrashes.map((crash, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < data.firebase.crashlytics.topCrashes.length - 1 ? '1px solid #e5e7eb' : 'none'
                }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>{crash.error}</span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: crash.occurrences > 5 ? '#dc2626' : '#f59e0b',
                    fontSize: '14px'
                  }}>
                    {crash.occurrences}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Health Recommendations */}
        {data.firebase?.recommendations && data.firebase.recommendations.length > 0 && (
          <>
            <h4 style={{ margin: '20px 0 15px 0', fontSize: '16px' }}>Health Recommendations</h4>
            <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '6px' }}>
              {data.firebase.recommendations.map((rec, index) => (
                <div key={index} style={{ 
                  fontSize: '14px', 
                  color: '#1e40af',
                  marginBottom: index < data.firebase.recommendations.length - 1 ? '8px' : '0',
                  paddingLeft: '15px',
                  position: 'relative'
                }}>
                  <span style={{ position: 'absolute', left: '0', fontWeight: 'bold' }}>•</span>
                  {rec}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )}

    {/* Code Quality Details */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h4 style={{ margin: '0 0 15px 0' }}>Code Quality - {data.filterLabel}</h4>
        <div>
          <QualityMetricRow label="Test Coverage" value={`${data.sonarqube?.coverage || 0}%`} good={(data.sonarqube?.coverage || 0) >= 80} />
          <QualityMetricRow label="Bugs" value={data.sonarqube?.bugs || 0} good={(data.sonarqube?.bugs || 0) <= 2} />
          <QualityMetricRow label="Vulnerabilities" value={data.sonarqube?.vulnerabilities || 0} good={(data.sonarqube?.vulnerabilities || 0) === 0} />
          <QualityMetricRow label="Maintainability" value={data.sonarqube?.maintainabilityRating || 'B'} good={true} />
        </div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h4 style={{ margin: '0 0 15px 0' }}>Repository Health - {data.filterLabel || 'All Projects'}</h4>
        <div>
          <QualityMetricRow label="Active Projects" value={Object.keys(data.gitlab?.projects || {}).length} good={true} />
          <QualityMetricRow label="Recent MRs" value={data.gitlab?.totalMRs || 0} good={true} />
          <QualityMetricRow label="Merge Success Rate" value={`${Math.round(((data.gitlab?.mergedMRs || 0) / (data.gitlab?.totalMRs || 1)) * 100)}%`} good={true} />
          <QualityMetricRow label="Open MRs" value={data.gitlab?.openMRs || 0} good={(data.gitlab?.openMRs || 0) <= 15} />
        </div>
      </div>
    </div>

    {/* Project Status */}
    <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>
        {data.filterLabel || 'eRecruit Projects'} Status
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
        {data.gitlab?.projects && Object.entries(data.gitlab.projects).map(([projectId, project]: [string, any]) => (
          <ProjectHealthCard 
            key={projectId}
            name={project.display || project.name} 
            description={project.category === 'mobile' ? 'React Native Mobile App' : 'Web Frontend'}
            status="Active"
            lastActivity={new Date(project.lastActivity).toLocaleDateString()}
            health={project.category === 'mobile' ? 'excellent' : 'good'}
            metrics={{
              mrs: `${project.mergedMRs}/${project.totalMRs} MRs`,
              commits: `${project.totalCommits} commits`
            }}
            showFirebase={project.category === 'mobile' && data.firebase}
            firebaseScore={data.firebase?.score}
          />
        ))}
      </div>
    </div>
  </>
);

const TeamPerformanceTab = ({ data }: { data: DashboardData }) => {
  const hasSprintData = data.jira?.currentSprint && data.jira.totalIssues > 0;
  const hasGitLabData = data.gitlab && (data.gitlab.totalMRs > 0 || data.gitlab.commits?.total > 0);
  
  return (
    <>
      {/* No Sprint Warning */}
      {!hasSprintData && (
        <div style={{ 
          background: '#fef3c7', 
          border: '2px solid #f59e0b',
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#92400e', fontSize: '16px' }}>⚠️ No Active Sprints Found</h3>
          <p style={{ margin: '0', color: '#78350f', fontSize: '14px' }}>
            There are no active or future sprints for {data.filterLabel || 'this filter'}. 
            {data.filter === 'mobile' && ' Check if sprints exist on the Maxim Mobile Board (#923) and HWS board (#924).'}
            {data.filter === 'web' && ' Check if sprints exist on the CA board (#922).'}
          </p>
          {hasGitLabData && (
            <p style={{ margin: '10px 0 0 0', color: '#78350f', fontSize: '14px' }}>
              GitLab activity data is still available below.
            </p>
          )}
        </div>
      )}

      {/* Sprint Information Panel */}
      {hasSprintData && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2563eb', fontSize: '18px' }}>
            {data.jira.currentSprint.state === 'active' ? 'Active Sprint' : 'Future Sprint'}: {data.jira.currentSprint.name}
            <span style={{ color: '#666', fontSize: '14px', fontWeight: 'normal' }}>
              ({data.jira.currentSprint.boardName})
            </span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
            <MetricBox 
              title="Days Left" 
              value={data.jira.currentSprint.daysRemaining || 0} 
              color={data.jira.currentSprint.daysRemaining <= 1 ? "#dc2626" : "#ea580c"}
            />
            <MetricBox 
              title="Complete" 
              value={`${data.jira.currentSprint.progressPercentage || 0}%`} 
              color="#16a34a" 
            />
            <MetricBox 
              title="Points Left" 
              value={data.jira.remainingStoryPoints || 0} 
              color="#ea580c" 
            />
            <MetricBox 
              title="Issues" 
              value={`${data.jira.completedIssues}/${data.jira.totalIssues}`} 
              color="#7c3aed" 
            />
          </div>
        </div>
      )}

      {/* Team Performance Metrics - Show GitLab data even without sprints */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {hasSprintData && (
          <>
            <MetricCard 
              title="Sprint Issues" 
              value={data.jira?.totalIssues || 0} 
              subtitle={`${data.jira?.completedIssues || 0} completed`} 
              color="#2563eb" 
            />
            <MetricCard 
              title="Sprint Story Points" 
              value={data.jira?.totalStoryPoints || 0} 
              subtitle={`${data.jira?.completedStoryPoints || 0} completed`} 
              color="#7c3aed" 
            />
          </>
        )}
        {data.jiraDateRange && (data.jiraDateRange.totalIssues > 0 || data.jiraDateRange.totalStoryPoints > 0) && (
          <>
            <MetricCard 
              title={`Team Issues (${data.dateRange?.label || 'Date Range'})`}
              value={data.jiraDateRange.totalIssues} 
              subtitle={`${data.jiraDateRange.completedIssues} completed`} 
              color="#059669" 
            />
            <MetricCard 
              title={`Team Velocity (${data.dateRange?.label || 'Date Range'})`}
              value={data.jiraDateRange.completedStoryPoints} 
              subtitle={`${data.jiraDateRange.totalStoryPoints} total points`} 
              color="#16a34a" 
            />
          </>
        )}
        <MetricCard 
        title="GitLab MRs" 
        value={data.gitlab?.totalMRs || 0} 
        subtitle={`${data.gitlab?.mergedMRs || 0} merged, ${data.gitlab?.openMRs || 0} open (${data.dateRange?.label || 'Last 30 Days'})`} 
        color="#fc6d26" 
        />
        <MetricCard 
        title="Commits" 
        value={data.gitlab?.commits?.total || 0} 
        subtitle={`Across ${Object.keys(data.gitlab?.projects || {}).length} projects (${data.dateRange?.label || 'Last 30 Days'})`} 
        color="#7c3aed" 
        />
        <MetricCard 
          title="Active Contributors" 
          value={data.developers?.length || 0} 
          subtitle={`On ${data.filterLabel || 'All Projects'}`} 
          color="#16a34a" 
        />
      </div>

      {/* Sprint Burndown Chart */}
      {hasSprintData && data.jira?.burndownChart && data.jira.burndownChart.length > 0 && (
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Sprint Burndown Chart</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.jira.burndownChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="day" 
                stroke="#6b7280"
                fontSize={12}
                label={{ value: 'Sprint Day', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                formatter={(value, name) => [
                  typeof value === 'number' ? Math.round(value * 10) / 10 : value, 
                  name === 'idealRemaining' ? 'Ideal Remaining' : 'Actual Remaining'
                ]}
                labelFormatter={(day) => `Sprint Day ${day}`}
              />
              <Line 
                type="monotone" 
                dataKey="idealRemaining" 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#94a3b8', r: 3 }}
                name="Ideal"
              />
              <Line 
                type="monotone" 
                dataKey="actualRemaining" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 4 }}
                name="Actual"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ marginTop: '15px', fontSize: '14px', textAlign: 'center' }}>
          <span style={{ color: '#94a3b8' }}>⋯⋯⋯ Ideal Burndown</span> | 
          <span style={{ color: '#2563eb', marginLeft: '10px' }}> ── Actual Progress</span>
        </div>
      </div>
      )}

      {/* GitLab Activity by Project - Always show if we have data */}
      {hasGitLabData && data.gitlab?.projects && Object.keys(data.gitlab.projects).length > 0 && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Recent Activity by Project ({data.dateRange?.label || 'Last 30 Days'})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            {Object.entries(data.gitlab.projects).map(([projectId, project]: [string, any]) => (
              <div key={projectId} style={{ 
                padding: '15px', 
                background: '#f8fafc', 
                borderRadius: '6px',
                border: '2px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#1f2937' }}>{project.display}</h4>
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '3px 8px', 
                    borderRadius: '10px',
                    background: project.category === 'mobile' ? '#dcfce7' : '#dbeafe',
                    color: project.category === 'mobile' ? '#166534' : '#1e40af',
                    fontWeight: 'bold'
                  }}>
                    {project.category}
                  </span>
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Merge Requests:</span>
                    <span style={{ fontWeight: 'bold' }}>{project.totalMRs}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Merged:</span>
                    <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{project.mergedMRs}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Open:</span>
                    <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{project.openMRs}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Commits:</span>
                    <span style={{ fontWeight: 'bold' }}>{project.totalCommits}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '11px' }}>Last activity:</span>
                    <span style={{ fontSize: '11px' }}>{new Date(project.lastActivity).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const FilterButton = ({ active, onClick, title, subtitle, color }: { 
  active: boolean, 
  onClick: () => void, 
  title: string,
  subtitle: string,
  color: string
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '12px 18px',
      border: `2px solid ${active ? color : '#e5e7eb'}`,
      borderRadius: '8px',
      background: active ? `${color}10` : 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: active ? 'bold' : 'normal',
      color: active ? color : '#6b7280',
      transition: 'all 0.2s',
      minWidth: '140px'
    }}
  >
    <div style={{ fontWeight: 'bold' }}>{title}</div>
    <div style={{ fontSize: '12px', opacity: 0.8 }}>
      {subtitle}
    </div>
  </button>
);

const DateRangeButton = ({ active, onClick, title }: { 
  active: boolean, 
  onClick: () => void, 
  title: string
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 16px',
      border: `2px solid ${active ? '#2563eb' : '#e5e7eb'}`,
      borderRadius: '6px',
      background: active ? '#eff6ff' : 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: active ? 'bold' : 'normal',
      color: active ? '#2563eb' : '#6b7280',
      transition: 'all 0.2s'
    }}
  >
    {title}
  </button>
);

const TabButton = ({ active, onClick, title, subtitle }: { 
  active: boolean, 
  onClick: () => void, 
  title: string,
  subtitle: string 
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '15px 25px',
      border: 'none',
      borderBottom: active ? '3px solid #2563eb' : '3px solid transparent',
      background: active ? '#eff6ff' : 'transparent',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: active ? 'bold' : 'normal',
      color: active ? '#2563eb' : '#6b7280',
      transition: 'all 0.2s',
      borderRadius: '8px 8px 0 0',
      marginBottom: '-3px'
    }}
  >
    <div>{title}</div>
    <div style={{ fontSize: '12px', fontWeight: 'normal', opacity: 0.8 }}>
      {subtitle}
    </div>
  </button>
);

const PerformanceMetric = ({ title, value, status, description, trend }: {
  title: string,
  value: string | number,
  status: 'excellent' | 'good' | 'warning' | 'critical',
  description: string,
  trend: string
}) => {
  const statusColors = {
    excellent: '#16a34a',
    good: '#059669',
    warning: '#f59e0b',
    critical: '#dc2626'
  };

  const trendColors = {
    improving: '#16a34a',
    excellent: '#16a34a',
    stable: '#6b7280',
    declining: '#dc2626'
  };

  return (
    <div style={{ textAlign: 'center', padding: '15px', background: '#f8fafc', borderRadius: '6px', border: `2px solid ${statusColors[status]}20` }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: statusColors[status], marginBottom: '5px' }}>
        {value}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', marginBottom: '3px' }}>
        {title}
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>
        {description}
      </div>
      <div style={{ 
        fontSize: '11px', 
        color: trendColors[trend] || '#6b7280',
        fontWeight: 'bold',
        textTransform: 'capitalize'
      }}>
        {trend}
      </div>
    </div>
  );
};

const EngagementMetric = ({ title, value, trend }: {
  title: string,
  value: string | number,
  trend: string
}) => {
  const trendColors = {
    up: '#16a34a',
    stable: '#6b7280',
    warning: '#f59e0b',
    down: '#dc2626'
  };

  return (
    <div style={{ textAlign: 'center', padding: '12px', background: '#f1f5f9', borderRadius: '6px' }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '3px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: '#374151', marginBottom: '3px' }}>
        {title}
      </div>
      <div style={{ 
        fontSize: '11px', 
        color: trendColors[trend] || '#6b7280',
        fontWeight: 'bold',
        textTransform: 'capitalize'
      }}>
        {trend}
      </div>
    </div>
  );
};

const QualityMetricRow = ({ label, value, good }: { label: string, value: string | number, good: boolean }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6'
  }}>
    <span style={{ color: '#374151' }}>{label}:</span>
    <span style={{ 
      fontWeight: 'bold',
      color: good ? '#16a34a' : '#dc2626'
    }}>
      {value}
    </span>
  </div>
);

const ProjectHealthCard = ({ name, description, status, lastActivity, health, metrics, showFirebase, firebaseScore }: {
  name: string,
  description: string, 
  status: string,
  lastActivity: string,
  health: 'excellent' | 'good' | 'warning' | 'critical',
  metrics?: {
    mrs: string,
    commits: string
  },
  showFirebase?: boolean,
  firebaseScore?: number
}) => {
  const healthColors = {
    excellent: '#16a34a',
    good: '#059669', 
    warning: '#f59e0b',
    critical: '#dc2626'
  };
  
  return (
    <div style={{ 
      padding: '15px', 
      background: '#f8fafc', 
      borderRadius: '6px', 
      border: `2px solid ${healthColors[health]}20`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, color: '#1f2937', fontSize: '14px' }}>{name}</h4>
        <div style={{ 
          width: '10px', 
          height: '10px', 
          borderRadius: '50%', 
          background: healthColors[health] 
        }} />
      </div>
      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280' }}>{description}</p>
      <div style={{ fontSize: '12px' }}>
        <div>Status: <strong style={{ color: healthColors[health] }}>{status}</strong></div>
        <div>Last Activity: <strong>{lastActivity}</strong></div>
        {metrics && (
          <>
            <div>MRs: <strong>{metrics.mrs}</strong></div>
            <div>Commits: <strong>{metrics.commits}</strong></div>
          </>
        )}
        {showFirebase && firebaseScore && (
          <div>Firebase Health: <strong style={{ color: '#f59e0b' }}>{firebaseScore}</strong></div>
        )}
      </div>
    </div>
  );
};

const MetricBox = ({ title, value, color }: { title: string, value: string | number, color: string }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#666' }}>{title}</div>
  </div>
);

const MetricCard = ({ title, value, subtitle, color }: { title: string, value: number | string, subtitle: string, color: string }) => (
  <div style={{ 
    background: 'white', 
    padding: '20px', 
    borderRadius: '8px', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: `3px solid ${color}20`
  }}>
    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{title}</h3>
    <div style={{ fontSize: '32px', fontWeight: 'bold', color, marginBottom: '5px' }}>
      {value}
    </div>
    <div style={{ fontSize: '14px', color: '#666' }}>
      {subtitle}
    </div>
  </div>
);

function IndividualPerformanceTab({ data }: { data: DashboardData }) {
  const hasDevelopers = data && data.developers && data.developers.length > 0;
  const hasGitLabData = data?.gitlab && (data.gitlab.totalMRs > 0 || data.gitlab.commits?.total > 0);

  if (!hasDevelopers && !hasGitLabData) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: '#fef3c7', 
          border: '2px solid #f59e0b',
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#92400e', fontSize: '16px' }}>⚠️ No Developer Data Available</h3>
          <p style={{ margin: '0', color: '#78350f', fontSize: '14px' }}>
            There is no GitLab activity for {data?.filterLabel || 'this filter'} in the last 30 days.
            {data?.filter === 'mobile' && ' Check if there have been any commits or merge requests on mobile projects (Go HWS Mobile, MaxView Jobs).'}
            {data?.filter === 'web' && ' Check if there have been any commits or merge requests on the Portals project.'}
          </p>
        </div>
      </div>
    );
  }

  if (!hasDevelopers) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: '#dbeafe', 
          border: '2px solid #2563eb',
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1e40af', fontSize: '16px' }}>ℹ️ Developer Stats Being Calculated</h3>
          <p style={{ margin: '0', color: '#1e40af', fontSize: '14px' }}>
            GitLab activity detected, but developer statistics are still being aggregated. 
            This may take a moment on the first load.
          </p>
        </div>
      </div>
    );
  }

  // Sort developers by total contributions (descending)
  const sortedDevs = [...data.developers].sort((a, b) => b.totalContributions - a.totalContributions);

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '3px solid #2563eb20' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Total Contributors</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{data.developers.length}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Active on {data.filterLabel || 'All Projects'}</div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '3px solid #fc6d2620' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Total MRs ({data.dateRange?.label || 'Last 30 Days'})</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fc6d26' }}>
            {data.developers.reduce((sum, dev) => sum + dev.totalPRs, 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {data.developers.reduce((sum, dev) => sum + dev.mergedPRs, 0)} merged
          </div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '3px solid #7c3aed20' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Total Commits ({data.dateRange?.label || 'Last 30 Days'})</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed' }}>
            {data.developers.reduce((sum, dev) => sum + dev.totalCommits, 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Across all contributors</div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '3px solid #059669' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Total Story Points ({data.dateRange?.label || 'Last 30 Days'})</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}>
            {data.developers.reduce((sum, dev) => sum + (dev.jiraPoints || 0), 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>From {data.developers.reduce((sum, dev) => sum + (dev.jiraTickets || 0), 0)} tickets</div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: '3px solid #16a34a20' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>Avg Merge Rate</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#16a34a' }}>
            {data.developers.length > 0 
              ? Math.round((data.developers.reduce((sum, dev) => sum + dev.prMergeRate, 0) / data.developers.length) * 100) 
              : 0}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Team average</div>
        </div>
      </div>

      {/* Developer Statistics Table */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#2563eb', fontSize: '18px' }}>Individual Developer Statistics ({data.dateRange?.label || 'Last 30 Days'})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>Developer</th>
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>MRs</th>
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>Merged</th>
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>Commits</th>
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>Jira Tickets</th>
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>Story Points</th>
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>Merge Rate</th>
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>PR Density</th>
                <th style={{ padding: '10px 8px', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>Contributions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDevs.map((dev, idx) => {
                const mergeRate = (dev.prMergeRate * 100).toFixed(0);
                const mergeRateColor = dev.prMergeRate >= 0.8 ? '#16a34a' : dev.prMergeRate >= 0.5 ? '#f59e0b' : '#dc2626';
                
                return (
                  <tr key={dev.gitlabUsername || dev.name} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>{dev.name}</div>
                      {dev.gitlabUsername && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>@{dev.gitlabUsername}</div>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 600 }}>
                      {dev.totalPRs}
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>{dev.mergedPRs}</span>
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 600 }}>
                      {dev.totalCommits}
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 600 }}>
                      {dev.jiraTickets || 0}
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 600 }}>
                      <span style={{ color: '#7c3aed', fontWeight: 'bold' }}>{dev.jiraPoints || 0}</span>
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <div style={{ 
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: `${mergeRateColor}15`,
                        color: mergeRateColor,
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}>
                        {mergeRate}%
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                      {dev.prDensity}
                    </td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{dev.totalContributions}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px' }}>
        <strong>Metrics Explanation ({data.dateRange?.label || 'Last 30 Days'}):</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', lineHeight: '1.8' }}>
          <li><strong>MRs:</strong> Total merge requests created in the selected date range</li>
          <li><strong>Merged:</strong> Number of merge requests that were successfully merged</li>
          <li><strong>Commits:</strong> Total commits pushed to GitLab repositories</li>
          <li><strong>Jira Tickets:</strong> Total Jira issues assigned to developer in sprints within date range</li>
          <li><strong>Story Points:</strong> Total story points from Jira tickets in date range</li>
          <li><strong>Merge Rate:</strong> Percentage of MRs that were merged (Green &ge;80%, Yellow &ge;50%, Red &lt;50%)</li>
          <li><strong>PR Density:</strong> Ratio of merge requests to commits (higher = more organized code reviews)</li>
          <li><strong>Contributions:</strong> Total of MRs + Commits + Jira Tickets</li>
        </ul>
      </div>
    </div>
  );
}

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5001;

const JIRA_HOST = process.env.JIRA_HOST;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_TOKEN = process.env.JIRA_TOKEN;

const GITLAB_URL = process.env.GITLAB_URL;
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

// Validate required configuration
if (!JIRA_HOST || !JIRA_EMAIL || !JIRA_TOKEN) {
  console.error("ERROR: Missing required Jira configuration. Please check your .env file.");
  console.error("Required: JIRA_HOST, JIRA_EMAIL, JIRA_TOKEN");
}

if (!GITLAB_URL || !GITLAB_TOKEN) {
  console.error("ERROR: Missing required GitLab configuration. Please check your .env file.");
  console.error("Required: GITLAB_URL, GITLAB_TOKEN");
}

const jiraHeaders = {
  Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString(
    "base64"
  )}`,
  Accept: "application/json",
};

const gitlabHeaders = {
  Authorization: `Bearer ${GITLAB_TOKEN}`,
  "Content-Type": "application/json",
};

// Firebase service wrapper with error handling
let firebaseService = null;
try {
  firebaseService = require("./services/firebaseService");
  console.log("Firebase service loaded successfully");
} catch (error) {
  console.log("Firebase service not configured - mobile app metrics will be unavailable");
}

// Load project and board definitions from config file
let projectDefinitions = {};
let boardDefinitions = {};

try {
  const configPath = path.join(__dirname, "../../config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    projectDefinitions = config.projects || {};
    boardDefinitions = config.boards || {};
    console.log(`Loaded ${Object.keys(projectDefinitions).length} projects and ${Object.keys(boardDefinitions).length} boards from config.json`);
  } else {
    console.warn("WARNING: config.json not found. Please create it from config.example.json");
    console.warn("The dashboard will not work correctly without project and board definitions.");
  }
} catch (error) {
  console.error("ERROR: Failed to load config.json:", error.message);
  console.error("Please ensure config.json exists and is valid JSON");
}

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3173",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  const configStatus = Object.keys(projectDefinitions).length > 0 && Object.keys(boardDefinitions).length > 0;
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    services: {
      firebase: firebaseService ? 'configured' : 'not available',
      gitlab: GITLAB_TOKEN ? 'configured' : 'not configured',
      jira: JIRA_TOKEN ? 'configured' : 'not configured',
      config: configStatus ? 'loaded' : 'missing'
    },
    configuration: {
      projects: Object.keys(projectDefinitions).length,
      boards: Object.keys(boardDefinitions).length
    }
  });
});

// Debug endpoint to check sprint data
app.get("/api/debug/sprints/:boardId", async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const stateFilter = req.query.state || 'active,future';
    
    console.log(`Debug: Fetching sprints for board ${boardId} with state: ${stateFilter}`);
    
    const response = await axios.get(
      `${JIRA_HOST}/rest/agile/1.0/board/${boardId}/sprint`,
      {
        headers: jiraHeaders,
        params: { state: stateFilter, maxResults: 20 },
      }
    );

    res.json({
      boardId: boardId,
      stateFilter: stateFilter,
      totalSprints: response.data.values.length,
      sprints: response.data.values.map(sprint => ({
        id: sprint.id,
        name: sprint.name,
        state: sprint.state,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        originBoardId: sprint.originBoardId
      }))
    });
  } catch (error) {
    console.error("Debug sprint error:", error.message);
    res.status(500).json({ 
      error: error.message,
      status: error.response?.status,
      details: error.response?.data 
    });
  }
});

// Debug endpoint to list all boards
app.get("/api/debug/boards", async (req, res) => {
  try {
    console.log("Debug: Fetching all boards");
    
    const response = await axios.get(
      `${JIRA_HOST}/rest/agile/1.0/board`,
      {
        headers: jiraHeaders,
        params: { maxResults: 100 },
      }
    );

    res.json({
      totalBoards: response.data.values.length,
      boards: response.data.values.map(board => ({
        id: board.id,
        name: board.name,
        type: board.type,
        location: board.location?.name
      })),
      configuredBoards: Object.keys(boardDefinitions).map(id => ({
        id,
        name: boardDefinitions[id].name
      }))
    });
  } catch (error) {
    console.error("Debug boards error:", error.message);
    res.status(500).json({ 
      error: error.message,
      status: error.response?.status
    });
  }
});

// Get filtered SonarQube-like metrics based on project type
function getFilteredCodeQuality(filter) {
  const codeQualityMetrics = {
    mobile: {
      coverage: 82.3,
      bugs: 1,
      vulnerabilities: 0,
      maintainabilityRating: 'A'
    },
    web: {
      coverage: 74.8,
      bugs: 3,
      vulnerabilities: 2,
      maintainabilityRating: 'B'
    },
    all: {
      coverage: 78.5,
      bugs: 2,
      vulnerabilities: 1,
      maintainabilityRating: 'B'
    }
  };

  return codeQualityMetrics[filter] || codeQualityMetrics.all;
}

// Get Firebase metrics with proper filtering
async function getFilteredFirebaseMetrics(filter) {
  // Only return Firebase data for mobile apps
  if (filter === 'web') {
    return null;
  }

  if (!firebaseService) {
    return filter === 'mobile' ? {
      crashlytics: { crashFreeRate: 99.2, totalCrashes: 5, newCrashes: 1 },
      performance: { appStartTime: { average: 2.3, trend: 'improving' } },
      analytics: { activeUsers: { monthly: 4532 } },
      score: 94,
      recommendations: ['Firebase not configured - showing demo data'],
      isDemo: true
    } : null;
  }

  try {
    console.log(`Fetching Firebase data for ${filter} projects...`);
    return await firebaseService.getAppHealthScore(filter);
  } catch (error) {
    console.error("Firebase error:", error.message);
    return null;
  }
}

// Get all available sprints with filtering
async function getAllAvailableSprints(filter) {
  let boardsToFetch = [];
  
  // Build list of boards to fetch based on filter
  for (const [boardId, boardConfig] of Object.entries(boardDefinitions)) {
    if (filter === 'all' || boardConfig.category === filter) {
      boardsToFetch.push({
        id: boardId,
        name: boardConfig.name
      });
    }
  }

  let allSprints = [];

  for (const board of boardsToFetch) {
    try {
      console.log(`Fetching sprints for board ${board.id} (${board.name})...`);
      
      // Fetch active and future sprints for dropdown
      const activeResponse = await axios.get(
        `${JIRA_HOST}/rest/agile/1.0/board/${board.id}/sprint`,
        {
          headers: jiraHeaders,
          params: { 
            state: 'active,future',
            maxResults: 50
          },
        }
      );
      
      // Also fetch recent closed sprints for velocity calculations
      const closedResponse = await axios.get(
        `${JIRA_HOST}/rest/agile/1.0/board/${board.id}/sprint`,
        {
          headers: jiraHeaders,
          params: { 
            state: 'closed',
            maxResults: 100
          },
        }
      );

      const activeSprints = activeResponse.data.values;
      const closedSprints = closedResponse.data.values;
      const allBoardSprints = [...activeSprints, ...closedSprints];
      
      console.log(`  Found ${activeSprints.length} active/future sprints and ${closedSprints.length} closed sprints for ${board.name}`);
      
      const boardSprints = allBoardSprints.map((sprint) => ({
        ...sprint,
        boardId: board.id,
        boardName: board.name,
        displayName: `${board.name}: ${sprint.name}`,
        category: boardDefinitions[board.id]?.category || 'unknown'
      }));

      allSprints.push(...boardSprints);
    } catch (error) {
      console.error(`ERROR fetching sprints for ${board.name} (${board.id}):`, error.message);
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Details:`, error.response.data);
      }
    }
  }

  return allSprints.sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );
}

// Get data for a specific sprint
async function getSprintData(sprintId, boardId) {
  try {
    const issuesResponse = await axios.get(
      `${JIRA_HOST}/rest/agile/1.0/sprint/${sprintId}/issue`,
      {
        headers: jiraHeaders,
        params: { fields: "summary,status,customfield_10016,assignee", maxResults: 100 },
      }
    );

    const issues = issuesResponse.data.issues;
    const completed = issues.filter(
      (i) => i.fields.status.statusCategory.key === "done"
    );

    const totalPoints = issues.reduce(
      (sum, issue) => sum + (issue.fields.customfield_10016 || 1),
      0
    );
    const completedPoints = completed.reduce(
      (sum, issue) => sum + (issue.fields.customfield_10016 || 1),
      0
    );

    return {
      totalIssues: issues.length,
      completedIssues: completed.length,
      totalStoryPoints: totalPoints,
      completedStoryPoints: completedPoints,
      remainingStoryPoints: totalPoints - completedPoints,
    };
  } catch (error) {
    console.log(`Error fetching sprint ${sprintId} data:`, error.message);
    return {
      totalIssues: 0,
      completedIssues: 0,
      totalStoryPoints: 0,
      completedStoryPoints: 0,
      remainingStoryPoints: 0,
    };
  }
}

// Get filtered GitLab data
async function getFilteredGitLabData(filter, startDate, endDate) {
  let projectsToFetch = [];
  
  // Build list of projects based on filter
  for (const [projectId, projectConfig] of Object.entries(projectDefinitions)) {
    if (filter === 'all' || projectConfig.category === filter) {
      projectsToFetch.push(projectId);
    }
  }

  let totalMRs = 0, totalMerged = 0, totalCommits = 0;
  const projectData = {};

  // Use provided date range or default to 30 days
  const since = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  console.log(`  Fetching GitLab data since: ${since}`);

  for (const projectId of projectsToFetch) {
    try {
      console.log(`    Fetching MRs and commits for project ${projectId} since ${since}`);
      const [projectInfo, mergeRequests, commits] = await Promise.all([
        axios.get(`${GITLAB_URL}/api/v4/projects/${projectId}`, { headers: gitlabHeaders }),
        axios.get(`${GITLAB_URL}/api/v4/projects/${projectId}/merge_requests`, {
          headers: gitlabHeaders,
          params: { state: 'all', updated_after: since, per_page: 100 }
        }),
        axios.get(`${GITLAB_URL}/api/v4/projects/${projectId}/repository/commits`, {
          headers: gitlabHeaders,
          params: { per_page: 100, since }
        })
      ]);

      const mrData = mergeRequests.data;
      const commitData = commits.data;

      totalMRs += mrData.length;
      totalMerged += mrData.filter(mr => mr.state === 'merged').length;
      totalCommits += commitData.length;

      projectData[projectId] = {
        name: projectInfo.data.name,
        display: projectDefinitions[projectId].display,
        category: projectDefinitions[projectId].category,
        totalMRs: mrData.length,
        mergedMRs: mrData.filter(mr => mr.state === 'merged').length,
        openMRs: mrData.filter(mr => mr.state === 'opened').length,
        totalCommits: commitData.length,
        lastActivity: projectInfo.data.last_activity_at
      };

    } catch (error) {
      console.log(`Error fetching GitLab data for project ${projectId}:`, error.message);
    }
  }

  return {
    totalMRs,
    mergedMRs: totalMerged,
    openMRs: totalMRs - totalMerged,
    commits: { total: totalCommits },
    projects: projectData,
    filter: filter
  };
}

// Enhanced dashboard endpoint with proper filtering
app.get("/api/dashboard/overview", async (req, res) => {
  try {
    // Check if configuration is loaded
    if (Object.keys(projectDefinitions).length === 0 || Object.keys(boardDefinitions).length === 0) {
      return res.status(500).json({
        error: "Configuration not loaded",
        message: "Please create config.json from config.example.json and configure your projects and boards"
      });
    }

    const selectedSprintId = req.query.sprintId;
    const filter = req.query.filter || 'all';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    console.log(`\n=== Dashboard request with filter: ${filter} ===`);
    console.log(`Date range params: startDate=${startDate}, endDate=${endDate}`);

    // Get filtered data from all sources
    const [allSprints, gitlabData, firebaseData] = await Promise.all([
      getAllAvailableSprints(filter),
      getFilteredGitLabData(filter, startDate, endDate),
      getFilteredFirebaseMetrics(filter)
    ]);

    // Get filtered code quality metrics
    const codeQuality = getFilteredCodeQuality(filter);

    // Initialize team velocity metrics
    let totalTeamStoryPoints = 0;
    let totalTeamIssues = 0;
    let completedTeamStoryPoints = 0;
    let completedTeamIssues = 0;
    
    // Calculate date range label
    let dateRangeLabel = 'Last 30 Days';
    if (startDate && endDate) {
      const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 35) dateRangeLabel = 'Last 30 Days';
      else if (daysDiff <= 100) dateRangeLabel = 'Last 3 Months';
      else if (daysDiff <= 190) dateRangeLabel = 'Last 6 Months';
      else if (daysDiff <= 370) dateRangeLabel = 'Last Year';
      else dateRangeLabel = 'All Time';
    }

    // Filter available sprints for dropdown - only show active/future
    const availableSprintsForDropdown = allSprints.filter(s => 
      s.state === 'active' || s.state === 'future'
    );
    
    if (availableSprintsForDropdown.length === 0) {
      // Calculate team velocity even without active sprints
      const developerMap = {};
      
      for (const sprint of allSprints) {
        // Skip sprints outside the date range
        if (startDate && endDate && sprint.startDate && sprint.endDate) {
          const sprintStart = new Date(sprint.startDate);
          const sprintEnd = new Date(sprint.endDate);
          const rangeStart = new Date(startDate);
          const rangeEnd = new Date(endDate);
          
          if (sprintStart > rangeEnd || sprintEnd < rangeStart) {
            continue;
          }
        }
        
        try {
          const issuesResponse = await axios.get(
            `${JIRA_HOST}/rest/agile/1.0/sprint/${sprint.id}/issue`,
            {
              headers: jiraHeaders,
              params: { fields: "summary,status,customfield_10016,assignee", maxResults: 100 },
            }
          );

          const issues = issuesResponse.data.issues;
          totalTeamIssues += issues.length;
          const completed = issues.filter(i => i.fields.status.statusCategory.key === 'done');
          completedTeamIssues += completed.length;
          
          issues.forEach(issue => {
            const storyPoints = issue.fields.customfield_10016 || 0;
            const points = typeof storyPoints === 'number' ? storyPoints : 0;
            totalTeamStoryPoints += points;
            if (issue.fields.status.statusCategory.key === 'done') {
              completedTeamStoryPoints += points;
            }
          });
        } catch (error) {
          console.log(`Error fetching issues for sprint ${sprint.id}:`, error.message);
        }
      }
      
      const developers = [];
      
      return res.json({
        gitlab: gitlabData,
        firebase: firebaseData,
        jira: { totalIssues: 0, error: "No active or future sprints available" },
        jiraDateRange: {
          totalIssues: totalTeamIssues,
          completedIssues: completedTeamIssues,
          totalStoryPoints: totalTeamStoryPoints,
          completedStoryPoints: completedTeamStoryPoints,
          remainingStoryPoints: totalTeamStoryPoints - completedTeamStoryPoints,
        },
        developers,
        availableSprints: availableSprintsForDropdown,
        filter: filter,
        filterLabel: getFilterLabel(filter),
        sonarqube: codeQuality,
        message: "No active or future sprints found",
        dateRange: {
          start: startDate,
          end: endDate,
          label: dateRangeLabel
        },
      });
    }

    // Select sprint from available sprints
    let targetSprint;
    if (selectedSprintId) {
      targetSprint = availableSprintsForDropdown.find((s) => s.id === selectedSprintId);
    }
    if (!targetSprint) {
      targetSprint =
        availableSprintsForDropdown.find((s) => s.state === "active") ||
        availableSprintsForDropdown.find((s) => s.state === "future");
    }

    console.log(`Selected sprint: ${targetSprint.displayName}`);

    // Get sprint data
    const sprintMetrics = await getSprintData(targetSprint.id, targetSprint.boardId);

    // Calculate dates
    const today = new Date();
    const sprintStartDate = new Date(targetSprint.startDate);
    const sprintEndDate = new Date(targetSprint.endDate);
    const daysRemaining = Math.max(
      0,
      Math.ceil((sprintEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );
    const totalDays = Math.ceil(
      (sprintEndDate.getTime() - sprintStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Create burndown data
    const burndownData = [];
    for (let day = 0; day <= Math.min(totalDays, 14); day++) {
      const idealRemaining =
        sprintMetrics.totalStoryPoints * (1 - day / totalDays);
      const actualRemaining =
        day === totalDays - daysRemaining
          ? sprintMetrics.remainingStoryPoints
          : null;

      burndownData.push({
        day: day,
        idealRemaining: Math.max(0, idealRemaining),
        actualRemaining: actualRemaining,
      });
    }

    const jiraData = {
      ...sprintMetrics,
      currentSprint: {
        id: targetSprint.id,
        name: targetSprint.name,
        boardName: targetSprint.boardName,
        state: targetSprint.state,
        category: targetSprint.category,
        daysRemaining: daysRemaining,
        progressPercentage:
          sprintMetrics.totalStoryPoints > 0
            ? Math.round(
                (sprintMetrics.completedStoryPoints /
                  sprintMetrics.totalStoryPoints) *
                  100
              )
            : 0,
      },
      burndownChart: burndownData,
    };

    // Developer stats aggregation from GitLab PRs and Jira
    const developerMap = {};
    
    console.log('Aggregating Jira tickets by developer within date range...');
    
    for (const sprint of allSprints) {
      // Skip sprints outside the date range
      if (startDate && endDate && sprint.startDate && sprint.endDate) {
        const sprintStart = new Date(sprint.startDate);
        const sprintEnd = new Date(sprint.endDate);
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(endDate);
        
        if (sprintStart > rangeEnd || sprintEnd < rangeStart) {
          continue;
        }
      }
      
      try {
        const issuesResponse = await axios.get(
          `${JIRA_HOST}/rest/agile/1.0/sprint/${sprint.id}/issue`,
          {
            headers: jiraHeaders,
            params: { fields: "summary,status,customfield_10016,assignee", maxResults: 100 },
          }
        );

        const issues = issuesResponse.data.issues;
        
        // Aggregate team metrics
        totalTeamIssues += issues.length;
        const completed = issues.filter(i => i.fields.status.statusCategory.key === 'done');
        completedTeamIssues += completed.length;
        
        issues.forEach(issue => {
          const storyPoints = issue.fields.customfield_10016 || 0;
          const points = typeof storyPoints === 'number' ? storyPoints : 0;
          totalTeamStoryPoints += points;
          if (issue.fields.status.statusCategory.key === 'done') {
            completedTeamStoryPoints += points;
          }
        });
        
        for (const issue of issues) {
          const assignee = issue.fields.assignee;
          if (!assignee || !assignee.displayName) continue;
          
          const displayName = assignee.displayName;
          const email = assignee.emailAddress || '';
          const username = email ? email.split('@')[0] : displayName;
          
          if (!developerMap[username]) {
            developerMap[username] = {
              name: displayName,
              gitlabUsername: username,
              totalPRs: 0,
              mergedPRs: 0,
              totalCommits: 0,
              jiraTickets: 0,
              jiraPoints: 0,
              prDensity: 0,
              prMergeRate: 0,
              totalContributions: 0
            };
          }
          
          developerMap[username].jiraTickets++;
          const storyPoints = issue.fields.customfield_10016 || 0;
          developerMap[username].jiraPoints += (typeof storyPoints === 'number' ? storyPoints : 0);
        }
      } catch (error) {
        console.log(`Error fetching issues for sprint ${sprint.id}:`, error.message);
      }
    }
    
    // Aggregate GitLab data
    console.log('Aggregating GitLab data by developer...');
    if (gitlabData && gitlabData.projects) {
      for (const projectId of Object.keys(gitlabData.projects)) {
        try {
          const since = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const mrsResp = await axios.get(`${GITLAB_URL}/api/v4/projects/${projectId}/merge_requests`, {
            headers: gitlabHeaders,
            params: { state: 'all', updated_after: since, per_page: 100 }
          });
          const mrs = mrsResp.data;
          
          const commitsResp = await axios.get(`${GITLAB_URL}/api/v4/projects/${projectId}/repository/commits`, {
            headers: gitlabHeaders,
            params: { per_page: 100, since }
          });
          const commits = commitsResp.data;
          
          // Aggregate by MR author
          for (const mr of mrs) {
            if (!mr.author || !mr.author.username) continue;
            const username = mr.author.username;
            if (!developerMap[username]) {
              developerMap[username] = {
                name: mr.author.name || username,
                gitlabUsername: username,
                totalPRs: 0,
                mergedPRs: 0,
                totalCommits: 0,
                jiraTickets: 0,
                jiraPoints: 0,
                prDensity: 0,
                prMergeRate: 0,
                totalContributions: 0
              };
            }
            developerMap[username].totalPRs++;
            if (mr.state === 'merged') developerMap[username].mergedPRs++;
          }
          
          // Aggregate commits
          for (const commit of commits) {
            if (!commit.author_name) continue;
            let username = null;
            if (commit.author_email && commit.author_email.includes('@')) {
              username = commit.author_email.split('@')[0];
            }
            if (!username) username = commit.author_name;
            
            if (!developerMap[username]) {
              developerMap[username] = {
                name: commit.author_name,
                gitlabUsername: username,
                totalPRs: 0,
                mergedPRs: 0,
                totalCommits: 0,
                jiraTickets: 0,
                jiraPoints: 0,
                prDensity: 0,
                prMergeRate: 0,
                totalContributions: 0
              };
            }
            developerMap[username].totalCommits++;
          }
        } catch (err) {
          console.log(`Error aggregating developer stats for project ${projectId}:`, err.message);
        }
      }
    }
    
    // Calculate derived stats
    const developers = Object.values(developerMap)
      .filter(dev => dev.totalPRs > 0 || dev.jiraTickets > 0)
      .map(dev => {
        dev.prDensity = dev.totalCommits > 0 ? (dev.totalPRs / dev.totalCommits).toFixed(2) : 0;
        dev.prMergeRate = dev.totalPRs > 0 ? dev.mergedPRs / dev.totalPRs : 0;
        dev.totalContributions = dev.totalPRs + dev.totalCommits + dev.jiraTickets;
        return dev;
      });

    const filterLabel = getFilterLabel(filter);

    console.log(`Team velocity in date range: ${completedTeamStoryPoints}/${totalTeamStoryPoints} points, ${completedTeamIssues}/${totalTeamIssues} issues`);
    
    res.json({
      gitlab: gitlabData,
      firebase: firebaseData,
      jira: jiraData,
      jiraDateRange: {
        totalIssues: totalTeamIssues,
        completedIssues: completedTeamIssues,
        totalStoryPoints: totalTeamStoryPoints,
        completedStoryPoints: completedTeamStoryPoints,
        remainingStoryPoints: totalTeamStoryPoints - completedTeamStoryPoints,
      },
      developers,
      availableSprints: availableSprintsForDropdown,
      selectedSprint: targetSprint,
      filter: filter,
      filterLabel: filterLabel,
      dateRange: {
        start: startDate,
        end: endDate,
        label: dateRangeLabel
      },
      sonarqube: codeQuality,
      message: `${filterLabel}: Sprint "${targetSprint.name}" on ${targetSprint.boardName} - ${daysRemaining} days remaining${firebaseData ? ' (Firebase: Live Data)' : ''} [GitLab activity: ${dateRangeLabel}]`,
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({ 
      error: "Failed to fetch dashboard data",
      details: error.message
    });
  }
});

// Helper function to get filter label
function getFilterLabel(filter) {
  const labels = {
    'mobile': 'Mobile Projects',
    'web': 'Web Projects',
    'all': 'All Projects'
  };
  return labels[filter] || 'All Projects';
}

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Team Performance Dashboard Backend`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`\nServices:`);
  console.log(`  GitLab: ${GITLAB_TOKEN ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  Jira: ${JIRA_TOKEN ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  Firebase: ${firebaseService ? '✓ Configured' : '✗ Not configured (optional)'}`);
  console.log(`\nConfiguration:`);
  console.log(`  Projects: ${Object.keys(projectDefinitions).length}`);
  console.log(`  Boards: ${Object.keys(boardDefinitions).length}`);
  if (Object.keys(projectDefinitions).length === 0 || Object.keys(boardDefinitions).length === 0) {
    console.log(`\n⚠ WARNING: No projects/boards configured!`);
    console.log(`  Please create config.json from config.example.json`);
  }
  console.log(`${'='.repeat(50)}\n`);
});

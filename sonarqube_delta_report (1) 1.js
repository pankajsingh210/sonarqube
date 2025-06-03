
const SONARQUBE_URL = "http://localhost:3000";
const SONARQUBE_TOKEN = "";
const PROJECT_KEY = "";
let branch1Name = '';
let branch2Name = '';

document.getElementById('fetchBtn').addEventListener('click', async () => {
    branch1Name = document.getElementById('branch1').value;
    branch2Name = document.getElementById('branch2').value;

    if (!branch1Name || !branch2Name) {
        alert('Please enter both branch names.');
        return;
    }

    showLoadingScreen('Fetching issues for Branch 1...');
    const branch1Issues = await fetchIssues(branch1Name);
    showLoadingScreen('Fetching issues for Branch 2...');
    const branch2Issues = await fetchIssues(branch2Name);
    showLoadingScreen('Loading rule names...');
    const ruleNames = await fetchRuleNames();

    hideLoadingScreen();

    generateSummaryReport(branch1Issues, branch2Issues, ruleNames);
    generateDetailedReport(branch1Issues, branch2Issues, ruleNames);
});

function showLoadingScreen(message) {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.innerText = message;
    loadingScreen.style.display = 'block';
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.display = 'none';
}

async function fetchIssues(branch) {
    const response = await fetch(`${SONARQUBE_URL}/proxy?token=${SONARQUBE_TOKEN}&branch=${branch}`);
    const data = await response.json();
    return data.issues;
}

async function fetchRuleNames() {
    const response = await fetch(`${SONARQUBE_URL}/sonarqube_rules.json`);
    const data = await response.json();
    return data;
}

function generateSummaryReport(branch1Issues, branch2Issues, ruleNames) {
    const summaryTable = document.getElementById('summaryTable');
    summaryTable.querySelector('thead').innerHTML = `
        <tr>
            <th>Rule</th>
            <th>${branch1Name}</th>
            <th>${branch2Name}</th>
            <th>Diff</th>
        </tr>
    `;

    const ruleCounts = {};

    branch1Issues.forEach(issue => {
        const rule = issue.rule;
        if (!ruleCounts[rule]) {
            ruleCounts[rule] = { branch1: 0, branch2: 0 };
        }
        ruleCounts[rule].branch1++;
    });

    branch2Issues.forEach(issue => {
        const rule = issue.rule;
        if (!ruleCounts[rule]) {
            ruleCounts[rule] = { branch1: 0, branch2: 0 };
        }
        ruleCounts[rule].branch2++;
    });

    const tbody = summaryTable.querySelector('tbody');
    tbody.innerHTML = '';

    Object.keys(ruleCounts).forEach(rule => {
        const ruleName = ruleNames[rule] || rule;
        const branch1Count = ruleCounts[rule].branch1;
        const branch2Count = ruleCounts[rule].branch2;
        const diff = branch1Count - branch2Count;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ruleName}</td>
            <td>${branch1Count}</td>
            <td>${branch2Count}</td>
            <td>${diff}</td>
        `;
        tbody.appendChild(row);
    });
}

function generateDetailedReport(branch1Issues, branch2Issues, ruleNames) {
    const detailedTable = document.getElementById('detailedTable');
    detailedTable.querySelector('thead').innerHTML = `
        <tr>
            <th>Rule</th>
            <th>Component</th>
            <th>Line</th>
            <th>Severity</th>
            <th>Message</th>
        </tr>
    `;

    const tbody = detailedTable.querySelector('tbody');
    tbody.innerHTML = '';

    const allIssues = [...branch1Issues, ...branch2Issues];

    allIssues.forEach(issue => {
        const ruleName = ruleNames[issue.rule] || issue.rule;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ruleName}</td>
            <td>${issue.component}</td>
            <td>${issue.line}</td>
            <td>${issue.severity}</td>
            <td>${issue.message}</td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('exportSummaryBtn').addEventListener('click', () => {
    exportTableToCSV('summaryTable', 'summary_report.csv');
});

document.getElementById('exportDetailedBtn').addEventListener('click', () => {
    exportTableToCSV('detailedTable', 'detailed_report.csv');
});

function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll('tr');
    const csv = [];

    rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const csvRow = [];
        cols.forEach(col => {
            let data = col.innerText;
            data = data.replace(/"/g, '""'); // Escape double quotes
            csvRow.push(`"${data}"`); // Wrap each field in double quotes
        });
        csv.push(csvRow.join(','));
    });

    const csvString = csv.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

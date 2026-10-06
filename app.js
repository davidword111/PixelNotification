const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
let statusData = {};

app.use(cors());
app.use(express.json());

// Update status
app.post('/api/update-status', (req, res) => {
  const { hostname, status, message, lastUpdate } = req.body;

  if (!hostname) {
    return res.status(400).json({ success: false, error: 'hostname required' });
  }

  statusData[hostname] = {
    status,
    message,
    lastUpdate,
    receivedAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
  };

  console.log(`[${new Date().toLocaleTimeString()}] Updated: ${hostname} - ${status}`);

  res.json({ success: true, message: 'Status updated' });
});

// Get all status
app.get('/api/status', (req, res) => {
  res.json(statusData);
});

// Web Dashboard
app.get('/', (req, res) => {
  const machines = Object.entries(statusData).map(([hostname, data]) => ({
    hostname,
    ...data
  })).sort((a, b) => a.hostname.localeCompare(b.hostname));

  const machineCount = machines.length;
  let running = 0, frozen = 0, loop = 0;

  machines.forEach(m => {
    if (m.status === 'Running') running++;
    else if (m.status === 'Frozen') frozen++;
    else if (m.status === 'Restart Loop') loop++;
  });

  let tableRows = '';
  machines.forEach(m => {
    let statusClass = '';
    let statusBadge = '';
    if (m.status === 'Running') {
      statusClass = 'status-ok';
      statusBadge = '<span class="status-badge ok">RUNNING</span>';
    } else if (m.status === 'Frozen') {
      statusClass = 'status-error';
      statusBadge = '<span class="status-badge error">FROZEN</span>';
    } else if (m.status === 'Restart Loop') {
      statusClass = 'status-warning';
      statusBadge = '<span class="status-badge warning">RESTART LOOP</span>';
    }

    tableRows += `
      <tr class="${statusClass}">
        <td>${m.hostname}</td>
        <td>${statusBadge}</td>
        <td>${m.message || ''}</td>
        <td><span class="timestamp">${m.lastUpdate || ''}</span></td>
      </tr>
    `;
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="5">
    <title>Machine Status Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .header h1 {
            color: #1e3a8a;
            margin-bottom: 15px;
        }

        .stats {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }

        .stat {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        }

        .stat-dot {
            width: 12px;
            height: 12px;
            border-radius: 2px;
        }

        .stat-dot.ok { background: #22c55e; }
        .stat-dot.error { background: #ef4444; }
        .stat-dot.warning { background: #f59e0b; }

        table {
            width: 100%;
            background: white;
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        thead {
            background: #1e3a8a;
            color: white;
            font-weight: 600;
        }

        th {
            padding: 15px;
            text-align: left;
        }

        td {
            padding: 12px 15px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
        }

        tbody tr:hover {
            background: #f9fafb;
        }

        .status-ok { border-left: 4px solid #22c55e; }
        .status-error { background: #fef2f2; border-left: 4px solid #ef4444; }
        .status-warning { background: #fffbeb; border-left: 4px solid #f59e0b; }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-badge.ok {
            background: #d1fae5;
            color: #065f46;
        }

        .status-badge.error {
            background: #fee2e2;
            color: #991b1b;
        }

        .status-badge.warning {
            background: #fef3c7;
            color: #92400e;
        }

        .timestamp {
            color: #999;
            font-size: 12px;
        }

        .footer {
            text-align: center;
            color: white;
            margin-top: 20px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Machine Status Dashboard</h1>
            <div class="stats">
                <div class="stat">
                    <div class="stat-dot ok"></div>
                    <span>Running: <strong>${running}</strong></span>
                </div>
                <div class="stat">
                    <div class="stat-dot error"></div>
                    <span>Frozen: <strong>${frozen}</strong></span>
                </div>
                <div class="stat">
                    <div class="stat-dot warning"></div>
                    <span>Restart Loop: <strong>${loop}</strong></span>
                </div>
                <div class="stat">
                    <span>Total: <strong>${machineCount}</strong></span>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 25%">Hostname</th>
                    <th style="width: 15%">Status</th>
                    <th style="width: 40%">Message</th>
                    <th style="width: 20%">Last Updated</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>

        <div class="footer">
            Auto-refresh every 5 seconds
        </div>
    </div>
</body>
</html>
  `;

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Status Hub running on port ${PORT}`);
});

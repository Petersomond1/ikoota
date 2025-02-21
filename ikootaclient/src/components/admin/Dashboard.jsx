import KeyStats from './KeyStats';
import PendingReports from './PendingReports';
import Analytics from './Analytics';
import React, { useEffect, useState } from 'react';
import api from '../service/api';

const Dashboard = () => {
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      const { data } = await api.get('/admin/audit-logs');
      setAuditLogs(data);
    };
    fetchAuditLogs();
  }, []);
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      
      <KeyStats />
      <Analytics />
      <PendingReports />

      
      <h3>Audit Logs</h3>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Target</th>
            <th>Details</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {auditLogs.map(log => (
            <tr key={log.id}>
              <td>{log.action}</td>
              <td>{log.target_id}</td>
              <td>{log.details}</td>
              <td>{log.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;

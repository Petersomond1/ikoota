import React from 'react';
import KeyStats from './KeyStats';
import PendingReports from './PendingReports';
import Analytics from './Analytics';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <KeyStats />
      <Analytics />
      <PendingReports />
    </div>
  );
};

export default Dashboard;

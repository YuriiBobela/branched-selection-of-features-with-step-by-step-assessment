import React from 'react';
import Sidebar from '../../components/Sidebar';
import UploadAndAnalyzeForm from '../../components/UploadAndAnalyzeForm';

const Dashboard = () => {
  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Панель керування</h1>
        <UploadAndAnalyzeForm onResult={(data) => {
          console.log('Result on dashboard:', data);
        }} />
      </main>
    </div>
  );
};

export default Dashboard;

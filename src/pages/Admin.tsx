import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { Users, Flag, BookOpen, BarChart } from 'lucide-react';

const Admin: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'users' | 'moderation' | 'resources' | 'analytics'>('users');
  
  // Mock data
  const users = [
    { id: '1', name: 'Test User', email: 'test@example.com', groups: 3 },
    { id: '2', name: 'Marie Diop', email: 'marie@example.com', groups: 1 },
    { id: '3', name: 'Jean Ndiaye', email: 'jean@example.com', groups: 2 },
  ];
  
  const reports = [
    { id: 'r1', reportedBy: 'Marie Diop', type: 'message', content: 'Contenu inapproprié', date: '2023-06-01' },
    { id: 'r2', reportedBy: 'Jean Ndiaye', type: 'user', content: 'Comportement suspect', date: '2023-05-28' },
  ];

  return (
    <Layout title={t('admin.title')}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-20">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 font-medium text-center ${activeTab === 'users' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('users')}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={18} />
              <span>{t('admin.users')}</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 font-medium text-center ${activeTab === 'moderation' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('moderation')}
          >
            <div className="flex items-center justify-center gap-2">
              <Flag size={18} />
              <span>{t('admin.moderation')}</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 font-medium text-center ${activeTab === 'resources' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('resources')}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen size={18} />
              <span>{t('admin.resources')}</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 font-medium text-center ${activeTab === 'analytics' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('analytics')}
          >
            <div className="flex items-center justify-center gap-2">
              <BarChart size={18} />
              <span>{t('admin.analytics')}</span>
            </div>
          </button>
        </div>
        
        <div className="p-6">
          {/* User Management */}
          {activeTab === 'users' && (
            <div>
              <h3 className="text-lg font-medium mb-4">{t('admin.userManagement')}</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('welcome.email')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('discussions.groups')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{user.groups}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900 mr-3">
                            {t('common.edit')}
                          </button>
                          <button className="text-error-500 hover:text-error-700">
                            {t('admin.suspend')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Moderation */}
          {activeTab === 'moderation' && (
            <div>
              <h3 className="text-lg font-medium mb-4">{t('admin.reportedContent')}</h3>
              
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{t(`admin.${report.type}Report`)}</p>
                          <p className="text-sm text-gray-500">
                            {t('admin.reportedBy')}: {report.reportedBy}
                          </p>
                          <p className="text-sm text-gray-500">
                            {t('admin.date')}: {report.date}
                          </p>
                        </div>
                        <div className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {t('admin.pending')}
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-gray-50 rounded text-gray-700">
                        {report.content}
                      </div>
                      
                      <div className="mt-4 flex justify-end space-x-3">
                        <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm">
                          {t('admin.ignore')}
                        </button>
                        <button className="px-3 py-1 bg-primary-500 text-white rounded-md text-sm">
                          {t('admin.review')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t('admin.noReports')}
                </div>
              )}
            </div>
          )}
          
          {/* Resources Management */}
          {activeTab === 'resources' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">{t('admin.resourceManagement')}</h3>
                <button className="px-4 py-2 bg-primary-500 text-white rounded-md">
                  {t('admin.addResource')}
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  {t('admin.resourceManagementDescription')}
                </p>
              </div>
            </div>
          )}
          
          {/* Analytics */}
          {activeTab === 'analytics' && (
            <div>
              <h3 className="text-lg font-medium mb-6">{t('admin.usageAnalytics')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-primary-50 border border-primary-100 rounded-lg p-4">
                  <p className="text-sm text-primary-600 font-medium">{t('admin.totalUsers')}</p>
                  <p className="text-2xl font-bold">42</p>
                </div>
                
                <div className="bg-accent-50 border border-accent-100 rounded-lg p-4">
                  <p className="text-sm text-accent-600 font-medium">{t('admin.activeGroups')}</p>
                  <p className="text-2xl font-bold">7</p>
                </div>
                
                <div className="bg-success-50 border border-success-100 rounded-lg p-4">
                  <p className="text-sm text-success-500 font-medium">{t('admin.resources')}</p>
                  <p className="text-2xl font-bold">16</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-4">{t('admin.activityOverTime')}</h4>
                <div className="h-64 flex items-center justify-center bg-gray-50">
                  <p className="text-gray-500">{t('admin.graphPlaceholder')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
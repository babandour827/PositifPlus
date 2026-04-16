import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { useTrackingStore } from '../stores/trackingStore';
import { format, parseISO, subDays } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { PlusCircle, Edit, Trash, BarChart, PieChart, Clock, Calendar, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

const MOOD_COLORS = {
  veryGood: '#10b981',
  good: '#14b8a6',
  neutral: '#6b7280',
  bad: '#f97316',
  veryBad: '#ef4444'
};

const MyTracking: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { 
    moodEntries, 
    medications, 
    addMedication, 
    updateMedication, 
    deleteMedication,
    getMoodDistribution,
    getTodayReminders
  } = useTrackingStore();
  
  const [activeTab, setActiveTab] = useState<'mood' | 'medications' | 'statistics'>('mood');
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<string | null>(null);
  
  // Form state
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('daily');
  const [medTimes, setMedTimes] = useState<string[]>(['08:00']);
  const [medNotes, setMedNotes] = useState('');
  
  const dateLocale = i18n.language === 'fr' ? fr : enUS;
  const todayReminders = getTodayReminders();
  
  // Prepare data for mood trend chart
  const moodTrendData = Array.from({ length: 7 }).map((_, index) => {
    const date = subDays(new Date(), 6 - index);
    const entry = moodEntries.find(e => format(e.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
    return {
      date: format(date, 'dd/MM', { locale: dateLocale }),
      value: entry ? getMoodValue(entry.mood) : null
    };
  });

  // Prepare data for mood distribution pie chart
  const moodDistribution = getMoodDistribution();
  const pieChartData = Object.entries(moodDistribution).map(([mood, count]) => ({
    name: t(`dashboard.moodOptions.${mood}`),
    value: count,
    color: MOOD_COLORS[mood as keyof typeof MOOD_COLORS]
  }));

  // Calculate medication adherence
  const medicationAdherence = calculateMedicationAdherence();

  function getMoodValue(mood: string): number {
    switch (mood) {
      case 'veryGood': return 5;
      case 'good': return 4;
      case 'neutral': return 3;
      case 'bad': return 2;
      case 'veryBad': return 1;
      default: return 3;
    }
  }

  function calculateMedicationAdherence() {
    const total = todayReminders.length;
    const completed = todayReminders.filter(r => r.isCompleted).length;
    return total > 0 ? (completed / total) * 100 : 0;
  }

  const resetForm = () => {
    setMedName('');
    setMedDosage('');
    setMedFrequency('daily');
    setMedTimes(['08:00']);
    setMedNotes('');
    setEditingMedication(null);
  };

  return (
    <Layout title={t('tracking.title')}>
      <div className="mb-20">
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`flex-1 py-4 font-medium text-center transition-colors ${
              activeTab === 'mood' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('mood')}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp size={20} />
              <span>{t('tracking.moodJournal')}</span>
            </div>
          </button>
          <button
            className={`flex-1 py-4 font-medium text-center transition-colors ${
              activeTab === 'medications' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('medications')}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock size={20} />
              <span>{t('tracking.medications')}</span>
            </div>
          </button>
          <button
            className={`flex-1 py-4 font-medium text-center transition-colors ${
              activeTab === 'statistics' 
                ? 'text-primary-600 border-b-2 border-primary-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('statistics')}
          >
            <div className="flex items-center justify-center gap-2">
              <BarChart size={20} />
              <span>{t('tracking.statistics')}</span>
            </div>
          </button>
        </div>
        
        {/* Mood Journal */}
        {activeTab === 'mood' && (
          <div className="space-y-6">
            {/* Mood Trend Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">{t('tracking.moodTrend')}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tickFormatter={(value) => {
                        const moods = ['veryBad', 'bad', 'neutral', 'good', 'veryGood'];
                        return t(`dashboard.moodOptions.${moods[value - 1]}`);
                      }}
                      stroke="#6b7280"
                    />
                    <Tooltip
                      contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                      formatter={(value: any) => {
                        const moods = ['veryBad', 'bad', 'neutral', 'good', 'veryGood'];
                        return t(`dashboard.moodOptions.${moods[value - 1]}`);
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      dot={{ fill: '#14b8a6', strokeWidth: 2 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mood Entries */}
            <div className="grid gap-4">
              {moodEntries.map(entry => (
                <div 
                  key={entry.id} 
                  className="bg-white rounded-xl shadow-sm p-6 transform transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                      <div>
                        <h4 className="font-medium text-lg">
                          {t(`dashboard.moodOptions.${entry.mood}`)}
                        </h4>
                        <p className="text-gray-500">
                          {format(entry.date, 'PPP', { locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {entry.note && (
                    <p className="mt-3 text-gray-700 bg-gray-50 rounded-lg p-3">
                      {entry.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Medications */}
        {activeTab === 'medications' && (
          <div className="space-y-6">
            {/* Today's Reminders */}
            {todayReminders.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('tracking.medicationReminders')}
                </h3>
                <div className="grid gap-3">
                  {todayReminders.map((reminder) => {
                    const medication = medications.find(m => m.id === reminder.medicationId);
                    return (
                      <div 
                        key={reminder.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          reminder.isCompleted 
                            ? 'bg-success-50 border-success-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {reminder.isCompleted ? (
                            <CheckCircle className="text-success-500" size={24} />
                          ) : (
                            <Clock className="text-primary-500" size={24} />
                          )}
                          <div>
                            <h4 className="font-medium">{medication?.name}</h4>
                            <p className="text-sm text-gray-600">
                              {reminder.time} - {medication?.dosage}
                            </p>
                          </div>
                        </div>
                        {!reminder.isCompleted && (
                          <button
                            onClick={() => useTrackingStore.getState().completeReminder(reminder.id)}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                          >
                            {t('tracking.markAsTaken')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add Medication Button */}
            <button
              onClick={() => {
                resetForm();
                setShowMedicationForm(true);
              }}
              className="w-full py-4 bg-white rounded-xl border-2 border-dashed border-gray-300 text-primary-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <PlusCircle size={20} />
              <span>{t('tracking.addMedication')}</span>
            </button>
            
            {/* Medications List */}
            <div className="grid gap-4">
              {medications.map(med => (
                <div 
                  key={med.id} 
                  className="bg-white rounded-xl shadow-sm p-6 transform transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{med.name}</h3>
                      <p className="text-gray-600">{med.dosage}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditMedication(med.id)}
                        className="p-2 text-gray-500 hover:text-primary-600 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteMedication(med.id)}
                        className="p-2 text-gray-500 hover:text-error-600 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {med.time.map((time, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-1 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full text-sm"
                      >
                        <Clock size={14} />
                        <span>{time}</span>
                      </div>
                    ))}
                  </div>
                  
                  {med.notes && (
                    <p className="mt-3 text-gray-700 bg-gray-50 rounded-lg p-3">
                      {med.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Statistics */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            {/* Mood Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-6">
                {t('tracking.moodDistribution')}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {pieChartData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="flex-1">{entry.name}</span>
                      <span className="font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Medication Adherence */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t('tracking.medicationAdherence')}
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {Math.round(medicationAdherence)}%
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={[
                          { value: medicationAdherence },
                          { value: 100 - medicationAdherence }
                        ]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#e5e7eb" />
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-gray-600">
                    {t('tracking.medicationAdherenceDescription')}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle className="text-success-500" size={20} />
                    <span>
                      {todayReminders.filter(r => r.isCompleted).length} / {todayReminders.length} {t('tracking.medicationsCompleted')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Medication Form Modal */}
      {showMedicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-6">
              {editingMedication ? t('tracking.editMedication') : t('tracking.addMedication')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('tracking.medicationName')}
                </label>
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('tracking.dosage')}
                </label>
                <input
                  type="text"
                  value={medDosage}
                  onChange={(e) => setMedDosage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('tracking.frequency')}
                </label>
                <select
                  value={medFrequency}
                  onChange={(e) => setMedFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="daily">{t('tracking.daily')}</option>
                  <option value="weekly">{t('tracking.weekly')}</option>
                  <option value="monthly">{t('tracking.monthly')}</option>
                  <option value="as_needed">{t('tracking.asNeeded')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('tracking.reminders')}
                </label>
                {medTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...medTimes];
                        newTimes[index] = e.target.value;
                        setMedTimes(newTimes);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {medTimes.length > 1 && (
                      <button
                        onClick={() => setMedTimes(medTimes.filter((_, i) => i !== index))}
                        className="p-2 text-gray-500 hover:text-error-600 rounded-full hover:bg-gray-100"
                      >
                        <Trash size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setMedTimes([...medTimes, '12:00'])}
                  className="text-primary-600 text-sm font-medium hover:text-primary-700"
                >
                  + {t('tracking.addTime')}
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('tracking.notes')}
                </label>
                <textarea
                  value={medNotes}
                  onChange={(e) => setMedNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMedicationForm(false)}
                  className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingMedication) {
                      updateMedication(editingMedication, {
                        name: medName,
                        dosage: medDosage,
                        frequency: medFrequency,
                        time: medTimes,
                        notes: medNotes || undefined
                      });
                    } else {
                      addMedication({
                        name: medName,
                        dosage: medDosage,
                        frequency: medFrequency,
                        time: medTimes,
                        startDate: new Date(),
                        notes: medNotes || undefined
                      });
                    }
                    setShowMedicationForm(false);
                    resetForm();
                  }}
                  className="flex-1 py-2 px-4 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingMedication ? t('common.save') : t('common.add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

function getMoodEmoji(mood: string) {
  switch (mood) {
    case 'veryGood': return '😁';
    case 'good': return '🙂';
    case 'neutral': return '😐';
    case 'bad': return '🙁';
    case 'veryBad': return '😢';
    default: return '😐';
  }
}

export default MyTracking;
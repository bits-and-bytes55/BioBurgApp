import React, { useState,useEffect } from 'react';
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiDownload,
  FiClock,
  FiCalendar,
  FiTarget,
  FiCheckCircle,
  FiEdit,
  FiPrinter,
  FiRefreshCw,
  FiBarChart2
} from 'react-icons/fi';
import axios from "axios";
import { toast } from "react-hot-toast";


const MarketingAgentDailyPlan = () => {
const token = localStorage.getItem('agentToken')

  const api = axios.create({
    baseURL: 'https://bioburglifescience-1.onrender.com/api/agent/daily-plan',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [agentName, setAgentName] = useState('');
  const [dailyTarget, setDailyTarget] = useState({
    calls: 0,
    visits: 0,
    conversions: 0,
    revenue: 0
  });

  // Initial tasks data
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState({
    timeSlot: '',
    activity: '',
    location: '',
    target: '',
    notes: ''
  })

  const timeSlots = [
    '8:00 AM - 9:00 AM',
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM',
    '6:00 PM - 7:00 PM'
  ]

  // 🔹 Load plan date-wise
  const fetchPlanByDate = async (selectedDate) => {
    try {
      const res = await api.get(`/${selectedDate}`)
      if (res.data.plan) {
        setAgentName(res.data.plan.agentName || '')
        setDailyTarget(res.data.plan.dailyTarget || dailyTarget)
        setTasks(res.data.plan.tasks || [])
      } else {
        setTasks([])
      }
    } catch (error) {
      console.error(error)
    }
  }

  // 🔹 Save plan to backend
const savePlan = async () => {
  try {
    const planData = {
      date,
      agentName,
      dailyTarget,
      tasks,
    };

    await api.post("/create", planData);

    toast.success("Daily plan saved successfully");
  } catch (error) {
    console.error(error);
    toast.error("Failed to save plan");
  }
};

const updatePlan = async () => {
  try {
    const payload = {
      agentName,
      dailyTarget,
      tasks
    };

    await api.put(`/${date}`, payload);
    toast.success("Plan updated successfully");
  } catch (error) {
    console.error(error);
    toast.error("Update failed");
  }
};

const deletePlan = async () => {
  if (!window.confirm("Are you sure you want to delete this plan?")) return;

  try {
    await api.delete(`/${date}`);

    setAgentName('');
    setDailyTarget({ calls: 0, visits: 0, conversions: 0, revenue: 0 });
    setTasks([]);

    toast.success("Daily plan deleted");
  } catch (error) {
    console.error(error);
    toast.error("Delete failed");
  }
};

 /* ===================== TASK FUNCTIONS ===================== */

  const addTask = () => {
    if (!newTask.timeSlot || !newTask.activity) {
      toast.error('Time slot & activity required')
      return
    }

    setTasks([
      ...tasks,
      { id: Date.now(), ...newTask, status: 'pending' }
    ])

    setNewTask({
      timeSlot: '',
      activity: '',
      location: '',
      target: '',
      notes: ''
    })
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const updateStatus = (id, status) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, status } : t)))
  }

  const updateNotes = (id, notes) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, notes } : t)))
  }

  const calculateProgress = () => {
    const completed = tasks.filter(t => t.status === 'completed').length
    return tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  }

  // Print plan
  const printPlan = () => {
    window.print();
  };

 const exportCSV = () => {
    const headers = ['Time Slot', 'Activity', 'Location', 'Target', 'Status', 'Notes']
    const rows = tasks.map(t =>
      [t.timeSlot, t.activity, t.location, t.target, t.status, t.notes]
        .map(v => `"${v}"`).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daily-plan-${date}.csv`
    a.click()
  }

    /* ===================== EFFECT ===================== */
  useEffect(() => {
    if (token) fetchPlanByDate(date)
  }, [date])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
                  <FiTarget className="text-white" />
                </div>
                Marketing Agent Daily Work Plan
              </h1>
              <p className="text-gray-600">
                Plan and track your daily marketing activities
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <button
                onClick={savePlan}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiSave />
                Save Plan
              </button>
              {/* <button
                onClick={updatePlan}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiSave />
                Update Plan
              </button> */}
              <button
                onClick={printPlan}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiPrinter />
                Print
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Daily Progress</span>
              <span className="text-sm font-bold text-blue-600">{calculateProgress()}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>

          {/* Plan Details Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Plan Date</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FiCalendar className="text-blue-500" />
                    <input
                      type="date"
                      className="text-lg font-bold text-gray-900 bg-transparent border-none focus:outline-none"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Agent Name</p>
                  <input
                    type="text"
                    className="text-lg font-bold text-gray-900 w-full bg-transparent border-none focus:outline-none mt-1"
                    placeholder="Enter your name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{tasks.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FiCheckCircle className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {tasks.filter(t => t.status === 'completed').length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <FiBarChart2 className="text-green-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Daily Targets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiTarget className="text-blue-600" />
              Daily Targets
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calls Target</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={dailyTarget.calls}
                  onChange={(e) => setDailyTarget({...dailyTarget, calls: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visits Target</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={dailyTarget.visits}
                  onChange={(e) => setDailyTarget({...dailyTarget, visits: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conversions Target</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={dailyTarget.conversions}
                  onChange={(e) => setDailyTarget({...dailyTarget, conversions: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Target (₹)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={dailyTarget.revenue}
                  onChange={(e) => setDailyTarget({...dailyTarget, revenue: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add New Task Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={newTask.timeSlot}
                onChange={(e) => setNewTask({...newTask, timeSlot: e.target.value})}
              >
                <option value="">Select Time</option>
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter activity"
                value={newTask.activity}
                onChange={(e) => setNewTask({...newTask, activity: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter location"
                value={newTask.location}
                onChange={(e) => setNewTask({...newTask, location: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter target"
                value={newTask.target}
                onChange={(e) => setNewTask({...newTask, target: e.target.value})}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={addTask}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiPlus />
                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Time Slot
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiClock className="text-gray-400" />
                        <span className="font-medium text-gray-900">{task.timeSlot}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{task.activity}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-700">{task.location}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-blue-700">{task.target}</div>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                        value={task.status}
                        onChange={(e) => updateStatus(task.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        placeholder="Add notes..."
                        value={task.notes}
                        onChange={(e) => updateNotes(task.id, e.target.value)}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={deletePlan}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Task"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Today's Focus</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-700">Complete all scheduled calls</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-700">Follow up with hot leads</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-700">Update CRM with new leads</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Achievements</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-green-700">Completed Tasks</p>
                <p className="text-2xl font-bold text-green-900">
                  {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">Success Rate</p>
                <p className="text-2xl font-bold text-green-900">{calculateProgress()}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <FiDownload />
                Export as CSV
              </button>
              <button
                onClick={() => setTasks([])}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <FiTrash2 />
                Clear All Tasks
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiRefreshCw />
                Reset Form
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Marketing Agent Daily Planner. All activities are tracked and monitored.</p>
        </div>
      </div>
    </div>
  );
};

export default MarketingAgentDailyPlan;
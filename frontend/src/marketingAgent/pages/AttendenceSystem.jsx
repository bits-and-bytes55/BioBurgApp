import React, { useState, useEffect } from 'react';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiUser,
  FiDownload,
  FiFilter,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPrinter,
  FiRefreshCw,
  FiMail,
  FiPhone,
  FiBarChart2,
  FiAlertCircle,
  FiCheckSquare,
  FiUserCheck,
  FiUserX
} from 'react-icons/fi';

const MarketingAgentAttendanceSystem = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Mock agents data
  const [agents, setAgents] = useState([
    {
      id: 1,
      name: 'Rajesh Kumar',
      employeeId: 'MKT001',
      email: 'rajesh@dryclean.com',
      phone: '+91 98765 43210',
      department: 'Field Marketing',
      attendance: [
        { date: '2024-01-01', status: 'present', checkIn: '09:15', checkOut: '18:30', location: 'Office', notes: '' },
        { date: '2024-01-02', status: 'present', checkIn: '09:10', checkOut: '18:45', location: 'Field', notes: '' },
        { date: '2024-01-03', status: 'absent', checkIn: '', checkOut: '', location: '', notes: 'Sick Leave' },
        { date: '2024-01-04', status: 'present', checkIn: '09:05', checkOut: '19:00', location: 'Office', notes: '' },
        { date: '2024-01-05', status: 'leave', checkIn: '', checkOut: '', location: '', notes: 'Personal Leave - Approved' },
      ]
    },
    {
      id: 2,
      name: 'Priya Sharma',
      employeeId: 'MKT002',
      email: 'priya@dryclean.com',
      phone: '+91 98765 43211',
      department: 'Digital Marketing',
      attendance: [
        { date: '2024-01-01', status: 'present', checkIn: '09:00', checkOut: '18:00', location: 'Remote', notes: 'Working from home' },
        { date: '2024-01-02', status: 'present', checkIn: '09:05', checkOut: '18:15', location: 'Remote', notes: '' },
        { date: '2024-01-03', status: 'present', checkIn: '08:55', checkOut: '18:30', location: 'Office', notes: '' },
        { date: '2024-01-04', status: 'absent', checkIn: '', checkOut: '', location: '', notes: 'Unexcused' },
        { date: '2024-01-05', status: 'present', checkIn: '09:10', checkOut: '18:45', location: 'Field', notes: 'Client meeting' },
      ]
    },
    {
      id: 3,
      name: 'Amit Patel',
      employeeId: 'MKT003',
      email: 'amit@dryclean.com',
      phone: '+91 98765 43212',
      department: 'Field Marketing',
      attendance: [
        { date: '2024-01-01', status: 'leave', checkIn: '', checkOut: '', location: '', notes: 'Vacation - Approved' },
        { date: '2024-01-02', status: 'leave', checkIn: '', checkOut: '', location: '', notes: 'Vacation - Approved' },
        { date: '2024-01-03', status: 'present', checkIn: '10:00', checkOut: '19:00', location: 'Office', notes: 'Late arrival - Traffic' },
        { date: '2024-01-04', status: 'present', checkIn: '09:00', checkOut: '18:00', location: 'Field', notes: '' },
        { date: '2024-01-05', status: 'present', checkIn: '09:05', checkOut: '18:20', location: 'Office', notes: '' },
      ]
    },
    {
      id: 4,
      name: 'Sneha Verma',
      employeeId: 'MKT004',
      email: 'sneha@dryclean.com',
      phone: '+91 98765 43213',
      department: 'Corporate Sales',
      attendance: [
        { date: '2024-01-01', status: 'present', checkIn: '09:00', checkOut: '18:00', location: 'Office', notes: '' },
        { date: '2024-01-02', status: 'present', checkIn: '08:45', checkOut: '18:15', location: 'Field', notes: 'Early arrival' },
        { date: '2024-01-03', status: 'present', checkIn: '09:10', checkOut: '18:30', location: 'Client Office', notes: '' },
        { date: '2024-01-04', status: 'present', checkIn: '09:00', checkOut: '18:00', location: 'Office', notes: '' },
        { date: '2024-01-05', status: 'absent', checkIn: '', checkOut: '', location: '', notes: 'Emergency' },
      ]
    },
    {
      id: 5,
      name: 'Vikram Singh',
      employeeId: 'MKT005',
      email: 'vikram@dryclean.com',
      phone: '+91 98765 43214',
      department: 'Digital Marketing',
      attendance: [
        { date: '2024-01-01', status: 'present', checkIn: '09:00', checkOut: '18:00', location: 'Remote', notes: '' },
        { date: '2024-01-02', status: 'present', checkIn: '09:00', checkOut: '18:00', location: 'Remote', notes: '' },
        { date: '2024-01-03', status: 'present', checkIn: '09:00', checkOut: '18:00', location: 'Remote', notes: '' },
        { date: '2024-01-04', status: 'present', checkIn: '09:00', checkOut: '18:00', location: 'Remote', notes: '' },
        { date: '2024-01-05', status: 'present', checkIn: '09:00', checkOut: '18:00', location: 'Remote', notes: '' },
      ]
    }
  ]);

  const [newLeaveRequest, setNewLeaveRequest] = useState({
    agentId: '',
    startDate: '',
    endDate: '',
    leaveType: 'casual',
    reason: '',
    status: 'pending'
  });

  const leaveTypes = [
    { value: 'casual', label: 'Casual Leave', color: 'bg-blue-100 text-blue-800' },
    { value: 'sick', label: 'Sick Leave', color: 'bg-red-100 text-red-800' },
    { value: 'earned', label: 'Earned Leave', color: 'bg-green-100 text-green-800' },
    { value: 'maternity', label: 'Maternity Leave', color: 'bg-purple-100 text-purple-800' },
    { value: 'paternity', label: 'Paternity Leave', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'emergency', label: 'Emergency Leave', color: 'bg-orange-100 text-orange-800' },
  ];

  // Get today's attendance status for each agent
  const getTodaysAttendance = (agent) => {
    const todayRecord = agent.attendance.find(a => a.date === selectedDate);
    return todayRecord || { date: selectedDate, status: 'absent', checkIn: '', checkOut: '', location: '', notes: '' };
  };

  // Update attendance status
  const updateAttendance = (agentId, status, checkIn = '', checkOut = '', location = '', notes = '') => {
    setAgents(prevAgents => 
      prevAgents.map(agent => {
        if (agent.id === agentId) {
          const existingRecord = agent.attendance.find(a => a.date === selectedDate);
          const updatedAttendance = existingRecord 
            ? agent.attendance.map(a => 
                a.date === selectedDate ? { ...a, status, checkIn, checkOut, location, notes } : a
              )
            : [...agent.attendance, { date: selectedDate, status, checkIn, checkOut, location, notes }];
          
          return { ...agent, attendance: updatedAttendance };
        }
        return agent;
      })
    );
  };

  // Mark attendance in bulk
  const markBulkAttendance = (status) => {
    const filteredAgents = agents.filter(agent => {
      const todayAttendance = getTodaysAttendance(agent);
      return todayAttendance.status !== status;
    });

    if (filteredAgents.length === 0) {
      alert(`All agents are already marked as ${status}`);
      return;
    }

    if (window.confirm(`Mark ${filteredAgents.length} agents as ${status}?`)) {
      filteredAgents.forEach(agent => {
        updateAttendance(agent.id, status);
      });
      alert(`${filteredAgents.length} agents marked as ${status}`);
    }
  };

  // Submit leave request
  const submitLeaveRequest = () => {
    if (!newLeaveRequest.agentId || !newLeaveRequest.startDate || !newLeaveRequest.reason) {
      alert('Please fill all required fields');
      return;
    }

    // In real app, this would be an API call
    alert(`Leave request submitted for Agent ID: ${newLeaveRequest.agentId}`);
    
    setNewLeaveRequest({
      agentId: '',
      startDate: '',
      endDate: '',
      leaveType: 'casual',
      reason: '',
      status: 'pending'
    });
  };

  // Approve/Reject leave
  const handleLeaveAction = (agentId, date, action) => {
    setAgents(prevAgents =>
      prevAgents.map(agent => {
        if (agent.id === agentId) {
          const updatedAttendance = agent.attendance.map(a => {
            if (a.date === date && a.status === 'leave') {
              const notes = action === 'approve' 
                ? 'Leave Approved by Manager' 
                : 'Leave Rejected by Manager';
              return { ...a, notes };
            }
            return a;
          });
          return { ...agent, attendance: updatedAttendance };
        }
        return agent;
      })
    );
    
    alert(`Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
  };

  // Calculate statistics
  const calculateStats = () => {
    const today = selectedDate;
    const totalAgents = agents.length;
    const presentCount = agents.filter(agent => {
      const attendance = getTodaysAttendance(agent);
      return attendance.status === 'present';
    }).length;
    
    const absentCount = agents.filter(agent => {
      const attendance = getTodaysAttendance(agent);
      return attendance.status === 'absent';
    }).length;
    
    const leaveCount = agents.filter(agent => {
      const attendance = getTodaysAttendance(agent);
      return attendance.status === 'leave';
    }).length;
    
    const attendanceRate = totalAgents > 0 ? Math.round((presentCount / totalAgents) * 100) : 0;
    
    return { totalAgents, presentCount, absentCount, leaveCount, attendanceRate };
  };

  // Filter agents based on search and status
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const todayAttendance = getTodaysAttendance(agent);
    return matchesSearch && todayAttendance.status === statusFilter;
  });

  const stats = calculateStats();

  // Generate attendance report
  const generateReport = () => {
    const reportData = agents.map(agent => {
      const attendance = getTodaysAttendance(agent);
      return {
        'Employee ID': agent.employeeId,
        'Name': agent.name,
        'Department': agent.department,
        'Status': attendance.status.toUpperCase(),
        'Check In': attendance.checkIn || 'N/A',
        'Check Out': attendance.checkOut || 'N/A',
        'Location': attendance.location || 'N/A',
        'Notes': attendance.notes || 'N/A'
      };
    });

    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${selectedDate}.csv`;
    a.click();
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch(status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg">
                  <FiUserCheck className="text-white" />
                </div>
                Marketing Agent Attendance System
              </h1>
              <p className="text-gray-600">
                Track and manage agent attendance, leaves, and approvals
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <button
                onClick={generateReport}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiDownload />
                Export Report
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiPrinter />
                Print
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Agents</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalAgents}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FiUser className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Present Today</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats.presentCount}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <FiCheckCircle className="text-green-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Absent Today</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {stats.absentCount}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <FiXCircle className="text-red-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">On Leave</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {stats.leaveCount}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <FiClock className="text-yellow-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.attendanceRate}%
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <FiBarChart2 className="text-purple-600 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Date Selection and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Date Selection */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-400" />
                  <input
                    type="date"
                    className="px-4 py-2 border border-gray-300 rounded-lg"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Agents
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or department..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => markBulkAttendance('present')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => markBulkAttendance('absent')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Mark All Absent
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Agent Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Today's Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Check In/Out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Location
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
                {filteredAgents.map((agent) => {
                  const attendance = getTodaysAttendance(agent);
                  const isLeavePending = attendance.status === 'leave' && 
                                         attendance.notes.toLowerCase().includes('pending');
                  
                  return (
                    <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                      {/* Agent Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <span className="font-bold text-blue-700">
                              {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{agent.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>ID: {agent.employeeId}</span>
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                {agent.department}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <FiMail size={12} />
                              <span>{agent.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <select
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusBadge(attendance.status)}`}
                          value={attendance.status}
                          onChange={(e) => updateAttendance(agent.id, e.target.value)}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="leave">On Leave</option>
                        </select>
                        {isLeavePending && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
                            <FiAlertCircle />
                            <span>Pending Approval</span>
                          </div>
                        )}
                      </td>

                      {/* Check In/Out */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Check In:</span>
                            <input
                              type="time"
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                              value={attendance.checkIn}
                              onChange={(e) => updateAttendance(agent.id, attendance.status, e.target.value, attendance.checkOut, attendance.location, attendance.notes)}
                              disabled={attendance.status !== 'present'}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Check Out:</span>
                            <input
                              type="time"
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                              value={attendance.checkOut}
                              onChange={(e) => updateAttendance(agent.id, attendance.status, attendance.checkIn, e.target.value, attendance.location, attendance.notes)}
                              disabled={attendance.status !== 'present'}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <select
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                          value={attendance.location}
                          onChange={(e) => updateAttendance(agent.id, attendance.status, attendance.checkIn, attendance.checkOut, e.target.value, attendance.notes)}
                          disabled={attendance.status !== 'present'}
                        >
                          <option value="">Select Location</option>
                          <option value="Office">Office</option>
                          <option value="Field">Field</option>
                          <option value="Remote">Remote</option>
                          <option value="Client Office">Client Office</option>
                          <option value="Meeting">External Meeting</option>
                        </select>
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4">
                        <textarea
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm resize-none"
                          placeholder="Add notes..."
                          rows="2"
                          value={attendance.notes}
                          onChange={(e) => updateAttendance(agent.id, attendance.status, attendance.checkIn, attendance.checkOut, attendance.location, e.target.value)}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isLeavePending ? (
                            <>
                              <button
                                onClick={() => handleLeaveAction(agent.id, selectedDate, 'approve')}
                                className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleLeaveAction(agent.id, selectedDate, 'reject')}
                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => updateAttendance(agent.id, 'leave', '', '', '', 'Leave Request - Pending')}
                                className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                              >
                                Mark Leave
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Reset attendance for ${agent.name}?`)) {
                                    updateAttendance(agent.id, 'absent', '', '', '', '');
                                  }
                                }}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Reset"
                              >
                                <FiRefreshCw />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leave Request Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FiClock className="text-blue-600" />
            New Leave Request
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Agent *
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                value={newLeaveRequest.agentId}
                onChange={(e) => setNewLeaveRequest({...newLeaveRequest, agentId: e.target.value})}
              >
                <option value="">Select Agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type *
              </label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                value={newLeaveRequest.leaveType}
                onChange={(e) => setNewLeaveRequest({...newLeaveRequest, leaveType: e.target.value})}
              >
                {leaveTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                value={newLeaveRequest.startDate}
                onChange={(e) => setNewLeaveRequest({...newLeaveRequest, startDate: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                value={newLeaveRequest.endDate}
                onChange={(e) => setNewLeaveRequest({...newLeaveRequest, endDate: e.target.value})}
                min={newLeaveRequest.startDate}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <textarea
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none"
                rows="2"
                placeholder="Please provide a reason for leave..."
                value={newLeaveRequest.reason}
                onChange={(e) => setNewLeaveRequest({...newLeaveRequest, reason: e.target.value})}
              />
            </div>

            <div className="md:col-span-2 flex items-end gap-4">
              <button
                onClick={submitLeaveRequest}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors"
              >
                Submit Leave Request
              </button>
              <button
                onClick={() => setNewLeaveRequest({
                  agentId: '',
                  startDate: '',
                  endDate: '',
                  leaveType: 'casual',
                  reason: '',
                  status: 'pending'
                })}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Leave Types Legend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Leave Types Legend</h3>
          <div className="flex flex-wrap gap-2">
            {leaveTypes.map(type => (
              <div
                key={type.value}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${type.color}`}
              >
                {type.label}
              </div>
            ))}
          </div>
        </div>

        {/* Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Attendance Tips</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700">Mark attendance before 10:00 AM</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700">Submit leave requests at least 2 days in advance</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700">Update location for field marketing agents</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-blue-700">Monthly Attendance Rate</span>
                <span className="font-bold text-blue-900">92%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Leave Approval Rate</span>
                <span className="font-bold text-blue-900">85%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Late Arrivals (This Month)</span>
                <span className="font-bold text-blue-900">12</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3">Pending Approvals</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-purple-900">Rajesh Kumar</p>
                  <p className="text-sm text-purple-700">Casual Leave (2 days)</p>
                </div>
                <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                  Review
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-purple-900">Priya Sharma</p>
                  <p className="text-sm text-purple-700">Sick Leave (1 day)</p>
                </div>
                <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                  Review
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Bioburglifescience Pro - Marketing Agent Attendance System</p>
          <p className="mt-1">Attendance data is monitored for performance evaluation</p>
        </div>
      </div>
    </div>
  );
};

export default MarketingAgentAttendanceSystem;
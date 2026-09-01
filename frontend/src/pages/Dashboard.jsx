import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileClock, ShieldCheck, CheckSquare, 
  ArrowUpRight, UserPlus, FileCheck, Award 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import Loading from '../components/Loading';

import { useSession } from '../context/SessionContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { activeSession } = useSession();
  const [stats, setStats] = useState(null);
  const [courseStats, setCourseStats] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    try {
      // 1. Fetch Students
      const studentsRes = await fetch(`/api/students?limit=5&session=${activeSession || ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setRecentStudents(studentsData.students || []);
      }

      // 2. Fetch Stats Summary
      const statsRes = await fetch(`/api/students/stats/summary?session=${activeSession || ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalAdmissions: statsData.total || 0,
          pendingVerifications: statsData.pending || 0,
          approvedStudents: statsData.verified || 0,
          seatsFilled: statsData.allotted || 0
        });
        setCourseStats(statsData.byCourse || []);
      } else {
        // Fallback default stats if 503 or initial DB load
        setStats({
          totalAdmissions: 0,
          pendingVerifications: 0,
          approvedStudents: 0,
          seatsFilled: 0
        });
      }
    } catch (error) {
      console.error('[Dashboard API Error]:', error.message);
      setStats({
        totalAdmissions: 0,
        pendingVerifications: 0,
        approvedStudents: 0,
        seatsFilled: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeSession]);

  if (loading || !stats) {
    return <Loading size="lg" text="Connecting to BJS Rampuria Database & Syncing live statistics..." />;
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 }
  };

  // Custom Tooltip component for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border p-4 rounded-xl shadow-elegant text-xs font-semibold text-warm-900 dark:text-slate-100">
          <p className="font-bold border-b border-warm-100 dark:border-darkbg-border pb-1.5 mb-2 text-warm-900 dark:text-white uppercase tracking-wider">{label}</p>
          <p className="flex justify-between items-center gap-6 py-0.5 text-brand-600 dark:text-brand-300">
            <span>Registered:</span>
            <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col space-y-8 font-sans">
      
      {/* 3 Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI: Total Registered */}
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
          className="classy-card relative overflow-hidden group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-warm-900/60 dark:text-slate-300 uppercase tracking-widest block">Total Registered</span>
              <h3 className="text-3xl font-bold font-serif text-warm-900 dark:text-white leading-none">{stats?.totalAdmissions || 0}</h3>
            </div>
            <div className="p-3 bg-orange-500/10 dark:bg-orange-500/20 rounded-2xl text-orange-600 dark:text-orange-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-warm-800/80 dark:text-slate-300/90">
            <span>Student registrations in database</span>
          </div>
        </motion.div>

        {/* KPI: Pending Checklists */}
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.05 }}
          className="classy-card relative overflow-hidden group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-warm-900/60 dark:text-slate-300 uppercase tracking-widest block">Pending Checklists</span>
              <h3 className="text-3xl font-bold font-serif text-warm-900 dark:text-white leading-none">{stats?.pendingVerifications || 0}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400">
              <FileClock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-warm-800/80 dark:text-slate-300/90">
            <span>Requires document check</span>
          </div>
        </motion.div>

        {/* KPI: Approved Students */}
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.1 }}
          className="classy-card relative overflow-hidden group hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-warm-900/60 dark:text-slate-300 uppercase tracking-widest block">Verified Credentials</span>
              <h3 className="text-3xl font-bold font-serif text-warm-900 dark:text-white leading-none">{stats?.approvedStudents || 0}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-warm-800/80 dark:text-slate-300/90">
            <span>Successfully verified profiles</span>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Graphs & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Course Wise Registrations Bar Chart */}
        <div className="lg:col-span-2 classy-card flex flex-col space-y-6">
          <div>
            <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100 uppercase tracking-wider">Course Wise Registrations</h3>
            <span className="text-xs font-medium text-warm-800/50 dark:text-slate-400">Distribution of registered students across courses</span>
          </div>
          
          <div className="h-72 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={courseStats}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                <XAxis dataKey="code" tickLine={false} />
                <YAxis tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(140, 122, 107, 0.05)' }} />
                <Legend iconType="circle" />
                <Bar name="Registered Applicants" dataKey="applied" fill="#8C7A6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="classy-card flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100 uppercase tracking-wider">Quick ERP Operations</h3>
              <span className="text-xs font-medium text-warm-800/50 dark:text-slate-400">Direct shortcuts to key modules</span>
            </div>

            <div className="flex flex-col space-y-3 mt-4">
              <button 
                onClick={() => navigate('/registration')}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-warm-100/50 dark:hover:bg-darkbg-base/50 text-warm-900 dark:text-slate-200 transition-all text-left border border-warm-200/50 dark:border-darkbg-border group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-brand-500/10 rounded-lg text-brand-600 dark:text-brand-300">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-none">Register Student</h4>
                    <span className="text-[10px] text-warm-800/50 dark:text-slate-500 mt-1.5 inline-block">Create enquiry forms</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-warm-800/40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/verification')}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-warm-100/50 dark:hover:bg-darkbg-base/50 text-warm-900 dark:text-slate-200 transition-all text-left border border-warm-200/50 dark:border-darkbg-border group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-none">Verify Documents</h4>
                    <span className="text-[10px] text-warm-800/50 dark:text-slate-500 mt-1.5 inline-block">Review attachments</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-warm-800/40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Recent Registrations table */}
      <div className="classy-card flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100 uppercase tracking-wider">Recent Registrations</h3>
            <span className="text-xs font-medium text-warm-800/50 dark:text-slate-400">The last five registered students inside the database</span>
          </div>
          <button 
            onClick={() => navigate('/verification')}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300 hover:underline flex items-center space-x-1"
          >
            <span>View Full Registry</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentStudents.length === 0 ? (
          <div className="text-center py-8 text-xs text-warm-800/40 dark:text-slate-500">
            No students registered in the database yet. Click "Register Student" to begin.
          </div>
        ) : (
          <div className="overflow-x-auto w-full rounded-xl border border-warm-200/55 dark:border-darkbg-border">
            <table className="min-w-full divide-y divide-warm-200/40 dark:divide-darkbg-border">
              <thead className="bg-warm-50/50 dark:bg-darkbg-base/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">12th Marks</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Course Applied</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200/20 dark:divide-darkbg-border bg-transparent">
                {recentStudents.map((s) => (
                  <tr key={s._id} className="hover:bg-warm-100/10 dark:hover:bg-darkbg-base/20 transition-all">
                    <td className="px-6 py-4 text-xs font-bold text-warm-900 dark:text-slate-200">{s.fullName}</td>
                    <td className="px-6 py-4 text-xs text-warm-800/60 dark:text-slate-400">{s.gender}</td>
                    <td className="px-6 py-4 text-xs text-warm-800/60 dark:text-slate-400">{s.category}</td>
                    <td className="px-6 py-4 text-xs font-medium text-warm-900 dark:text-slate-300">{s.marks12}%</td>
                    <td className="px-6 py-4 text-xs font-bold text-brand-600 dark:text-brand-300">{s.courseApplied}</td>
                    <td className="px-6 py-4 text-xs">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.verificationStatus === 'Verified' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                          : s.verificationStatus === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}>
                        {s.verificationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

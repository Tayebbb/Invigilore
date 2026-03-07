import { Eye, Activity, AlertCircle, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

const activityLogs = [
  { user: 'Dr. Sarah Johnson', action: 'Approved Exam #2041', time: '2 min ago', status: 'success' },
  { user: 'Prof. Michael Chen', action: 'Submitted Question Set', time: '5 min ago', status: 'pending' },
  { user: 'System Alert', action: 'Unusual access detected', time: '8 min ago', status: 'warning' },
  { user: 'Dr. Emily Watson', action: 'Completed Audit Review', time: '12 min ago', status: 'success' },
];

export function MonitoringPreview() {
  return (
    <section className="relative py-32 bg-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-4">
            <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="text-sm text-blue-400 font-medium">Real-Time Intelligence</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Live Monitoring
            </span>
            {' '}Dashboard
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Track every action, monitor all activities, and maintain complete oversight in real-time.
          </p>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden bg-gray-800 border border-gray-700 shadow-2xl shadow-black/40 p-8">
            {/* Top Stats Bar */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <Eye className="w-8 h-8 text-blue-400" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-blue-400 rounded-full"
                  ></motion.div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">1,247</div>
                <div className="text-sm text-gray-400">Active Viewers</div>
              </div>

              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-emerald-400" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    className="w-2 h-2 bg-emerald-400 rounded-full"
                  ></motion.div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">42</div>
                <div className="text-sm text-gray-400">Ongoing Exams</div>
              </div>

              <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    className="w-2 h-2 bg-amber-400 rounded-full"
                  ></motion.div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">3</div>
                <div className="text-sm text-gray-400">Incidents</div>
              </div>

              <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                    className="w-2 h-2 bg-purple-400 rounded-full"
                  ></motion.div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">98.7%</div>
                <div className="text-sm text-gray-400">Completion</div>
              </div>
            </div>

            {/* Exam Status Timeline */}
            <div className="mb-8 p-6 rounded-xl bg-gray-900/50 border border-gray-700 shadow-sm">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Exam Progress Tracker
              </h3>
              <div className="relative">
                <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '68%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </motion.div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>0%</span>
                  <span className="text-emerald-400 font-semibold">68% Complete</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Access Logs */}
            <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-700 shadow-sm">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Recent Activity Log
              </h3>
              <div className="space-y-3">
                {activityLogs.map((log, index) => {
                  const statusColors = {
                    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                    pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                    warning: 'bg-red-500/10 border-red-500/20 text-red-400',
                  };
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${statusColors[log.status as keyof typeof statusColors]} flex items-center justify-center flex-shrink-0`}>
                          {log.status === 'success' && <CheckCircle className="w-4 h-4" />}
                          {log.status === 'pending' && <Clock className="w-4 h-4" />}
                          {log.status === 'warning' && <AlertCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{log.user}</div>
                          <div className="text-xs text-gray-500">{log.action}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 flex-shrink-0">{log.time}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl opacity-10 blur-2xl -z-10"></div>
        </motion.div>
      </div>
    </section>
  );
}
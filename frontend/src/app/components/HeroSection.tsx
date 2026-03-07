import { ArrowRight, Play, Shield, Lock, Clock, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 bg-gray-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-950"></div>
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      
      {/* Floating Icons */}
      <motion.div
        className="absolute top-32 left-[10%]"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/10">
          <Shield className="w-8 h-8 text-blue-400" />
        </div>
      </motion.div>

      <motion.div
        className="absolute top-48 right-[15%]"
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Lock className="w-7 h-7 text-emerald-400" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-32 left-[20%]"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4.5, repeat: Infinity }}
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/10">
          <Clock className="w-6 h-6 text-blue-400" />
        </div>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-block">
            <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="text-sm text-blue-400 font-medium">Next-Generation Exam Platform</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            <span className="text-white">Secure. </span>
            <span className="text-white">Transparent. </span>
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Invigilore.
            </span>
          </h1>

          <p className="text-xl text-gray-400 leading-relaxed">
            The most advanced digital examination management platform. Monitor exams in real-time, ensure integrity with AI-powered proctoring, and maintain complete audit trails.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button className="group inline-flex items-center gap-3 px-8 py-4 bg-gray-800 border border-gray-700 text-white rounded-xl font-semibold hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer">
              <Play className="w-5 h-5 text-blue-400" />
              Watch Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center gap-8 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">ISO 27001 Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-gray-400">24/7 Monitored</span>
            </div>
          </div>
        </motion.div>

        {/* Right - Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            {/* Dashboard Mockup */}
            <div className="bg-gray-900 p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div>
                  <h3 className="text-white font-semibold">Live Monitoring Dashboard</h3>
                  <p className="text-sm text-gray-500 mt-1">Real-time exam oversight</p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                  <span className="text-sm text-emerald-400 font-medium">3 Active Exams</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Students Online', value: '142', color: 'blue' },
                  { label: 'Submissions', value: '89', color: 'emerald' },
                  { label: 'Flags Raised', value: '3', color: 'amber' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="p-4 rounded-xl bg-gray-800 border border-gray-700"
                  >
                    <div className={`text-2xl font-bold text-${stat.color}-400 mb-1`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Progress Bars */}
              <div className="space-y-3">
                {[
                  { exam: 'Physics Midterm', progress: 75, students: 48 },
                  { exam: 'Math Quiz #3', progress: 45, students: 52 },
                  { exam: 'Chemistry Lab', progress: 90, students: 42 },
                ].map((exam, i) => (
                  <motion.div
                    key={exam.exam}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="p-3 rounded-lg bg-gray-800 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white font-medium">{exam.exam}</span>
                      <span className="text-xs text-gray-500">{exam.students} students</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${exam.progress}%` }}
                        transition={{ delay: 0.8 + i * 0.1, duration: 1 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                      ></motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Audit Summary */}
              <div className="p-4 rounded-xl bg-gray-800 border border-gray-700 shadow-sm">
                <div className="text-sm text-gray-400 mb-2">Audit Trail Status</div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 1.2, duration: 1.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                  ></motion.div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">All systems operational</span>
                  <span className="text-xs text-emerald-400 font-medium">100%</span>
                </div>
              </div>
            </div>

            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl opacity-20 blur-xl -z-10"></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import { BookOpen, FileText, GitBranch, BarChart3, AlertTriangle, FileCheck } from 'lucide-react';
import { motion } from 'motion/react';

const features = [
  {
    icon: BookOpen,
    title: 'Exam & Course Management',
    description: 'Seamlessly organize courses, schedules, and examination workflows.',
    color: 'blue',
  },
  {
    icon: FileText,
    title: 'Secure Question Authoring',
    description: 'Create and store exam questions with encrypted security protocols.',
    color: 'emerald',
  },
  {
    icon: GitBranch,
    title: 'Multi-Step Approval Workflow',
    description: 'Streamlined approval chains with role-based authorization.',
    color: 'blue',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Monitoring Dashboard',
    description: 'Track exam progress and viewer activity in real-time.',
    color: 'emerald',
  },
  {
    icon: AlertTriangle,
    title: 'Incident Reporting System',
    description: 'Automated detection and logging of suspicious activities.',
    color: 'blue',
  },
  {
    icon: FileCheck,
    title: 'Post-Exam Audit Reports',
    description: 'Comprehensive audit trails and compliance documentation.',
    color: 'emerald',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 bg-gray-950">
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
              <span className="text-sm text-blue-400 font-medium">Core Features</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need for{' '}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Secure Examinations
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Comprehensive tools designed for academic integrity and operational excellence.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const glowColor = feature.color === 'blue' ? 'from-blue-500' : 'from-emerald-500';
            const iconBg = feature.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-emerald-500/10 border-emerald-500/20';
            const iconColor = feature.color === 'blue' ? 'text-blue-400' : 'text-emerald-400';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <div className="relative h-full p-8 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 hover:shadow-xl hover:shadow-black/40 transition-all duration-300">
                  {/* Glow Effect on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} to-transparent opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                  
                  {/* Icon */}
                  <div className={`relative w-14 h-14 rounded-xl ${iconBg} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <Icon className={`w-7 h-7 ${iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
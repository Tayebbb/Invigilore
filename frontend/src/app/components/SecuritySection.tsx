import { Shield, Lock, Clock, Database, Key, RefreshCw, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

const securityFeatures = [
  {
    icon: Shield,
    text: 'Role-based access control',
  },
  {
    icon: Clock,
    text: 'Time-limited access windows',
  },
  {
    icon: Database,
    text: 'Encrypted backups',
  },
  {
    icon: CheckCircle,
    text: 'Automated audit trails',
  },
  {
    icon: Key,
    text: 'Emergency recovery links',
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="relative py-32 bg-gradient-to-b from-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            return (
              <section id="security" className="relative py-32 bg-gradient-to-b from-gray-900 to-gray-950">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left - Illustration */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="relative"
                    >
                      <div className="relative">
                        {/* Security Shield Illustration */}
                        <div className="relative w-full aspect-square max-w-md mx-auto">
                          {/* Outer Ring */}
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/30"
                          ></motion.div>

                          {/* Middle Ring */}
                          <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-8 rounded-full border border-emerald-500/30"
                          ></motion.div>

                          {/* Center Shield */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                              <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                                <Shield className="w-20 h-20 text-white" aria-label="Security shield" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Right - Features List */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6 }}
                      className="space-y-8"
                    >
                      <div className="mb-8">
                        <Badge variant="secondary" className="px-4 py-2 text-emerald-400 border-emerald-500/20 bg-emerald-500/10">Security & Compliance</Badge>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">Enterprise-Grade Security</h2>
                        <p className="text-lg text-gray-400 mt-2">All data is encrypted, access is tightly controlled, and every action is logged for full transparency.</p>
                      </div>
                      <ul className="space-y-6">
                        {securityFeatures.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-4">
                            <Badge variant="secondary" className="w-10 h-10 flex items-center justify-center bg-blue-500/10" aria-label={feature.text + ' icon'}>
                              <feature.icon className="w-5 h-5 text-blue-400" />
                            </Badge>
                            <span className="text-base text-white font-medium">{feature.text}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </div>
              </section>
            );
          >
            <div className="inline-block">
              <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-sm text-emerald-400 font-medium">Enterprise Security</span>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Bank-Level{' '}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Security & Compliance
              </span>
            </h2>

            <p className="text-xl text-gray-400 leading-relaxed">
              Your examination data is protected by military-grade encryption, comprehensive access controls, and regular third-party security audits.
            </p>

            {/* Security Features List */}
            <div className="space-y-4">
              {securityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-600 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-300 font-medium">{feature.text}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <div className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700">
                <span className="text-sm text-gray-300 font-medium">ISO 27001 Certified</span>
              </div>
              <div className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700">
                <span className="text-sm text-gray-300 font-medium">SOC 2 Type II</span>
              </div>
              <div className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700">
                <span className="text-sm text-gray-300 font-medium">GDPR Compliant</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
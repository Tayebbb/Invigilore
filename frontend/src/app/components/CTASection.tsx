import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';

export function CTASection() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-gray-950 to-gray-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-emerald-900/10 to-blue-900/20"></div>
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.1) 1px, transparent 0)', backgroundSize: '50px 50px' }}></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="inline-block"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-blue-500/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          {/* Headline */}
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            <span className="text-white">Modernize Your </span>
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              University Examination System
            </span>
            <span className="text-white"> Today</span>
          </h2>

          {/* Subtext */}
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join leading academic institutions in revolutionizing examination management with enterprise-grade security and transparency.
          </p>

          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Button size="lg" className="px-10 py-5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold text-lg flex items-center gap-3 mx-auto cursor-pointer" aria-label="Request Institutional Access">
              Request Institutional Access
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">14-day free trial</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
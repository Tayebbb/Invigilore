import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  X,
  Zap,
  Shield,
  Building2,
  ArrowRight,
  Star,
  Lock,
  BarChart3,
  HeadphonesIcon,
} from 'lucide-react';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    icon: Zap,
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-700',
    monthlyPrice: 9,
    yearlyPrice: 7,
    description: 'Perfect for small institutions running occasional assessments.',
    cta: 'Get Started',
    ctaStyle: 'border border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10',
    popular: false,
    features: [
      { label: 'Up to 200 candidates/exam', included: true },
      { label: '5 exams per month', included: true },
      { label: 'Basic proctoring tools', included: true },
      { label: 'Email support', included: true },
      { label: 'Analytics dashboard', included: false },
      { label: 'AI-powered monitoring', included: false },
      { label: 'Custom branding', included: false },
      { label: 'API access', included: false },
      { label: 'Dedicated account manager', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Shield,
    iconColor: 'text-white',
    iconBg: 'bg-white/20',
    monthlyPrice: 29,
    yearlyPrice: 23,
    description: 'The complete toolkit for institutions that demand reliability and insight.',
    cta: 'Start Free Trial',
    ctaStyle: 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg shadow-blue-500/20',
    popular: true,
    features: [
      { label: 'Up to 2,000 candidates/exam', included: true },
      { label: 'Unlimited exams', included: true },
      { label: 'Advanced proctoring + AI flags', included: true },
      { label: 'Priority email & chat support', included: true },
      { label: 'Full analytics dashboard', included: true },
      { label: 'AI-powered monitoring', included: true },
      { label: 'Custom branding', included: true },
      { label: 'API access', included: false },
      { label: 'Dedicated account manager', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    monthlyPrice: null,
    yearlyPrice: null,
    description: 'Tailored solutions for large universities and government examination bodies.',
    cta: 'Contact Sales',
    ctaStyle: 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',
    popular: false,
    features: [
      { label: 'Unlimited candidates/exam', included: true },
      { label: 'Unlimited exams', included: true },
      { label: 'Full proctoring suite + custom rules', included: true },
      { label: '24/7 dedicated support', included: true },
      { label: 'Advanced analytics & reporting', included: true },
      { label: 'AI-powered monitoring', included: true },
      { label: 'Custom branding & white-label', included: true },
      { label: 'Full API access & webhooks', included: true },
      { label: 'Dedicated account manager', included: true },
    ],
  },
];

const featureHighlights = [
  {
    icon: Lock,
    title: 'Bank-Grade Encryption',
    description: 'End-to-end AES-256 encryption keeps every exam and result completely private.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Monitor live sessions, flag anomalies, and generate instant reports on exam performance.',
  },
  {
    icon: Shield,
    title: 'AI Proctoring',
    description: 'Intelligent face detection, tab-switch alerts, and behaviour analysis — all automated.',
  },
  {
    icon: HeadphonesIcon,
    title: 'World-Class Support',
    description: 'Our expert team is on hand to assist invigilators and admins before, during, and after every exam.',
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="relative py-28 bg-gray-950 overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(59,130,246,0.1) 1px, transparent 0)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Decorative blobs */}
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[480px] h-[480px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
            <Star className="w-3.5 h-3.5 fill-blue-400" />
            Simple, transparent pricing
          </span>

          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Choose the plan that{' '}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              fits your institution
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            No hidden fees. No lock-in contracts. Scale up or down at any time as your examination needs evolve.
          </p>

          {/* ── Toggle ── */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <span className={`text-sm font-medium transition-colors ${!yearly ? 'text-white' : 'text-gray-500'}`}>
              Monthly
            </span>

            <button
              onClick={() => setYearly((v) => !v)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer ${
                yearly ? 'bg-blue-600' : 'bg-gray-700'
              }`}
              aria-label="Toggle billing period"
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md ${yearly ? 'left-8' : 'left-1'}`}
              />
            </button>

            <span className={`text-sm font-medium transition-colors ${yearly ? 'text-white' : 'text-gray-500'}`}>
              Yearly
            </span>

            <AnimatePresence>
              {yearly && (
                <motion.span
                  key="save-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold"
                >
                  Save up to 20%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Plan Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className={`relative flex flex-col rounded-2xl overflow-hidden transition-shadow duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-blue-600 to-blue-700 shadow-2xl shadow-blue-500/30 scale-[1.03] ring-4 ring-blue-400/30'
                    : 'bg-gray-800 border border-gray-700 shadow-sm hover:shadow-lg hover:shadow-black/20'
                }`}
              >
                {/* Most Popular badge */}
                {plan.popular && (
                  <div className="absolute top-0 inset-x-0 flex justify-center">
                    <span className="px-5 py-1 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-xs font-bold tracking-wide rounded-b-xl shadow-md">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className={`p-8 flex flex-col flex-1 ${plan.popular ? 'pt-12' : ''}`}>

                  {/* Icon + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.iconBg}`}>
                      <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                    </div>
                    <h3 className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-white'}`}>
                      {plan.name}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <AnimatePresence mode="wait">
                      {price !== null ? (
                        <motion.div
                          key={`${plan.id}-${yearly}`}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-end gap-1"
                        >
                          <span className={`text-5xl font-extrabold ${plan.popular ? 'text-white' : 'text-white'}`}>
                            ${price}
                          </span>
                          <span className={`mb-2 text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-400'}`}>
                            /mo{yearly && <span className="ml-1 opacity-80">(billed yearly)</span>}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="enterprise-price"
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="text-4xl font-extrabold text-white">Custom</span>
                          <p className="text-sm text-gray-400 mt-1">Volume-based pricing</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Description */}
                  <p className={`text-sm leading-relaxed mb-6 ${plan.popular ? 'text-blue-100' : 'text-gray-400'}`}>
                    {plan.description}
                  </p>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 group mb-8 cursor-pointer hover:scale-[1.02] active:scale-95 ${plan.ctaStyle}`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Divider */}
                  <div className={`border-t mb-6 ${plan.popular ? 'border-white/20' : 'border-gray-700'}`} />

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat.label} className="flex items-start gap-3">
                        {feat.included ? (
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${plan.popular ? 'bg-emerald-400/20' : 'bg-emerald-500/10'}`}>
                            <Check className={`w-3 h-3 ${plan.popular ? 'text-emerald-300' : 'text-emerald-400'}`} />
                          </span>
                        ) : (
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center mt-0.5">
                            <X className="w-3 h-3 text-gray-500" />
                          </span>
                        )}
                        <span
                          className={`text-sm ${
                            feat.included
                              ? plan.popular
                                ? 'text-blue-50'
                                : 'text-gray-300'
                              : 'text-gray-500'
                          }`}
                        >
                          {feat.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Feature Highlight Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-20"
        >
          <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-10">
            Everything you need — across every plan
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureHighlights.map((feat, i) => {
              const FeatIcon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                  className="group bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md hover:shadow-black/20 hover:border-gray-600 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <FeatIcon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-white mb-1.5">{feat.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{feat.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Bottom note ── */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-sm text-gray-500 mt-12"
        >
          All plans include a <span className="text-gray-300 font-medium">14-day free trial</span>. No credit card required.
          Questions?{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300 font-medium">
            Talk to our team
          </a>
          .
        </motion.p>
      </div>
    </section>
  );
}
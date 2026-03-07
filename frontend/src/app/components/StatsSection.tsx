import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect, useRef } from 'react';

const stats = [
  { value: 100, suffix: '+', label: 'Exams Managed', duration: 2 },
  { value: 500, suffix: '+', label: 'Faculty Users', duration: 2.5 },
  { value: 99.9, suffix: '%', label: 'Secure Access', duration: 2 },
  { value: 24, suffix: '/7', label: 'Monitoring', duration: 1.5 },
];

function AnimatedCounter({ value, suffix, duration }: { value: number; suffix: string; duration: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (suffix === '%') {
      return latest.toFixed(1);
    }
    return Math.round(latest);
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const controls = animate(count, value, { duration });
          return () => controls.stop();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [count, value, duration]);

  return (
    <div ref={ref}>
      <motion.span>{rounded}</motion.span>
      <span>{suffix}</span>
    </div>
  );
}

export function StatsSection() {
  return (
    <section className="relative py-24 bg-gray-900">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 to-gray-900"></div>
      
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative text-center"
            >
              <div className="relative p-8 rounded-2xl bg-gray-800 border border-gray-700 hover:border-gray-600 hover:shadow-xl hover:shadow-black/40 transition-all duration-300 group">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
                
                <div className="relative">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-3">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={stat.duration} />
                  </div>
                  <div className="text-gray-400 font-medium">{stat.label}</div>
                </div>

                {/* Animation Indicator */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full"
                ></motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
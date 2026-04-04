import { Shield, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Column 1 - Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Shield className="w-5 h-5 text-white" aria-label="Invigilore logo" />
              </div>
              <span className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Invigilore
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Next-generation digital examination management platform ensuring integrity, accountability, and real-time monitoring for academic institutions.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label="Twitter"
                className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted/80 hover:border-border/80 transition-all duration-200 cursor-pointer"
              >
                <Twitter className="w-4 h-4 text-gray-400" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted/80 hover:border-border/80 transition-all duration-200 cursor-pointer"
              >
                <Linkedin className="w-4 h-4 text-gray-400" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted/80 hover:border-border/80 transition-all duration-200 cursor-pointer"
              >
                <Github className="w-4 h-4 text-gray-400" />
              </a>
              <a
                href="#"
                aria-label="Email"
                className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-muted/80 hover:border-border/80 transition-all duration-200 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>

          {/* Column 2 - Product */}
          <div>
            <h3 className="text-card-foreground font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-card-foreground transition-colors text-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="#security" className="text-muted-foreground hover:text-card-foreground transition-colors text-sm">
                  Security
                </a>
              </li>
              <li>
                <a href="#workflow" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Workflow
                </a>
              </li>
              <li>
                <a href="#monitoring" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Monitoring
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 - Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact
                </a>
              </li>
              <li>
                <a href="#docs" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#support" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 - Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#cookies" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="#compliance" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 Invigilore. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#status" className="hover:text-white transition-colors flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                System Status
              </a>
              <span>•</span>
              <span>ISO 27001 Certified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Heart, Shield, Cpu, ExternalLink, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#174C32] text-white pt-16 pb-12 border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-emerald-800/60">
          
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">AGROVISION</span>
                <span className="block text-[11px] text-emerald-300 uppercase tracking-wider font-semibold">
                  SIH25044 Final Year Project
                </span>
              </div>
            </div>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              AI-Powered Crop Yield Prediction & Optimization System. Empowering Indian farmers through dual-stage machine learning, Sentinel-2 remote sensing, and real-time market intelligence.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Cloud Services Online & Synchronized</span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-200 mb-4">
              Intelligence Engines
            </h4>
            <ul className="space-y-2.5 text-sm text-emerald-100/70">
              <li><Link to="/features" className="hover:text-white transition-colors">Dual-Stage Yield Prediction</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">Crop Disease Detection</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">Sentinel-2 NDVI Monitoring</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">Mandi Price Intelligence</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">Open-Meteo Weather Alerts</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">Multilingual AI Agronomist</Link></li>
            </ul>
          </div>

          {/* Geographic Coverage */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-200 mb-4">
              Supported States
            </h4>
            <ul className="space-y-2 text-sm text-emerald-100/70">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Maharashtra (Nashik, Pune, etc.)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Madhya Pradesh (Malwa, Indore)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Karnataka (Belagavi, Mandya)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Gujarat (Rajkot, Surat)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Punjab (Ludhiana, Patiala)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Uttar Pradesh (Varanasi, Agra)</li>
            </ul>
          </div>

          {/* Reference & Compliance */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-200 mb-4">
              Project Specification
            </h4>
            <p className="text-xs text-emerald-100/80 leading-relaxed mb-4">
              B.Tech Computer Science and Engineering (Data Science) Mega Project. Designed for Smart India Hackathon 2025 under problem statement SIH25044.
            </p>
            <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-800 text-xs text-emerald-200 space-y-1">
              <div className="font-semibold text-white">Data Integrations:</div>
              <div>• data.gov.in & AGMARKNET</div>
              <div>• Open-Meteo & IMD Advisories</div>
              <div>• Sentinel-2 / Google Earth Engine</div>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-200/60 gap-4">
          <div>
            © {new Date().getFullYear()} AGROVISION. All rights reserved. Built for Indian Agriculture.
          </div>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-white transition-colors">Architecture</Link>
            <Link to="/features" className="hover:text-white transition-colors">Documentation</Link>
            <a href="http://127.0.0.1:8000/api/docs/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
              <span>Swagger API Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}

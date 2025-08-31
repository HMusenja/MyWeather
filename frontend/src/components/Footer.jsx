import { Cloud, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-black/20 backdrop-blur-sm border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Cloud className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">MyWeather</h1>
                  <p className="text-sm text-white/70">Live Weather Updates</p>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Get accurate, real-time weather information for any location worldwide. 
                Stay prepared with hourly forecasts, extended outlooks, and severe weather alerts.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Data Attribution */}
            <div>
              <h4 className="font-semibold text-white mb-4">Data Sources</h4>
              <div className="space-y-3">
                <a 
                  href="#" 
                  className="flex items-center space-x-2 text-white/60 hover:text-white text-sm transition-colors group"
                >
                  <span>OpenWeatherMap API</span>
                  <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a 
                  href="#" 
                  className="flex items-center space-x-2 text-white/60 hover:text-white text-sm transition-colors group"
                >
                  <span>Weather Icons</span>
                  <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 mt-8 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-white/40 text-sm">
                © 2024 SkyWeather. All rights reserved.
              </p>
              <p className="text-white/40 text-sm">
                Weather data provided by OpenWeatherMap
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
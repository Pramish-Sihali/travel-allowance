'use client';

import { Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border py-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left side - Company info */}
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} IXI Employee Portal. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Built with modern web technologies for enhanced user experience.
            </p>
          </div>

          {/* Right side - Additional info */}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-red-500 fill-current" />
            <span>by the Development Team</span>
          </div>
        </div>

        {/* Bottom section - Links */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-muted-foreground">
            <a 
              href="/privacy" 
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="/terms" 
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </a>
            <a 
              href="/support" 
              className="hover:text-foreground transition-colors"
            >
              Support
            </a>
            <a 
              href="/contact" 
              className="hover:text-foreground transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
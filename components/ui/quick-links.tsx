import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

interface QuickLink {
  icon: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

interface QuickLinksProps {
  links: QuickLink[];
}

export function QuickLinks({ links }: QuickLinksProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ExternalLink size={18} />
          Quick Links
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {links.map((link, index) => (
            <Button 
              key={index}
              variant="ghost" 
              className="flex items-center justify-start gap-2 w-full p-4 rounded-none h-auto"
              asChild={!!link.href}
              onClick={link.onClick}
            >
              {link.href ? (
                <a href={link.href}>
                  {link.icon}
                  <span>{link.label}</span>
                </a>
              ) : (
                <>
                  {link.icon}
                  <span>{link.label}</span>
                </>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
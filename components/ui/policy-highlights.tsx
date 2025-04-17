import { BookOpen, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PolicyItem {
  id: number;
  text: string;
}

interface PolicyHighlightsProps {
  items: PolicyItem[];
}

export function PolicyHighlights({ items }: PolicyHighlightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen size={18} className="text-primary" />
          Travel Policy Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {items.slice(0, Math.ceil(items.length / 2)).map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-primary">{item.id}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          
          <div className="space-y-3">
            {items.slice(Math.ceil(items.length / 2)).map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-primary">{item.id}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
            
            <Button variant="link" className="text-sm text-primary mt-2 pl-7">
              View Full Policy Document
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
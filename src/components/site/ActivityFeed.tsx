import { Activity } from '@/data/mockData';

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return null;

  return (
    <div className="container mb-6">
      <div className="overflow-hidden rounded-xl glass-card p-3">
        <div className="flex gap-6 animate-marquee">
          {[...activities, ...activities].map((a, i) => (
            <span key={i} className="whitespace-nowrap text-sm text-muted-foreground">
              {a.message}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

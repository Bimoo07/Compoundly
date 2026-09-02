import { useState } from 'react';
import { Map, Eye, Zap, TrendingUp, Bandage, Droplet, PersonStanding, Shield, Mountain, Check } from 'lucide-react';
import SidebarNavItem from './SidebarNavItem';
import InsightCard from './InsightCard';
import Button from './Button';
import Card from './Card';
import Badge from './Badge';
import Toggle from './Toggle';
import PhaseCard from './PhaseCard';

// --- Sidebar example (Journey Map, Awareness, Action, Growth, Recovery) ---
export function SidebarExample({ activePhase, onNavigate }) {
  const items = [
    { key: 'journey', label: 'Journey Map', icon: Map },
    { key: 'awareness', label: 'Awareness', icon: Eye },
    { key: 'action', label: 'Action', icon: Zap },
    { key: 'growth', label: 'Growth', icon: TrendingUp },
    { key: 'recovery', label: 'Recovery', icon: Bandage },
  ];

  return (
    <nav className="flex w-60 flex-col gap-1 bg-navy-950 p-md">
      {items.map((item) => (
        <SidebarNavItem
          key={item.key}
          icon={item.icon}
          label={item.label}
          active={activePhase === item.key}
          onClick={() => onNavigate(item.key)}
        />
      ))}
    </nav>
  );
}

// --- Insights Summary example (Growth phase, 4 cards) ---
export function InsightsSummaryExample() {
  return (
    <div className="grid grid-cols-2 gap-md sm:grid-cols-4">
      <InsightCard icon={Droplet} label="Consistency" description="Flowing steady" accent="teal" />
      <InsightCard icon={PersonStanding} label="Emotional Regulation" description="Finding balance" accent="green" />
      <InsightCard icon={Shield} label="Self-Control" description="Strengthening core" accent="purple" />
      <InsightCard icon={Mountain} label="Facing Challenges" description="Confronting problems" accent="muted" />
    </div>
  );
}

// --- Journey Map example (4 phase cards) ---
export function JourneyMapExample({ activePhase }) {
  const phases = [
    { number: 1, key: 'awareness', icon: Eye, title: 'Awareness', description: 'Understand your current habits and choose a path toward your long-term vision.' },
    { number: 2, key: 'action', icon: Zap, title: 'Action', description: 'Implement a tiny, manageable habit and commit to it for one week.' },
    { number: 3, key: 'growth', icon: TrendingUp, title: 'Growth', description: 'Log qualitative evidence of your progress and identify emerging growth patterns.' },
    { number: 4, key: 'recovery', icon: Bandage, title: 'Recovery', description: 'Reframe setbacks as points of strength and measure your resilience.' },
  ];

  return (
    <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-4">
      {phases.map((phase) => (
        <PhaseCard key={phase.key} phaseNumber={phase.number} {...phase} active={activePhase === phase.key} />
      ))}
    </div>
  );
}

// --- Intention Builder example (Card + Button) ---
export function IntentionBuilderExample() {
  return (
    <Card className="flex flex-col gap-md">
      <h3 className="text-heading text-text-primary">Intention Builder</h3>
      <p className="text-sm text-text-secondary">&ldquo;If [Trigger], then I will [Action].&rdquo;</p>
      {/* form fields would go here */}
      <div className="flex justify-end">
        <Button variant="primary" icon={Check}>Save Experiment</Button>
      </div>
    </Card>
  );
}

// --- Settings row example (Toggle) ---
export function ReminderRowExample() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-text-primary">Daily Reflection</p>
        <p className="text-xs text-text-secondary">Evening check-in on today&apos;s priority habit</p>
      </div>
      <Toggle checked={enabled} onChange={setEnabled} label="Daily Reflection reminder" />
    </div>
  );
}

// --- Tag example (Badge tone="tag") ---
export function JournalTagsExample() {
  return (
    <div className="flex gap-2">
      <Badge tone="tag">#UrgeSurfing</Badge>
      <Badge tone="tag">#Mindfulness</Badge>
    </div>
  );
}

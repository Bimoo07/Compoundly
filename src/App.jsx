import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import Button from './components/Button';
import Card from './components/Card';
import AppShell from './components/AppShell';
import JourneyMapPage from './pages/JourneyMapPage';
import AwarenessPage from './pages/AwarenessPage';
import ActionPage from './pages/ActionPage';
import GrowthPage from './pages/GrowthPage';
import RecoveryPage from './pages/RecoveryPage';
import SettingsPage from './pages/SettingsPage';
import { useAppStore } from './store/useAppStore';

// Maps currentView -> page component. Adding a new screen later is just
// one new entry here, no router config to touch.
const VIEWS = {
  journey: JourneyMapPage,
  awareness: AwarenessPage,
  action: ActionPage,
  growth: GrowthPage,
  recovery: RecoveryPage,
  settings: SettingsPage,
};

export default function App() {
  const hasAcceptedDisclaimer = useAppStore((s) => s.hasAcceptedDisclaimer);
  const acceptDisclaimer = useAppStore((s) => s.acceptDisclaimer);
  const currentView = useAppStore((s) => s.currentView);

  if (!hasAcceptedDisclaimer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950 p-lg">
        <Card className="max-w-md text-center" padding="lg">
          <h1 className="mb-md text-heading text-text-primary">Welcome to Compoundly</h1>
          <p className="mb-lg text-sm text-text-secondary">
            Compoundly is a tool for personal growth and habit formation. It is
            not a diagnostic tool, clinical predictor, or a substitute for
            professional mental health support.
          </p>
          <Button variant="primary" onClick={acceptDisclaimer}>
            I Understand, Let&apos;s Begin
          </Button>
        </Card>
      </div>
    );
  }

  // Fall back to Journey Map for any unrecognized/legacy view value
  // (e.g. persisted state from an earlier version of the app).
  const CurrentPage = VIEWS[currentView] ?? JourneyMapPage;

  return (
    <AppShell>
      {/*
        LayoutGroup scopes shared layoutId elements (the phase icon badges)
        so Motion can track them across page swaps. AnimatePresence is left
        in its default (overlapping) mode — NOT "wait" — so the outgoing and
        incoming page briefly coexist, which is what lets the shared icon
        badge actually morph in place instead of just cross-fading.
      */}
      <LayoutGroup>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <CurrentPage />
          </motion.div>
        </AnimatePresence>
      </LayoutGroup>
    </AppShell>
  );
}

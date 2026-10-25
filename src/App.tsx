import { Icon, type IconName } from './components/Icon';
import { ExerciseDetail } from './screens/ExerciseDetail';
import { History, SessionDetail } from './screens/History';
import { Library } from './screens/Library';
import { Me } from './screens/Me';
import { Onboarding } from './screens/Onboarding';
import { Plan } from './screens/Plan';
import { Player } from './screens/Player';
import { Summary } from './screens/Summary';
import { Today } from './screens/Today';
import { WarmUp } from './screens/WarmUp';
import { useNav, type Tab } from './state/nav';
import { useStore } from './state/store';

const TABS: { tab: Tab; label: string; icon: IconName }[] = [
  { tab: 'today', label: 'Today', icon: 'today' },
  { tab: 'plan', label: 'Plan', icon: 'plan' },
  { tab: 'library', label: 'Library', icon: 'library' },
  { tab: 'history', label: 'History', icon: 'history' },
  { tab: 'me', label: 'Me', icon: 'me' },
];

function TabBar({ current }: { current: Tab }) {
  const nav = useNav();
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <button
          key={t.tab}
          type="button"
          className={`tab ${t.tab === current ? 'tab-on' : ''}`}
          aria-current={t.tab === current ? 'page' : undefined}
          onClick={() => nav.tab(t.tab)}
        >
          <Icon name={t.icon} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function App() {
  const { data, saveFailed } = useStore();
  const { route } = useNav();

  if (!data.disclaimerAccepted || !data.profile || !data.program) return <Onboarding mode="first" />;

  const banner = saveFailed && (
    <div className="banner" role="alert">
      Couldn't save to this device's storage. Export a backup from Me before closing.
    </div>
  );

  let screen;
  switch (route.name) {
    case 'player':
      screen = data.active ? <Player /> : <Today />;
      break;
    case 'warmup':
      return <WarmUp />;
    case 'summary':
      return <Summary id={route.id} />;
    case 'exercise':
      return <ExerciseDetail id={route.id} />;
    case 'session':
      return <SessionDetail id={route.id} />;
    case 'setup':
      return <Onboarding mode="edit" />;
    case 'tab':
      screen = { today: <Today />, plan: <Plan />, library: <Library />, history: <History />, me: <Me /> }[route.tab];
      return (
        <div className="app">
          {banner}
          <main className="screen">{screen}</main>
          <TabBar current={route.tab} />
        </div>
      );
  }
  return (
    <div className="app">
      {banner}
      {screen}
    </div>
  );
}

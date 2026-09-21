import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import {
  Activity, AlertCircle, Bell, BellRing, CheckCircle2, ChevronRight, CircleHelp, HeartPulse,
  KeyRound, Lightbulb, LockKeyhole, Menu, MessageCircle, MoreHorizontal, Phone, RefreshCw,
  ShieldCheck, SlidersHorizontal, Sparkles, Thermometer, UsersRound, Watch, Wifi, X, Zap
} from 'lucide-react';
import {
  getGetConsentsQueryKey, getGetVitalsQueryKey,
  getListAlertsQueryKey, useEscalateEmergency, useGetCareTeam, useGetConsents,
  useGetDashboard, useGetModelInsights, useGetSession, useGetVitals, useListAlerts,
  useListDevices, useStartDemoSession, useSyncDevice, useUpdateAlert, useUpdateConsents
} from '@workspace/api-client-react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import './index.css';

const queryClient = new QueryClient();

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Activity },
  { href: '/vitals', label: 'Vitals', icon: HeartPulse },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/care', label: 'Care team', icon: UsersRound },
  { href: '/insights', label: 'Insights', icon: Lightbulb },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 focus-ring" data-testid="link-logo">
      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-sm">
        <HeartPulse size={20} strokeWidth={2.4} />
      </span>
      {!compact && <span className="text-[17px] font-semibold tracking-[-.03em]">pulseguard</span>}
    </Link>
  );
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-label="Loading" data-testid="loading-skeleton" />;
}

function StatusPill({ label, tone = 'mint' }: { label: string; tone?: 'mint' | 'coral' | 'amber' | 'slate' }) {
  const tones = {
    mint: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
    coral: 'bg-[hsl(var(--accent)/.13)] text-[hsl(var(--accent))]',
    amber: 'bg-[#f4e9c9] text-[#755b23]',
    slate: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`} data-testid={`status-${label.toLowerCase().replaceAll(' ', '-')}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{label}
  </span>;
}

function ErrorState({ label = 'We could not load this right now.', retry }: { label?: string; retry?: () => void }) {
  return <div className="surface flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center" data-testid="state-error">
    <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]"><AlertCircle size={21} /></span>
    <p className="font-semibold">{label}</p>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">Your care data is still safe. Try again in a moment.</p>
    {retry && <button onClick={retry} className="focus-ring mt-5 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover-elevate" data-testid="button-retry">Try again</button>}
  </div>;
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof Activity; title: string; body: string }) {
  return <div className="surface flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center" data-testid="state-empty">
    <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Icon size={22} /></span>
    <h3 className="font-display text-xl">{title}</h3>
    <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{body}</p>
  </div>;
}

function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (value: boolean) => void }) {
  const [location] = useLocation();
  const { data: session } = useGetSession({ query: { queryKey: ['/api/session'], staleTime: 60_000 } });
  const user = session?.user;
  return <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] transition-transform duration-300 md:static md:translate-x-0`} data-testid="sidebar">
    <div className="flex items-center justify-between"><Logo /><button className="rounded-lg p-2 text-[hsl(var(--sidebar-foreground)/.7)] md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X size={18} /></button></div>
    <div className="mt-12 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--sidebar-foreground)/.42)]">Your health</div>
    <nav className="mt-3 space-y-1" aria-label="Primary navigation">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = location === href;
        return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-link flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium focus-ring ${active ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.66)] hover:bg-[hsl(var(--sidebar-accent)/.7)] hover:text-[hsl(var(--sidebar-foreground))]'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
          <span className="flex items-center gap-3"><Icon size={18} strokeWidth={active ? 2.2 : 1.8} />{label}</span>{label === 'Alerts' && <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />}
        </Link>;
      })}
    </nav>
    <div className="mt-auto">
      <Link href="/settings" className={`nav-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${location === '/settings' ? 'bg-[hsl(var(--sidebar-accent))]' : 'text-[hsl(var(--sidebar-foreground)/.66)] hover:bg-[hsl(var(--sidebar-accent)/.7)]'}`} data-testid="link-nav-settings"><SlidersHorizontal size={18} />Settings</Link>
      <div className="mt-6 border-t border-[hsl(var(--sidebar-border))] pt-5">
        <div className="flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--sidebar-primary)/.22)] text-xs font-bold text-[hsl(var(--sidebar-primary))]" data-testid="text-sidebar-initials">{user?.initials ?? 'AM'}</span><div className="min-w-0"><p className="truncate text-sm font-semibold" data-testid="text-sidebar-user">{user?.name ?? 'Alex Morgan'}</p><p className="text-xs text-[hsl(var(--sidebar-foreground)/.5)]">Sample session</p></div><MoreHorizontal size={17} className="ml-auto text-[hsl(var(--sidebar-foreground)/.45)]" /></div>
      </div>
    </div>
  </aside>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const titles: Record<string, string> = { '/dashboard': 'Overview', '/vitals': 'Vitals', '/alerts': 'Alerts', '/care': 'Care team', '/insights': 'Insights', '/settings': 'Settings' };
  return <div className="app-grain flex min-h-[100dvh] bg-background">
    <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
    {mobileOpen && <button className="fixed inset-0 z-30 bg-[hsl(var(--primary)/.3)] md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-overlay" />}
    <main className="min-w-0 flex-1">
      <header className="flex h-[78px] items-center justify-between border-b border-border/70 px-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover-elevate md:hidden" data-testid="button-open-menu"><Menu size={21} /></button><span className="text-sm font-medium text-muted-foreground">{titles[location] ?? 'PulseGuard'}</span></div>
        <div className="flex items-center gap-2 sm:gap-4"><div className="hidden items-center gap-2 rounded-full bg-[hsl(var(--secondary)/.55)] px-3 py-2 text-xs font-medium text-[hsl(var(--secondary-foreground))] sm:flex"><span className="h-2 w-2 animate-pulse-soft rounded-full bg-[#4b9e8e]" />Monitoring active</div><Link href="/settings" className="focus-ring grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-[hsl(var(--primary-foreground))]" data-testid="link-header-profile">MC</Link></div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</div>
    </main>
  </div>;
}

function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end animate-rise"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">{eyebrow}</p><h1 className="font-display mt-2 text-[clamp(2rem,4vw,3.25rem)] leading-[.98] tracking-[-.04em]" data-testid="text-page-title">{title}</h1></div>{children}</div>;
}

function MetricCard({ label, value, unit, detail, icon: Icon, tone = 'mint' }: { label: string; value: string | number; unit?: string; detail: string; icon: typeof Activity; tone?: 'mint' | 'coral' | 'amber' }) {
  const bg = tone === 'coral' ? 'bg-[hsl(var(--accent)/.1)]' : tone === 'amber' ? 'bg-[#f4e9c9]' : 'bg-[hsl(var(--secondary)/.65)]';
  const fg = tone === 'coral' ? 'text-[hsl(var(--accent))]' : tone === 'amber' ? 'text-[#755b23]' : 'text-[hsl(var(--primary))]';
  return <div className="surface rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5" data-testid={`card-metric-${label.toLowerCase().replaceAll(' ', '-')}`}><div className="flex items-start justify-between"><span className={`grid h-9 w-9 place-items-center rounded-xl ${bg} ${fg}`}><Icon size={18} /></span><span className="text-xs text-muted-foreground">{detail}</span></div><div className="mt-7 flex items-baseline gap-1"><span className="font-display text-[2.45rem] leading-none tracking-[-.05em]" data-testid={`text-value-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>{unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}</div><p className="mt-2 text-sm font-medium text-muted-foreground">{label}</p></div>;
}

function SessionPage() {
  const [, setLocation] = useLocation();
  const { data: session, isLoading, isError, refetch } = useGetSession({ query: { queryKey: ['/api/session'], retry: false } });
  const startSession = useStartDemoSession();
  const patient = session?.user;
  const begin = () => startSession.mutate(undefined, { onSuccess: () => setLocation('/dashboard') });
  useEffect(() => {
    if (session?.authenticated) setLocation('/dashboard');
  }, [session?.authenticated, setLocation]);
  if (isLoading) return <div className="grid min-h-[100dvh] place-items-center bg-[hsl(var(--sidebar))]"><div className="w-[min(90%,360px)] space-y-3"><SkeletonBlock className="h-10 w-10 bg-[hsl(var(--sidebar-accent))]" /><SkeletonBlock className="h-9 w-48 bg-[hsl(var(--sidebar-accent))]" /><SkeletonBlock className="h-20 w-full bg-[hsl(var(--sidebar-accent))]" /></div></div>;
  if (session?.authenticated) return null;
  if (isError) return <div className="grid min-h-[100dvh] place-items-center bg-background p-6"><ErrorState label="Your secure session could not be checked." retry={() => refetch()} /></div>;
  return <div className="min-h-[100dvh] overflow-hidden bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]"><div className="mx-auto grid min-h-[100dvh] max-w-[1400px] lg:grid-cols-[1.05fr_.95fr]"><section className="relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between lg:p-16"><div className="absolute -left-24 top-24 h-[460px] w-[460px] rounded-full border border-[hsl(var(--sidebar-primary)/.16)]" /><div className="absolute -left-8 top-40 h-[300px] w-[300px] rounded-full border border-[hsl(var(--sidebar-primary)/.12)]" /><Logo /><div className="relative max-w-[560px]"><p className="font-mono-ui text-xs uppercase tracking-[.22em] text-[hsl(var(--sidebar-primary))]">Your everyday health signal</p><h1 className="font-display mt-6 text-[clamp(3.4rem,6vw,6.5rem)] leading-[.91] tracking-[-.06em]">A clearer<br /><em className="text-[hsl(var(--sidebar-primary))]">way to notice.</em></h1><p className="mt-8 max-w-[420px] text-[17px] leading-7 text-[hsl(var(--sidebar-foreground)/.62)]">PulseGuard brings your wearable signals and care team into one calm place — without turning data into a diagnosis.</p></div><div className="flex items-center gap-3 text-sm text-[hsl(var(--sidebar-foreground)/.5)]"><LockKeyhole size={16} /> Encrypted sample session · read-only data</div></section><section className="flex items-center bg-[hsl(var(--background))] px-6 py-12 text-[hsl(var(--foreground))] sm:px-12 lg:px-20"><div className="w-full max-w-[430px]"><div className="mb-12 lg:hidden"><Logo compact /></div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">Welcome back</p><h2 className="font-display mt-3 text-4xl tracking-[-.04em]">Set up your sample session.</h2><p className="mt-4 text-[15px] leading-7 text-muted-foreground">See how a daily check-in can feel: private, explainable, and connected to the people who know your care plan.</p><div className="mt-9 rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] font-bold">{patient?.initials ?? 'AM'}</span><div><p className="font-semibold" data-testid="text-session-user">{patient?.name ?? 'Alex Morgan'}</p><p className="text-xs text-muted-foreground">Sample patient · {patient?.carePlan ?? 'remote monitoring'}</p></div><CheckCircle2 size={18} className="ml-auto text-[hsl(var(--ring))]" /></div><div className="my-5 h-px bg-border" /><div className="space-y-3 text-sm text-muted-foreground"><div className="flex items-center gap-3"><ShieldCheck size={16} className="text-[hsl(var(--ring))]" /> Secure, read-only sample data</div><div className="flex items-center gap-3"><Wifi size={16} className="text-[hsl(var(--ring))]" /> Wearable signals stay in context</div></div></div><button onClick={begin} disabled={startSession.isPending} className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-3.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition-transform hover:-translate-y-0.5 disabled:opacity-60" data-testid="button-start-session">{startSession.isPending ? 'Opening your session…' : 'Continue securely'}<ChevronRight size={17} /></button><p className="mt-5 text-center text-xs leading-5 text-muted-foreground">By continuing, you agree to review the sample consent settings before monitoring begins.</p></div></section></div></div>;
}

function DashboardPage() {
  const { data, isLoading, isError, refetch } = useGetDashboard();
  const { data: alerts } = useListAlerts();
  if (isLoading) return <DashboardSkeleton />;
  if (isError || !data) return <ErrorState retry={() => refetch()} />;
  const latest = data.latest;
  const trendUp = data.trend.toLowerCase().includes('up');
  return <div className="animate-rise"><PageIntro eyebrow="Daily check-in · Tue, 18 Jun" title={`Good morning, ${data.patient.name.split(' ')[0]}.`}><Link href="/vitals" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-sm hover-elevate" data-testid="link-review-vitals">Review readings <ChevronRight size={16} /></Link></PageIntro><section className="relative overflow-hidden rounded-[24px] bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))] shadow-lg sm:p-8"><div className="absolute -right-16 -top-24 h-80 w-80 rounded-full border border-[hsl(var(--sidebar-primary)/.16)]" /><div className="absolute -right-2 -top-8 h-52 w-52 rounded-full border border-[hsl(var(--sidebar-primary)/.13)]" /><div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><div className="flex items-center gap-2 text-sm text-[hsl(var(--primary-foreground)/.68)]"><span className="h-2 w-2 rounded-full bg-[hsl(var(--sidebar-primary))]" />Overall signal</div><div className="mt-4 flex items-end gap-3"><span className="font-display text-6xl leading-none tracking-[-.07em]" data-testid="text-risk-score">{data.riskScore}</span><span className="mb-1 text-lg text-[hsl(var(--primary-foreground)/.55)]">/ 100</span><StatusPill label={data.riskLabel} tone="mint" /></div><p className="mt-4 max-w-[500px] text-sm leading-6 text-[hsl(var(--primary-foreground)/.64)]">Your recent signals are within your usual range. PulseGuard notices patterns; it does not diagnose.</p></div><div className="grid grid-cols-2 gap-6 border-t border-[hsl(var(--primary-foreground)/.14)] pt-5 sm:grid-cols-3 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[hsl(var(--primary-foreground)/.45)]">Open alerts</p><p className="mt-2 text-2xl font-semibold">{data.openAlertCount}</p></div><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[hsl(var(--primary-foreground)/.45)]">Device</p><p className="mt-2 text-sm font-semibold">{data.deviceStatus}</p></div><div><p className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[hsl(var(--primary-foreground)/.45)]">Synced</p><p className="mt-2 text-sm font-semibold">{formatTime(data.lastSyncedAt)}</p></div></div></div></section><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Heart rate" value={latest.heartRate} unit="bpm" detail={trendUp ? '↑ 4% vs usual' : 'Within usual range'} icon={HeartPulse} tone={trendUp ? 'amber' : 'mint'} /><MetricCard label="Blood oxygen" value={`${latest.oxygen}`} unit="%" detail="Stable today" icon={Activity} /><MetricCard label="Temperature" value={latest.temperature.toFixed(1)} unit="°C" detail="Within usual range" icon={Thermometer} /><MetricCard label="HRV" value={latest.hrv} unit="ms" detail="↑ 6% vs 7-day avg" icon={Zap} tone="coral" /></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.8fr]"><SignalChart readings={[latest]} /><RecentAlerts alerts={alerts ?? []} /></div></div>;
}

function DashboardSkeleton() {
  return <div className="space-y-6"><div className="space-y-3"><SkeletonBlock className="h-3 w-28" /><SkeletonBlock className="h-12 w-80" /></div><SkeletonBlock className="h-64 w-full rounded-[24px]" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map(i => <SkeletonBlock key={i} className="h-40" />)}</div></div>;
}

function SignalChart({ readings }: { readings: { heartRate: number; recordedAt: string }[] }) {
  const points = readings.length > 1 ? readings.map((r, i) => `${i * 18},${70 - (r.heartRate % 13)}`).join(' ') : '0,67 18,62 36,72 54,52 72,59 90,43 108,49 126,35 144,43 162,29 180,38 198,24 216,34 234,20 252,29 270,18 288,27 306,22 324,36 342,30 360,43 378,33 396,39';
  return <div className="surface rounded-2xl p-5 sm:p-6" data-testid="card-signal-chart"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold">Signal rhythm</p><p className="mt-1 text-xs text-muted-foreground">Heart rate · last 24 hours</p></div><Link href="/vitals" className="focus-ring text-xs font-semibold text-[hsl(var(--accent))]" data-testid="link-chart-details">Details <ChevronRight size={13} className="inline" /></Link></div><div className="mt-8 h-[145px] w-full"><svg viewBox="0 0 396 90" preserveAspectRatio="none" className="h-full w-full overflow-visible" aria-label="Heart rate trend chart"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="hsl(166 42% 48% / .24)" /><stop offset="1" stopColor="hsl(166 42% 48% / 0)" /></linearGradient></defs><path d={`M 0 90 L ${points} L 396 90 Z`} fill="url(#area)" /><polyline points={points} fill="none" stroke="hsl(166 42% 48%)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></div><div className="mt-2 flex justify-between text-[10px] font-mono-ui text-muted-foreground"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>Now</span></div></div>;
}

function RecentAlerts({ alerts }: { alerts: any[] }) {
  const recent = alerts.filter(a => a.status !== 'resolved').slice(0, 2);
  return <div className="surface rounded-2xl p-5 sm:p-6" data-testid="card-recent-alerts"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Needs your attention</p><Link href="/alerts" className="focus-ring text-xs font-semibold text-[hsl(var(--accent))]" data-testid="link-all-alerts">View all <ChevronRight size={13} className="inline" /></Link></div>{recent.length === 0 ? <div className="flex items-center gap-3 py-10 text-sm text-muted-foreground"><CheckCircle2 className="text-[hsl(var(--ring))]" size={19} />You are all caught up.</div> : <div className="mt-5 space-y-3">{recent.map((alert: any) => <div key={alert.id} className="flex gap-3 rounded-xl bg-[hsl(var(--muted)/.55)] p-3" data-testid={`row-recent-alert-${alert.id}`}><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${alert.severity === 'high' ? 'bg-[hsl(var(--accent))]' : 'bg-[#d3a942]'}`} /><div className="min-w-0"><p className="text-sm font-semibold">{alert.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{alert.detail}</p><p className="mt-2 text-[10px] font-mono-ui text-muted-foreground">{formatTime(alert.createdAt)}</p></div></div>)}</div>}</div>;
}

function VitalsPage() {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d');
  const { data: readings, isLoading, isError, refetch } = useGetVitals({ range });
  const { data: devices } = useListDevices();
  const syncDevice = useSyncDevice();
  const qc = useQueryClient();
  const sync = (deviceId: string) => syncDevice.mutate({ data: { deviceId } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetVitalsQueryKey({ range }) }); qc.invalidateQueries({ queryKey: ['/api/devices'] }); } });
  return <div className="animate-rise"><PageIntro eyebrow="Wearable signals" title="Vitals"><div className="flex gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">{(['24h', '7d', '30d'] as const).map(item => <button key={item} onClick={() => setRange(item)} className={`focus-ring rounded-lg px-3 py-2 text-xs font-semibold ${range === item ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'text-muted-foreground hover:bg-muted'}`} data-testid={`button-range-${item}`}>{item}</button>)}</div></PageIntro><div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]"><div className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold">Readings over time</p><p className="mt-1 text-xs text-muted-foreground">A view of your signals, not a verdict.</p></div><span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">{range}</span></div>{isLoading ? <SkeletonBlock className="mt-8 h-64" /> : isError ? <div className="mt-5"><ErrorState retry={() => refetch()} /></div> : !readings?.length ? <div className="mt-5"><EmptyState icon={HeartPulse} title="No readings yet" body="Once your wearable syncs, your recent signals will appear here." /></div> : <VitalsTable readings={readings} />}</div><div className="space-y-6"><DevicePanel devices={devices ?? []} syncing={syncDevice.isPending} onSync={sync} /><div className="rounded-2xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))]"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(var(--sidebar-primary)/.2)] text-[hsl(var(--sidebar-primary))]"><CircleHelp size={19} /></span><p className="font-semibold">How to read this</p></div><p className="mt-4 text-sm leading-6 text-[hsl(var(--primary-foreground)/.67)]">Compare a signal to your own pattern over time. If something feels wrong, contact your care team — even when the numbers look calm.</p><Link href="/care" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--sidebar-primary))]" data-testid="link-vitals-care">Meet your care team <ChevronRight size={15} /></Link></div></div></div></div>;
}

function VitalsTable({ readings }: { readings: any[] }) {
  return <div className="mt-7 overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm"><thead><tr className="border-b border-border text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground"><th className="pb-3">Recorded</th><th className="pb-3">Heart rate</th><th className="pb-3">Oxygen</th><th className="pb-3">Temp</th><th className="pb-3">Source</th></tr></thead><tbody>{readings.map((reading: any) => <tr key={reading.id} className="border-b border-border/70 last:border-0" data-testid={`row-vital-${reading.id}`}><td className="py-4"><p className="font-semibold">{formatDate(reading.recordedAt)}</p><p className="text-xs text-muted-foreground">{formatTime(reading.recordedAt)}</p></td><td className="py-4 font-mono-ui">{reading.heartRate}<span className="ml-1 text-xs text-muted-foreground">bpm</span></td><td className="py-4 font-mono-ui">{reading.oxygen}<span className="ml-1 text-xs text-muted-foreground">%</span></td><td className="py-4 font-mono-ui">{reading.temperature.toFixed(1)}°</td><td className="py-4"><span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Watch size={14} />{reading.source}</span></td></tr>)}</tbody></table></div>;
}

function DevicePanel({ devices, syncing, onSync }: { devices: any[]; syncing: boolean; onSync: (id: string) => void }) {
  if (!devices.length) return <EmptyState icon={Watch} title="No device connected" body="Connect a supported wearable to begin collecting daily signals." />;
  return <div className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Connected device</p><StatusPill label="Connected" /></div>{devices.map((device: any) => <div key={device.id} className="mt-5 rounded-xl bg-[hsl(var(--muted)/.55)] p-4" data-testid={`card-device-${device.id}`}><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-card text-[hsl(var(--primary))]"><Watch size={20} /></span><div><p className="font-semibold">{device.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{device.model} · {device.transport}</p></div><Wifi size={16} className="ml-auto text-[hsl(var(--ring))]" /></div><div className="mt-5 grid grid-cols-2 gap-4 text-xs"><div><p className="text-muted-foreground">Battery</p><p className="mt-1 font-mono-ui font-bold">{device.battery}%</p></div><div><p className="text-muted-foreground">Last seen</p><p className="mt-1 font-mono-ui font-bold">{formatTime(device.lastSeen)}</p></div></div><button onClick={() => onSync(device.id)} disabled={syncing} className="focus-ring mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold hover-elevate disabled:opacity-60" data-testid={`button-sync-${device.id}`}><RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />{syncing ? 'Syncing readings…' : 'Sync now'}</button></div>)}</div>;
}

function AlertsPage() {
  const { data: alerts, isLoading, isError, refetch } = useListAlerts();
  const updateAlert = useUpdateAlert();
  const qc = useQueryClient();
  const update = (id: string, status: 'acknowledged' | 'resolved') => updateAlert.mutate({ alertId: id, data: { status } }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListAlertsQueryKey() }) });
  return <div className="animate-rise"><PageIntro eyebrow="Signal review" title="Alerts"><div className="flex items-center gap-2 text-xs text-muted-foreground"><BellRing size={15} /> {alerts?.filter((a: any) => a.status === 'open').length ?? 0} open</div></PageIntro>{isLoading ? <div className="space-y-3">{[1, 2, 3].map(i => <SkeletonBlock className="h-28" key={i} />)}</div> : isError ? <ErrorState retry={() => refetch()} /> : !alerts?.length ? <EmptyState icon={CheckCircle2} title="Nothing needs your attention" body="New signal changes will appear here with context and a next step." /> : <div className="space-y-3">{alerts.map((alert: any) => <AlertRow key={alert.id} alert={alert} pending={updateAlert.isPending} onUpdate={update} />)}</div>}</div>;
}

function AlertRow({ alert, pending, onUpdate }: { alert: any; pending: boolean; onUpdate: (id: string, status: 'acknowledged' | 'resolved') => void }) {
  const open = alert.status === 'open';
  const high = alert.severity === 'high';
  return <article className={`surface rounded-2xl p-5 transition-transform hover:-translate-y-0.5 ${open && high ? 'border-l-[3px] border-l-[hsl(var(--accent))]' : ''}`} data-testid={`card-alert-${alert.id}`}><div className="flex gap-4"><span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${high ? 'bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]' : 'bg-[#f4e9c9] text-[#755b23]'}`}><AlertCircle size={19} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="flex items-center gap-2"><h2 className="font-semibold">{alert.title}</h2><StatusPill label={alert.status} tone={open ? (high ? 'coral' : 'amber') : 'slate'} /></div><p className="mt-1 text-sm leading-6 text-muted-foreground">{alert.detail}</p></div><span className="shrink-0 text-xs text-muted-foreground">{formatTime(alert.createdAt)}</span></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Watch size={13} /> {alert.source}</span>{open && <div className="flex gap-2"><button onClick={() => onUpdate(alert.id, 'acknowledged')} disabled={pending} className="focus-ring rounded-lg border border-border px-3 py-2 text-xs font-semibold hover-elevate disabled:opacity-50" data-testid={`button-acknowledge-${alert.id}`}>Acknowledge</button><button onClick={() => onUpdate(alert.id, 'resolved')} disabled={pending} className="focus-ring rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50" data-testid={`button-resolve-${alert.id}`}>Resolve</button></div>}{alert.status === 'acknowledged' && <button onClick={() => onUpdate(alert.id, 'resolved')} disabled={pending} className="focus-ring rounded-lg border border-border px-3 py-2 text-xs font-semibold hover-elevate disabled:opacity-50" data-testid={`button-resolve-acknowledged-${alert.id}`}>Mark resolved</button>}</div></div></div></article>;
}

function CarePage() {
  const { data: team, isLoading: teamLoading, isError: teamError } = useGetCareTeam();
  const { data: consents, isLoading: consentLoading } = useGetConsents();
  const updateConsents = useUpdateConsents();
  const escalate = useEscalateEmergency();
  const [showEmergency, setShowEmergency] = useState(false);
  const [reason, setReason] = useState('');
  const [workflow, setWorkflow] = useState<any>(null);
  const qc = useQueryClient();
  const updateConsent = (id: string, enabled: boolean) => {
    const values = Object.fromEntries((consents ?? []).map((item: any) => [item.id, item.id === id ? enabled : item.enabled]));
    updateConsents.mutate({ data: { wearableData: Boolean(values.wearableData), careTeamSharing: Boolean(values.careTeamSharing), emergencyEscalation: Boolean(values.emergencyEscalation), modelAnalysis: Boolean(values.modelAnalysis) } }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetConsentsQueryKey() }) });
  };
  const startEmergency = (channel: 'care-team' | 'emergency-services') => escalate.mutate({ data: { reason: reason || 'I need help reviewing my current health signals.', channel } }, { onSuccess: (result) => { setWorkflow(result); setShowEmergency(false); setReason(''); } });
  return <div className="animate-rise"><PageIntro eyebrow="People in your corner" title="Care team"><button onClick={() => setShowEmergency(true)} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--accent))] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90" data-testid="button-open-emergency"><Phone size={16} /> I need help now</button></PageIntro>{workflow && <EmergencyStatus workflow={workflow} onDismiss={() => setWorkflow(null)} />}<div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]"><section><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl">Verified care team</h2><span className="text-xs text-muted-foreground">Your approved circle</span></div>{teamLoading ? <div className="space-y-3"><SkeletonBlock className="h-28" /><SkeletonBlock className="h-28" /></div> : teamError ? <ErrorState /> : !team?.length ? <EmptyState icon={UsersRound} title="Your circle is quiet" body="No care team members are connected to this sample session." /> : <div className="space-y-3">{team.map((member: any) => <TeamMember key={member.id} member={member} />)}</div>}</section><section><h2 className="mb-3 font-display text-2xl">Consent & sharing</h2><div className="surface rounded-2xl p-5">{consentLoading ? <div className="space-y-5"><SkeletonBlock className="h-12" /><SkeletonBlock className="h-12" /><SkeletonBlock className="h-12" /></div> : (consents ?? []).map((consent: any) => <ConsentRow key={consent.id} consent={consent} pending={updateConsents.isPending} onChange={updateConsent} />)}<div className="mt-5 flex gap-2 rounded-xl bg-[hsl(var(--secondary)/.6)] p-3 text-xs leading-5 text-muted-foreground"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[hsl(var(--ring))]" />You choose what is shared. Required settings keep your monitoring session safe.</div></div></section></div>{showEmergency && <EmergencyDialog reason={reason} setReason={setReason} pending={escalate.isPending} onClose={() => setShowEmergency(false)} onStart={startEmergency} />}</div>;
}

function EmergencyStatus({ workflow, onDismiss }: { workflow: any; onDismiss: () => void }) {
  return <section className="mb-6 rounded-2xl border border-[hsl(var(--ring)/.35)] bg-[hsl(var(--secondary)/.55)] p-5" data-testid="card-emergency-workflow"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--ring)/.15)] text-[hsl(var(--ring))]"><CheckCircle2 size={19} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold">Support request started</p><p className="mt-1 text-xs text-muted-foreground">Workflow {workflow.id} · {formatTime(workflow.createdAt)}</p></div><StatusPill label={workflow.status} /></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{(workflow.steps ?? []).map((step: any) => <div key={step.label} className="rounded-xl bg-card/70 p-3"><p className="text-xs font-semibold">{step.label}</p><p className="mt-1 text-[11px] text-muted-foreground">{step.status}</p></div>)}</div></div><button onClick={onDismiss} className="rounded-lg p-1.5 text-muted-foreground hover-elevate" aria-label="Dismiss support status" data-testid="button-dismiss-emergency-status"><X size={16} /></button></div></section>;
}

function TeamMember({ member }: { member: any }) {
  return <div className="surface flex items-center gap-4 rounded-2xl p-4" data-testid={`card-care-member-${member.id}`}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--primary))]">{member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{member.name}</p>{member.verified && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[hsl(var(--ring))]"><ShieldCheck size={13} /> VERIFIED</span>}</div><p className="mt-1 text-sm text-muted-foreground">{member.role} · {member.organization}</p><p className="mt-1 text-xs text-muted-foreground">{member.availability}</p></div><button onClick={() => window.alert(`Opening ${member.channel} with ${member.name}`)} className="focus-ring rounded-lg border border-border p-2.5 text-muted-foreground hover-elevate" data-testid={`button-contact-${member.id}`} aria-label={`Contact ${member.name}`}><MessageCircle size={17} /></button></div>;
}

function ConsentRow({ consent, pending, onChange }: { consent: any; pending: boolean; onChange: (id: string, enabled: boolean) => void }) {
  return <div className="flex gap-4 border-b border-border/70 py-4 last:border-0" data-testid={`row-consent-${consent.id}`}><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-sm font-semibold">{consent.label}</p>{consent.required && <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--accent))]">Required</span>}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{consent.description}</p></div><button role="switch" aria-checked={consent.enabled} disabled={pending || consent.required} onClick={() => onChange(consent.id, !consent.enabled)} className={`focus-ring relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${consent.enabled ? 'bg-[hsl(var(--ring))]' : 'bg-[hsl(var(--muted-foreground)/.28)]'} disabled:cursor-not-allowed disabled:opacity-60`} data-testid={`switch-consent-${consent.id}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-card shadow-sm transition-transform ${consent.enabled ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>;
}

function EmergencyDialog({ reason, setReason, pending, onClose, onStart }: { reason: string; setReason: (v: string) => void; pending: boolean; onClose: () => void; onStart: (channel: 'care-team' | 'emergency-services') => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[hsl(var(--primary)/.46)] p-5" role="dialog" aria-modal="true" data-testid="dialog-emergency"><div className="w-full max-w-[480px] rounded-2xl bg-card p-6 shadow-xl sm:p-7"><div className="flex items-start justify-between"><div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]"><Phone size={19} /></span><h2 className="font-display mt-4 text-2xl">Let’s get you support.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">This starts a verified escalation. If you are in immediate danger, call local emergency services.</p></div><button onClick={onClose} className="rounded-lg p-2 hover-elevate" data-testid="button-close-emergency"><X size={18} /></button></div><label className="mt-6 block text-sm font-semibold" htmlFor="emergency-reason">What is happening?</label><textarea id="emergency-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="A short note helps your care team respond." className="focus-ring mt-2 min-h-24 w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none" data-testid="input-emergency-reason" /><div className="mt-5 grid gap-2 sm:grid-cols-2"><button onClick={() => onStart('care-team')} disabled={pending} className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] disabled:opacity-60" data-testid="button-escalate-care-team"><UsersRound size={16} />Notify care team</button><button onClick={() => onStart('emergency-services')} disabled={pending} className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-[hsl(var(--accent)/.35)] px-4 py-3 text-sm font-semibold text-[hsl(var(--accent))] disabled:opacity-60" data-testid="button-escalate-emergency-services"><Phone size={16} />Emergency services</button></div></div></div>;
}

function InsightsPage() {
  const { data, isLoading, isError, refetch } = useGetModelInsights();
  return <div className="animate-rise"><PageIntro eyebrow="Patterns, explained" title="Insights"><span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--secondary))] px-3 py-2 text-xs font-semibold text-[hsl(var(--secondary-foreground))]"><Sparkles size={14} /> Updated after each sync</span></PageIntro><div className="mb-6 flex gap-3 rounded-2xl border border-[hsl(var(--accent)/.2)] bg-[hsl(var(--accent)/.07)] p-4 text-sm leading-6 text-[hsl(var(--foreground))]" data-testid="disclaimer-insights"><CircleHelp size={18} className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" /><p><strong>This is not medical advice.</strong> Insights describe patterns in wearable data. They are not a diagnosis or a substitute for guidance from your care team.</p></div>{isLoading ? <div className="grid gap-4 lg:grid-cols-2"><SkeletonBlock className="h-56" /><SkeletonBlock className="h-56" /></div> : isError ? <ErrorState retry={() => refetch()} /> : !data?.length ? <EmptyState icon={Lightbulb} title="No patterns to share yet" body="Insights will appear after PulseGuard has enough signal history to explain a trend." /> : <div className="grid gap-4 lg:grid-cols-2">{data.map((insight: any, index: number) => <InsightCard key={insight.id} insight={insight} index={index} />)}</div>}</div>;
}

function InsightCard({ insight, index }: { insight: any; index: number }) {
  return <article className="surface rounded-2xl p-6" data-testid={`card-insight-${insight.id}`}><div className="flex items-start justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${index % 2 ? 'bg-[hsl(var(--accent)/.12)] text-[hsl(var(--accent))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--ring))]'}`}><Lightbulb size={19} /></span><span className="font-mono-ui text-xs text-muted-foreground">{Math.round(insight.confidence * 100)}% confidence</span></div><h2 className="font-display mt-6 text-[1.65rem] leading-tight tracking-[-.03em]">{insight.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{insight.summary}</p><div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Watch size={13} /> {insight.source}</span><span>{formatDate(insight.createdAt)}</span></div><p className="mt-4 text-[11px] leading-5 text-muted-foreground/80">{insight.disclaimer}</p></article>;
}

function SettingsPage() {
  const { data: session } = useGetSession({ query: { queryKey: ['/api/session'], staleTime: 60_000 } });
  const [notifications, setNotifications] = useState(true);
  const [weekly, setWeekly] = useState(false);
  return <div className="animate-rise"><PageIntro eyebrow="Your account" title="Settings"><StatusPill label="Secure session" /></PageIntro><div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]"><section className="space-y-6"><div className="surface rounded-2xl p-6"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-full bg-[hsl(var(--primary))] text-lg font-bold text-[hsl(var(--primary-foreground))]">{session?.user?.initials ?? 'MC'}</span><div><h2 className="font-display text-2xl" data-testid="text-settings-name">{session?.user?.name ?? 'Maya Chen'}</h2><p className="mt-1 text-sm text-muted-foreground">Patient profile · {session?.user?.carePlan ?? 'Daily monitoring'}</p></div></div><div className="mt-6 grid gap-4 border-t border-border/70 pt-5 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Date of birth</p><p className="mt-1 text-sm font-semibold">{session?.user?.dateOfBirth ? formatDate(session.user.dateOfBirth) : '18 Apr 1988'}</p></div><div><p className="text-xs text-muted-foreground">Patient ID</p><p className="mt-1 font-mono-ui text-xs font-bold">{session?.user?.id ?? 'PG-2048'}</p></div></div></div><div className="rounded-2xl bg-[hsl(var(--primary))] p-6 text-[hsl(var(--primary-foreground))]"><div className="flex gap-3"><LockKeyhole size={19} className="mt-0.5 text-[hsl(var(--sidebar-primary))]" /><div><h2 className="font-semibold">Private by design</h2><p className="mt-2 text-sm leading-6 text-[hsl(var(--primary-foreground)/.65)]">This sample session is read-only. Your signals are shown to help you notice patterns, never to label you.</p></div></div></div></section><section className="surface rounded-2xl p-6"><h2 className="font-display text-2xl">Preferences</h2><div className="mt-5 divide-y divide-border/70"><PreferenceRow icon={Bell} label="Signal notifications" detail="Get a quiet nudge when a reading needs review." enabled={notifications} onChange={() => setNotifications(!notifications)} testId="notifications" /><PreferenceRow icon={Activity} label="Weekly summary" detail="A short reflection on your recent patterns." enabled={weekly} onChange={() => setWeekly(!weekly)} testId="weekly-summary" /><PreferenceRow icon={ShieldCheck} label="Care team sharing" detail="Manage what your approved care team can see." enabled={true} onChange={() => {}} disabled testId="care-sharing" /></div><div className="mt-6 border-t border-border/70 pt-5"><Link href="/care" className="focus-ring flex items-center justify-between rounded-xl bg-[hsl(var(--muted)/.65)] p-4 text-sm font-semibold hover-elevate" data-testid="link-settings-consent"><span className="flex items-center gap-3"><KeyRound size={17} className="text-[hsl(var(--ring))]" />Review consent settings</span><ChevronRight size={17} /></Link></div></section></div></div>;
}

function PreferenceRow({ icon: Icon, label, detail, enabled, onChange, disabled = false, testId }: { icon: typeof Bell; label: string; detail: string; enabled: boolean; onChange: () => void; disabled?: boolean; testId: string }) {
  return <div className="flex items-center gap-4 py-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]"><Icon size={17} /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div><button role="switch" aria-checked={enabled} disabled={disabled} onClick={onChange} className={`focus-ring relative h-6 w-11 shrink-0 rounded-full ${enabled ? 'bg-[hsl(var(--ring))]' : 'bg-[hsl(var(--muted-foreground)/.28)]'} disabled:opacity-60`} data-testid={`switch-${testId}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-card shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>;
}

function AppRouter() {
  return <Switch><Route path="/" component={SessionPage} /><Route path="/dashboard"><Shell><DashboardPage /></Shell></Route><Route path="/vitals"><Shell><VitalsPage /></Shell></Route><Route path="/alerts"><Shell><AlertsPage /></Shell></Route><Route path="/care"><Shell><CarePage /></Shell></Route><Route path="/insights"><Shell><InsightsPage /></Shell></Route><Route path="/settings"><Shell><SettingsPage /></Shell></Route><Route component={NotFound} /></Switch>;
}

function formatTime(value?: string) { if (!value) return '—'; return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }
function formatDate(value?: string) { if (!value) return '—'; return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)); }

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ErrorBoundary><AppRouter /></ErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
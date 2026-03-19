import { useState, useMemo } from 'react';
import {
  Calculator, Package, Ship, DollarSign,
  ChevronDown, ChevronRight, Copy, CheckCheck,
  Pencil, Check, Plus, Trash2, AlertTriangle,
  Save, History, LogOut,
} from 'lucide-react';
import { useContainer } from './hooks/useContainer';
import { useCalculator } from './hooks/useCalculator';
import { useAuth } from './hooks/useAuth';
import type { CostGroup, CostItem, GroupColor } from './types';
import { SnapshotsDrawer } from './components/SnapshotsDrawer';
import type { SnapshotEntry } from './components/SnapshotsDrawer';
import { LoginScreen } from './components/LoginScreen';

// ─── helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

const colorCls: Record<GroupColor, { border: string; header: string; badge: string; text: string; ring: string }> = {
  blue:   { border: 'border-blue-500/40',   header: 'bg-blue-500/10',   badge: 'bg-blue-500/20 text-blue-300',   text: 'text-blue-400',   ring: 'focus:ring-blue-500/40' },
  green:  { border: 'border-green-500/40',  header: 'bg-green-500/10',  badge: 'bg-green-500/20 text-green-300', text: 'text-green-400',  ring: 'focus:ring-green-500/40' },
  red:    { border: 'border-red-500/40',    header: 'bg-red-500/10',    badge: 'bg-red-500/20 text-red-300',     text: 'text-red-400',    ring: 'focus:ring-red-500/40' },
  orange: { border: 'border-orange-500/40', header: 'bg-orange-500/10', badge: 'bg-orange-500/20 text-orange-300', text: 'text-orange-400', ring: 'focus:ring-orange-500/40' },
  purple: { border: 'border-purple-500/40', header: 'bg-purple-500/10', badge: 'bg-purple-500/20 text-purple-300', text: 'text-purple-400', ring: 'focus:ring-purple-500/40' },
  cyan:   { border: 'border-cyan-500/40',   header: 'bg-cyan-500/10',   badge: 'bg-cyan-500/20 text-cyan-300',   text: 'text-cyan-400',   ring: 'focus:ring-cyan-500/40' },
};

const toEUR = (item: CostItem, rate: number) =>
  item.currency === 'USD' ? item.amount / rate : item.amount;

const fmtEUR = (n: number) =>
  '€' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ─── initial data (from landed-cost-calculator.tsx) ─────────────────────────
const INITIAL_GROUPS: CostGroup[] = [
  {
    id: 'unitex',
    label: 'UNITEX Hong Kong – Overseas Forwarder',
    color: 'blue',
    exchangeRate: 1.1651,
    items: [
      { id: uid(), label: 'DOC FEE',                   amount: 80,   currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'BOOKING FEE',                amount: 150,  currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'ORC (Origin Receiving Charge)', amount: 380, currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'SEAL CHARGE',               amount: 10,   currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'ENS FEE',                   amount: 30,   currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'ICS2 FEE',                  amount: 30,   currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'CUSTOMS DECLARATION (×3)',   amount: 225,  currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'EXPORT LICENCE',             amount: 350,  currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'VGM FEE',                   amount: 15,   currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'EIR',                       amount: 8,    currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'INSIDE LOADING',             amount: 350,  currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'TRUCK FEE (origin)',         amount: 250,  currency: 'USD', includeInLanded: true },
      { id: uid(), label: 'DOC FEE – Invoice 2',        amount: 490,  currency: 'USD', includeInLanded: true },
    ],
  },
  {
    id: 'sba',
    label: 'SBA Cargo Hellas – Sea Freight & Destination',
    color: 'green',
    exchangeRate: null,
    items: [
      { id: uid(), label: 'Ocean Freight (O/F)',     amount: 2949.62, currency: 'EUR', includeInLanded: true, note: '$3,450 @ 1.169641' },
      { id: uid(), label: 'THCD Πρακτορειακά',      amount: 423,     currency: 'EUR', includeInLanded: true },
    ],
  },
  {
    id: 'customs',
    label: 'Τελωνείο – Customs Broker & Duties',
    color: 'red',
    exchangeRate: null,
    items: [
      { id: uid(), label: 'Δασμοί (field A00)',      amount: 1952.35, currency: 'EUR', includeInLanded: true,  note: 'Import duties from customs entry' },
      { id: uid(), label: 'ΦΠΑ Εισαγωγής',          amount: 12374.85, currency: 'EUR', includeInLanded: false, note: '⚠️ Excluded — fully recovered via VAT return' },
    ],
  },
  {
    id: 'transport',
    label: 'Μεταφορικά Ελλάδα – Local Transport',
    color: 'orange',
    exchangeRate: null,
    items: [
      { id: uid(), label: 'Λιμάνι → Αποθήκη',       amount: 1200, currency: 'EUR', includeInLanded: true },
    ],
  },
];

// ─── component ───────────────────────────────────────────────────────────────
export default function App() {
  const { session, loading: authLoading, signIn, signUp, signOut } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Calculator className="h-10 w-10 text-[#60a5fa] animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onSignIn={signIn} onSignUp={signUp} />;
  }

  return <AppInner signOut={signOut} userEmail={session.user.email} />;
}

function AppInner({ signOut, userEmail }: { signOut: () => void; userEmail?: string }) {
  const { container, loading, saving, saveError, setSaveError, updateContainer } = useContainer();
  const calc = useCalculator(INITIAL_GROUPS);
  const {
    groups,
    setGroups,
    totalGoodsUSD,
    setTotalGoodsUSD,
    goodsCurrency,
    setGoodsCurrency,
    goodsRate,
    setGoodsRate,
    globalRate,
    setGlobalRate,
    rateDate,
    setRateDate,
    samplePrice,
    setSamplePrice,
    saving: calcSaving,
    saveError: calcSaveError,
    setSaveError: setCalcSaveError,
  } = calc;

  // Container header inline edit
  const [editTitle, setEditTitle] = useState(false);
  const [editMbl,   setEditMbl]   = useState(false);
  const [editContainerCode, setEditContainerCode] = useState(false);
  const [editRefNo, setEditRefNo] = useState(false);
  const [localTitle, setLocalTitle] = useState('');
  const [localMbl,   setLocalMbl]   = useState('');
  const [localContainerCode, setLocalContainerCode] = useState('');
  const [localRefNo, setLocalRefNo] = useState('');

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupLabel, setEditGroupLabel] = useState('');

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Snapshots drawer
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [snapshots, setSnapshots]         = useState<SnapshotEntry[]>([]);
  const [snapsLoading, setSnapsLoading]   = useState(false);
  const [savingSnap, setSavingSnap]       = useState(false);
  const [snapSaved, setSnapSaved]         = useState(false);

  const fetchSnapshots = async () => {
    setSnapsLoading(true);
    try {
      const r = await fetch('/api/snapshots');
      if (r.ok) setSnapshots(await r.json());
    } finally {
      setSnapsLoading(false);
    }
  };

  const openDrawer = () => { setDrawerOpen(true); fetchSnapshots(); };

  const saveSnapshot = async () => {
    setSavingSnap(true);
    try {
      await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: container.container_code,
          container,
          calculator: { groups, totalGoodsUSD, goodsCurrency, goodsRate, globalRate, rateDate, samplePrice },
        }),
      });
      setSnapSaved(true);
      setTimeout(() => setSnapSaved(false), 2000);
    } finally {
      setSavingSnap(false);
    }
  };

  const loadSnapshot = (snap: SnapshotEntry) => {
    updateContainer(snap.container);
    const c = snap.calculator;
    setGroups(c.groups);
    setTotalGoodsUSD(c.totalGoodsUSD);
    setGoodsCurrency(c.goodsCurrency ?? 'USD');
    setGoodsRate(c.goodsRate);
    setGlobalRate(c.globalRate);
    setRateDate(c.rateDate);
    setSamplePrice(c.samplePrice);
  };

  const deleteSnapshot = async (id: string) => {
    await fetch(`/api/snapshots?id=${id}`, { method: 'DELETE' });
    setSnapshots(s => s.filter(x => x.id !== id));
  };

  // ── calculations ──
  const goodsEUR = goodsCurrency === 'EUR' ? totalGoodsUSD : totalGoodsUSD / goodsRate;

  const groupTotals = useMemo(() =>
    groups.map(g => {
      const rate = g.exchangeRate ?? globalRate;
      const included = g.items.filter(i => i.includeInLanded).reduce((s, i) => s + toEUR(i, rate), 0);
      const excluded = g.items.filter(i => !i.includeInLanded).reduce((s, i) => s + toEUR(i, rate), 0);
      return { id: g.id, included, excluded };
    }), [groups, globalRate]);

  const totalCostsEUR = useMemo(() =>
    groupTotals.reduce((s, t) => s + t.included, 0), [groupTotals]);

  const markupPct   = goodsEUR > 0 ? (totalCostsEUR / goodsEUR) * 100 : 0;
  const multiplier  = 1 + markupPct / 100;
  const sampleLanded = samplePrice * multiplier;

  const copyMultiplier = () => {
    navigator.clipboard.writeText(multiplier.toFixed(4));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── group helpers ──
  const updateGroup = (id: string, patch: Partial<CostGroup>) =>
    setGroups(gs => gs.map(g => g.id === id ? { ...g, ...patch } : g));

  const updateItem = (groupId: string, itemId: string, patch: Partial<CostItem>) =>
    setGroups(gs => gs.map(g =>
      g.id === groupId
        ? { ...g, items: g.items.map(i => i.id === itemId ? { ...i, ...patch } : i) }
        : g));

  const addItem = (groupId: string) =>
    setGroups(gs => gs.map(g =>
      g.id === groupId
        ? { ...g, items: [...g.items, { id: uid(), label: 'New item', amount: 0, currency: g.items[0]?.currency ?? 'EUR', includeInLanded: true }] }
        : g));

  const removeItem = (groupId: string, itemId: string) =>
    setGroups(gs => gs.map(g =>
      g.id === groupId ? { ...g, items: g.items.filter(i => i.id !== itemId) } : g));

  // ── container header save ──
  const saveTitle         = () => { setEditTitle(false);         if (localTitle.trim())         updateContainer({ title: localTitle.trim() }); };
  const saveMbl           = () => { setEditMbl(false);           if (localMbl.trim())           updateContainer({ mbl: localMbl.trim() }); };
  const saveContainerCode = () => { setEditContainerCode(false); if (localContainerCode.trim()) updateContainer({ container_code: localContainerCode.trim() }); };
  const saveRefNo         = () => { setEditRefNo(false);         if (localRefNo.trim())         updateContainer({ ref_no: localRefNo.trim() }); };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── HEADER ── */}
        <header className="animate-fade-in rounded-xl border border-[#374151] bg-[#1f2937] p-5 shadow-xl">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <Calculator className="h-8 w-8 text-[#60a5fa]" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">Landed Cost Calculator</h1>
            <span className="text-2xl md:text-3xl font-bold text-[#9ca3af]">Container code:</span>
            {loading ? (
              <span className="text-2xl md:text-3xl font-bold text-white">I110.15</span>
            ) : editContainerCode ? (
              <span className="flex items-center gap-2">
                <input autoFocus value={localContainerCode} onChange={e => setLocalContainerCode(e.target.value)}
                  onBlur={saveContainerCode} onKeyDown={e => e.key === 'Enter' && saveContainerCode()}
                  className="w-28 rounded border border-[#4b5563] bg-[#111827] px-2 py-1 text-2xl md:text-3xl font-bold text-white focus:border-[#60a5fa] focus:outline-none" />
                <button onClick={saveContainerCode} disabled={saving} className="text-[#34d399] hover:opacity-80"><Check className="h-5 w-5" /></button>
              </span>
            ) : (
              <button onClick={() => { setLocalContainerCode(container.container_code); setEditContainerCode(true); }}
                className="flex items-center gap-1 rounded px-1 hover:bg-white/10">
                <span className="text-2xl md:text-3xl font-bold text-white font-mono">{container.container_code}</span>
                <Pencil className="h-4 w-4 text-[#6b7280]" />
              </button>
            )}

            {/* Save snapshot + open drawer + sign out */}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={saveSnapshot}
                disabled={savingSnap || loading}
                title={`Save "${container.container_code}" as snapshot`}
                className="flex items-center gap-1.5 rounded-lg border border-[#374151] bg-[#111827] px-3 py-1.5 text-sm font-semibold text-white hover:border-[#60a5fa] hover:text-[#60a5fa] transition-colors disabled:opacity-50"
              >
                {snapSaved
                  ? <CheckCheck className="h-4 w-4 text-[#34d399]" />
                  : <Save className="h-4 w-4" />}
                {snapSaved ? 'Saved!' : 'Save'}
              </button>
              <button
                onClick={openDrawer}
                title="View saved containers"
                className="flex items-center gap-1.5 rounded-lg border border-[#374151] bg-[#111827] px-3 py-1.5 text-sm font-semibold text-[#9ca3af] hover:border-[#60a5fa] hover:text-white transition-colors"
              >
                <History className="h-4 w-4" />
                History
              </button>
              <button
                onClick={signOut}
                title={userEmail}
                className="flex items-center gap-1.5 rounded-lg border border-[#374151] bg-[#111827] px-3 py-1.5 text-sm font-semibold text-[#9ca3af] hover:border-red-500/50 hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-[#9ca3af] text-sm">Loading…</p>
          ) : (
            <>
            {(saveError || calcSaveError) && (
              <div className="mb-2 rounded bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-300 flex items-center justify-between gap-2">
                <span>Save failed: {saveError || calcSaveError}</span>
                <button type="button" onClick={() => { setSaveError(); setCalcSaveError(); }} className="text-red-400 hover:text-white">Dismiss</button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#d1d5db]">
              {(saving || calcSaving) && (
                <span className="text-[#9ca3af] text-xs italic">Saving…</span>
              )}
              <span className="text-[#6b7280]">Container:</span>
              {editTitle ? (
                <span className="flex items-center gap-2">
                  <input autoFocus value={localTitle} onChange={e => setLocalTitle(e.target.value)}
                    onBlur={saveTitle} onKeyDown={e => e.key === 'Enter' && saveTitle()}
                    className="rounded border border-[#4b5563] bg-[#111827] px-2 py-1 text-white focus:border-[#60a5fa] focus:outline-none" />
                  <button onClick={saveTitle} disabled={saving} className="text-[#34d399] hover:opacity-80"><Check className="h-4 w-4" /></button>
                </span>
              ) : (
                <button onClick={() => { setLocalTitle(container.title); setEditTitle(true); }}
                  className="flex items-center gap-1 rounded px-1 hover:bg-white/10">
                  <span className="font-mono font-semibold text-white">{container.title}</span>
                  <Pencil className="h-3 w-3 text-[#6b7280]" />
                </button>
              )}
              <span className="text-[#374151]">|</span>
              <span className="text-[#6b7280]">MBL:</span>
              {editMbl ? (
                <span className="flex items-center gap-2">
                  <input autoFocus value={localMbl} onChange={e => setLocalMbl(e.target.value)}
                    onBlur={saveMbl} onKeyDown={e => e.key === 'Enter' && saveMbl()}
                    className="rounded border border-[#4b5563] bg-[#111827] px-2 py-1 text-white focus:border-[#60a5fa] focus:outline-none" />
                  <button onClick={saveMbl} disabled={saving} className="text-[#34d399] hover:opacity-80"><Check className="h-4 w-4" /></button>
                </span>
              ) : (
                <button onClick={() => { setLocalMbl(container.mbl); setEditMbl(true); }}
                  className="flex items-center gap-1 rounded px-1 hover:bg-white/10">
                  <span className="font-mono font-semibold text-white">{container.mbl}</span>
                  <Pencil className="h-3 w-3 text-[#6b7280]" />
                </button>
              )}
              <span className="text-[#374151]">|</span>
              <span className="text-[#6b7280]">Ref. no:</span>
              {editRefNo ? (
                <span className="flex items-center gap-2">
                  <input autoFocus value={localRefNo} onChange={e => setLocalRefNo(e.target.value)}
                    onBlur={saveRefNo} onKeyDown={e => e.key === 'Enter' && saveRefNo()}
                    className="rounded border border-[#4b5563] bg-[#111827] px-2 py-1 text-white focus:border-[#60a5fa] focus:outline-none" />
                  <button onClick={saveRefNo} disabled={saving} className="text-[#34d399] hover:opacity-80"><Check className="h-4 w-4" /></button>
                </span>
              ) : (
                <button onClick={() => { setLocalRefNo(container.ref_no); setEditRefNo(true); }}
                  className="flex items-center gap-1 rounded px-1 hover:bg-white/10">
                  <span className="font-mono font-semibold text-white">{container.ref_no}</span>
                  <Pencil className="h-3 w-3 text-[#6b7280]" />
                </button>
              )}
            </div>
            </>
          )}
        </header>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* ── LEFT: cost groups ── */}
          <div className="space-y-4">

            {/* Global rate row + USD conversion date note */}
            <div className="rounded-lg border border-[#374151] bg-[#1f2937] px-4 py-3 space-y-2">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-[#9ca3af]">Global USD/EUR rate:</span>
                <input type="number" step="0.0001" value={globalRate}
                  onChange={e => setGlobalRate(parseFloat(e.target.value) || 1)}
                  className="w-28 rounded border border-[#4b5563] bg-[#111827] px-2 py-1 text-white focus:border-[#60a5fa] focus:outline-none" />
                <span className="text-[#6b7280] text-xs">(used for groups without own rate)</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-[#9ca3af]">Rate date:</span>
                <input type="date" value={rateDate} onChange={e => setRateDate(e.target.value)}
                  className="rounded border border-[#4b5563] bg-[#111827] px-2 py-1 text-white focus:border-[#60a5fa] focus:outline-none" />
                <span className="text-[#6b7280] text-xs italic">
                  Note: USD conversion — add date to use exchange rate for that specific date (auto-fetch coming soon).
                </span>
              </div>
            </div>

            {/* Cost groups */}
            {groups.map(group => {
              const c     = colorCls[group.color];
              const open  = !collapsed[group.id];
              const gt    = groupTotals.find(t => t.id === group.id)!;
              const rate  = group.exchangeRate ?? globalRate;

              return (
                <div key={group.id} className={`animate-scale-in rounded-xl border ${c.border} bg-[#1f2937] shadow-md overflow-hidden`}>
                  {/* Group header */}
                  <div className={`${c.header} px-4 py-3 flex items-center justify-between gap-2 cursor-pointer`}
                    onClick={() => setCollapsed(s => ({ ...s, [group.id]: !s[group.id] }))}>
                    <div className="flex items-center gap-2 min-w-0">
                      {open ? <ChevronDown className={`h-4 w-4 shrink-0 ${c.text}`} /> : <ChevronRight className={`h-4 w-4 shrink-0 ${c.text}`} />}
                      {editingGroupId === group.id ? (
                        <input
                          value={editGroupLabel}
                          onClick={e => e.stopPropagation()}
                          onChange={e => setEditGroupLabel(e.target.value)}
                          onBlur={() => { updateGroup(group.id, { label: editGroupLabel }); setEditingGroupId(null); }}
                          onKeyDown={e => { if (e.key === 'Enter') { updateGroup(group.id, { label: editGroupLabel }); setEditingGroupId(null); } }}
                          className="rounded border border-[#4b5563] bg-[#111827] px-2 py-0.5 text-white text-sm font-semibold focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className={`font-semibold text-sm ${c.text} truncate`}>{group.label}</span>
                      )}
                      <button onClick={e => { e.stopPropagation(); setEditingGroupId(group.id); setEditGroupLabel(group.label); }}
                        className="shrink-0 rounded p-0.5 hover:bg-white/10">
                        <Pencil className="h-3 w-3 text-[#6b7280]" />
                      </button>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${c.badge}`}>
                      {fmtEUR(gt.included)}
                    </span>
                  </div>

                  {/* Group body */}
                  {open && (
                    <div className="p-4 space-y-2">
                      {/* Per-group rate */}
                      <div className="flex items-center gap-3 text-xs text-[#9ca3af] mb-3">
                        <span>USD/EUR rate for this group:</span>
                        <input type="number" step="0.0001"
                          value={group.exchangeRate ?? ''}
                          placeholder={`${globalRate} (global)`}
                          onChange={e => {
                            const v = e.target.value;
                            updateGroup(group.id, { exchangeRate: v === '' ? null : parseFloat(v) || null });
                          }}
                          className="w-28 rounded border border-[#374151] bg-[#111827] px-2 py-1 text-white text-xs focus:border-[#60a5fa] focus:outline-none" />
                        {group.exchangeRate !== null && (
                          <button onClick={() => updateGroup(group.id, { exchangeRate: null })}
                            className="text-[#6b7280] hover:text-white text-xs underline">use global</button>
                        )}
                      </div>

                      {/* Items */}
                      <div className="space-y-1">
                        {/* Column headers */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-2 pb-1 text-[10px] uppercase tracking-wide text-[#6b7280]">
                          <span>Description</span>
                          <span className="w-28 text-right">Amount</span>
                          <span className="w-14 text-center">Cur</span>
                          <span className="w-20 text-right">EUR</span>
                          <span className="w-8 text-center">Inc</span>
                        </div>

                        {group.items.map(item => {
                          const eurVal = toEUR(item, rate);
                          const excluded = !item.includeInLanded;
                          return (
                            <div key={item.id}
                              className={`grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 rounded-lg px-2 py-1.5 transition-colors
                                ${excluded ? 'opacity-40' : 'bg-[#111827]'}`}>
                              {/* Label */}
                              <div className="min-w-0">
                                <input
                                  value={item.label}
                                  onChange={e => updateItem(group.id, item.id, { label: e.target.value })}
                                  className="w-full bg-transparent text-sm text-white focus:outline-none focus:underline truncate"
                                />
                                {item.note && (
                                  <p className="text-[10px] text-[#6b7280] truncate">{item.note}</p>
                                )}
                              </div>
                              {/* Amount */}
                              <input
                                type="number" step="0.01"
                                value={item.amount}
                                onChange={e => updateItem(group.id, item.id, { amount: parseFloat(e.target.value) || 0 })}
                                className="w-28 rounded border border-[#374151] bg-[#0f172a] px-2 py-1 text-right text-sm text-white focus:border-[#60a5fa] focus:outline-none"
                              />
                              {/* Currency toggle */}
                              <button
                                onClick={() => updateItem(group.id, item.id, { currency: item.currency === 'USD' ? 'EUR' : 'USD' })}
                                className={`w-14 rounded px-1.5 py-1 text-xs font-bold transition-colors
                                  ${item.currency === 'USD' ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' : 'bg-[#374151] text-[#d1d5db] hover:bg-[#4b5563]'}`}>
                                {item.currency}
                              </button>
                              {/* EUR equivalent */}
                              <span className={`w-20 text-right text-sm font-semibold ${excluded ? 'text-[#6b7280]' : c.text}`}>
                                {fmtEUR(eurVal)}
                              </span>
                              {/* Include toggle */}
                              <div className="flex w-8 items-center justify-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={item.includeInLanded}
                                  onChange={e => updateItem(group.id, item.id, { includeInLanded: e.target.checked })}
                                  className="h-4 w-4 cursor-pointer accent-[#60a5fa]"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeItem(group.id, item.id); }}
                                  className="p-1 rounded text-[#6b7280] hover:text-red-400 hover:bg-white/10 transition-colors"
                                  title="Delete cost line"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Group footer: add item + subtotal */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#374151]">
                        <button onClick={() => addItem(group.id)}
                          className="flex items-center gap-1 text-xs text-[#9ca3af] hover:text-white transition-colors">
                          <Plus className="h-3.5 w-3.5" /> Add item
                        </button>
                        {gt.excluded > 0 && (
                          <span className="text-xs text-[#6b7280]">
                            {fmtEUR(gt.excluded)} excluded
                          </span>
                        )}
                        <span className={`text-sm font-bold ${c.text}`}>
                          Included: {fmtEUR(gt.included)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Goods Value */}
            <div className="animate-slide-up rounded-xl border border-[#374151] bg-[#1f2937] p-5 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-[#fb923c]" />
                <h3 className="font-bold text-white">Αξία Αγορών (Goods Value)</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#9ca3af]">Συνολική Αξία Αγορών</label>
                    <button
                      onClick={() => setGoodsCurrency(goodsCurrency === 'USD' ? 'EUR' : 'USD')}
                      className={`rounded px-2 py-0.5 text-xs font-bold transition-colors
                        ${goodsCurrency === 'USD'
                          ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                          : 'bg-[#374151] text-[#d1d5db] hover:bg-[#4b5563]'}`}
                    >
                      {goodsCurrency}
                    </button>
                  </div>
                  <input type="number" step="0.01" value={totalGoodsUSD}
                    onChange={e => setTotalGoodsUSD(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-[#374151] bg-[#111827] px-3 py-2 text-white focus:border-[#60a5fa] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]/30" />
                  {goodsCurrency === 'USD' && (
                    <p className="mt-1 text-xs text-[#9ca3af]">= {fmtEUR(goodsEUR)}</p>
                  )}
                </div>
                {goodsCurrency === 'USD' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#9ca3af]">USD/EUR Rate (customs entry)</label>
                    <input type="number" step="0.0001" value={goodsRate}
                      onChange={e => setGoodsRate(parseFloat(e.target.value) || 1)}
                      className="w-full rounded-lg border border-[#374151] bg-[#111827] px-3 py-2 text-white focus:border-[#60a5fa] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]/30" />
                  </div>
                )}
              </div>
              <div className="mt-3 rounded-lg bg-[#fb923c]/10 border border-[#fb923c]/30 px-4 py-2 flex justify-between text-sm">
                <span className="text-[#9ca3af]">Goods value in EUR</span>
                <span className="font-bold text-[#fb923c]">{fmtEUR(goodsEUR)}</span>
              </div>
            </div>

            {/* VAT notice */}
            <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-yellow-400" />
              <div>
                <strong>ΦΠΑ Εισαγωγής — Excluded</strong>
                <p className="mt-0.5 text-yellow-200/70 text-xs">
                  Import VAT is fully recovered via periodic VAT return. It is NOT included in landed cost. Toggle <em>ΦΠΑ Εισαγωγής</em> in the Customs group if you need to see it, but keep it unchecked for calculations.
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: results (sticky) ── */}
          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">

            {/* MULTIPLIER HERO */}
            <div className="animate-fade-in rounded-xl bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#0ea5e9] p-6 shadow-2xl">
              <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-white/70">MULTIPLIER</div>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-6xl font-black text-white tracking-tight">
                  {multiplier.toFixed(4)}
                </span>
                <button
                  onClick={copyMultiplier}
                  className="mb-1.5 flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/30 transition-colors active:scale-95">
                  {copied ? <CheckCheck className="h-4 w-4 text-green-300" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="text-3xl font-bold text-white/90 mb-4">{markupPct.toFixed(2)}%</div>
              <div className="rounded-lg bg-white/10 px-4 py-2 font-mono text-sm text-white">
                = [Price] × {multiplier.toFixed(4)}
              </div>
              <div className="mt-2 rounded-lg bg-white/10 px-4 py-2 font-mono text-sm text-white">
                = [Price] × (1 + {markupPct.toFixed(2)}%)
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="rounded-xl border border-[#374151] bg-[#1f2937] p-5">
              <h3 className="mb-4 font-bold text-white flex items-center gap-2">
                <Calculator className="h-4 w-4 text-[#60a5fa]" /> Summary
              </h3>

              <div className="space-y-2 text-sm">
                {groups.map(g => {
                  const c  = colorCls[g.color];
                  const gt = groupTotals.find(t => t.id === g.id)!;
                  return (
                    <div key={g.id} className="flex justify-between items-center py-1 border-b border-[#374151]/60">
                      <span className={`${c.text} truncate mr-2`}>{g.label.split('–')[0].trim()}</span>
                      <span className="font-semibold text-white shrink-0">{fmtEUR(gt.included)}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between items-center py-2 border-t-2 border-[#4b5563] mt-2">
                  <span className="text-[#9ca3af] font-semibold">Total Import Costs</span>
                  <span className="text-lg font-bold text-white">{fmtEUR(totalCostsEUR)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#9ca3af]">Total Goods Value</span>
                  <span className="font-semibold text-[#fb923c]">{fmtEUR(goodsEUR)}</span>
                </div>
                <div className="flex justify-between items-center py-1 rounded-lg bg-[#111827] px-3 mt-2">
                  <span className="text-[#9ca3af]">Markup %</span>
                  <span className="text-xl font-black text-[#60a5fa]">{markupPct.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Sample calculation */}
            <div className="rounded-xl border border-[#374151] bg-[#1f2937] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-[#34d399]" />
                <h3 className="font-bold text-white text-sm">Παράδειγμα Υπολογισμού</h3>
              </div>
              <label className="mb-1 block text-xs text-[#9ca3af]">Τιμή Αγοράς (€)</label>
              <input type="number" step="0.01" value={samplePrice}
                onChange={e => setSamplePrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-[#374151] bg-[#111827] px-3 py-2 text-white focus:border-[#34d399] focus:outline-none focus:ring-2 focus:ring-[#34d399]/30" />
              <div className="mt-3 rounded-lg bg-[#34d399]/10 border border-[#34d399]/30 p-4">
                <div className="text-xs text-[#9ca3af] mb-1">Landed Cost:</div>
                <div className="text-3xl font-black text-[#34d399]">{fmtEUR(sampleLanded)}</div>
                <div className="mt-1 text-xs text-[#9ca3af]">
                  +{fmtEUR(sampleLanded - samplePrice)} κόστος μεταφοράς
                </div>
              </div>
            </div>

            {/* Cost bars */}
            <div className="rounded-xl border border-[#374151] bg-[#1f2937] p-5">
              <h3 className="mb-4 font-bold text-white text-sm flex items-center gap-2">
                <Ship className="h-4 w-4 text-[#22d3ee]" /> Ανάλυση Κόστους
              </h3>
              {totalCostsEUR > 0 && groups.map(g => {
                const c  = colorCls[g.color];
                const gt = groupTotals.find(t => t.id === g.id)!;
                const pct = (gt.included / totalCostsEUR) * 100;
                if (pct === 0) return null;
                const barColors: Record<GroupColor, string> = {
                  blue: 'bg-[#60a5fa]', green: 'bg-[#34d399]', red: 'bg-red-500',
                  orange: 'bg-[#fb923c]', purple: 'bg-purple-400', cyan: 'bg-[#22d3ee]',
                };
                return (
                  <div key={g.id} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`${c.text} truncate mr-2`}>{g.label.split('–')[0].trim()}</span>
                      <span className="text-[#9ca3af] shrink-0">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#374151]">
                      <div className={`h-2 rounded-full ${barColors[g.color]} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <SnapshotsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        snapshots={snapshots}
        loading={snapsLoading}
        onLoad={loadSnapshot}
        onDelete={deleteSnapshot}
      />
    </div>
  );
}

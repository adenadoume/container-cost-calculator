import { useState, useEffect, useCallback, useRef } from 'react';
import type { CostGroup } from '../types';

const API = '/api';
const SAVE_DELAY_MS = 1200;

export interface CalculatorState {
  groups: CostGroup[];
  totalGoodsUSD: number;
  goodsRate: number;
  globalRate: number;
  rateDate: string;
  samplePrice: number;
}

const defaultState: CalculatorState = {
  groups: [],
  totalGoodsUSD: 53870.46,
  goodsRate: 1.1651,
  globalRate: 1.1651,
  rateDate: new Date().toISOString().slice(0, 10),
  samplePrice: 100,
};

export function useCalculator(initialGroups: CostGroup[]) {
  const [state, setState] = useState<CalculatorState>({
    ...defaultState,
    groups: initialGroups,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCalculator = useCallback(async () => {
    try {
      const res = await fetch(`${API}/calculator`);
      if (res.ok) {
        const data = await res.json();
        const groups = Array.isArray(data.groups) && data.groups.length > 0
          ? (data.groups as CostGroup[])
          : initialGroups;
        setState({
          groups,
          totalGoodsUSD: Number(data.total_goods_usd) ?? defaultState.totalGoodsUSD,
          goodsRate: Number(data.goods_rate) ?? defaultState.goodsRate,
          globalRate: Number(data.global_rate) ?? defaultState.globalRate,
          rateDate: data.rate_date ?? defaultState.rateDate,
          samplePrice: Number(data.sample_price) ?? defaultState.samplePrice,
        });
      }
    } catch {
      setState(s => ({ ...s, groups: initialGroups }));
    } finally {
      setLoading(false);
    }
  }, [initialGroups]);

  useEffect(() => {
    fetchCalculator();
  }, [fetchCalculator]);

  const saveCalculator = useCallback(async (s: CalculatorState) => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API}/calculator`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          global_rate: s.globalRate,
          rate_date: s.rateDate,
          total_goods_usd: s.totalGoodsUSD,
          goods_rate: s.goodsRate,
          sample_price: s.samplePrice,
          groups: s.groups,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data?.details as string) || (data?.error as string) || `HTTP ${res.status}`;
        setSaveError(msg);
      }
    } catch {
      setSaveError('Network error');
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      saveCalculator(state);
    }, SAVE_DELAY_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state, loading, saveCalculator]);

  return {
    ...state,
    setGroups: (g: CostGroup[] | ((prev: CostGroup[]) => CostGroup[])) =>
      setState(prev => ({ ...prev, groups: typeof g === 'function' ? g(prev.groups) : g })),
    setTotalGoodsUSD: (v: number | ((p: number) => number)) =>
      setState(prev => ({ ...prev, totalGoodsUSD: typeof v === 'function' ? v(prev.totalGoodsUSD) : v })),
    setGoodsRate: (v: number | ((p: number) => number)) =>
      setState(prev => ({ ...prev, goodsRate: typeof v === 'function' ? v(prev.goodsRate) : v })),
    setGlobalRate: (v: number | ((p: number) => number)) =>
      setState(prev => ({ ...prev, globalRate: typeof v === 'function' ? v(prev.globalRate) : v })),
    setRateDate: (v: string) => setState(prev => ({ ...prev, rateDate: v })),
    setSamplePrice: (v: number | ((p: number) => number)) =>
      setState(prev => ({ ...prev, samplePrice: typeof v === 'function' ? v(prev.samplePrice) : v })),
    loading,
    saving,
    saveError,
    setSaveError: () => setSaveError(null),
    refetch: fetchCalculator,
  };
}

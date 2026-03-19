import { useState, useEffect, useCallback } from 'react';

const API = '/api';

/** Parse response as JSON; if body is empty or invalid, return null and set error message. */
async function parseJson(res: Response): Promise<{ data: Record<string, unknown> | null; error?: string }> {
  const text = await res.text();
  if (!text.trim()) {
    return { data: null, error: `Server returned empty response (${res.status})` };
  }
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    return { data };
  } catch {
    return { data: null, error: `Invalid response (${res.status}). ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}` };
  }
}

export interface ContainerInfo {
  title: string;
  mbl: string;
  container_code: string;
  ref_no: string;
}

const defaults: ContainerInfo = {
  title: 'SUDU8701372',
  mbl: '255436388',
  container_code: 'I110.15',
  ref_no: '12239',
};

export function useContainer() {
  const [container, setContainer] = useState<ContainerInfo>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchContainer = useCallback(async () => {
    try {
      const res = await fetch(`${API}/container`);
      const { data, error } = await parseJson(res);
      if (error) {
        if (res.ok) setSaveError(error);
        return;
      }
      if (res.ok && data) {
        setContainer({
          title: (data.title as string) ?? defaults.title,
          mbl: (data.mbl as string) ?? defaults.mbl,
          container_code: (data.container_code as string) ?? defaults.container_code,
          ref_no: (data.ref_no as string) ?? defaults.ref_no,
        });
      }
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContainer();
  }, [fetchContainer]);

  const updateContainer = useCallback(async (updates: Partial<ContainerInfo>) => {
    setSaving(true);
    setSaveError(null);
    // Optimistic update so the UI shows the new value immediately instead of reverting
    setContainer(prev => ({ ...prev, ...updates }));
    try {
      const res = await fetch(`${API}/container`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const { data, error: parseError } = await parseJson(res);
      if (parseError) {
        setSaveError(parseError);
        fetchContainer();
        return;
      }
      if (res.ok && data) {
        setContainer({
          title: (data.title as string) ?? container.title,
          mbl: (data.mbl as string) ?? container.mbl,
          container_code: (data.container_code as string) ?? container.container_code,
          ref_no: (data.ref_no as string) ?? container.ref_no,
        });
      } else {
        const msg = (data?.details as string) || (data?.error as string) || `HTTP ${res.status}`;
        setSaveError(msg);
        console.error('Container save failed:', res.status, data);
        fetchContainer();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setSaveError(msg);
      fetchContainer();
    } finally {
      setSaving(false);
    }
  }, [container.title, container.mbl, container.container_code, container.ref_no, fetchContainer]);

  return { container, loading, saving, saveError, setSaveError: () => setSaveError(null), updateContainer, refetch: fetchContainer };
}

import { useState, useEffect, useCallback } from 'react';

const API = '/api';

export interface ContainerInfo {
  title: string;
  mbl: string;
}

export function useContainer() {
  const [container, setContainer] = useState<ContainerInfo>({ title: 'SUDU8701372', mbl: '255436388' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchContainer = useCallback(async () => {
    try {
      const res = await fetch(`${API}/container`);
      if (res.ok) {
        const data = await res.json();
        setContainer({ title: data.title ?? 'SUDU8701372', mbl: data.mbl ?? '255436388' });
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
    try {
      const res = await fetch(`${API}/container`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setContainer({ title: data.title ?? container.title, mbl: data.mbl ?? container.mbl });
      }
    } finally {
      setSaving(false);
    }
  }, [container.title, container.mbl]);

  return { container, loading, saving, updateContainer, refetch: fetchContainer };
}

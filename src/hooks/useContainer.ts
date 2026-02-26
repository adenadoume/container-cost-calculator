import { useState, useEffect, useCallback } from 'react';

const API = '/api';

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

  const fetchContainer = useCallback(async () => {
    try {
      const res = await fetch(`${API}/container`);
      if (res.ok) {
        const data = await res.json();
        setContainer({
          title: data.title ?? defaults.title,
          mbl: data.mbl ?? defaults.mbl,
          container_code: data.container_code ?? defaults.container_code,
          ref_no: data.ref_no ?? defaults.ref_no,
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
    try {
      const res = await fetch(`${API}/container`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setContainer({
          title: data.title ?? container.title,
          mbl: data.mbl ?? container.mbl,
          container_code: data.container_code ?? container.container_code,
          ref_no: data.ref_no ?? container.ref_no,
        });
      }
    } finally {
      setSaving(false);
    }
  }, [container.title, container.mbl, container.container_code, container.ref_no]);

  return { container, loading, saving, updateContainer, refetch: fetchContainer };
}

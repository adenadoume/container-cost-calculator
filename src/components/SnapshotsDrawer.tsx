import { X, Trash2, FolderOpen } from 'lucide-react';
import type { CostGroup } from '../types';

export interface SnapshotCalculator {
  groups: CostGroup[];
  totalGoodsUSD: number;
  goodsRate: number;
  globalRate: number;
  rateDate: string;
  samplePrice: number;
}

export interface SnapshotContainer {
  title: string;
  mbl: string;
  container_code: string;
  ref_no: string;
}

export interface SnapshotEntry {
  id: string;
  name: string;
  created_at: string;
  container: SnapshotContainer;
  calculator: SnapshotCalculator;
}

interface Props {
  open: boolean;
  onClose: () => void;
  snapshots: SnapshotEntry[];
  loading: boolean;
  onLoad: (snap: SnapshotEntry) => void;
  onDelete: (id: string) => void;
}

export function SnapshotsDrawer({ open, onClose, snapshots, loading, onLoad, onDelete }: Props) {
  const handleLoad = (snap: SnapshotEntry) => {
    if (!window.confirm(`Load "${snap.name}"? This will replace your current working state.`)) return;
    onLoad(snap);
    onClose();
  };

  const handleDelete = (snap: SnapshotEntry) => {
    if (!window.confirm(`Delete "${snap.name}"?`)) return;
    onDelete(snap.id);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-[#1f2937] border-l border-[#374151] z-50 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151]">
          <h2 className="font-bold text-white">Saved Containers</h2>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto h-[calc(100%-52px)] p-3 space-y-2">
          {loading && (
            <p className="text-[#9ca3af] text-sm text-center py-10">Loading…</p>
          )}
          {!loading && snapshots.length === 0 && (
            <p className="text-[#6b7280] text-sm text-center py-10">
              No saved containers yet.<br />
              <span className="text-xs">Click <strong className="text-[#9ca3af]">Save</strong> in the header to save the current state.</span>
            </p>
          )}
          {snapshots.map(snap => (
            <div key={snap.id} className="rounded-lg border border-[#374151] bg-[#111827] p-3">
              <div className="font-mono font-bold text-white text-sm">{snap.name}</div>
              <div className="text-xs text-[#6b7280] mt-0.5">{snap.container.title}</div>
              <div className="text-xs text-[#6b7280] mb-2">
                {new Date(snap.created_at).toLocaleString('el-GR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoad(snap)}
                  className="flex-1 flex items-center justify-center gap-1 rounded bg-[#2563eb] hover:bg-[#3b82f6] px-2 py-1.5 text-xs font-semibold text-white transition-colors"
                >
                  <FolderOpen className="h-3.5 w-3.5" /> Load
                </button>
                <button
                  onClick={() => handleDelete(snap)}
                  className="flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500/40 px-2.5 py-1.5 text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

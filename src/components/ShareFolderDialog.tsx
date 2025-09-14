// src/components/ShareFolderDialog.tsx
import { useEffect, useState } from 'react';
import {
  createShare,
  listShares,
  revokeShare,
  // dacă ai și endpoint by-email, decomentează-l și îl folosim ca fallback:
  // revokeShareByEmail,
} from '@/api/folders';
import type { ShareItem, Permission } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

type Props = {
  folderId: string;
  onClose: () => void;
};

export function ShareFolderDialog({ folderId, onClose }: Props) {
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [email, setEmail] = useState('');
  const [perm, setPerm] = useState<Permission>('READ');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listShares(folderId);
      setShares(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [folderId]);

  const onAdd = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) return;
    setSaving(true);
    try {
      await createShare(folderId, { targetEmail, permission: perm });
      setEmail('');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async (share: ShareItem) => {
    if (!share.sharedWithUserId) {
      // fallback – doar dacă NU ai câmpul în payload
      // await revokeShareByEmail(folderId, share.sharedWithEmail);
      console.error('sharedWithUserId missing on ShareItem');
      return;
    }
  
    setSaving(true);
    try {
      await revokeShare(folderId, share.sharedWithUserId); // ✅ trimiți userId, nu share.id
      await load();
    } finally {
      setSaving(false);
    }
  };
  

  return (
    <div className="w-full max-w-lg">
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>Share folder</DialogTitle>
      </DialogHeader>

      <div className="px-6 py-4 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="email@exemplu.ro"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Select value={perm} onValueChange={(v) => setPerm(v as Permission)}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Perm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="READ">READ</SelectItem>
              <SelectItem value="WRITE">WRITE</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onAdd} disabled={!email.trim() || saving}>
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : shares.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nimeni încă.</div>
          ) : (
            shares.map(s => (
              <div key={s.id} className="flex items-center justify-between border rounded-lg p-2">
                <div>
                  <div className="text-sm">{s.sharedWithEmail}</div>
                  <div className="text-xs text-muted-foreground">{s.permission}</div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onRemove(s)}
                  disabled={saving}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <DialogFooter className="px-6 pb-6">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </DialogFooter>
    </div>
  );
}

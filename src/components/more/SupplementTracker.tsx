'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Pill, Check, X, Clock } from 'lucide-react';

interface SupplementTrackerProps {
  onBack: () => void;
}

interface Supplement {
  id: string;
  name: string;
  dosage: string;
  hour: number;
  minute: number;
}

interface SupplementLog {
  id: string;
  supplementId: string;
  date: string;
  taken: boolean;
}

export default function SupplementTracker({ onBack }: SupplementTrackerProps) {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [logs, setLogs] = useState<SupplementLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const [newSupplement, setNewSupplement] = useState({
    name: '',
    dosage: '',
    hour: 8,
    minute: 0,
  });

  useEffect(() => {
    const savedSups = localStorage.getItem('supplements');
    const savedLogs = localStorage.getItem('supplementLogs');
    if (savedSups) setSupplements(JSON.parse(savedSups));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  const handleAddSupplement = (): void => {
    if (!newSupplement.name.trim() || !newSupplement.dosage.trim()) return;

    const newSup: Supplement = {
      id: Date.now().toString(),
      name: newSupplement.name,
      dosage: newSupplement.dosage,
      hour: newSupplement.hour,
      minute: newSupplement.minute,
    };

    const updated = [...supplements, newSup];
    setSupplements(updated);
    localStorage.setItem('supplements', JSON.stringify(updated));

    setNewSupplement({ name: '', dosage: '', hour: 8, minute: 0 });
    setIsDialogOpen(false);
  };

  const toggleSupplementLog = (supplementId: string, isTaken: boolean): void => {
    const today = new Date().toISOString().split('T')[0];
    const existing = logs.findIndex(
      (log: SupplementLog) => log.supplementId === supplementId && log.date === today
    );

    let updated: SupplementLog[];
    if (existing >= 0) {
      updated = logs.map((log: SupplementLog, i: number) =>
        i === existing ? { ...log, taken: isTaken } : log
      );
    } else {
      const newLog: SupplementLog = {
        id: Date.now().toString(),
        supplementId,
        date: today,
        taken: isTaken,
      };
      updated = [...logs, newLog];
    }

    setLogs(updated);
    localStorage.setItem('supplementLogs', JSON.stringify(updated));
  };

  const getTodayLog = (supplementId: string): SupplementLog | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return logs.find(
      (log: SupplementLog) => log.supplementId === supplementId && log.date === today
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Takviye Takibi</h2>
        <Button variant="outline" onClick={onBack}>
          Geri
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Takviye Ekle
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Takviye</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sup-name">Takviye Adı</Label>
              <Input
                id="sup-name"
                value={newSupplement.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewSupplement((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Örn: Vitamin D3"
              />
            </div>

            <div>
              <Label htmlFor="dosage">Doz</Label>
              <Input
                id="dosage"
                value={newSupplement.dosage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewSupplement((prev) => ({ ...prev, dosage: e.target.value }))
                }
                placeholder="Örn: 1000 IU"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hour">Saat</Label>
                <Input
                  id="hour"
                  type="number"
                  min="0"
                  max="23"
                  value={newSupplement.hour}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewSupplement((prev) => ({
                      ...prev,
                      hour: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="minute">Dakika</Label>
                <Input
                  id="minute"
                  type="number"
                  min="0"
                  max="59"
                  value={newSupplement.minute}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewSupplement((prev) => ({
                      ...prev,
                      minute: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <Button onClick={handleAddSupplement} className="w-full">
              Ekle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {supplements.map((supplement: Supplement) => {
          const todayLog = getTodayLog(supplement.id);
          const isTaken = todayLog?.taken || false;

          return (
            <Card key={supplement.id} className="bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Pill className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{supplement.name}</h3>
                      <p className="text-sm text-gray-600">{supplement.dosage}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {String(supplement.hour).padStart(2, '0')}:
                        {String(supplement.minute).padStart(2, '0')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isTaken ? 'default' : 'outline'}
                      onClick={() => toggleSupplementLog(supplement.id, true)}
                      className={isTaken ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={isTaken === false ? 'destructive' : 'outline'}
                      onClick={() => toggleSupplementLog(supplement.id, false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {supplements.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Henüz takviye eklemediniz.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

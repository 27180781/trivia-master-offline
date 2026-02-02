import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ArrowRight, 
  ToggleLeft,
  ToggleRight,
  Key,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AdminPinEntry from '@/components/AdminPinEntry';
import { 
  getLicenseStore, 
  addLicense, 
  deleteLicense, 
  toggleLicenseActive,
  generateLicenseCode,
  setAdminPin,
  getAdminPin
} from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { License } from '@/types';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [licenses, setLicenses] = useState<License[]>(() => getLicenseStore().licenses);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newMaxActivations, setNewMaxActivations] = useState('10');
  const [newPin, setNewPin] = useState('');

  const refreshLicenses = () => {
    setLicenses(getLicenseStore().licenses);
  };

  const handleGenerateCode = () => {
    setNewCode(generateLicenseCode());
  };

  const handleAddLicense = () => {
    if (!newCode.trim()) {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'יש להזין קוד רישיון' });
      return;
    }

    const maxActivations = parseInt(newMaxActivations, 10);
    if (isNaN(maxActivations) || maxActivations < 1) {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'מספר הפעלות לא תקין' });
      return;
    }

    addLicense({ code: newCode.toUpperCase(), maxActivations });
    refreshLicenses();
    setShowAddDialog(false);
    setNewCode('');
    setNewMaxActivations('10');
    
    toast({ title: 'הצלחה', description: 'רישיון נוסף בהצלחה' });
  };

  const handleDeleteLicense = (code: string) => {
    deleteLicense(code);
    refreshLicenses();
    toast({ title: 'נמחק', description: 'הרישיון נמחק בהצלחה' });
  };

  const handleToggleActive = (code: string) => {
    toggleLicenseActive(code);
    refreshLicenses();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'הועתק', description: 'הקוד הועתק ללוח' });
  };

  const handleChangePin = () => {
    if (newPin.length < 4) {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'קוד PIN חייב להיות לפחות 4 תווים' });
      return;
    }
    setAdminPin(newPin);
    setShowPinDialog(false);
    setNewPin('');
    toast({ title: 'הצלחה', description: 'קוד PIN עודכן בהצלחה' });
  };

  if (!isAuthenticated) {
    return <AdminPinEntry onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">ניהול רישיונות</h1>
            <p className="text-muted-foreground mt-1">ניהול קודי הפעלה למערכת</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPinDialog(true)}>
              <Key className="w-4 h-4 ml-2" />
              שנה PIN
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-muted-foreground text-sm">סה"כ רישיונות</p>
            <p className="text-3xl font-bold mt-1">{licenses.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-muted-foreground text-sm">רישיונות פעילים</p>
            <p className="text-3xl font-bold mt-1 text-game-correct">
              {licenses.filter(l => l.isActive).length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-muted-foreground text-sm">סה"כ הפעלות</p>
            <p className="text-3xl font-bold mt-1">
              {licenses.reduce((acc, l) => acc + l.usedActivations, 0)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <Button onClick={() => { handleGenerateCode(); setShowAddDialog(true); }}>
            <Plus className="w-4 h-4 ml-2" />
            הוסף רישיון חדש
          </Button>
          <Button variant="secondary" onClick={() => navigate('/package')}>
            <Package className="w-4 h-4 ml-2" />
            ארוז משחק ללקוח
          </Button>
        </div>

        {/* Licenses Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">קוד רישיון</TableHead>
                <TableHead className="text-right">הפעלות</TableHead>
                <TableHead className="text-right">נוצר</TableHead>
                <TableHead className="text-right">שימוש אחרון</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    אין רישיונות. לחץ על "הוסף רישיון חדש" להתחיל.
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((license) => (
                  <TableRow key={license.code}>
                    <TableCell className="font-mono text-sm" dir="ltr">
                      {license.code}
                    </TableCell>
                    <TableCell>
                      <span className={license.usedActivations >= license.maxActivations ? 'text-destructive' : ''}>
                        {license.usedActivations} / {license.maxActivations}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(license.createdAt).toLocaleDateString('he-IL')}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {license.lastUsedAt 
                        ? new Date(license.lastUsedAt).toLocaleDateString('he-IL') 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        license.isActive 
                          ? 'bg-game-correct/20 text-game-correct' 
                          : 'bg-destructive/20 text-destructive'
                      }`}>
                        {license.isActive ? 'פעיל' : 'מושבת'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyCode(license.code)}
                          title="העתק קוד"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(license.code)}
                          title={license.isActive ? 'השבת' : 'הפעל'}
                        >
                          {license.isActive 
                            ? <ToggleRight className="w-4 h-4 text-game-correct" />
                            : <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLicense(license.code)}
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add License Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוסף רישיון חדש</DialogTitle>
              <DialogDescription>
                צור קוד רישיון חדש עם מספר הפעלות מוגדר
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">קוד רישיון</label>
                <div className="flex gap-2">
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX"
                    className="font-mono"
                    dir="ltr"
                  />
                  <Button variant="outline" onClick={handleGenerateCode}>
                    חדש
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">מספר הפעלות מקסימלי</label>
                <Input
                  type="number"
                  value={newMaxActivations}
                  onChange={(e) => setNewMaxActivations(e.target.value)}
                  min="1"
                  dir="ltr"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                ביטול
              </Button>
              <Button onClick={handleAddLicense}>
                הוסף רישיון
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change PIN Dialog */}
        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>שנה קוד PIN</DialogTitle>
              <DialogDescription>
                הזן קוד PIN חדש לגישה לפאנל הניהול
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="קוד PIN חדש"
                className="text-center text-xl tracking-widest"
                dir="ltr"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPinDialog(false)}>
                ביטול
              </Button>
              <Button onClick={handleChangePin}>
                שמור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
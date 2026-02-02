import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Upload, 
  Download, 
  FileText, 
  Image, 
  ArrowRight,
  CheckCircle2,
  Copy,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/contexts/GameContext';
import { parseExcelFile } from '@/lib/excelParser';
import { createGamePackage, exportGamePackage, generateEmbeddedGameContent } from '@/lib/gamePackager';
import { TriviaQuestion } from '@/types';
import AdminPinEntry from '@/components/AdminPinEntry';

export default function PackageExport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { questions: contextQuestions } = useGame();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [questions, setQuestions] = useState<TriviaQuestion[]>(contextQuestions);
  const [gameName, setGameName] = useState('');
  const [customLogo, setCustomLogo] = useState<string | undefined>();
  const [logoFileName, setLogoFileName] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);
  const [embedCode, setEmbedCode] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseExcelFile(file);
      if (!result.success || result.questions.length === 0) {
        toast({ 
          variant: 'destructive', 
          title: 'שגיאה', 
          description: result.errors[0] || 'לא נמצאו שאלות בקובץ' 
        });
        return;
      }
      setQuestions(result.questions);
      toast({ 
        title: 'הצלחה', 
        description: `נטענו ${result.questions.length} שאלות מהקובץ` 
      });
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'שגיאה', 
        description: error instanceof Error ? error.message : 'שגיאה בקריאת הקובץ' 
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'יש להעלות קובץ תמונה' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomLogo(event.target?.result as string);
      setLogoFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleExport = () => {
    if (!gameName.trim()) {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'יש להזין שם למשחק' });
      return;
    }

    if (questions.length === 0) {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'אין שאלות לייצוא' });
      return;
    }

    setIsExporting(true);
    
    try {
      const gamePackage = createGamePackage(gameName, questions, customLogo);
      exportGamePackage(gamePackage);
      
      toast({ 
        title: 'הצלחה', 
        description: `הקובץ ${gameName}.bravo נוצר בהצלחה` 
      });
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'שגיאה', 
        description: 'שגיאה ביצירת הקובץ' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateEmbedCode = () => {
    if (!gameName.trim()) {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'יש להזין שם למשחק' });
      return;
    }

    if (questions.length === 0) {
      toast({ variant: 'destructive', title: 'שגיאה', description: 'אין שאלות לייצוא' });
      return;
    }

    const gamePackage = createGamePackage(gameName, questions, customLogo);
    const code = generateEmbeddedGameContent(gamePackage);
    setEmbedCode(code);
    setShowEmbedCode(true);
  };

  const handleCopyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast({ title: 'הועתק', description: 'הקוד הועתק ללוח' });
  };

  if (!isAuthenticated) {
    return <AdminPinEntry onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              אריזת משחק ללקוח
            </h1>
            <p className="text-muted-foreground mt-1">
              צור חבילת משחק נעולה לשליחה ללקוחות
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה
          </Button>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {/* Step 1: Upload Excel */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">העלאת קובץ משחק</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  העלה קובץ Excel עם השאלות או השתמש במשחק הטעון כרגע
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 ml-2" />
                    העלה קובץ Excel
                  </Button>
                  
                  {questions.length > 0 && (
                    <div className="flex items-center gap-2 text-game-correct">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">{questions.length} שאלות טעונות</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Game Name */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">פרטי המשחק</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  הזן שם למשחק (יופיע בשם הקובץ)
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="gameName">שם המשחק / הלקוח</Label>
                    <Input
                      id="gameName"
                      value={gameName}
                      onChange={(e) => setGameName(e.target.value)}
                      placeholder="לדוגמה: חידון חברת ABC"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Optional Logo */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">לוגו (אופציונלי)</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  הוסף לוגו מותאם אישית למשחק
                </p>
                
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Image className="w-4 h-4 ml-2" />
                    העלה לוגו
                  </Button>
                  
                  {logoFileName && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{logoFileName}</span>
                    </div>
                  )}
                </div>
                
                {customLogo && (
                  <div className="mt-4">
                    <img 
                      src={customLogo} 
                      alt="לוגו" 
                      className="h-16 object-contain rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 4: Export */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">4</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">ייצוא</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  צור קובץ .bravo להורדה או קוד להטמעה
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleExport}
                    disabled={isExporting || questions.length === 0 || !gameName.trim()}
                  >
                    <Download className="w-4 h-4 ml-2" />
                    הורד קובץ .bravo
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    onClick={handleGenerateEmbedCode}
                    disabled={questions.length === 0 || !gameName.trim()}
                  >
                    <FileText className="w-4 h-4 ml-2" />
                    הצג קוד להטמעה
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Embed Code Display */}
          {showEmbedCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">קוד להטמעה ב-embedded-game.json</h3>
                <Button variant="outline" size="sm" onClick={handleCopyEmbedCode}>
                  <Copy className="w-4 h-4 ml-2" />
                  העתק
                </Button>
              </div>
              
              <div className="bg-muted rounded-lg p-4 overflow-auto max-h-64">
                <pre className="text-xs font-mono" dir="ltr">
                  {embedCode}
                </pre>
              </div>
              
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <strong>הוראות:</strong> החלף את תוכן הקובץ <code className="bg-muted px-1 rounded">src/data/embedded-game.json</code> בקוד הזה, ואז בנה את האפליקציה עם Electron.
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-muted/50 rounded-xl">
          <h3 className="font-semibold mb-3">תהליך האריזה המלא:</h3>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>העלה קובץ Excel עם השאלות</li>
            <li>הזן שם למשחק והוסף לוגו (אופציונלי)</li>
            <li>הורד קובץ .bravo או העתק את הקוד להטמעה</li>
            <li>החלף את תוכן <code className="bg-muted px-1 rounded">embedded-game.json</code></li>
            <li>הרץ <code className="bg-muted px-1 rounded">npm run build</code></li>
            <li>ארוז עם Electron לפי ההוראות בתיקיית <code className="bg-muted px-1 rounded">electron/</code></li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
}

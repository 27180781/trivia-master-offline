import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileSpreadsheet, 
  Play, 
  AlertCircle,
  CheckCircle2,
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseExcelFile, ParseResult } from '@/lib/excelParser';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';
import { isUnlocked, logout } from '@/lib/storage';

export default function Setup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setQuestions, questions } = useGame();
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not unlocked
  useEffect(() => {
    if (!isUnlocked()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx?|csv)$/i)) {
      toast({
        variant: 'destructive',
        title: 'קובץ לא נתמך',
        description: 'יש להעלות קובץ Excel או CSV',
      });
      return;
    }

    setIsLoading(true);
    const result = await parseExcelFile(file);
    setParseResult(result);
    
    if (result.success) {
      setQuestions(result.questions);
      toast({
        title: 'הקובץ נטען בהצלחה',
        description: `נמצאו ${result.questions.length} שאלות`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'שגיאה בקריאת הקובץ',
        description: result.errors[0] || 'אירעה שגיאה',
      });
    }
    
    setIsLoading(false);
  }, [setQuestions, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleStartGame = () => {
    if (questions.length === 0) {
      toast({
        variant: 'destructive',
        title: 'אין שאלות',
        description: 'יש להעלות קובץ שאלות תחילה',
      });
      return;
    }
    navigate('/game');
  };

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
            <h1 className="text-3xl font-bold">הגדרת משחק</h1>
            <p className="text-muted-foreground mt-1">העלה קובץ שאלות והתחל</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="w-4 h-4 ml-2" />
              הגדרות
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 ml-2" />
              התנתק
            </Button>
          </div>
        </div>

        {/* Upload Zone */}
        <motion.div
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center
            transition-colors cursor-pointer
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
            }
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-4">
            {isLoading ? (
              <>
                <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-lg">טוען קובץ...</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-medium mb-1">גרור קובץ לכאן</p>
                  <p className="text-muted-foreground">או לחץ לבחירת קובץ Excel/CSV</p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Parse Result */}
        {parseResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            {/* Success Summary */}
            {parseResult.success && (
              <div className="bg-game-correct/10 border border-game-correct/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-game-correct" />
                  <h3 className="text-lg font-semibold">הקובץ נטען בהצלחה</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-2xl font-bold">{parseResult.questions.length}</p>
                    <p className="text-sm text-muted-foreground">סה"כ</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-2xl font-bold">
                      {parseResult.questions.filter(q => !q.isSurvey && !q.isTextOnly).length}
                    </p>
                    <p className="text-sm text-muted-foreground">טריוויה</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-game-survey">
                      {parseResult.questions.filter(q => q.isSurvey && !q.isTextOnly).length}
                    </p>
                    <p className="text-sm text-muted-foreground">סקרים</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-400">
                      {parseResult.questions.filter(q => q.isTextOnly).length}
                    </p>
                    <p className="text-sm text-muted-foreground">טקסט</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-3">
                    <p className="text-2xl font-bold">
                      {Math.round(parseResult.questions.reduce((acc, q) => acc + q.timeLimit, 0) / 60)}
                    </p>
                    <p className="text-sm text-muted-foreground">דקות (משוער)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                  <h3 className="text-lg font-semibold">אזהרות</h3>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {parseResult.errors.slice(0, 5).map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                  {parseResult.errors.length > 5 && (
                    <li>• ועוד {parseResult.errors.length - 5} אזהרות...</li>
                  )}
                </ul>
              </div>
            )}

            {/* Questions Preview */}
            {parseResult.success && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  תצוגה מקדימה
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {parseResult.questions.slice(0, 10).map((q, i) => (
                    <div 
                      key={q.id} 
                      className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg"
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{q.question}</p>
                        <p className="text-sm text-muted-foreground">
                          {q.isTextOnly ? (
                            <span className="text-blue-400">שקופית טקסט</span>
                          ) : (
                            <>
                              {q.answers.length} תשובות • {q.timeLimit} שניות
                              {q.isSurvey && (
                                <span className="text-game-survey mr-2">• סקר</span>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                  {parseResult.questions.length > 10 && (
                    <p className="text-center text-muted-foreground text-sm py-2">
                      ועוד {parseResult.questions.length - 10} שאלות...
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Start Button */}
        {questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Button
              size="lg"
              className="w-full h-16 text-xl bg-gradient-primary hover:opacity-90"
              onClick={handleStartGame}
            >
              <Play className="w-6 h-6 ml-2" />
              התחל משחק
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
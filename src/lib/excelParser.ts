import * as XLSX from 'xlsx';
import { TriviaQuestion } from '@/types';

export interface ParseResult {
  success: boolean;
  questions: TriviaQuestion[];
  errors: string[];
}

// Header aliases for robust column detection
const HEADER_ALIASES: Record<string, string[]> = {
  question: ['שאלה', 'שאלות', 'Question'],
  correctAnswer: [
    'מס\' תשובה נכונה',
    'מס׳ תשובה נכונה', // Hebrew geresh
    'מספר תשובה נכונה',
    'מספר התשובה הנכונה',
    'תשובה נכונה',
    'Correct Answer',
    'correctAnswer',
  ],
  timeLimit: ['זמן מענה', 'זמן', 'טיימר', 'Time Limit', 'Timer', 'timeLimit'],
  points: ['ניקוד', 'נקודות', 'Points', 'points'],
};

// Answer column aliases (1-6)
const ANSWER_ALIASES: string[][] = [
  ['תשובה 1', 'Answer 1'],
  ['תשובה 2', 'Answer 2'],
  ['תשובה 3', 'Answer 3'],
  ['תשובה 4', 'Answer 4'],
  ['תשובה 5', 'Answer 5'],
  ['תשובה 6', 'Answer 6'],
];

// Values that indicate text-only slide
const TEXT_ONLY_VALUES = ['טקסט', 'text'];
// Values that indicate survey
const SURVEY_VALUES = ['סקר', 'survey'];

/**
 * Normalize a string for comparison: trim, lowercase (for non-Hebrew)
 */
function normalizeValue(val: string): string {
  return val.trim();
}

/**
 * Get a cell value from a row by trying multiple header aliases
 */
function getCellValue(row: Record<string, unknown>, aliases: string[]): string {
  for (const alias of aliases) {
    if (alias in row) {
      return String(row[alias] ?? '').trim();
    }
  }
  return '';
}

/**
 * Check if a header key exists in the row for any of the aliases
 */
function hasColumn(row: Record<string, unknown>, aliases: string[]): boolean {
  return aliases.some(alias => alias in row);
}

/**
 * Normalize text content: unify line breaks, convert <br/> to newlines
 */
function normalizeText(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n') // Convert HTML line breaks
    .replace(/\r\n/g, '\n') // Unify Windows line breaks
    .replace(/\r/g, '\n') // Unify old Mac line breaks
    .trim();
}

export function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
        
        if (jsonData.length === 0) {
          resolve({ success: false, questions: [], errors: ['הקובץ ריק או לא מכיל נתונים'] });
          return;
        }
        
        // Validate required columns exist (check first row)
        const firstRow = jsonData[0];
        
        if (!hasColumn(firstRow, HEADER_ALIASES.question)) {
          resolve({ 
            success: false, 
            questions: [], 
            errors: ['לא נמצאה עמודת שאלה. בדוק שיש כותרת "שאלה" בשורה הראשונה.'] 
          });
          return;
        }
        
        if (!hasColumn(firstRow, HEADER_ALIASES.correctAnswer)) {
          resolve({ 
            success: false, 
            questions: [], 
            errors: [
              'לא נמצאה עמודת תשובה נכונה. בדוק שיש כותרת כמו "מס\' תשובה נכונה" או "מספר התשובה הנכונה" בשורה הראשונה.'
            ] 
          });
          return;
        }
        
        const questions: TriviaQuestion[] = [];
        const errors: string[] = [];
        
        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // Excel row number (1-indexed + header)
          
          // Get question text
          const questionText = normalizeText(getCellValue(row, HEADER_ALIASES.question));
          if (!questionText) {
            errors.push(`שורה ${rowNum}: חסרה שאלה`);
            return;
          }
          
          // Collect non-empty answers using aliases
          const answers: string[] = [];
          for (let i = 0; i < ANSWER_ALIASES.length; i++) {
            const answer = getCellValue(row, ANSWER_ALIASES[i]);
            if (answer) {
              answers.push(normalizeText(answer));
            }
          }
          
          // Parse correct answer
          const correctAnswerRaw = normalizeValue(getCellValue(row, HEADER_ALIASES.correctAnswer));
          let correctAnswerIndex: number | null = null;
          let isSurvey = false;
          let isTextOnly = false;
          
          // Check for text-only slides (case-insensitive for English)
          if (TEXT_ONLY_VALUES.some(v => 
            correctAnswerRaw === v || correctAnswerRaw.toLowerCase() === v.toLowerCase()
          )) {
            isTextOnly = true;
          } else if (SURVEY_VALUES.some(v => 
            correctAnswerRaw === v || correctAnswerRaw.toLowerCase() === v.toLowerCase()
          ) || correctAnswerRaw === '') {
            isSurvey = true;
          } else {
            const parsed = parseInt(correctAnswerRaw, 10);
            if (isNaN(parsed) || parsed < 1 || parsed > answers.length) {
              errors.push(`שורה ${rowNum}: מספר תשובה נכונה לא תקין (${correctAnswerRaw})`);
              return;
            }
            correctAnswerIndex = parsed - 1; // Convert to 0-indexed
          }
          
          // Validate answers only for non-text slides
          if (!isTextOnly && answers.length < 2) {
            errors.push(`שורה ${rowNum}: נדרשות לפחות 2 תשובות`);
            return;
          }
          
          // Parse time limit
          const timeLimitRaw = getCellValue(row, HEADER_ALIASES.timeLimit);
          let timeLimit = isTextOnly ? 0 : 30; // default: 0 for text, 30 for questions
          if (timeLimitRaw !== '') {
            const parsed = parseInt(timeLimitRaw, 10);
            if (!isNaN(parsed) && parsed >= 0) {
              timeLimit = parsed;
            }
          }
          
          // Parse points (optional)
          const pointsRaw = getCellValue(row, HEADER_ALIASES.points);
          let points: number | undefined;
          if (pointsRaw !== '') {
            const parsed = parseInt(pointsRaw, 10);
            if (!isNaN(parsed)) {
              points = parsed;
            }
          }
          
          questions.push({
            id: index + 1,
            question: questionText,
            answers,
            correctAnswerIndex,
            timeLimit,
            points,
            isSurvey,
            isTextOnly,
          });
        });
        
        resolve({
          success: questions.length > 0,
          questions,
          errors,
        });
      } catch (error) {
        resolve({
          success: false,
          questions: [],
          errors: [`שגיאה בקריאת הקובץ: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`],
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        questions: [],
        errors: ['שגיאה בקריאת הקובץ'],
      });
    };
    
    reader.readAsBinaryString(file);
  });
}

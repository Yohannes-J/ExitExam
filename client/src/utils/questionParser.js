/**
 * Parse plain text extracted from PDF/Word into question objects.
 *
 * Handles real-world exam formats like:
 *   1. Question text?
 *   A. Option A   or   A) Option A
 *   B. Option B
 *   C. Option C
 *   D. Option D
 *   ANSWER: B   or   Answer: B.
 */

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

export function parseQuestionsFromText(rawText) {
  if (!rawText || !rawText.trim()) return [];

  // Normalize: collapse multiple spaces, fix common PDF extraction issues
  let text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Normalize option lines: ensure A. / A) are on their own line
    .replace(/([A-D][.)]\s)/g, '\n$1')
    // Normalize ANSWER lines
    .replace(/(ANSWER|Answer|answer)\s*:/g, '\nANSWER:')
    // Split run-together question numbers: "...text D. option ANSWER: X 2. Next question"
    .replace(/(\d+)\.\s+(?=[A-Z])/g, '\n$1. ');

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const questions = [];
  const seenNumbers = new Set(); // prevent duplicate question numbers

  let currentQ = null;
  let currentQNum = null;
  let currentOptions = [];
  let answerRaw = '';

  const saveQuestion = () => {
    if (!currentQ || !currentQ.trim()) return;

    // Clean up question text — remove leading number
    const qText = currentQ.replace(/^\d+[\.\)]\s*/, '').trim();
    if (!qText) return;

    const type = detectType(currentOptions, answerRaw);
    const q = {
      text: qText,
      code: '',
      type,
      options: [],
      correctIndex: 0,
      correctText: '',
      points: 1,
    };

    if (type === 'mcq') {
      q.options = currentOptions.length >= 2 ? currentOptions : ['', '', '', ''];
      const idx = OPTION_LABELS.indexOf(answerRaw.trim().toUpperCase().replace(/\.$/, ''));
      q.correctIndex = idx >= 0 ? idx : 0;
    } else if (type === 'truefalse') {
      q.options = ['True', 'False'];
      q.correctIndex = answerRaw.trim().toUpperCase().startsWith('T') ? 0 : 1;
    } else if (type === 'short') {
      q.correctText = answerRaw.trim();
    }

    questions.push(q);
  };

  for (const line of lines) {
    // Skip header/footer lines
    if (
      /^S\s*o\s*f\s*t\s*w\s*a\s*r\s*e/.test(line) || // spaced-out header
      /^Page\s+\d+/i.test(line) ||
      /^Instruction:/i.test(line) ||
      /^Program:/i.test(line) ||
      /^Exam Type:/i.test(line) ||
      /^Exam Item:/i.test(line) ||
      /^Number of Questions:/i.test(line) ||
      /^Time Allowed:/i.test(line) ||
      /^St\.Name/i.test(line) ||
      /^IDNo/i.test(line) ||
      /^May \d+/i.test(line) ||
      /^Jimma University/i.test(line) ||
      /^\d+\s*\|\s*\d+$/.test(line) || // page numbers like "7 | 28"
      line.length < 2
    ) continue;

    // ANSWER line
    const ansMatch = line.match(/^(?:ANSWER|Answer|ans(?:wer)?)\s*[:\-]\s*(.+)/i);
    if (ansMatch) {
      answerRaw = ansMatch[1].trim().replace(/\.$/, '');
      continue;
    }

    // Option line: A. text  or  A) text
    const optMatch = line.match(/^([A-Ea-e])[.)]\s+(.+)/);
    if (optMatch) {
      currentOptions.push(optMatch[2].trim());
      continue;
    }

    // Question number line: 1. text  or  1) text
    // Must have at least 10 chars of content to avoid picking up stray numbers
    const qMatch = line.match(/^(\d+)[.)]\s+(.{10,})/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]);
      // Skip if we've already seen this question number (duplicate from page headers)
      if (seenNumbers.has(qNum)) continue;
      seenNumbers.add(qNum);
      // Save previous question
      saveQuestion();
      // Start new question
      currentQ = line;
      currentOptions = [];
      answerRaw = '';
      continue;
    }

    // Continuation of question text (before options appear)
    if (currentQ && currentOptions.length === 0 && !answerRaw) {
      currentQ += ' ' + line;
    }
  }

  // Save last question
  saveQuestion();

  return questions;
}

function detectType(options, answerRaw) {
  if (!answerRaw) return options.length >= 2 ? 'mcq' : 'essay';
  const ans = answerRaw.trim().toUpperCase().replace(/\.$/, '');
  if (ans === 'TRUE' || ans === 'FALSE') return 'truefalse';
  if (OPTION_LABELS.includes(ans) && options.length >= 2) return 'mcq';
  if (options.length === 0) return 'short';
  return 'mcq';
}

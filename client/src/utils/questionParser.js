/**
 * Parse plain text into question objects.
 *
 * Supported formats:
 *
 * MCQ:
 *   1. Question text?
 *   A) Option A   or   A. Option A
 *   B) Option B
 *   C) Option C
 *   D) Option D
 *   Answer: B   or   Correct: B
 *
 * True/False:
 *   1. Statement text?
 *   Answer: True   or   Answer: False
 *
 * Short Answer:
 *   1. Question text?
 *   Answer: Expected answer text
 *   (when answer is not A/B/C/D and not True/False)
 *
 * Essay:
 *   1. Question text?
 *   (no answer line — or Answer: [essay])
 */

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

function detectType(options, answerRaw) {
  if (!answerRaw) return 'essay';
  const ans = answerRaw.trim().toUpperCase();
  if (ans === 'TRUE' || ans === 'FALSE') return 'truefalse';
  if (OPTION_LABELS.includes(ans) && options.length >= 2) return 'mcq';
  if (options.length === 0) return 'short';
  return 'mcq';
}

export function parseQuestionsFromText(text) {
  const questions = [];
  if (!text || !text.trim()) return questions;

  // Split by question numbers: lines starting with digit(s) followed by . or )
  const blocks = text.split(/\n(?=\s*\d+[\.\)]\s)/);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // First line = question number + text
    const firstLine = lines[0].replace(/^\d+[\.\)]\s*/, '').trim();
    if (!firstLine) continue;

    const options = [];
    let answerRaw = '';
    let questionText = firstLine;
    let codeLines = [];
    let inCode = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Code block markers
      if (line.startsWith('```')) { inCode = !inCode; continue; }
      if (inCode) { codeLines.push(line); continue; }

      // Option line: A) ... or A. ...
      const optMatch = line.match(/^([A-Ea-e])[\.\)]\s*(.+)/);
      if (optMatch) {
        options.push(optMatch[2].trim());
        continue;
      }

      // Answer line
      const ansMatch = line.match(/^(?:answer|correct|ans)[\s:]+(.+)/i);
      if (ansMatch) {
        answerRaw = ansMatch[1].trim();
        continue;
      }

      // Continuation of question text (before options)
      if (options.length === 0 && !answerRaw) {
        questionText += ' ' + line;
      }
    }

    const type = detectType(options, answerRaw);
    const q = {
      text: questionText.trim(),
      code: codeLines.join('\n'),
      type,
      options: type === 'mcq' ? (options.length >= 2 ? options : ['', '', '', '']) : [],
      correctIndex: 0,
      correctText: '',
      points: 1,
    };

    if (type === 'mcq' && answerRaw) {
      const idx = OPTION_LABELS.indexOf(answerRaw.toUpperCase());
      q.correctIndex = idx >= 0 ? idx : 0;
    } else if (type === 'truefalse') {
      q.options = ['True', 'False'];
      q.correctIndex = answerRaw.trim().toUpperCase() === 'TRUE' ? 0 : 1;
    } else if (type === 'short') {
      q.correctText = answerRaw;
    }

    if (q.text) questions.push(q);
  }

  return questions;
}

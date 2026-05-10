import { useState, useRef } from 'react';
import { parseQuestionsFromText } from '../utils/questionParser';

export default function QuestionUploader({ onImport }) {
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null); // parsed questions before confirming
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const extractTextFromPDF = async (file) => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  };

  const extractTextFromWord = async (file) => {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setParsing(true);
    setPreview(null);

    try {
      let text = '';
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        text = await extractTextFromPDF(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')
      ) {
        text = await extractTextFromWord(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        text = await file.text();
      } else {
        setError('Unsupported file type. Please upload PDF, DOCX, or TXT.');
        return;
      }

      const parsed = parseQuestionsFromText(text);
      if (parsed.length === 0) {
        setError('No questions found. Make sure your document follows the expected format.');
        return;
      }
      setPreview(parsed);
    } catch (err) {
      setError('Failed to parse file: ' + err.message);
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onImport(preview);
      setPreview(null);
    }
  };

  return (
    <div>
      {/* Upload button */}
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt"
          onChange={e => handleFile(e.target.files[0])}
          className="hidden" id="question-upload" />
        <label htmlFor="question-upload"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-dashed text-sm font-medium cursor-pointer transition ${
            parsing ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-indigo-300 text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50'
          }`}>
          {parsing ? (
            <><span className="animate-spin">⏳</span> Parsing...</>
          ) : (
            <><span>📄</span> Import from PDF / Word</>
          )}
        </label>
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Format hint */}
      <details className="mt-2">
        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
          📋 Expected document format
        </summary>
        <pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-600 overflow-x-auto whitespace-pre-wrap">{`1. What is the capital of Ethiopia?
A) Nairobi
B) Addis Ababa
C) Cairo
D) Lagos
Answer: B

2. Is the sky blue?
Answer: True

3. Explain recursion briefly.
Answer: A function that calls itself

4. Write an essay about AI.
(no answer needed)`}</pre>
      </details>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-5 sm:p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Import Questions</h2>
                <p className="text-sm text-gray-500">{preview.length} question{preview.length !== 1 ? 's' : ''} found</p>
              </div>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* Preview list */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-5 pr-1">
              {preview.map((q, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400">Q{i + 1}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      q.type === 'truefalse' ? 'bg-blue-100 text-blue-600'
                      : q.type === 'short' ? 'bg-amber-100 text-amber-600'
                      : q.type === 'essay' ? 'bg-purple-100 text-purple-600'
                      : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {q.type === 'truefalse' ? 'True/False' : q.type === 'short' ? 'Short Answer' : q.type === 'essay' ? 'Essay' : 'MCQ'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{q.text}</p>
                  {q.type === 'mcq' && q.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, j) => (
                        <div key={j} className={`text-xs px-2 py-1 rounded ${j === q.correctIndex ? 'bg-green-100 text-green-700 font-semibold' : 'text-gray-500'}`}>
                          {String.fromCharCode(65 + j)}. {opt}
                          {j === q.correctIndex && ' ✓'}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === 'truefalse' && (
                    <p className="text-xs text-green-600 mt-1">✓ {q.correctIndex === 0 ? 'True' : 'False'}</p>
                  )}
                  {(q.type === 'short') && q.correctText && (
                    <p className="text-xs text-amber-600 mt-1">Expected: {q.correctText}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPreview(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
                Cancel
              </button>
              <button onClick={handleConfirm}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                ✓ Add {preview.length} Question{preview.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

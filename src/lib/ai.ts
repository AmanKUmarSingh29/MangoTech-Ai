// AI Processing Utilities - works with or without OpenAI API key

import OpenAI from "openai";

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

// ─── TEXT PROCESSING HELPERS ────────────────────────────────────────

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function wordFrequency(text: string): Map<string, number> {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "because", "but", "and", "or", "if", "while", "about", "this", "that",
    "these", "those", "it", "its", "he", "she", "they", "them", "we",
    "you", "i", "me", "my", "your", "his", "her", "our", "their", "what",
    "which", "who", "whom", "also", "been", "many", "much", "any",
  ]);
  const freq = new Map<string, number>();
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  for (const w of words) {
    if (!stopWords.has(w)) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  return freq;
}

function scoreSentence(
  sentence: string,
  freq: Map<string, number>,
  idx: number,
  total: number
): number {
  const words = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  let score = 0;
  for (const w of words) {
    score += freq.get(w) || 0;
  }
  // Normalize by sentence length
  score = words.length > 0 ? score / words.length : 0;
  // Position bonus: first & last paragraphs weighted higher
  const positionRatio = idx / total;
  if (positionRatio < 0.2) score *= 1.5;
  else if (positionRatio > 0.8) score *= 1.2;
  // Length bonus for medium-length sentences
  if (words.length >= 8 && words.length <= 30) score *= 1.1;
  return score;
}

// ─── SUMMARIZATION ──────────────────────────────────────────────────

export async function summarizeText(
  text: string
): Promise<{ summary: string; keyPoints: string[] }> {
  const openai = getOpenAI();

  if (openai) {
    try {
      const truncated = text.slice(0, 12000);
      const resp = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert study assistant. Summarize the given study material concisely. Also extract 5-8 key points. Return JSON: { summary: string, keyPoints: string[] }",
          },
          { role: "user", content: truncated },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });
      const parsed = JSON.parse(resp.choices[0].message.content || "{}");
      return {
        summary: parsed.summary || "Summary not available.",
        keyPoints: parsed.keyPoints || [],
      };
    } catch {
      // Fallback to built-in
    }
  }

  // Built-in summarization
  const sentences = splitSentences(text);
  const freq = wordFrequency(text);
  const scored = sentences.map((s, i) => ({
    sentence: s,
    score: scoreSentence(s, freq, i, sentences.length),
    idx: i,
  }));
  scored.sort((a, b) => b.score - a.score);

  const topCount = Math.min(Math.max(5, Math.floor(sentences.length * 0.15)), 12);
  const topSentences = scored
    .slice(0, topCount)
    .sort((a, b) => a.idx - b.idx)
    .map((s) => s.sentence);

  const summary = topSentences.join(" ");

  // Extract key points: top scoring unique sentences
  const keyPoints = scored
    .slice(0, 7)
    .map((s) => {
      const clean = s.sentence.replace(/^[-•*]\s*/, "");
      return clean.length > 120 ? clean.slice(0, 117) + "..." : clean;
    });

  return { summary, keyPoints };
}

// ─── QUIZ GENERATION ────────────────────────────────────────────────

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function generateQuiz(
  text: string,
  numQuestions: number = 10
): Promise<QuizQuestion[]> {
  const openai = getOpenAI();

  if (openai) {
    try {
      const truncated = text.slice(0, 12000);
      const resp = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a quiz generator for study materials. Generate exactly ${numQuestions} multiple-choice questions from the given text. Each question should have 4 options with one correct answer. Return JSON: { questions: [{ id: number, question: string, options: [string, string, string, string], correctAnswer: number (0-3 index), explanation: string }] }`,
          },
          { role: "user", content: truncated },
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
      });
      const parsed = JSON.parse(resp.choices[0].message.content || "{}");
      if (parsed.questions && parsed.questions.length > 0) {
        return parsed.questions;
      }
    } catch {
      // Fallback
    }
  }

  // Built-in quiz generation
  return generateBuiltInQuiz(text, numQuestions);
}

function generateBuiltInQuiz(text: string, count: number): QuizQuestion[] {
  const sentences = splitSentences(text);
  const freq = wordFrequency(text);
  const scored = sentences.map((s, i) => ({
    sentence: s,
    score: scoreSentence(s, freq, i, sentences.length),
    idx: i,
  }));
  scored.sort((a, b) => b.score - a.score);

  const questions: QuizQuestion[] = [];
  const usedSentences = new Set<number>();

  // Get important words for distractor generation
  const sortedWords = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w);

  for (const item of scored) {
    if (questions.length >= count) break;
    if (usedSentences.has(item.idx)) continue;
    usedSentences.add(item.idx);

    const sentence = item.sentence;
    const words = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const importantWords = sentence.match(/\b[a-z]{4,}\b/gi) || [];

    if (words.length > 0 || importantWords.length > 2) {
      // Find a key term to ask about
      const keyTerm =
        words.length > 0
          ? words[Math.floor(Math.random() * words.length)]
          : importantWords[Math.floor(Math.random() * importantWords.length)];

      // Create fill-in-the-blank style question
      const questionText = sentence
        .replace(keyTerm, "________")
        .replace(/[.!?]$/, "?");

      // Generate distractors
      const distractors = sortedWords
        .filter(
          (w) =>
            w.toLowerCase() !== keyTerm.toLowerCase() && w.length > 3
        )
        .slice(0, 10);

      const shuffledDistractors = distractors
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      if (shuffledDistractors.length < 3) continue;

      const correctIdx = Math.floor(Math.random() * 4);
      const options: string[] = [];
      let dIdx = 0;
      for (let i = 0; i < 4; i++) {
        if (i === correctIdx) {
          options.push(keyTerm);
        } else {
          options.push(
            shuffledDistractors[dIdx]
              ? shuffledDistractors[dIdx].charAt(0).toUpperCase() +
                shuffledDistractors[dIdx].slice(1)
              : `Option ${i + 1}`
          );
          dIdx++;
        }
      }

      questions.push({
        id: questions.length + 1,
        question: `Complete the statement: "${questionText}"`,
        options,
        correctAnswer: correctIdx,
        explanation: `The correct answer is "${keyTerm}". Original: ${sentence}`,
      });
    }
  }

  // If we don't have enough, add true/false style
  let sentenceIdx = 0;
  while (questions.length < count && sentenceIdx < scored.length) {
    const s = scored[sentenceIdx];
    sentenceIdx++;
    if (usedSentences.has(s.idx)) continue;
    usedSentences.add(s.idx);

    const isTrue = Math.random() > 0.4;
    let statement = s.sentence.replace(/[.!?]$/, "");

    if (!isTrue) {
      // Modify the statement to make it false
      statement = statement.replace(/\b(is|are|was|were)\b/, (m) => {
        return m + " not";
      });
    }

    questions.push({
      id: questions.length + 1,
      question: `True or False: "${statement}"`,
      options: ["True", "False", "Partially True", "Cannot be determined"],
      correctAnswer: isTrue ? 0 : 1,
      explanation: `The original text states: "${s.sentence}"`,
    });
  }

  return questions.slice(0, count);
}

// ─── Q&A SYSTEM ─────────────────────────────────────────────────────

export async function answerQuestion(
  text: string,
  question: string,
  history: { role: string; content: string }[] = []
): Promise<string> {
  const openai = getOpenAI();

  if (openai) {
    try {
      const truncated = text.slice(0, 10000);
      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        {
          role: "system",
          content: `You are a helpful study assistant. Answer questions based on the following study material. If the answer is not in the material, say so. Be concise but thorough.\n\nStudy Material:\n${truncated}`,
        },
      ];

      // Add conversation history
      for (const msg of history.slice(-6)) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }

      messages.push({ role: "user", content: question });

      const resp = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 1000,
      });
      return resp.choices[0].message.content || "I couldn't generate an answer.";
    } catch {
      // Fallback
    }
  }

  // Built-in Q&A
  return builtInAnswer(text, question);
}

function builtInAnswer(text: string, question: string): string {
  const questionWords = (question.toLowerCase().match(/\b[a-z]{3,}\b/g) || []).filter(
    (w) =>
      ![
        "what", "when", "where", "which", "who", "whom", "why", "how",
        "does", "did", "will", "would", "could", "should", "can",
        "the", "and", "for", "are", "but", "not", "you", "all",
        "her", "was", "one", "our", "out", "about", "this", "that",
      ].includes(w)
  );

  // Split text into paragraphs
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30);

  // Score paragraphs by relevance to the question
  const scored = paragraphs.map((p) => {
    const pLower = p.toLowerCase();
    let score = 0;
    for (const qw of questionWords) {
      const regex = new RegExp(`\\b${qw}\\b`, "gi");
      const matches = pLower.match(regex);
      score += matches ? matches.length * 2 : 0;
    }
    return { paragraph: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0 || scored[0].score === 0) {
    return "I couldn't find a specific answer to your question in the uploaded material. Try rephrasing your question or asking about a different topic covered in the document.";
  }

  const topParagraphs = scored
    .filter((s) => s.score > 0)
    .slice(0, 2)
    .map((s) => s.paragraph);

  const answer = `Based on the study material:\n\n${topParagraphs.join("\n\n")}\n\n💡 *This answer was extracted from the most relevant sections of your document.*`;
  return answer;
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Brain,
  HelpCircle,
  MessageSquare,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  BookOpen,
  Calendar,
  Hash,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  ChevronRight,
  Trophy,
} from "lucide-react";

interface Document {
  id: number;
  title: string;
  filename: string;
  content: string;
  fileSize: number;
  pageCount: number;
  createdAt: Date;
}

interface Summary {
  id: number;
  documentId: number;
  content: string;
  keyPoints: string[] | null;
  createdAt: Date;
}

interface Quiz {
  id: number;
  documentId: number;
  title: string;
  questions: {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
  createdAt: Date;
}

interface Attempt {
  id: number;
  quizId: number;
  documentId: number;
  score: number;
  totalQuestions: number;
  answers: { questionId: number; selected: number; correct: boolean }[];
  timeTaken: number;
  completedAt: Date;
}

interface Message {
  id: number;
  documentId: number;
  role: string;
  content: string;
  createdAt: Date;
}

type TabType = "overview" | "summary" | "quiz" | "qa";

export function DocumentClient({
  document: doc,
  summaries: initialSummaries,
  quizzes: initialQuizzes,
  attempts: initialAttempts,
  messages: initialMessages,
}: {
  document: Document;
  summaries: Summary[];
  quizzes: Quiz[];
  attempts: Attempt[];
  messages: Message[];
}) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [summariesState, setSummaries] = useState(initialSummaries);
  const [quizzesState, setQuizzes] = useState(initialQuizzes);
  const [attemptsState, setAttempts] = useState(initialAttempts);
  const [messagesState, setMessages] = useState(initialMessages);

  // Loading states
  const [summarizing, setSummarizing] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [question, setQuestion] = useState("");

  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    questions: (Quiz["questions"][0] & {
      userAnswer: number;
      isCorrect: boolean;
    })[];
  } | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesState]);

  const tabs: { key: TabType; label: string; icon: typeof FileText }[] = [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "summary", label: "Summary", icon: Brain },
    { key: "quiz", label: "Quiz", icon: HelpCircle },
    { key: "qa", label: "Q&A", icon: MessageSquare },
  ];

  // ─── SUMMARIZE ─────────────────────────────────────────
  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/summarize`, {
        method: "POST",
      });
      if (res.ok) {
        const summary = await res.json();
        setSummaries((prev) => [summary, ...prev]);
      }
    } catch {
      alert("Failed to generate summary");
    } finally {
      setSummarizing(false);
    }
  };

  // ─── GENERATE QUIZ ────────────────────────────────────
  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/quiz`, {
        method: "POST",
      });
      if (res.ok) {
        const quiz = await res.json();
        setQuizzes((prev) => [quiz, ...prev]);
      }
    } catch {
      alert("Failed to generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // ─── START QUIZ ────────────────────────────────────────
  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizAnswers({});
    setQuizResult(null);
    setQuizStartTime(Date.now());
  };

  // ─── SUBMIT QUIZ ──────────────────────────────────────
  const submitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmittingQuiz(true);
    const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);

    try {
      const res = await fetch(`/api/quiz/${activeQuiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: quizAnswers, timeTaken }),
      });
      if (res.ok) {
        const result = await res.json();
        setQuizResult({
          score: result.score,
          total: result.totalQuestions,
          questions: result.questions,
        });
        setAttempts((prev) => [result, ...prev]);
      }
    } catch {
      alert("Failed to submit quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // ─── ASK QUESTION ─────────────────────────────────────
  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    setAskingQuestion(true);
    const q = question;
    setQuestion("");

    // Optimistic user message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        documentId: doc.id,
        role: "user",
        content: q,
        createdAt: new Date(),
      },
    ]);

    try {
      const res = await fetch(`/api/documents/${doc.id}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (res.ok) {
        const answer = await res.json();
        setMessages((prev) => [...prev, answer]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          documentId: doc.id,
          role: "assistant",
          content: "Sorry, I couldn't process your question. Please try again.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setAskingQuestion(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="p-8 animate-fade-in">
      {/* Back Button & Header */}
      <Link
        href="/documents"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Documents
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <BookOpen size={14} />
              {doc.pageCount} pages
            </span>
            <span className="flex items-center gap-1">
              <Hash size={14} />
              {formatSize(doc.fileSize)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(doc.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-dark-card rounded-xl p-1 border border-dark-border w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key !== "quiz") {
                setActiveQuiz(null);
                setQuizResult(null);
              }
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-mango text-black"
                : "text-slate-400 hover:text-white hover:bg-dark-hover"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {/* ── OVERVIEW TAB ──────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} className="text-blue-400" />
                Document Content Preview
              </h2>
              <div className="max-h-96 overflow-y-auto text-sm text-slate-300 whitespace-pre-wrap leading-relaxed pr-4">
                {doc.content.slice(0, 3000)}
                {doc.content.length > 3000 && (
                  <span className="text-slate-500">
                    ... ({doc.content.length - 3000} more characters)
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-dark-card border border-dark-border rounded-xl p-5 text-center">
                <Brain className="mx-auto text-mango mb-2" size={28} />
                <p className="text-2xl font-bold">{summariesState.length}</p>
                <p className="text-xs text-slate-400">Summaries</p>
              </div>
              <div className="bg-dark-card border border-dark-border rounded-xl p-5 text-center">
                <HelpCircle className="mx-auto text-green-400 mb-2" size={28} />
                <p className="text-2xl font-bold">{quizzesState.length}</p>
                <p className="text-xs text-slate-400">Quizzes Generated</p>
              </div>
              <div className="bg-dark-card border border-dark-border rounded-xl p-5 text-center">
                <MessageSquare className="mx-auto text-purple-400 mb-2" size={28} />
                <p className="text-2xl font-bold">{messagesState.length}</p>
                <p className="text-xs text-slate-400">Q&A Messages</p>
              </div>
            </div>
          </div>
        )}

        {/* ── SUMMARY TAB ───────────────────────────── */}
        {activeTab === "summary" && (
          <div className="space-y-6">
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="flex items-center gap-2 px-6 py-3 gradient-mango text-black rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-mango/20"
            >
              {summarizing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating Summary...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate New Summary
                </>
              )}
            </button>

            {summariesState.length === 0 && !summarizing && (
              <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center">
                <Brain className="mx-auto text-slate-600 mb-4" size={48} />
                <h3 className="text-lg font-semibold mb-2">No Summaries Yet</h3>
                <p className="text-slate-400 text-sm">
                  Click the button above to generate an AI summary of this document.
                </p>
              </div>
            )}

            {summariesState.map((summary, idx) => (
              <div
                key={summary.id}
                className="bg-dark-card border border-dark-border rounded-2xl p-6 animate-slide-up"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Brain className="text-mango" size={20} />
                    Summary #{summariesState.length - idx}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {new Date(summary.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed mb-6 whitespace-pre-wrap">
                  {summary.content}
                </p>
                {summary.keyPoints && summary.keyPoints.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-mango mb-3">
                      📌 Key Points
                    </h4>
                    <ul className="space-y-2">
                      {summary.keyPoints.map((point, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-slate-300"
                        >
                          <ChevronRight
                            className="text-mango mt-0.5 flex-shrink-0"
                            size={14}
                          />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── QUIZ TAB ──────────────────────────────── */}
        {activeTab === "quiz" && (
          <div className="space-y-6">
            {!activeQuiz && !quizResult && (
              <>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={generatingQuiz}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 text-black rounded-xl font-semibold hover:bg-green-400 transition-colors disabled:opacity-50 shadow-lg shadow-green-500/20"
                >
                  {generatingQuiz ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <HelpCircle size={20} />
                      Generate New Quiz
                    </>
                  )}
                </button>

                {quizzesState.length === 0 && !generatingQuiz && (
                  <div className="bg-dark-card border border-dark-border rounded-2xl p-12 text-center">
                    <HelpCircle className="mx-auto text-slate-600 mb-4" size={48} />
                    <h3 className="text-lg font-semibold mb-2">No Quizzes Yet</h3>
                    <p className="text-slate-400 text-sm">
                      Generate a quiz to test your knowledge of this document.
                    </p>
                  </div>
                )}

                {/* Quiz List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizzesState.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-green-500/30 transition-all"
                    >
                      <h3 className="font-semibold mb-2">{quiz.title}</h3>
                      <p className="text-sm text-slate-400 mb-4">
                        {quiz.questions.length} questions •{" "}
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => startQuiz(quiz)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/20 transition-colors"
                      >
                        <HelpCircle size={16} />
                        Take Quiz
                      </button>
                    </div>
                  ))}
                </div>

                {/* Past Attempts */}
                {attemptsState.length > 0 && (
                  <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Trophy className="text-mango" size={20} />
                      Past Attempts
                    </h3>
                    <div className="space-y-3">
                      {attemptsState.map((attempt) => {
                        const pct = Math.round(
                          (attempt.score / attempt.totalQuestions) * 100
                        );
                        return (
                          <div
                            key={attempt.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-dark-hover/30"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                  pct >= 80
                                    ? "bg-green-400/10 text-green-400"
                                    : pct >= 60
                                    ? "bg-mango/10 text-mango"
                                    : "bg-red-400/10 text-red-400"
                                }`}
                              >
                                {pct}%
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {attempt.score}/{attempt.totalQuestions} correct
                                </p>
                                <p className="text-xs text-slate-500">
                                  {Math.floor(attempt.timeTaken / 60)}m{" "}
                                  {attempt.timeTaken % 60}s
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-slate-500">
                              {new Date(attempt.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Active Quiz */}
            {activeQuiz && !quizResult && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{activeQuiz.title}</h3>
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                {activeQuiz.questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="bg-dark-card border border-dark-border rounded-xl p-6"
                  >
                    <p className="font-medium mb-4">
                      <span className="text-mango mr-2">Q{qIdx + 1}.</span>
                      {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((option, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() =>
                            setQuizAnswers((prev) => ({
                              ...prev,
                              [q.id]: oIdx,
                            }))
                          }
                          className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
                            quizAnswers[q.id] === oIdx
                              ? "border-mango bg-mango/10 text-mango"
                              : "border-dark-border hover:border-slate-500 text-slate-300"
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={submitQuiz}
                  disabled={
                    submittingQuiz ||
                    Object.keys(quizAnswers).length <
                      activeQuiz.questions.length
                  }
                  className="w-full py-4 gradient-mango text-black rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-mango/20"
                >
                  {submittingQuiz ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={22} />
                      Submitting...
                    </span>
                  ) : (
                    `Submit Quiz (${Object.keys(quizAnswers).length}/${activeQuiz.questions.length} answered)`
                  )}
                </button>
              </div>
            )}

            {/* Quiz Results */}
            {quizResult && (
              <div className="space-y-6 animate-slide-up">
                <div className="bg-dark-card border border-dark-border rounded-2xl p-8 text-center">
                  <Trophy
                    className={`mx-auto mb-4 ${
                      quizResult.score / quizResult.total >= 0.8
                        ? "text-mango"
                        : quizResult.score / quizResult.total >= 0.6
                        ? "text-blue-400"
                        : "text-red-400"
                    }`}
                    size={48}
                  />
                  <h3 className="text-2xl font-bold mb-2">
                    {Math.round((quizResult.score / quizResult.total) * 100)}%
                  </h3>
                  <p className="text-slate-400">
                    You scored {quizResult.score} out of {quizResult.total}
                  </p>
                  <button
                    onClick={() => {
                      setActiveQuiz(null);
                      setQuizResult(null);
                    }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-mango/10 text-mango rounded-lg text-sm font-medium hover:bg-mango/20 transition-colors"
                  >
                    <RotateCcw size={16} />
                    Back to Quizzes
                  </button>
                </div>

                {quizResult.questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className={`bg-dark-card border rounded-xl p-6 ${
                      q.isCorrect
                        ? "border-green-500/30"
                        : "border-red-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      {q.isCorrect ? (
                        <CheckCircle2 className="text-green-400 mt-0.5" size={20} />
                      ) : (
                        <XCircle className="text-red-400 mt-0.5" size={20} />
                      )}
                      <p className="font-medium">
                        <span className="text-slate-500 mr-2">Q{qIdx + 1}.</span>
                        {q.question}
                      </p>
                    </div>
                    <div className="space-y-2 ml-8">
                      {q.options.map((option, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-lg border text-sm ${
                            oIdx === q.correctAnswer
                              ? "border-green-500/40 bg-green-500/10 text-green-400"
                              : oIdx === q.userAnswer && !q.isCorrect
                              ? "border-red-500/40 bg-red-500/10 text-red-400"
                              : "border-dark-border text-slate-400"
                          }`}
                        >
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          {option}
                          {oIdx === q.correctAnswer && " ✓"}
                          {oIdx === q.userAnswer &&
                            oIdx !== q.correctAnswer &&
                            " ✗"}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="mt-3 ml-8 text-sm text-slate-400 italic">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Q&A TAB ───────────────────────────────── */}
        {activeTab === "qa" && (
          <div className="space-y-6">
            {/* Chat Messages */}
            <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-dark-border bg-dark-hover/30">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="text-purple-400" size={20} />
                  Ask Questions About This Document
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ask anything about the content and get intelligent answers
                </p>
              </div>

              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messagesState.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare
                      className="mx-auto text-slate-600 mb-4"
                      size={48}
                    />
                    <p className="text-slate-400 mb-2">No messages yet</p>
                    <p className="text-sm text-slate-500">
                      Ask a question about the document to get started
                    </p>
                  </div>
                )}

                {messagesState.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-mango/10 text-mango-light rounded-br-sm"
                          : "bg-dark-hover border border-dark-border text-slate-300 rounded-bl-sm"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1 mb-2 text-xs text-purple-400 font-medium">
                          <Sparkles size={12} />
                          AI Assistant
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {askingQuestion && (
                  <div className="flex justify-start">
                    <div className="bg-dark-hover border border-dark-border p-4 rounded-2xl rounded-bl-sm">
                      <Loader2
                        className="animate-spin text-purple-400"
                        size={20}
                      />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-dark-border bg-dark-hover/30">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAskQuestion();
                      }
                    }}
                    placeholder="Ask a question about this document..."
                    className="flex-1 bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                    disabled={askingQuestion}
                  />
                  <button
                    onClick={handleAskQuestion}
                    disabled={!question.trim() || askingQuestion}
                    className="px-5 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useRef, useState } from "react";
import {
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Files,
  FileUp,
  GraduationCap,
  History,
  House,
  Layers3,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  UploadCloud,
  X,
  Copy,
  Check,
  Menu,
  Download,
} from "lucide-react";
import { uploadNotes, summarizeDocument, summarizeText } from "../api/notes";
import { uploadPdf, askPdf } from "../api/pdfRag";
import "../styles.css";

const initialHistory = [
  { title: "Operating Systems — Unit 3", type: "summary", date: "Today" },
  { title: "DBMS normalization notes", type: "summary", date: "Yesterday" },
  { title: "Computer Networks.pdf", type: "chat", date: "Oct 24" },
];

export default function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState("home");
  const [mobileNav, setMobileNav] = useState(false);
  const [summaryFile, setSummaryFile] = useState(null);
  const [summaryLength, setSummaryLength] = useState("Balanced");
  const [summaryStyle, setSummaryStyle] = useState("Study notes");
  const [summaryText, setSummaryText] = useState("");
  const [summaryReady, setSummaryReady] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);

  const [pdfFile, setPdfFile] = useState(null);
  const [indexed, setIndexed] = useState(false);
  const [isIndexingPdf, setIsIndexingPdf] = useState(false);
  const [pdfDocId, setPdfDocId] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isAskingPdf, setIsAskingPdf] = useState(false);

  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const summaryInput = useRef(null);
  const pdfInput = useRef(null);

  const notify = (s) => {
    setToast(s);
    setTimeout(() => setToast(""), 3000);
  };

  const choosePage = (p) => {
    setPage(p);
    setMobileNav(false);
  };

  const onSummaryFile = (f) => {
    if (f) {
      setSummaryFile(f);
      setSummaryReady(false);
      setSummaryResult(null);
    }
  };

  const onPdfFile = (f) => {
    if (f) {
      setPdfFile(f);
      setIndexed(false);
      setPdfDocId(null);
      setMessages([]);
    }
  };

  const generateSummary = async () => {
    if (!summaryFile && !summaryText.trim()) {
      return notify("Upload a file or paste your notes first.");
    }

    setIsSummarizing(true);
    setSummaryReady(false);
    notify("Analyzing notes with AI...");

    const lengthMap = {
      Brief: 180,
      Balanced: 400,
      Detailed: 750,
    };
    const maxWords = lengthMap[summaryLength] || 400;

    try {
      let result;
      if (summaryFile) {
        notify(`Uploading ${summaryFile.name}...`);
        const uploadRes = await uploadNotes(summaryFile);
        notify("Generating structured summary...");
        result = await summarizeDocument(uploadRes.document_id, maxWords, summaryStyle);
      } else {
        result = await summarizeText(summaryText, maxWords, summaryStyle);
      }

      setSummaryResult(result);
      setSummaryReady(true);
      notify("Summary generated successfully!");
    } catch (err) {
      console.error("Summarizer error:", err);
      notify(err.message || "Failed to generate summary. Please check backend.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const indexPdf = async () => {
    if (!pdfFile) return notify("Choose a PDF before continuing.");
    setIsIndexingPdf(true);
    notify("Indexing PDF with vector embeddings...");

    try {
      const res = await uploadPdf(pdfFile);
      setPdfDocId(res.document_id);
      setIndexed(true);
      setMessages([
        {
          role: "assistant",
          text: `PDF "${pdfFile.name}" (${res.pages || "?"} pages, ${res.chunks || "?"} chunks) has been prepared and indexed! You can now ask questions about its content.`,
          sources: [],
        },
      ]);
      notify("PDF prepared successfully!");
    } catch (err) {
      console.error("PDF index error:", err);
      notify(err.message || "Failed to prepare PDF. Check backend.");
    } finally {
      setIsIndexingPdf(false);
    }
  };

  const sendQuestion = async () => {
    if (!question.trim()) return;
    if (!indexed || !pdfDocId) return notify("Upload and prepare a PDF first.");

    const q = question.trim();
    setQuestion("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setIsAskingPdf(true);

    try {
      const res = await askPdf(pdfDocId, q);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: res.answer,
          sources: res.sources || [],
        },
      ]);
    } catch (err) {
      console.error("Ask PDF error:", err);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Error retrieving answer: ${err.message || "Backend error"}.`,
          sources: [],
        },
      ]);
      notify("Failed to get answer.");
    } finally {
      setIsAskingPdf(false);
    }
  };

  const copySummary = async () => {
    if (!summaryResult) {
      notify("No summary available to copy.");
      return;
    }
    const fullText = [
      `# ${summaryResult.title}`,
      "",
      "## Summary",
      summaryResult.summary,
      "",
      "## Key Points",
      ...(summaryResult.key_points || []).map((pt) => `• ${pt}`),
      "",
      "## Important Terms",
      ...(summaryResult.important_terms || []).map((tm) => `• ${tm}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(fullText);
      notify("Copied summary to clipboard!");
    } catch {
      notify("Copy is not available in this browser.");
    }
  };

  const downloadSummary = () => {
    if (!summaryResult) return;
    const fullText = [
      `Title: ${summaryResult.title}`,
      `Format: ${summaryStyle} | Length: ${summaryLength}`,
      `Generated: ${new Date().toLocaleString()}`,
      "\n================ SUMMARY ================\n",
      summaryResult.summary,
      "\n============== KEY POINTS ==============\n",
      ...(summaryResult.key_points || []).map((pt) => `• ${pt}`),
      "\n============ IMPORTANT TERMS ============\n",
      ...(summaryResult.important_terms || []).map((tm) => `• ${tm}`),
    ].join("\n");

    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(summaryResult.title || "notes_summary").replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Notes downloaded as text file!");
  };

  const getInitials = (name) => {
    if (!name) return "ST";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <BrainCircuit size={22} />
          </div>
          <span>studywise</span>
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobileNav(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <button
          className="new-work"
          onClick={() => {
            choosePage("home");
            setSummaryReady(false);
          }}
        >
          <Plus size={17} /> New workspace <span>⌘ K</span>
        </button>

        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-list">
          <button
            className={page === "home" ? "nav-item active" : "nav-item"}
            onClick={() => choosePage("home")}
          >
            <House size={18} /> Overview
          </button>
          <button
            className={page === "summarizer" ? "nav-item active" : "nav-item"}
            onClick={() => choosePage("summarizer")}
          >
            <FileText size={18} /> Note summarizer{" "}
            <span className="nav-pill">AI</span>
          </button>
          <button
            className={page === "chat" ? "nav-item active" : "nav-item"}
            onClick={() => choosePage("chat")}
          >
            <MessageCircle size={18} /> Chat with PDF{" "}
            <span className="nav-pill violet">RAG</span>
          </button>
          <button
            className={page === "library" ? "nav-item active" : "nav-item"}
            onClick={() => choosePage("library")}
          >
            <Files size={18} /> My library
          </button>
        </nav>

        <div className="nav-label recent-label">
          RECENT ACTIVITY{" "}
          <button className="tiny-icon" aria-label="History">
            <History size={14} />
          </button>
        </div>
        <div className="recent-list">
          {initialHistory.map((h) => (
            <button
              key={h.title}
              className="recent-item"
              onClick={() => {
                choosePage(h.type === "chat" ? "chat" : "summarizer");
                notify(`Opened: ${h.title}`);
              }}
            >
              <span className={`recent-file ${h.type}`}>
                <FileText size={15} />
              </span>
              <span className="recent-copy">
                <span>{h.title}</span>
                <small>{h.date}</small>
              </span>
              <MoreHorizontal size={16} className="recent-more" />
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <Sparkles size={17} />
            </div>
            <strong>Your study space</strong>
            <p>Turn long readings into clear ideas.</p>
            <button onClick={() => choosePage("summarizer")}>
              Get started <ChevronRight size={14} />
            </button>
            <div className="upgrade-orb orb-one" />
            <div className="upgrade-orb orb-two" />
          </div>

          <div className="profile-row-wrap">
            <button
              className="profile-row"
              onClick={() => notify(`Logged in as ${user?.email || "Student"}`)}
            >
              <div className="avatar">{getInitials(user?.name)}</div>
              <span>
                <strong>{user?.name || "Student account"}</strong>
                <small>{user?.email || "Personal workspace"}</small>
              </span>
              <MoreHorizontal size={18} />
            </button>
            {onLogout && (
              <button
                className="logout-button-styled"
                onClick={onLogout}
                title="Sign out of your account"
              >
                <LogOut size={13} /> Log out
              </button>
            )}
          </div>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="mobile-scrim"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Main Area */}
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileNav(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="crumb-muted">Workspace</span>
            <ChevronRight size={14} />
            <span>
              {page === "home"
                ? "Overview"
                : page === "summarizer"
                ? "Note summarizer"
                : page === "chat"
                ? "Chat with PDF"
                : "My library"}
            </span>
          </div>
          <div className="topbar-right">
            <div className="status-dot" />
            <span className="ready-text">
              {user?.name
                ? `Hi, ${user.name.split(" ")[0]}`
                : "Your study space"}
            </span>
            <button
              className="icon-button"
              onClick={() => notify("Academic Assistant help.")}
              aria-label="Help"
            >
              <CircleHelp size={18} />
            </button>
            <button
              className="icon-button"
              onClick={() => notify("Workspace settings.")}
              aria-label="Settings"
            >
              <Settings2 size={18} />
            </button>
            {onLogout && (
              <button
                className="topbar-logout-styled"
                onClick={onLogout}
                title="Log out"
              >
                <LogOut size={13} /> Log out
              </button>
            )}
          </div>
        </header>

        <div className="page-content">
          {page === "home" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <Sparkles size={14} /> YOUR AI STUDY COMPANION
                  </div>
                  <h1>
                    Make learning <span>click.</span>
                  </h1>
                  <p className="welcome-sub">
                    Your notes, your PDFs, a clearer way to understand it all.
                  </p>
                </div>
                <div className="welcome-art">
                  <div className="art-spark spark-a">✳</div>
                  <div className="art-paper paper-back" />
                  <div className="art-paper paper-front">
                    <div className="paper-line long" />
                    <div className="paper-line" />
                    <div className="paper-highlight" />
                    <div className="paper-line long" />
                    <div className="paper-line short" />
                    <div className="paper-line" />
                  </div>
                  <div className="art-orbit">
                    <Sparkles size={20} />
                  </div>
                  <div className="art-spark spark-b">✦</div>
                </div>
              </section>

              <section className="section-heading">
                <div>
                  <h2>What are we working on?</h2>
                  <p>Choose a tool to get started.</p>
                </div>
                <span className="beta-chip">
                  <span /> EARLY ACCESS
                </span>
              </section>

              <section className="tool-grid">
                <button
                  className="tool-card summary-card"
                  onClick={() => choosePage("summarizer")}
                >
                  <div className="tool-card-top">
                    <div className="tool-icon summary-icon">
                      <FileText size={22} />
                    </div>
                    <span className="tool-arrow">
                      <ChevronRight size={18} />
                    </span>
                  </div>
                  <div className="tool-tag">READ LESS, KNOW MORE</div>
                  <h3>Note summarizer</h3>
                  <p>
                    Turn lengthy notes, lecture slides, and documents into
                    concise, useful summaries.
                  </p>
                  <div className="tool-card-bottom">
                    <span>
                      <FileUp size={15} /> PDF, DOCX, TXT
                    </span>
                    <span className="launch-link">
                      Open tool <ChevronRight size={15} />
                    </span>
                  </div>
                  <div className="card-decoration deco-lines">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </button>

                <button
                  className="tool-card rag-card"
                  onClick={() => choosePage("chat")}
                >
                  <div className="tool-card-top">
                    <div className="tool-icon rag-icon">
                      <MessageCircle size={22} />
                    </div>
                    <span className="tool-arrow">
                      <ChevronRight size={18} />
                    </span>
                  </div>
                  <div className="tool-tag">ASK YOUR DOCUMENTS</div>
                  <h3>Chat with PDF</h3>
                  <p>
                    Ask questions about a PDF and explore answers grounded in
                    your own material.
                  </p>
                  <div className="tool-card-bottom">
                    <span>
                      <Files size={15} /> Source-aware answers
                    </span>
                    <span className="launch-link">
                      Open tool <ChevronRight size={15} />
                    </span>
                  </div>
                  <div className="rag-decoration">
                    <div />
                    <div />
                    <div />
                  </div>
                </button>
              </section>

              <section className="bottom-grid">
                <div className="panel quick-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Pick up where you left off</h3>
                      <p>Your recent study sessions</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => choosePage("library")}
                    >
                      View library <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="activity-list">
                    {initialHistory.slice(0, 2).map((h, i) => (
                      <button
                        key={h.title}
                        className="activity-row"
                        onClick={() =>
                          choosePage(h.type === "chat" ? "chat" : "summarizer")
                        }
                      >
                        <div
                          className={`activity-icon ${
                            i === 0 ? "lavender" : "mint"
                          }`}
                        >
                          <FileText size={17} />
                        </div>
                        <div className="activity-info">
                          <strong>{h.title}</strong>
                          <span>
                            {h.type === "chat"
                              ? "PDF conversation"
                              : "Summary document"}{" "}
                            · {h.date}
                          </span>
                        </div>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel tip-panel">
                  <div className="tip-symbol">
                    <GraduationCap size={20} />
                  </div>
                  <div className="tip-label">STUDY TIP</div>
                  <h3>
                    Small summaries.
                    <br />
                    Big picture.
                  </h3>
                  <p>
                    Summarize a topic first, then use PDF chat to dig into the
                    details you want to understand better.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => choosePage("summarizer")}
                  >
                    Try it now <ChevronRight size={15} />
                  </button>
                  <div className="tip-decoration">✳</div>
                </div>
              </section>

              <div className="footer-note">
                <span>✳</span> Made for curious minds{" "}
                <span className="footer-dot">·</span> Study smarter, at your pace
              </div>
            </>
          )}

          {page === "summarizer" && (
            <>
              <div className="tool-page-title">
                <div className="eyebrow">
                  <FileText size={14} /> NOTE SUMMARIZER
                </div>
                <h1>
                  Make your notes <span>make sense.</span>
                </h1>
                <p>
                  Upload a document or paste your notes. Get the key ideas
                  without the extra pages.
                </p>
              </div>
              <div className="workspace-grid">
                <section className="panel input-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>
                        <span className="step-number">1</span> Add your notes
                      </h3>
                      <p>Upload a file or paste text below.</p>
                    </div>
                    <span className="supported-label">PDF · DOCX · TXT</span>
                  </div>
                  <input
                    ref={summaryInput}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    hidden
                    onChange={(e) => onSummaryFile(e.target.files?.[0])}
                  />
                  <button
                    className={`dropzone ${summaryFile ? "has-file" : ""}`}
                    onClick={() => summaryInput.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      onSummaryFile(e.dataTransfer.files?.[0]);
                    }}
                  >
                    <div className="upload-symbol">
                      <UploadCloud size={23} />
                    </div>
                    {summaryFile ? (
                      <>
                        <strong>{summaryFile.name}</strong>
                        <span>
                          {(summaryFile.size / 1024).toFixed(0)} KB · Ready to
                          summarize
                        </span>
                      </>
                    ) : (
                      <>
                        <strong>
                          Drop your file here, or <em>browse</em>
                        </strong>
                        <span>
                          PDF, Word document, or plain text · Max 20 MB
                        </span>
                      </>
                    )}
                    <span className="dropzone-foot">
                      <FileUp size={14} /> Secure document upload{" "}
                      <span>·</span> UI preview
                    </span>
                  </button>
                  <div className="or-divider">
                    <span /> OR PASTE YOUR NOTES <span />
                  </div>
                  <textarea
                    className="notes-textarea"
                    value={summaryText}
                    onChange={(e) => {
                      setSummaryText(e.target.value);
                      setSummaryReady(false);
                    }}
                    placeholder="Paste lecture notes, textbook excerpts, or your own study material here…"
                  />
                  <div className="textarea-footer">
                    <span>{summaryText.length} characters</span>
                    <button
                      onClick={() => {
                        setSummaryText("");
                        setSummaryFile(null);
                        setSummaryReady(false);
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="settings-divider" />
                  <div className="panel-heading settings-heading">
                    <div>
                      <h3>
                        <span className="step-number">2</span> Customize your
                        summary
                      </h3>
                      <p>Make it fit the way you study.</p>
                    </div>
                  </div>
                  <label className="field-label">SUMMARY LENGTH</label>
                  <div className="choice-row">
                    {["Brief", "Balanced", "Detailed"].map((v) => (
                      <button
                        key={v}
                        className={`choice ${
                          summaryLength === v ? "selected" : ""
                        }`}
                        onClick={() => setSummaryLength(v)}
                      >
                        {v}
                        {summaryLength === v && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                  <label className="field-label">FORMAT</label>
                  <div className="choice-row">
                    {["Study notes", "Bullet points", "Key takeaways"].map(
                      (v) => (
                        <button
                          key={v}
                          className={`choice ${
                            summaryStyle === v ? "selected" : ""
                          }`}
                          onClick={() => setSummaryStyle(v)}
                        >
                          {v}
                          {summaryStyle === v && <Check size={14} />}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    className="primary-button full-button"
                    onClick={generateSummary}
                    disabled={isSummarizing || (!summaryFile && !summaryText.trim())}
                  >
                    {isSummarizing ? (
                      <>
                        <div className="button-spinner" /> Generating summary...
                      </>
                    ) : (
                      <>
                        <Sparkles size={17} /> Generate summary{" "}
                        <ChevronRight size={17} />
                      </>
                    )}
                  </button>
                  <p className="privacy-note">
                    <span /> Summarize lecture notes & study materials easily.
                  </p>
                </section>

                <section className="panel result-panel">
                  <div className="result-head">
                    <div>
                      <div className="result-icon">
                        <Sparkles size={18} />
                      </div>
                      <h3>Your summary</h3>
                      <p>Key ideas, made clearer.</p>
                    </div>
                    <span className="preview-chip">
                      {isSummarizing ? "GENERATING..." : summaryReady ? "READY" : "AI"}
                    </span>
                  </div>
                  {isSummarizing ? (
                    <div className="summary-loading-state">
                      <div className="auth-spinner" />
                      <h4>Generating summary with AI...</h4>
                      <p>Analyzing document, extracting key concepts, and structuring your notes.</p>
                    </div>
                  ) : summaryReady && summaryResult ? (
                    <div className="result-body" style={{ alignItems: "stretch", textAlign: "left", padding: "18px 0" }}>
                      <div className="result-content-wrap">
                        <div className="result-title-row">
                          <h4>{summaryResult.title}</h4>
                          <span className="result-tag">{summaryStyle}</span>
                        </div>

                        <div className="summary-block">
                          <label className="summary-block-label">SUMMARY</label>
                          <p className="summary-paragraph">{summaryResult.summary}</p>
                        </div>

                        {summaryResult.key_points && summaryResult.key_points.length > 0 && (
                          <div className="summary-block">
                            <label className="summary-block-label">KEY POINTS</label>
                            <ul className="summary-keypoints-list">
                              {summaryResult.key_points.map((pt, idx) => (
                                <li key={idx}>
                                  <span className="bullet-dot">•</span>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {summaryResult.important_terms && summaryResult.important_terms.length > 0 && (
                          <div className="summary-block">
                            <label className="summary-block-label">IMPORTANT TERMS</label>
                            <div className="terms-wrap">
                              {summaryResult.important_terms.map((t, idx) => (
                                <span key={idx} className="term-badge">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="result-actions">
                          <button className="secondary-button" onClick={copySummary}>
                            <Copy size={15} /> Copy summary
                          </button>
                          <button className="secondary-button" onClick={downloadSummary}>
                            <Download size={15} /> Download .txt
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="result-empty">
                      <div className="empty-illustration">
                        <div className="empty-doc">
                          <div />
                          <div />
                          <div />
                          <div />
                          <div />
                        </div>
                        <div className="empty-spark">✦</div>
                        <div className="empty-circle">
                          <Sparkles size={19} />
                        </div>
                      </div>
                      <h4>Your summary will live here</h4>
                      <p>
                        Once you add your notes and generate a summary, the main
                        ideas will show up in this space.
                      </p>
                      <div className="result-feature">
                        <span>
                          <Check size={14} />
                        </span>{" "}
                        Clear, structured key points
                      </div>
                      <div className="result-feature">
                        <span>
                          <Check size={14} />
                        </span>{" "}
                        Important concepts highlighted
                      </div>
                      <div className="result-feature">
                        <span>
                          <Check size={14} />
                        </span>{" "}
                        Easy to copy and revise
                      </div>
                    </div>
                  )}
                  <div className="result-bottom">
                    <Clock3 size={14} /> Your study workspace, at a glance
                  </div>
                </section>
              </div>
            </>
          )}

          {page === "chat" && (
            <>
              <div className="tool-page-title chat-title">
                <div className="eyebrow">
                  <MessageCircle size={14} /> PDF KNOWLEDGE CHAT
                </div>
                <h1>
                  Ask your PDF <span>anything.</span>
                </h1>
                <p>
                  Bring a document into the conversation and explore it one
                  question at a time.
                </p>
              </div>
              <div className="chat-layout">
                <section className="panel pdf-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Your document</h3>
                      <p>Choose a PDF to start a conversation.</p>
                    </div>
                    <div className="pdf-mini-icon">
                      <FileText size={19} />
                    </div>
                  </div>
                  <input
                    ref={pdfInput}
                    type="file"
                    accept="application/pdf,.pdf"
                    hidden
                    onChange={(e) => onPdfFile(e.target.files?.[0])}
                  />
                  <button
                    className={`pdf-dropzone ${pdfFile ? "has-file" : ""}`}
                    onClick={() => pdfInput.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      onPdfFile(e.dataTransfer.files?.[0]);
                    }}
                  >
                    <div className="pdf-upload-icon">
                      <UploadCloud size={23} />
                    </div>
                    <strong>{pdfFile ? pdfFile.name : "Upload a PDF"}</strong>
                    <span>
                      {pdfFile
                        ? `${(pdfFile.size / 1024).toFixed(0)} KB · Selected`
                        : "Drag and drop or browse your files"}
                    </span>
                    <span className="browse-small">Choose file</span>
                  </button>
                  {pdfFile && (
                    <div className="selected-file">
                      <div className="selected-file-icon">
                        <FileText size={17} />
                      </div>
                      <div>
                        <strong>{pdfFile.name}</strong>
                        <span>PDF document</span>
                      </div>
                      <button
                        className="icon-button"
                        onClick={() => {
                          setPdfFile(null);
                          setIndexed(false);
                          setMessages([]);
                        }}
                        aria-label="Remove PDF"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}
                  <button
                    className="primary-button full-button"
                    onClick={indexPdf}
                    disabled={!pdfFile || indexed || isIndexingPdf}
                  >
                    {isIndexingPdf ? (
                      <>
                        <div className="button-spinner" /> Preparing document...
                      </>
                    ) : indexed ? (
                      <>
                        <Check size={17} /> PDF ready
                      </>
                    ) : (
                      <>
                        <Layers3 size={17} /> Prepare document
                      </>
                    )}
                  </button>
                  <div className="pdf-info">
                    <Sparkles size={15} />
                    <p>
                      Once connected, the app will extract text and retrieve
                      relevant passages to answer your questions.
                    </p>
                  </div>
                  <div className="source-section">
                    <div className="source-heading">
                      SUGGESTED QUESTIONS <span>✳</span>
                    </div>
                    {[
                      "What are the main ideas?",
                      "Summarize this document",
                      "What should I remember?",
                    ].map((q) => (
                      <button
                        key={q}
                        className="suggestion"
                        onClick={() => {
                          setQuestion(q);
                          if (!indexed)
                            notify("Upload and prepare a PDF first.");
                        }}
                      >
                        {q}
                        <ChevronRight size={15} />
                      </button>
                    ))}
                  </div>
                </section>

                <section className="panel conversation-panel">
                  <div className="conversation-header">
                    <div className="conversation-avatar">
                      <BrainCircuit size={19} />
                    </div>
                    <div>
                      <h3>Document assistant</h3>
                      <span>
                        <i />{" "}
                        {isIndexingPdf
                          ? "Indexing PDF..."
                          : indexed
                          ? `${pdfFile?.name || "PDF"} · Ready to answer`
                          : "Ready when you are"}
                      </span>
                    </div>
                    <button
                      className="icon-button"
                      onClick={() => {
                        setMessages([]);
                        setQuestion("");
                      }}
                      aria-label="Clear chat"
                    >
                      <MoreHorizontal size={19} />
                    </button>
                  </div>
                  <div className="conversation-body">
                    {messages.length === 0 ? (
                      <div className="chat-empty">
                        <div className="chat-empty-art">
                          <div className="chat-art-page">
                            <div />
                            <div />
                            <div />
                            <div />
                          </div>
                          <div className="chat-art-bubble">
                            <Sparkles size={19} />
                          </div>
                          <div className="chat-art-star">✦</div>
                        </div>
                        <h3>A little curiosity goes a long way.</h3>
                        <p>
                          {indexed
                            ? "Your PDF is selected. Ask a question to preview the chat experience."
                            : "Upload a PDF on the left, then ask questions about its content."}
                        </p>
                        <div className="chat-example">
                          <span>TRY ASKING</span>
                          <button
                            onClick={() =>
                              setQuestion(
                                "Can you explain the key concepts in simple terms?"
                              )
                            }
                          >
                            “Can you explain the key concepts in simple terms?”{" "}
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="message-list">
                        {messages.map((m, i) => (
                          <div key={i} className={`message ${m.role}`}>
                            <div className="message-avatar">
                              {m.role === "user" ? (
                                "You"
                              ) : (
                                <Sparkles size={15} />
                              )}
                            </div>
                            <div className="message-content">
                              <span className="message-author">
                                {m.role === "user" ? "You" : "Studywise AI"}
                              </span>
                              <p>{m.text}</p>
                              {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                                <div className="source-reference">
                                  <FileText size={13} />
                                  <span>
                                    Sources:{" "}
                                    {m.sources
                                      .filter((s) => s.page !== undefined && s.page !== null)
                                      .map((s) => `Page ${s.page}`)
                                      .filter((v, idx, arr) => arr.indexOf(v) === idx)
                                      .join(", ") || "Document passages"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {isAskingPdf && (
                          <div className="message assistant">
                            <div className="message-avatar">
                              <Sparkles size={15} />
                            </div>
                            <div className="message-content">
                              <span className="message-author">Studywise AI</span>
                              <p className="thinking-text">Searching document and generating answer...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="chat-composer">
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendQuestion();
                        }
                      }}
                      placeholder={
                        indexed
                          ? "Ask something about your PDF…"
                          : "Upload and prepare a PDF to begin…"
                      }
                      disabled={!indexed || isAskingPdf}
                      rows={2}
                    />
                    <div className="composer-bottom">
                      <span>
                        <Sparkles size={13} /> Answers based on your document
                      </span>
                      <button
                        className="send-button"
                        onClick={sendQuestion}
                        disabled={!indexed || !question.trim() || isAskingPdf}
                        aria-label="Send question"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}

          {page === "library" && (
            <>
              <div className="tool-page-title">
                <div className="eyebrow">
                  <Files size={14} /> YOUR LIBRARY
                </div>
                <h1>
                  All your learning, <span>in one place.</span>
                </h1>
                <p>
                  Your recent summaries and PDF conversations will be organized
                  here.
                </p>
              </div>
              <div className="library-toolbar">
                <div className="search-box">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search your workspace…"
                  />
                </div>
                <button
                  className="filter-button"
                  onClick={() => notify("Filters can be added later.")}
                >
                  <Settings2 size={16} /> Filters <ChevronDown size={14} />
                </button>
              </div>
              <div className="panel library-panel">
                <div className="library-table-head">
                  <span>NAME</span>
                  <span>TYPE</span>
                  <span>LAST OPENED</span>
                  <span />
                </div>
                {initialHistory
                  .filter((h) =>
                    h.title.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((h, i) => (
                    <button
                      className="library-row"
                      key={h.title}
                      onClick={() =>
                        choosePage(h.type === "chat" ? "chat" : "summarizer")
                      }
                    >
                      <div className="library-name">
                        <div
                          className={`activity-icon ${
                            i % 2 ? "mint" : "lavender"
                          }`}
                        >
                          <FileText size={17} />
                        </div>
                        <strong>{h.title}</strong>
                      </div>
                      <span className="library-type">
                        {h.type === "chat" ? "PDF chat" : "Summary"}
                      </span>
                      <span className="library-date">{h.date}</span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                {initialHistory.filter((h) =>
                  h.title.toLowerCase().includes(search.toLowerCase())
                ).length === 0 && (
                  <div className="library-empty">No matching items found.</div>
                )}
              </div>
              <button
                className="secondary-button"
                onClick={() => choosePage("summarizer")}
              >
                <Plus size={16} /> Create a new summary
              </button>
            </>
          )}
        </div>
      </main>
      {toast && (
        <div className="toast">
          <Sparkles size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
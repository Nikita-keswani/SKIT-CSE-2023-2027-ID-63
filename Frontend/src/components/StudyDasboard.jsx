import { useRef, useState } from "react";
import {
  uploadNotes,
  chatWithNotes,
  uploadPdf,
  askPdfQuestion,
} from "../api/ai";
import "./study.css";

const tools = [
  {
    id: "notes",
    number: "01",
    icon: "✦",
    title: "Notes Summarizer",
    description:
      "Turn lengthy study material into concise, easy-to-understand notes.",
    label: "SMART SUMMARIZATION",
  },
  {
    id: "pdf",
    number: "02",
    icon: "⌕",
    title: "Chat with your PDF",
    description:
      "Ask questions about your documents and get answers grounded in their content.",
    label: "DOCUMENT INTELLIGENCE",
  },
];

export default function StudyDashboard({ user, onLogout }) {
  const [activeTool, setActiveTool] = useState("home");

  const [notesFile, setNotesFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

  const [notesDocument, setNotesDocument] = useState(null);
  const [pdfDocument, setPdfDocument] = useState(null);

  const [notesQuestion, setNotesQuestion] = useState("");
  const [pdfQuestion, setPdfQuestion] = useState("");

  const [notesMessages, setNotesMessages] = useState([]);
  const [pdfMessages, setPdfMessages] = useState([]);

  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const [error, setError] = useState("");

  const notesInput = useRef(null);
  const pdfInput = useRef(null);

  async function handleNotesUpload() {
    if (!notesFile) {
      setError("Please select a document first.");
      return;
    }

    setError("");
    setLoadingNotes(true);

    try {
      const result = await uploadNotes(notesFile);

      setNotesDocument({
        id: result.document_id,
        filename: result.filename || notesFile.name,
        chunks: result.chunks_created,
      });

      setNotesMessages([
        {
          role: "assistant",
          text: `Your document "${result.filename || notesFile.name}" is ready. Ask a question or generate a summary.`,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingNotes(false);
    }
  }

  async function handlePdfUpload() {
    if (!pdfFile) {
      setError("Please select a PDF first.");
      return;
    }

    setError("");
    setLoadingPdf(true);

    try {
      const result = await uploadPdf(pdfFile);

      setPdfDocument({
        id: result.document_id,
        filename: result.filename || pdfFile.name,
        pages: result.pages,
        chunks: result.chunks,
      });

      setPdfMessages([
        {
          role: "assistant",
          text: `Your PDF is ready! I've indexed ${
            result.pages ?? "the available"
          } pages. What would you like to know?`,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPdf(false);
    }
  }

  async function sendNotesQuestion(question = notesQuestion) {
    if (!notesDocument || !question.trim() || loadingNotes) return;

    const submittedQuestion = question.trim();

    setError("");
    setNotesQuestion("");

    setNotesMessages((previous) => [
      ...previous,
      { role: "user", text: submittedQuestion },
    ]);

    setLoadingNotes(true);

    try {
      const result = await chatWithNotes(
        notesDocument.id,
        submittedQuestion
      );

      setNotesMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: result.answer || "No answer was returned.",
          sources: result.sources || [],
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingNotes(false);
    }
  }

  async function sendPdfQuestion(question = pdfQuestion) {
    if (!pdfDocument || !question.trim() || loadingPdf) return;

    const submittedQuestion = question.trim();

    setError("");
    setPdfQuestion("");

    setPdfMessages((previous) => [
      ...previous,
      { role: "user", text: submittedQuestion },
    ]);

    setLoadingPdf(true);

    try {
      const result = await askPdfQuestion(
        pdfDocument.id,
        submittedQuestion
      );

      setPdfMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: result.answer || "No answer was returned.",
          sources: result.sources || [],
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPdf(false);
    }
  }

  function renderSources(sources) {
    if (!Array.isArray(sources) || sources.length === 0) return null;

    return (
      <div className="source-list">
        <span className="source-heading">Sources</span>

        {sources.map((source, index) => (
          <div className="source-item" key={index}>
            {typeof source === "string"
              ? source
              : source.page
                ? `Page ${source.page}`
                : source.source || source.filename || JSON.stringify(source)}
          </div>
        ))}
      </div>
    );
  }

  function renderChat(messages, loading) {
    return (
      <div className="chat-history" aria-live="polite">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-message ${message.role}`}
          >
            <div className="message-avatar">
              {message.role === "assistant" ? "✦" : "Y"}
            </div>

            <div className="message-content">
              <span className="message-author">
                {message.role === "assistant" ? "StudyAI" : "You"}
              </span>

              <p>{message.text}</p>

              {message.role === "assistant" &&
                renderSources(message.sources)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant">
            <div className="message-avatar">✦</div>

            <div className="message-content">
              <span className="message-author">StudyAI</span>
              <p className="thinking-text">Thinking...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderDocumentWorkspace(type) {
    const isNotes = type === "notes";
    const file = isNotes ? notesFile : pdfFile;
    const document = isNotes ? notesDocument : pdfDocument;
    const messages = isNotes ? notesMessages : pdfMessages;
    const loading = isNotes ? loadingNotes : loadingPdf;
    const question = isNotes ? notesQuestion : pdfQuestion;

    const inputRef = isNotes ? notesInput : pdfInput;

    const setFile = isNotes ? setNotesFile : setPdfFile;
    const setQuestion = isNotes ? setNotesQuestion : setPdfQuestion;

    const handleUpload = isNotes
      ? handleNotesUpload
      : handlePdfUpload;

    const sendQuestion = isNotes
      ? sendNotesQuestion
      : sendPdfQuestion;

    const accept = isNotes
      ? ".pdf,.docx,.txt"
      : ".pdf";

    return (
      <section className="workspace">
        <button
          className="back-button"
          onClick={() => {
            setActiveTool("home");
            setError("");
          }}
        >
          ← Back to dashboard
        </button>

        <div className="workspace-heading">
          <div>
            <span className="eyebrow">
              {isNotes ? "SMART SUMMARIZATION" : "DOCUMENT INTELLIGENCE"}
            </span>

            <h1>
              {isNotes ? "Notes Summarizer" : "Chat with your PDF"}
            </h1>

            <p>
              {isNotes
                ? "Understand your study material in less time."
                : "Ask questions and explore your document with AI."}
            </p>
          </div>

          <div className="workspace-icon">
            {isNotes ? "✦" : "⌕"}
          </div>
        </div>

        {!document ? (
          <div className="upload-panel">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              hidden
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setError("");
              }}
            />

            <button
              type="button"
              className="drop-zone"
              onClick={() => inputRef.current?.click()}
            >
              <span className="upload-icon">↑</span>

              <strong>Upload your document</strong>

              <span>
                Click to browse your files
              </span>

              <small>
                {isNotes
                  ? "PDF, DOCX or TXT"
                  : "PDF files only"}
              </small>
            </button>

            {file && (
              <div className="selected-file">
                <span className="file-symbol">▤</span>

                <div className="selected-file-info">
                  <strong>{file.name}</strong>
                  <span>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                <button
                  className="remove-file"
                  onClick={() => setFile(null)}
                  aria-label="Remove selected file"
                >
                  ×
                </button>
              </div>
            )}

            <button
              className="primary-button upload-submit"
              onClick={handleUpload}
              disabled={!file || loading}
            >
              {loading ? "Processing document..." : "Upload and process"}
              {!loading && <span>→</span>}
            </button>
          </div>
        ) : (
          <div className="document-workspace">
            <div className="document-info">
              <div className="document-file-icon">PDF</div>

              <div className="document-details">
                <strong>{document.filename}</strong>
                <span>
                  {isNotes
                    ? `${document.chunks ?? "Indexed"} chunks indexed`
                    : `${document.pages ?? "Indexed"} pages · ${
                        document.chunks ?? "Indexed"
                      } chunks`}
                </span>
              </div>

              <span className="ready-badge">Ready</span>

              <button
                className="new-document-button"
                onClick={() => {
                  if (isNotes) {
                    setNotesDocument(null);
                    setNotesFile(null);
                    setNotesMessages([]);
                  } else {
                    setPdfDocument(null);
                    setPdfFile(null);
                    setPdfMessages([]);
                  }

                  setError("");
                }}
              >
                New
              </button>
            </div>

            <div className="chat-panel">
              {renderChat(messages, loading)}

              <div className="chat-composer">
                {isNotes && (
                  <button
                    className="suggestion-button"
                    disabled={loading}
                    onClick={() =>
                      sendQuestion(
                        "Summarize this document with its main ideas and important points."
                      )
                    }
                  >
                    ✦ Summarize document
                  </button>
                )}

                <form
                  className="question-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendQuestion();
                  }}
                >
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder={
                      isNotes
                        ? "Ask a question or request a summary..."
                        : "Ask anything about your PDF..."
                    }
                    disabled={loading}
                  />

                  <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    aria-label="Send question"
                  >
                    ↑
                  </button>
                </form>

                <p className="composer-note">
                  AI-generated answers may require verification.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="study-app">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => {
            setActiveTool("home");
            setError("");
          }}
        >
          <span className="brand-mark">S</span>

          <span>
            <strong>StudyAI</strong>
            <small>YOUR LEARNING SPACE</small>
          </span>
        </button>

        <div className="sidebar-label">WORKSPACE</div>

        <button
          className={`nav-item ${activeTool === "home" ? "active" : ""}`}
          onClick={() => {
            setActiveTool("home");
            setError("");
          }}
        >
          <span>⌂</span> Overview
        </button>

        <button
          className={`nav-item ${activeTool === "notes" ? "active" : ""}`}
          onClick={() => {
            setActiveTool("notes");
            setError("");
          }}
        >
          <span>✦</span> Notes Summarizer
        </button>

        <button
          className={`nav-item ${activeTool === "pdf" ? "active" : ""}`}
          onClick={() => {
            setActiveTool("pdf");
            setError("");
          }}
        >
          <span>⌕</span> PDF Q&A
        </button>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span>✧</span>

            <strong>Learn smarter</strong>

            <p>Spend less time searching. More time understanding.</p>
          </div>

          <div className="profile-row">
            <div className="profile-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div className="profile-details">
              <strong>{user?.name || "Student"}</strong>
              <span>{user?.email || "Your workspace"}</span>
            </div>

            <button
              className="logout-button"
              onClick={onLogout}
              title="Log out"
            >
              ↗
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>StudyAI</span>
            <span>/</span>
            <strong>
              {activeTool === "home"
                ? "Overview"
                : activeTool === "notes"
                  ? "Notes Summarizer"
                  : "PDF Q&A"}
            </strong>
          </div>

          <div className="topbar-status">
            <span className="status-dot" />
            AI workspace
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button onClick={() => setError("")}>×</button>
            </div>
          )}

          {activeTool === "home" ? (
            <>
              <section className="hero-panel">
                <div className="hero-copy">
                  <span className="hero-label">
                    ✦ YOUR PERSONAL AI STUDY ASSISTANT
                  </span>

                  <h1>
                    Learn more.
                    <br />
                    <span>Understand better.</span>
                  </h1>

                  <p>
                    Your notes, your documents, your questions.
                    Everything you need to learn with more clarity.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => {
                      setActiveTool("notes");
                      setError("");
                    }}
                  >
                    Explore your workspace <span>→</span>
                  </button>
                </div>

                <div className="hero-art" aria-hidden="true">
                  <div className="art-orbit orbit-one" />
                  <div className="art-orbit orbit-two" />

                  <div className="art-card art-card-back">
                    <span>YOUR NOTES</span>
                    <div />
                    <div />
                    <div />
                  </div>

                  <div className="art-card art-card-front">
                    <div className="art-sparkle">✦</div>
                    <strong>Knowledge,</strong>
                    <strong>made simple.</strong>
                    <span>✧ AI-powered learning</span>
                  </div>

                  <div className="art-floating">✦</div>
                </div>
              </section>

              <section className="tools-section">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">YOUR TOOLKIT</span>
                    <h2>What would you like to do?</h2>
                    <p>Choose a tool and get started.</p>
                  </div>

                  <span className="tool-count">02 TOOLS</span>
                </div>

                <div className="tool-grid">
                  {tools.map((tool) => (
                    <button
                      className={`tool-card ${tool.id}`}
                      key={tool.id}
                      onClick={() => {
                        setActiveTool(tool.id);
                        setError("");
                      }}
                    >
                      <div className="tool-card-top">
                        <span className="tool-icon">{tool.icon}</span>
                        <span className="tool-number">{tool.number}</span>
                      </div>

                      <span className="tool-label">{tool.label}</span>

                      <h3>{tool.title}</h3>

                      <p>{tool.description}</p>

                      <span className="tool-action">
                        Open workspace <span>↗</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="bottom-note">
                <span>✧</span>

                <div>
                  <strong>A little smarter, every day.</strong>
                  <p>
                    Upload a document, ask questions, and make your study
                    sessions count.
                  </p>
                </div>
              </section>
            </>
          ) : (
            renderDocumentWorkspace(activeTool)
          )}

          <footer className="app-footer">
            Made for curious minds <span>✦</span> Powered by AI
          </footer>
        </div>
      </main>
    </div>
  );
}
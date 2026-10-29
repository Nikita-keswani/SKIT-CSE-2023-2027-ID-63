# Studywise UI-only prototype

This is a separate frontend-only UI prototype for the Note Summarizer and PDF RAG features. It does not modify or replace any file in the existing project and does not call the backend yet. Upload controls, navigation, summary options, and the chat preview are interactive, but generating summaries and retrieving PDF answers require a later API integration step.

## Run locally

Requirements: Node.js 18+ (Node.js 20+ recommended).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## What is included

- Overview dashboard
- Note summarizer screen (PDF/DOCX/TXT selection, paste notes, length and format controls)
- PDF chat screen (PDF selection, prepare-document state, question/answer UI, source citation placeholder)
- Library screen with searchable sample items
- Responsive sidebar and mobile layouts

## Important

This is intentionally isolated from your existing repository. It does not edit backend files, authentication, database configuration, dependencies, or existing frontend files. API integration can be done separately after you approve the UI.

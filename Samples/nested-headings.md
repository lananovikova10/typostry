# Document with Deep Heading Nesting

This document tests the editor's ability to handle deeply nested heading structures for navigation and outline generation.

## 1. Introduction

Welcome to this comprehensive test document that explores various levels of heading nesting.

### 1.1 Purpose

The purpose of this document is to test the sidebar navigation and outline features.

#### 1.1.1 Primary Goals

To ensure smooth navigation through complex document structures.

##### 1.1.1.1 Navigation Testing

Test the ability to jump between sections quickly.

###### 1.1.1.1.1 Deep Nesting Level

This is the deepest level (H6) that HTML supports.

### 1.2 Scope

This document covers all heading levels from H1 to H6.

## 2. Technical Specifications

Let's dive into the technical details of our markdown editor.

### 2.1 Architecture

The editor is built with modern web technologies.

#### 2.1.1 Frontend

React-based user interface with TypeScript.

##### 2.1.1.1 Components

Modular component architecture for maintainability.

###### 2.1.1.1.1 UI Components

Reusable interface elements built with Radix UI.

##### 2.1.1.2 State Management

Using React hooks and context for state.

###### 2.1.1.2.1 Context Providers

Theme, editor state, and user preferences.

#### 2.1.2 Backend Integration

API integration for extended features.

##### 2.1.2.1 REST APIs

Standard HTTP REST endpoints.

###### 2.1.2.1.1 Authentication

JWT-based authentication system.

##### 2.1.2.2 Real-time Features

WebSocket connections for live collaboration.

### 2.2 Performance

Optimizations for handling large documents.

#### 2.2.1 Rendering

Efficient rendering strategies implemented.

##### 2.2.1.1 Virtual Scrolling

Only render visible content for large docs.

###### 2.2.1.1.1 Implementation Details

Using react-window library for virtual lists.

##### 2.2.1.2 Debouncing

Reduce unnecessary re-renders during typing.

###### 2.2.1.2.1 Configuration Options

Adjustable debounce timing (300ms default).

#### 2.2.2 Processing

Background processing with Web Workers.

##### 2.2.2.1 Markdown Parsing

Unified/remark pipeline in worker thread.

###### 2.2.2.1.1 Parser Configuration

Custom plugins and transformations.

## 3. Features

Comprehensive feature set for markdown editing.

### 3.1 Editor Features

Core editing capabilities.

#### 3.1.1 Syntax Highlighting

Real-time syntax highlighting for code blocks.

##### 3.1.1.1 Supported Languages

Over 100 programming languages supported.

###### 3.1.1.1.1 Popular Languages

JavaScript, Python, Java, C++, Rust, Go.

##### 3.1.1.2 Theme Support

Multiple color themes for code highlighting.

###### 3.1.1.2.1 Light Themes

GitHub Light, VS Code Light.

###### 3.1.1.2.2 Dark Themes

GitHub Dark, Dracula, Monokai.

#### 3.1.2 Auto-completion

Smart suggestions while typing.

##### 3.1.2.1 Emoji Picker

Quick emoji insertion with keyboard shortcuts.

###### 3.1.2.1.1 Search Functionality

Search emojis by name or category.

##### 3.1.2.2 Link Suggestions

Auto-suggest internal document links.

### 3.2 Preview Features

Live preview capabilities.

#### 3.2.1 Math Rendering

LaTeX math formulas with KaTeX.

##### 3.2.1.1 Inline Math

Math expressions within text: $E = mc^2$

###### 3.2.1.1.1 Syntax

Use single dollar signs for inline.

##### 3.2.1.2 Block Math

Standalone math equations on separate lines.

###### 3.2.1.2.1 Syntax

Use double dollar signs for blocks.

#### 3.2.2 Diagram Rendering

Mermaid diagram support.

##### 3.2.2.1 Flowcharts

Standard flowchart diagrams.

###### 3.2.2.1.1 Node Types

Decision nodes, process nodes, terminal nodes.

##### 3.2.2.2 Sequence Diagrams

Interaction between components over time.

###### 3.2.2.2.1 Participants

Actors and systems in the sequence.

### 3.3 Export Features

Multiple export formats supported.

#### 3.3.1 File Formats

Export to various formats.

##### 3.3.1.1 PDF Export

Generate PDF documents from markdown.

###### 3.3.1.1.1 Styling Options

Custom CSS for PDF styling.

##### 3.3.1.2 HTML Export

Export as standalone HTML files.

###### 3.3.1.2.1 Template Options

Choose from multiple HTML templates.

## 4. User Interface

Design and usability considerations.

### 4.1 Layout

Flexible layout options.

#### 4.1.1 Split View

Side-by-side editor and preview.

##### 4.1.1.1 Resizable Panels

Drag to adjust panel sizes.

###### 4.1.1.1.1 Persistence

Panel sizes saved in browser storage.

##### 4.1.1.2 Synchronized Scrolling

Preview scrolls with editor position.

#### 4.1.2 Full Screen Mode

Distraction-free writing mode.

##### 4.1.2.1 Keyboard Shortcut

Press F11 to toggle full screen.

###### 4.1.2.1.1 Exit Options

ESC or F11 to exit full screen.

### 4.2 Theming

Dark and light theme support.

#### 4.2.1 Theme Toggle

Quick theme switching.

##### 4.2.1.1 System Theme

Follow system preferences automatically.

###### 4.2.1.1.1 Detection

Uses prefers-color-scheme media query.

##### 4.2.1.2 Manual Override

Choose theme regardless of system setting.

## 5. Keyboard Shortcuts

Productivity-enhancing shortcuts.

### 5.1 Editing Shortcuts

Common text editing operations.

#### 5.1.1 Formatting

Text formatting shortcuts.

##### 5.1.1.1 Bold

Ctrl/Cmd + B for bold text.

###### 5.1.1.1.1 Alternative

Wrap text with ** or __.

##### 5.1.1.2 Italic

Ctrl/Cmd + I for italic text.

###### 5.1.1.2.1 Alternative

Wrap text with * or _.

#### 5.1.2 Structure

Document structure shortcuts.

##### 5.1.2.1 Headings

Ctrl/Cmd + 1-6 for heading levels.

##### 5.1.2.2 Lists

Ctrl/Cmd + L for lists.

### 5.2 Navigation Shortcuts

Quick navigation through document.

#### 5.2.1 Search

Find and replace functionality.

##### 5.2.1.1 Find

Ctrl/Cmd + F to search.

###### 5.2.1.1.1 Options

Case sensitive, whole word, regex.

##### 5.2.1.2 Replace

Ctrl/Cmd + H for find and replace.

## 6. Collaboration

Multi-user editing features (future).

### 6.1 Real-time Editing

Multiple users editing simultaneously.

#### 6.1.1 Conflict Resolution

Operational transformation for conflicts.

##### 6.1.1.1 Algorithm

Using differential synchronization.

###### 6.1.1.1.1 Implementation

Based on Neil Fraser's work.

##### 6.1.1.2 User Cursors

Show other users' cursor positions.

### 6.2 Comments

Inline comments and discussions.

#### 6.2.1 Thread Management

Organize comment threads.

##### 6.2.1.1 Resolution

Mark threads as resolved.

###### 6.2.1.1.1 History

View resolved comment history.

## 7. Integrations

External service integrations.

### 7.1 Cloud Storage

Save documents to cloud services.

#### 7.1.1 Supported Services

List of supported cloud platforms.

##### 7.1.1.1 Google Drive

Integration with Google Drive.

###### 7.1.1.1.1 Authorization

OAuth 2.0 authentication flow.

##### 7.1.1.2 Dropbox

Integration with Dropbox.

#### 7.1.2 Sync Options

Automatic and manual sync modes.

### 7.2 Version Control

Git integration for versioning.

#### 7.2.1 Git Commands

Basic Git operations from editor.

##### 7.2.1.1 Commit

Save changes with commit message.

###### 7.2.1.1.1 Commit Messages

Follow conventional commit standards.

##### 7.2.1.2 Push/Pull

Sync with remote repository.

## 8. Testing

Quality assurance and testing.

### 8.1 Unit Tests

Component-level testing.

#### 8.1.1 Test Framework

Using Jest and React Testing Library.

##### 8.1.1.1 Test Coverage

Aiming for 80%+ code coverage.

###### 8.1.1.1.1 Coverage Reports

Generated with Jest coverage tools.

### 8.2 E2E Tests

End-to-end testing with Cypress.

#### 8.2.1 Test Scenarios

Critical user workflows.

##### 8.2.1.1 Editor Workflows

Test basic editing operations.

###### 8.2.1.1.1 Text Input

Typing and formatting text.

##### 8.2.1.2 Preview Workflows

Test preview rendering accuracy.

## 9. Documentation

User and developer documentation.

### 9.1 User Guides

End-user documentation.

#### 9.1.1 Getting Started

Quick start guide for new users.

##### 9.1.1.1 Installation

How to install and setup.

###### 9.1.1.1.1 System Requirements

Minimum and recommended specs.

##### 9.1.1.2 First Steps

Basic usage tutorial.

### 9.2 API Documentation

Developer API reference.

#### 9.2.1 REST API

HTTP API endpoints.

##### 9.2.1.1 Authentication

API authentication methods.

###### 9.2.1.1.1 API Keys

Generate and manage API keys.

##### 9.2.1.2 Rate Limiting

Request rate limits and quotas.

## 10. Conclusion

Summary and future directions.

### 10.1 Current Status

Project status and achievements.

#### 10.1.1 Completed Features

List of implemented features.

##### 10.1.1.1 Core Features

Essential functionality complete.

###### 10.1.1.1.1 Stability

Production-ready and stable.

### 10.2 Roadmap

Future development plans.

#### 10.2.1 Short-term Goals

Next 3-6 months.

##### 10.2.1.1 Performance

Further performance optimizations.

###### 10.2.1.1.1 Metrics

Target metrics for improvements.

##### 10.2.1.2 Features

New feature implementations.

#### 10.2.2 Long-term Vision

Strategic direction for 1-2 years.

##### 10.2.2.1 Platform Expansion

Mobile and desktop applications.

###### 10.2.2.1.1 Mobile App

Native iOS and Android apps.

##### 10.2.2.2 AI Integration

AI-powered writing assistance.

---

**End of Document**

This document structure tests the editor's ability to handle deeply nested headings and should provide a comprehensive outline in the sidebar navigation.

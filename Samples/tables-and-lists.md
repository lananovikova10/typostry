# Tables and Lists

This document demonstrates various table and list formats supported by the markdown editor.

## Simple Lists

### Unordered Lists

- First item
- Second item
- Third item
- Fourth item

### Nested Unordered Lists

- Level 1 item
  - Level 2 item
  - Level 2 item
    - Level 3 item
    - Level 3 item
      - Level 4 item
- Level 1 item
  - Level 2 item

### Ordered Lists

1. First step
2. Second step
3. Third step
4. Fourth step

### Nested Ordered Lists

1. Main task
   1. Subtask A
   2. Subtask B
      1. Sub-subtask B1
      2. Sub-subtask B2
   3. Subtask C
2. Next main task
   1. Subtask A
   2. Subtask B

### Mixed Lists

1. Numbered item
   - Bullet point
   - Another bullet point
     1. Numbered sub-item
     2. Another numbered sub-item
2. Another numbered item
   - Bullet point
     - Nested bullet
       1. Deep numbered item

### Task Lists (GFM)

- [x] Completed task
- [x] Another completed task
- [ ] Pending task
- [ ] Another pending task
  - [x] Completed subtask
  - [ ] Pending subtask

## Simple Tables

### Basic Table

| Name | Age | City |
|------|-----|------|
| Alice | 25 | New York |
| Bob | 30 | London |
| Charlie | 35 | Tokyo |

### Table with Alignment

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Apple | Banana | Cherry |
| Dog | Elephant | Fox |
| Guitar | Harmonica | Instrument |

## Complex Tables

### Product Comparison Table

| Feature | Basic Plan | Pro Plan | Enterprise |
|---------|-----------|----------|------------|
| Storage | 10 GB | 100 GB | Unlimited |
| Users | 1 | 5 | Unlimited |
| Support | Email | Email + Chat | 24/7 Phone |
| Price | $9/month | $29/month | Custom |
| API Access | ❌ | ✅ | ✅ |
| Advanced Analytics | ❌ | ❌ | ✅ |

### Project Timeline Table

| Phase | Duration | Start Date | End Date | Status |
|-------|----------|------------|----------|--------|
| Planning | 2 weeks | 2024-01-01 | 2024-01-14 | ✅ Complete |
| Design | 3 weeks | 2024-01-15 | 2024-02-04 | ✅ Complete |
| Development | 8 weeks | 2024-02-05 | 2024-03-31 | 🔄 In Progress |
| Testing | 2 weeks | 2024-04-01 | 2024-04-14 | ⏳ Pending |
| Deployment | 1 week | 2024-04-15 | 2024-04-21 | ⏳ Pending |

### Programming Languages Comparison

| Language | Year | Type | Memory Management | Popular Use Cases |
|----------|------|------|-------------------|-------------------|
| JavaScript | 1995 | Dynamic | GC | Web Development |
| Python | 1991 | Dynamic | GC | Data Science, ML |
| Java | 1995 | Static | GC | Enterprise Apps |
| C++ | 1985 | Static | Manual | Systems, Games |
| Rust | 2010 | Static | Ownership | Systems, WebAssembly |
| Go | 2009 | Static | GC | Cloud Services |
| TypeScript | 2012 | Static | GC | Web Apps |
| Swift | 2014 | Static | ARC | iOS/macOS Apps |

## Definition Lists (using HTML)

<dl>
  <dt>Markdown</dt>
  <dd>A lightweight markup language with plain text formatting syntax.</dd>

  <dt>HTML</dt>
  <dd>HyperText Markup Language, the standard markup language for web pages.</dd>

  <dt>CSS</dt>
  <dd>Cascading Style Sheets, used for describing the presentation of a document.</dd>
</dl>

## Nested Lists with Content

1. **Frontend Development**

   Modern web interface development.

   - **Technologies**
     - React
     - Vue
     - Angular

   - **Tools**
     - Webpack
     - Vite
     - npm/yarn

2. **Backend Development**

   Server-side application logic.

   - **Technologies**
     - Node.js
     - Python
     - Java

   - **Databases**
     - PostgreSQL
     - MongoDB
     - Redis

## Large Data Table

### Employee Directory

| ID | Name | Department | Role | Location | Email | Phone | Start Date |
|----|------|------------|------|----------|-------|-------|------------|
| 001 | John Smith | Engineering | Senior Dev | New York | john@example.com | 555-0101 | 2020-01-15 |
| 002 | Sarah Johnson | Marketing | Manager | London | sarah@example.com | 555-0102 | 2019-03-20 |
| 003 | Mike Chen | Engineering | Lead Dev | San Francisco | mike@example.com | 555-0103 | 2018-07-10 |
| 004 | Emily Brown | Sales | Director | Chicago | emily@example.com | 555-0104 | 2021-05-01 |
| 005 | David Lee | HR | Coordinator | Seattle | david@example.com | 555-0105 | 2020-11-15 |
| 006 | Lisa Wang | Engineering | Dev | Austin | lisa@example.com | 555-0106 | 2022-02-01 |
| 007 | Tom Wilson | Product | Manager | Boston | tom@example.com | 555-0107 | 2019-09-12 |
| 008 | Anna Garcia | Design | Senior Designer | Miami | anna@example.com | 555-0108 | 2021-01-20 |

## Lists with Code

### Installation Steps

1. **Install Node.js**
   ```bash
   # Download from nodejs.org or use package manager
   brew install node
   ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/username/project.git
   cd project
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## Horizontal Lists (using HTML)

<ul style="list-style-type: none; padding: 0; display: flex; gap: 1rem;">
  <li>🏠 Home</li>
  <li>📝 About</li>
  <li>💼 Services</li>
  <li>📧 Contact</li>
</ul>

## Complex Nested Structure

### Project Structure

```
project/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   └── features/
│   │       ├── Auth/
│   │       └── Dashboard/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useTheme.ts
│   ├── utils/
│   │   └── helpers.ts
│   └── App.tsx
├── public/
│   ├── images/
│   └── favicon.ico
├── package.json
└── README.md
```

## Statistical Table

### Browser Market Share (2024)

| Browser | Desktop % | Mobile % | Overall % | Trend |
|---------|-----------|----------|-----------|-------|
| Chrome | 65.12% | 62.85% | 64.21% | → |
| Safari | 19.37% | 25.44% | 21.87% | ↑ |
| Edge | 5.13% | 0.32% | 3.28% | ↑ |
| Firefox | 6.81% | 0.51% | 4.42% | ↓ |
| Opera | 2.23% | 1.89% | 2.09% | → |
| Others | 1.34% | 8.99% | 4.13% | ↑ |

## List with Images (using HTML for alignment)

1. **Beautiful Landscapes**

   <img src="https://via.placeholder.com/300x200" alt="Mountain" width="300">

   Stunning mountain views with crystal clear lakes.

2. **Urban Architecture**

   <img src="https://via.placeholder.com/300x200" alt="City" width="300">

   Modern city skylines and architectural marvels.

3. **Natural Wonders**

   <img src="https://via.placeholder.com/300x200" alt="Forest" width="300">

   Dense forests and wildlife habitats.

## Keyboard Shortcuts Table

### Editor Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Bold | Ctrl + B | ⌘ + B |
| Italic | Ctrl + I | ⌘ + I |
| Underline | Ctrl + U | ⌘ + U |
| Save | Ctrl + S | ⌘ + S |
| Find | Ctrl + F | ⌘ + F |
| Replace | Ctrl + H | ⌘ + ⌥ + F |
| Undo | Ctrl + Z | ⌘ + Z |
| Redo | Ctrl + Y | ⌘ + ⇧ + Z |
| Select All | Ctrl + A | ⌘ + A |

## Feature Matrix

### Framework Comparison

| Feature | React | Vue | Angular | Svelte |
|---------|-------|-----|---------|--------|
| Virtual DOM | ✅ | ✅ | ❌ (Real DOM) | ❌ (Compiler) |
| TypeScript | ✅ | ✅ | ✅ | ✅ |
| Learning Curve | Medium | Easy | Hard | Easy |
| Bundle Size | Small | Small | Large | Tiny |
| Community | Very Large | Large | Large | Growing |
| State Management | Redux/Context | Vuex/Pinia | RxJS | Stores |
| Routing | React Router | Vue Router | Built-in | SvelteKit |
| CLI Tool | CRA/Vite | Vue CLI | Angular CLI | SvelteKit |

## End Notes

This document demonstrates:
- Various list types (ordered, unordered, nested, task lists)
- Simple and complex tables
- Tables with different alignments
- Mixed content with lists and code blocks
- Large data tables for performance testing

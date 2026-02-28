# UniPath

A web app that generates personalized 4-year academic plans for college students. Users input their major, minor, and credits; the system produces a semester-by-semester schedule that respects prerequisites, credit limits, and degree requirements.

---

## Setup

```bash
# Clone the repo
git clone <repo-url>
cd unipath

# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## How It Works

### Planner Logic

The planner (`lib/planner/generate-plan.ts`) builds a 4-year, 8-semester schedule from major and minor JSON data. It enforces:

1. **Entrance-to-Major (ETM) before Core** — ETM courses must be completed before MAC (major core) or MAE (major elective) courses.

2. **Prerequisites** — A course can only be scheduled once all courses in its `prerequisite` array have been completed in earlier semesters.

3. **Concurrent Requirements** — A course can only be scheduled if all courses in its `concurrent` array are either completed or scheduled in the same semester.

4. **Major + Minor Overlap** — Courses that satisfy both major and minor requirements (e.g., MATH 140, 141, 220, 230) are counted once and scheduled only once.

5. **Credit Limits** — Each semester stays within 12–19 credits. General education credits (e.g., 45 for Computer Science) are distributed across all 8 semesters.

6. **Electives** — The planner selects MAE (major electives) and MIE (minor electives) from the available pools to meet degree requirements.

### Data Format

Course data lives in `data/penn-state/*.json`. Each course has:

| Field         | Description                                              |
|----------------|----------------------------------------------------------|
| `className`    | Course code (e.g., "CMPSC 121")                         |
| `credits`      | Credit count ("3", "4", or "1-2" for ranges)             |
| `difficulty`   | Difficulty rating (1–5)                                 |
| `type`         | ETM, MAC, MAE (major) or MIC, MIE (minor)                |
| `prerequisite` | Array of course codes that must be completed before      |
| `concurrent`   | Array of course codes that must be taken same/before    |

### Supported Majors & Minors

- **Major:** Computer Science (`data/penn-state/computer-science-major.json`)
- **Minor:** Mathematics (`data/penn-state/math-minor.json`)

To add more, create JSON files and update `lib/config.ts` with the mapping.

---

## Project Structure

```
unipath/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── info.tsx            # Setup form + 4-year plan UI
├── data/penn-state/       # Major/minor course catalogs
├── lib/
│   ├── config.ts          # Major/minor → JSON mapping
│   └── planner/
│       ├── generate-plan.ts
│       ├── types.ts
│       └── utils.ts
└── package.json
```

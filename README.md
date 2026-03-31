# 📊 REND Performance Analytics

A React-based web application for analyzing performance metrics (Rendement - REND) from manufacturing data files.

## Features

- **Drag & Drop File Upload**: Easily upload CSV or Excel files (.csv, .xlsx, .xls)
- **Data Processing**: Automatically parses and cleans performance data
- **REND Calculation**: Calculates average Rendement (performance percentage) metrics
- **Multiple Views**:
  - **Daily View**: Performance by date and operator
  - **Monthly View**: Aggregated monthly performance summary
  - **By Operator**: Overall performance statistics by operator
- **Filtering**: Filter results by operator name
- **Responsive Design**: Works on desktop and mobile devices

## Data Format

The application expects CSV or Excel files with the following columns:

- **Date d'enroulage** (or similar): The date of wrapping/production
- **Opérateur** (or similar): The operator name
- **REND** (or similar): The Rendement (performance) percentage value

The application intelligently handles:
- Multiple column naming conventions (case-insensitive)
- Invalid values (#N/A, empty cells)
- Different date formats (DD/MM/YY, ISO format, etc.)

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Start the Application**:
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173/` (Vite may choose another free port if 5173 is in use).

2. **Upload Your Data**:
   - Drag and drop your CSV/Excel file into the upload area, or
   - Click "Click to Browse" and select your file

3. **View Results**:
   - Switch between Daily, Monthly, and By Operator views
   - Filter by specific operators
   - Review performance statistics and trends

## Recent changes

- Dashboard redesign with KPI cards, sparklines, and improved layout
- Persist last uploaded dataset in browser with "Restore" / "Clear" in the sidebar
- Export aggregated by-day CSV from the dashboard
- Improved responsive styling, table visuals and filters

## Project Structure

```
src/
├── App.tsx              # Main application component
├── App.css              # Application styles
├── FileUpload.tsx       # File upload component with drag-drop
├── FileUpload.css       # File upload styles
├── Dashboard.tsx        # Results dashboard component
├── Dashboard.css        # Dashboard styles
├── utils.ts             # Data parsing and processing functions
├── types.ts             # TypeScript type definitions
├── index.css            # Global styles
└── main.tsx             # Entry point
```

## Technologies

- **React 19**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Build tool and development server
- **XLSX**: Excel and CSV file parsing
- **CSS3**: Responsive styling

## Quick Try / Notes

- **Load Example Data**: Use the "Load Example Data" button in the sidebar to populate the dashboard without uploading a file.
- **Download Example CSV**: Click "Download Example CSV" in the sidebar to get a sample CSV compatible with the parser.
- **Local persistence**: The app stores the last aggregated dataset in `perfoplas.lastData` and upload metadata in `perfoplas.lastUpload` in `localStorage`. Use "Restore" / "Clear" in the sidebar to manage it.
- **Node**: Tested with Node.js >=16 and npm >=8. If you see issues, run `npm install` then `npm run dev`.

## Troubleshooting

- If the dashboard shows very few valid REND values, verify your file includes a recognizable REND column. Common header variants are `REND`, `Rendement`, or `Performance`.
- If parsing fails, check for Excel error codes (e.g. `#N/A`) or unusual decimal separators (commas vs dots). The parser attempts to handle both.

## License

MIT License

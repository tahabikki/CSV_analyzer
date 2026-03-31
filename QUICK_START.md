# REND Performance Analytics - Quick Reference

## 🚀 Starting the App

```bash
# Navigate to the project directory
cd perfoplas

# Start the development server
npm run dev

# The app will be available at http://localhost:5173/
```

## 📊 How to Use

### Step 1: Prepare Your Data
Your file should be a CSV or Excel file with these columns:
- **Date** (e.g., "01/01/26")
- **Operator** (e.g., "AZHAR AZIZ")  
- **REND** (e.g., "95.5")

### Step 2: Upload File
- Drag your file into the gray upload area
- OR click "Click to Browse" to select a file

### Step 3: View Results
The app automatically calculates:
- ✅ Daily performance by operator
- ✅ Monthly performance summary
- ✅ Overall operator rankings
- ✅ Performance statistics

## 🎯 Features

| View | Shows |
|------|-------|
| **Daily** | Performance for each operator on each day |
| **Monthly** | Aggregated monthly performance |
| **By Operator** | Overall ranking of operators |

## 🔧 Data Column Names

The app automatically recognizes these column names (case-insensitive):

### Date Columns
- Date d'enroulage
- Date
- date
- Date_enroulage

### Operator Columns
- Opérateur (French)
- Operateur
- operateur
- OPERATEUR
- Operator

### Performance Columns
- REND
- Rend
- rend
- Rendement
- OBJ

## ⚙️ Data Handling

The app automatically:
- ✅ Cleans #N/A values in Excel
- ✅ Ignores empty cells
- ✅ Removes rows with missing dates or operators
- ✅ Converts percentages to numbers
- ✅ Groups data by month and year

## 📈 Performance Ratings

- 🟢 **90-100%**: Excellent
- 🟡 **70-90%**: Good
- 🔴 **Below 70%**: Needs Improvement

## 💻 System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js 16+ (for development)
- No internet connection required (app runs locally)

## 🆘 Troubleshooting

### Issue: File won't upload
**Solution**: Ensure the file is .csv, .xlsx, or .xls format

### Issue: No data appears
**Solution**: Check that your file has:
- Column headers (Date, Operator, REND)
- Data rows below headers
- Non-empty date and operator values

### Issue: REND values showing as 0
**Solution**: Verify REND column contains numeric values, not text

### Issue: Dates not recognized
**Solution**: Use standard date formats like:
- DD/MM/YY (01/01/26)
- YYYY-MM-DD (2026-01-01)
- MM/DD/YYYY (01/01/2026)

## 📁 Project Structure

```
perfoplas/
├── src/
│   ├── App.tsx              # Main app
│   ├── FileUpload.tsx       # Upload component
│   ├── Dashboard.tsx        # Results display
│   ├── utils.ts             # Data processing
│   ├── types.ts             # TypeScript types
│   └── *.css                # Styling
├── sample_data.csv          # Test data
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🔒 Data Privacy

- All data processing happens in your browser
- No data is sent to any server
- No tracking or analytics
- Your data stays on your computer

## 🚢 Building for Production

```bash
# Build optimized version
npm run build

# Preview the production build
npm preview
```

The production build will be in the `dist/` folder.

## 📝 Example CSV Format

```csv
Date d'enroulage,Opérateur,REND,Designation
01/01/26,AZHAR AZIZ,95.5,VINYSOL BLUE
01/01/26,AMMOURI RACHID,88.3,VINYSOL BLUE
02/01/26,AZHAR AZIZ,98.3,VINYSOL BLUE
02/01/26,HOUMANE YOUSSEF,30.2,VINYLIA VIOLET
```

## 🎓 Learning Resources

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org
- **Vite**: https://vite.dev
- **XLSX Library**: https://sheetjs.com

## 📞 Support

For issues or questions:
1. Check the GETTING_STARTED.md file
2. Review the README.md
3. Check your data format is correct
4. Ensure file is not corrupted

---

**Happy analyzing!** 📊

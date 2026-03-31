# Getting Started with REND Performance Analytics

## Quick Start

1. **The app is already running!** Open your browser to: **http://localhost:5173/**

2. **Test with Sample Data**:
   - A sample CSV file (`sample_data.csv`) has been created in the project root
   - Drag this file into the upload area, or click to browse and select it
   - The app will immediately calculate and display performance metrics

## What the App Does

### File Upload
- **Drag & Drop**: Simply drag your CSV/Excel file onto the upload area
- **Click to Browse**: Click the button to select a file from your computer
- Supported formats: `.csv`, `.xlsx`, `.xls`

### Data Analysis
After uploading a file, the app automatically:
1. Parses the file and extracts data
2. Calculates REND (Rendement/Performance) averages
3. Groups data by day, month, and operator
4. Handles invalid data (#N/A, empty values, etc.)
5. Displays results in three different views

### Three Views of Your Data

#### 1. Daily View
- Shows performance for each operator on each day
- Includes how many records were valid vs total
- Color-coded: Green (90+ %), Yellow (70-90%), Red (< 70%)

#### 2. Monthly View
- Aggregates all data by month
- Shows monthly average REND percentage
- Total record count per month

#### 3. By Operator View
- Shows overall performance for each operator
- Sorted from best to worst performance
- Useful for identifying top and bottom performers

## Data Format Requirements

Your CSV/Excel file should include these columns (names are flexible):

| Column Name | Purpose | Example |
|-------------|---------|---------|
| Date d'enroulage (or Date) | Production date | 01/01/26 |
| Opérateur | Operator name | AZHAR AZIZ |
| REND | Performance percentage | 95.5 |

Additional columns are optional and won't affect processing.

## Example Data

```
Date d'enroulage | Opérateur | REND
01/01/26 | AZHAR AZIZ | 95.5
01/01/26 | AMMOURI RACHID | 88.3
02/01/26 | AZHAR AZIZ | 98.3
```

## Common Issues & Solutions

### "Failed to process file"
- ✅ Make sure your file is actually CSV or Excel format
- ✅ Verify the file isn't corrupted
- ✅ Check that it has data in it

### Missing data in results
- ✅ The application skips rows without date or operator names
- ✅ Non-numeric REND values are automatically cleaned
- ✅ #N/A errors in Excel are automatically ignored

### Dates not showing correctly
- ✅ The app supports multiple date formats automatically
- ✅ Works with DD/MM/YY, YYYY-MM-DD, and other common formats

## Performance Tips

- Large files (10,000+ rows) may take a few seconds to process
- The app runs entirely in your browser - no data is sent anywhere
- Upload a fresh file to reset and start over

## Features Explained

### Color Coding
- 🟢 **Green**: 90%+ - Excellent performance
- 🟡 **Yellow**: 70-90% - Good performance
- 🔴 **Red**: Below 70% - Needs improvement

### Filtering
In Daily and By Operator views, you can:
- Filter to see data for a specific operator only
- Select "All Operators" to see everything

### Statistics
- **Overall REND Average**: Average across all data in the file
- **Total Records**: How many rows of data were processed
- **Valid Records**: How many rows had actual REND values (vs empty/errors)

## File Structure

The app looks for these column headers (case-insensitive):
- **Date columns**: "Date d'enroulage", "Date", "date"
- **Operator columns**: "Opérateur", "Operateur", "operateur", "OPERATEUR"
- **REND columns**: "REND", "Rend", "rend", "rendement"

## Next Steps

1. ✅ Test with `sample_data.csv`
2. 📊 Prepare your own performance data file
3. 📈 Upload and analyze your data
4. 💾 Export results if needed

## Support

If you encounter any issues:
1. Check that your file is in CSV or Excel format
2. Verify the required columns exist
3. Ensure dates and operator names are filled in
4. Check for obvious data errors in Excel

Enjoy analyzing your performance data! 📊

import React, { useState } from 'react';
import './FileUpload.css';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFileName(file.name);
        onFileSelected(file);
      } else {
        alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFileName(file.name);
      onFileSelected(file);
    }
  };

  return (
    <div className="file-upload-container">
      <div
        className={`drag-drop-zone ${isDragOver ? 'drag-over' : ''} ${isLoading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-content">
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <h2>Drag & Drop Your File</h2>
          <p>or</p>
          <label className="file-input-label">
            <span>Click to Browse</span>
            <input
              type="file"
              onChange={handleFileInput}
              accept=".csv,.xlsx,.xls"
              disabled={isLoading}
              style={{ display: 'none' }}
            />
          </label>
          <p className="file-types">CSV, XLSX, or XLS files</p>
          
          {selectedFileName && (
            <div className="selected-file">
              <svg className="check-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span>{selectedFileName}</span>
            </div>
          )}

          {isLoading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Processing file...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

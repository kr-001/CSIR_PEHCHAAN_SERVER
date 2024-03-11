import React, { useState } from 'react';
import '../css/FileUploadComponent.css';

const DelCsvComponent = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState('');

  const handleFileSelect = (event) => {
    setSelectedFiles([...selectedFiles, ...event.target.files]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage('Please select files to upload.');
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('csvFile', file));

    try {
      setMessage('Uploading files...');
      const response = await fetch('http://192.168.0.132:4000/uploadDelCsvFiles', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage('Files uploaded successfully.');
        setSelectedFiles([]);
      } else {
        setMessage('Error uploading files.');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setMessage('Error uploading files.');
    }
  };

  return (
    <div className="file-upload-container">
      <h2>Upload Files</h2>
      <input
        type="file"
        name='csvFile'
        multiple
        accept=".csv"
        onChange={handleFileSelect}
      />
      <button onClick={handleUpload}>Upload</button>
      {message && <p className="message">{message}</p>}

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h3>Selected Files:</h3>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DelCsvComponent;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from './NavBar';
import '../css/FileListComponent.css'; // Import your CSS file

function DelFileListComponent() {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    // Fetch the list of uploaded files from the server
    axios.get('http://192.168.0.132:4000/getDelCsvFiles')
      .then(response => {
        setFiles(response.data.files);
      })
      .catch(error => {
        console.error('Error fetching files:', error);
      });
  }, []);

  const handleApplyChanges = (fileName) => {
    // Trigger the API call for applying changes with the selected file
    axios.post('http://192.168.0.132:4000/deleteEntries', { fileName })
      .then(response => {
        console.log('Changes applied successfully:', response.data);
      })
      .catch(error => {
        console.error('Error applying changes:', error);
      });
  };

  return (
    <>
      <NavBar title="CSIR-PEHCHAAN Remove Employee Panel" />
      <div className="file-list-container">
        <h2>Uploaded CSV Files</h2>
        {files.length > 0 ? (
          <ul className="file-list">
            {files.map((fileName, index) => (
              <li key={index} className="file-list-item">
                <span>{fileName}</span>
                <button className="apply-button" onClick={() => handleApplyChanges(fileName)}>
                  Apply Changes
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No Requests</p>
        )}
      </div>
    </>
  );
}

export default DelFileListComponent;

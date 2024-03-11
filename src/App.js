import logo from './logo.svg';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import UsersPage from './components/UsersPage';
import HomePage from './components/HomePage';
import Login from './components/Login';
import UserDetailsComponent from './components/UserDetailsComponent';
import FileUploadComponent from './components/FileUploadComponent';
import FileListComponent from './components/FileListComponent';
import DelCsvComponent from './components/DelCsvComponent';
import DelFileListComponent from './components/DelFileListComponent';

function App() {
  return (
    <>
      <Routes>
        <Route path="/userList" element={<UsersPage props="CSIR PEHCHAAN" />} />
        <Route path='/' element={<HomePage/>}/>
        <Route path='/loginUser' element={<Login/>}/>
        <Route path='/UpdateUsersApplication' element={<UserDetailsComponent/>}/>
        <Route path = '/uploadFiles' element = {<FileUploadComponent/>}/>
        <Route path = '/uploadDelFiles' element = {<DelCsvComponent/>}/>
        <Route path = '/fileList' element = {<FileListComponent/>}/>
        <Route path = '/delFileList' element = {<DelFileListComponent/>}/>
      </Routes>
    </>
  );
}

export default App;

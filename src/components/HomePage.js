import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';

export default function HomePage() {
    const navigate = useNavigate();
    
    const handleClick = () =>{
        navigate('/loginUser');
    };
     


  return (
    <>
      <NavBar />
      <div className='homepageContainer'>
        <h1 className='fade-in'>WELCOME TO CSIR PEHCHAAN ADMIN PORTAL. DENGUE SE GENDUE TK APKE SATH.</h1>
        <button className='fade-in-button' onClick={handleClick}>Login</button>
        <p className='loginNote'>Only Admins are allowed to Login.</p>
        
      </div>
      
      
      
    </>
  );
}

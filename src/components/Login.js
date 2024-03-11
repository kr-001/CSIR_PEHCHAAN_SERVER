import React , {useState} from 'react'
import axios from 'axios';
import NavBar from './NavBar';

export default function Login() {
    const [authId , setAuthId] = useState('');
    const [password , setPassword] = useState('');

    const handleAuthIdChange = (e) =>{
       setAuthId(e.target.value)
    };

    const handlePasswordChange = (e) =>{
       setPassword(e.target.value);
    };

    const handleSubmit = async(e)=>{
      e.preventDefault();
      try{
        const response = await axios.post("http://192.168.0.132/loginUser" , {
            authId,
            password,
            
        });
        console.log(response.data);
      }catch(error){
        console.log("Error" , error);
      }
    };
  return (
    <>
    <NavBar/>
    <div className='container my-5'>
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="authId">AuthId:</label>
        <input
          type="text"
          id="authId"
          value={authId}
          onChange={handleAuthIdChange}
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={handlePasswordChange}
        />
      </div>
      <button type="submit">Login</button>
    </form>
    </div>
    </>
  )
}

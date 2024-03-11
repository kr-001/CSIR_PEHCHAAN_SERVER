import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from './NavBar';



const UsersPage = (props) => {
  const [users, setUsers] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [notVerifiedUsers, setNotVerifiedUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 120000); // Fetch every 2 minutes (2 minutes * 60 seconds * 1000 milliseconds)
    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://192.168.0.132:4000/users'); 
      const data = await response.json();
      console.log(data);

      const filteredUsers = data.filter(
        (user) =>
          user.verification_status === 'unverified' &&
          user.verification_authority === 'NA'
      );

      const verifiedUsersResponse = await fetch('http://192.168.0.132:4000/verified-users');
      const verifiedUsersData = await verifiedUsersResponse.json();
      const notVerifiedUsersResponse = await fetch('http://192.168.0.132:4000/not-verified-users');
      const notVerifiedUsersData = await notVerifiedUsersResponse.json();
      setUsers(filteredUsers);
      // console.log(verifiedUsersData);
      setVerifiedUsers(verifiedUsersData);
      setNotVerifiedUsers(notVerifiedUsersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  

  return (
    <>
    <NavBar prop1={props}/>

<div className="container1">
  <h1 className='mt-5'>Unverified Users</h1>
  {users.length > 0 ? (
    <table className="table table-striped table-bordered mx-auto">
      <thead>
        <tr>
          <th>Photo</th>
          <th>ID</th>
          <th>Title</th>
          <th>Name</th>
          <th>Designation</th>
          <th>Department</th>
          <th>Division</th>
          <th>Lab Name/Code</th>
          <th>ID Card Number</th>
          <th>Email</th>
          <th>Contact</th>
          <th>Verification Status</th>
          <th>Verification Authority</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>
              <img
                src={`http://192.168.0.132:4000/${user.photoPath}`}
                alt="User Photo"
                style={{ width: '90px', height: 'auto' }} 
              />
            </td>
            <td>{user.id}</td>
            <td>{user.title}</td>
            <td>{user.fullName}</td>
            <td>{user.designation}</td>
            <td>{user.Department}</td>
            <td>{user.Division}</td>
            <td>{user.LabNameCode}</td>
            <td>{user.CardNumber}</td>
            <td>{user.email}</td>
            <td>{user.contact}</td>
            <td>{user.verification_status}</td>
            <td>{user.verification_authority}</td>
    
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p>No unverified users found.</p>
  )}
  <hr/>

  <h1>Verified Users</h1>
  {verifiedUsers.length > 0 ? (
    <table className="table table-striped table-bordered mx-auto">
      <thead>
        <tr>
          <th>ID</th>
          <th>Photo</th>
          <th>ID</th>
          <th>Title</th>
          <th>Name</th>
          <th>Designation</th>
          <th>Department</th>
          <th>Division</th>
          <th>Lab Name/Code</th>
          <th>ID Card Number</th>
          <th>Email</th>
          <th>Contact</th>
          <th>Verification Status</th>
          <th>Verification Authority</th>
    
        </tr>
      </thead>
      <tbody>
        {verifiedUsers.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>
              <img
                src={`http://192.168.0.132:4000/${user.photoPath}`}
                alt="User Photo"
                style={{ width: '90px', height: 'auto' }} 
              />
            </td>
            <td>{user.id}</td>
            <td>{user.title}</td>
            <td>{user.fullName}</td>
            <td>{user.designation}</td>
            <td>{user.Department}</td>
            <td>{user.Division}</td>
            <td>{user.LabNameCode}</td>
            <td>{user.CardNumber}</td>
            <td>{user.email}</td>
            <td>{user.contact}</td>
            <td>{user.verification_status}</td>
            <td>{user.verification_authority}</td>
      
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p>No verified users found.</p>
  )}
  <hr/>
  
  <h1>Not Verified Users</h1>
  {notVerifiedUsers.length > 0 ? (
    <table className="table table-striped table-bordered mx-auto">
      <thead>
        <tr>
          <th>ID</th>
          <th>Photo</th>
          <th>Title</th>
          <th>Name</th>
          <th>Designation</th>
          <th>Department</th>
          <th>Division</th>
          <th>Lab Name/Code</th>
          <th>ID Card Number</th>
          <th>Email</th>
          <th>Contact</th>
          <th>Verification Status</th>
          <th>Verification Authority</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {notVerifiedUsers.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>
              <img
                src={`http://192.168.0.132:4000/${user.photoPath}`}
                alt="User Photo"
                style={{ width: '90px', height: 'auto' }} 
              />
            </td>
            <td>{user.id}</td>
            <td>{user.title}</td>
            <td>{user.fullName}</td>
            <td>{user.designation}</td>
            <td>{user.Department}</td>
            <td>{user.Division}</td>
            <td>{user.LabNameCode}</td>
            <td>{user.CardNumber}</td>
            <td>{user.email}</td>
            <td>{user.contact}</td>
            <td>{user.verification_status}</td>
            <td>{user.verification_authority}</td>
        
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p>No not verified users found.</p>
  )}
</div>
</>


  );
};

export default UsersPage;

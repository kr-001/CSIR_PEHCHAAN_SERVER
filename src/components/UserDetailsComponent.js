import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserDetailsComponent = () => {
  const [updatedData, setUpdatedData] = useState({});
  const [userData, setUserData] = useState({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    // Fetch updated details when the component mounts
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const updatedResponse = await axios.get('http://192.168.0.132:4000/getUpdatedDetails');
      setUpdatedData(updatedResponse.data);
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error fetching updated data:', error);
    }
  };

  const fetchUserData = async (cardNumber) => {
    try {
      const userResponse = await axios.get(`http://192.168.0.132:4000/getUserDetails/${cardNumber}`);
      setUserData(userResponse.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleApprove = async () => {
    try {
      // Send the updated details to the server to update user details
      await axios.post(`http://192.168.0.132:4000/approveUpdate/${updatedData.cardNumber}`, {
        updatedDetails: updatedData,
      });
      // After approval, fetch data again to update the UI
      fetchData();
    } catch (error) {
      console.error('Error approving update:', error);
    }
  };

  const handleReject = () => {
    // Handle reject action if needed
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-md-6">
          {isDataLoaded ? (
            <>
              {/* Render updated details */}
              <h2>Updated Details:</h2>
              <p><strong>Title:</strong> {updatedData.title}</p>
              <p><strong>CardNumber:</strong> <button className="btn btn-link" onClick={() => fetchUserData(updatedData.CardNumber)}>{updatedData.CardNumber}</button></p>
              <p><strong>Designation:</strong> {updatedData.designation}</p>
              <p><strong>Division:</strong> {updatedData.division}</p>
              <p><strong>Lab Name:</strong> {updatedData.labName}</p>
              <p><strong>Address:</strong> {updatedData.address}</p>
              {/* Buttons for approve and reject */}
              <button className="btn btn-primary" onClick={() => handleApprove(updatedData.CardNumber)}>Approve</button>
              <button className="btn btn-danger" onClick={handleReject}>Reject</button>
            </>
          ) : (
            <p>Loading data...</p>
          )}
        </div>
        <div className="col-md-6">
          {Object.keys(userData).length > 0 && (
            <>
              {/* Render user details */}
              <h2>User Details:</h2>
              <p><strong>Name:</strong> {userData.fullName}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Designation:</strong> {userData.designation}</p>
              <p><strong>Depatment:</strong> {userData.Department}</p>
              <p><strong>Division:</strong> {userData.Division}</p>
              <p><strong>Lab Name:</strong> {userData.LabNameCode}</p>
              <p><strong>Blood Group :</strong> {userData.BloodGroup}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Address:</strong> {userData.Address}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default UserDetailsComponent;

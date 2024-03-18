const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const note = require('fs');
const { time } = require('console');
const cors = require('cors')
const path = require('path')
const router = express.Router();
const app = express();
const port = 4000;
const speakeasy = require('speakeasy');
const fs = require('fs')
app.use(cors());
const otpStorage = {};
// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });
app.use(bodyParser.urlencoded({ extended: true }));



// Configure bodyParser to parse JSON data
app.use(bodyParser.json());

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Ravi@1998',
  database: 'csir_db',
  connectionLimit : 10
});

// Handle registration API endpoint
const TOTP_WINDOW = 1; 
const TOTP_ENCODING = 'base32'
const sharp = require('sharp');
let secretKeyDict = {};

app.post('/register', upload.single('photo'), (req, res) => {
  const { email, idCardNumber } = req.body;
  console.log(req.body);

  const photoPath = req.file.path;
  const verification_status = "Verified✅";
  const labCode = req.body.labCode;
  const verification_authority = labCode;
  console.log(labCode);
  console.log("Photo Path: Line 41", photoPath);

  // Retrieve the secret key from the dictionary
  const base32Secret = secretKeyDict['temp'];
  console.log("BASE32 Secret at fetch register: ", base32Secret);

  // Clear the secret key from the dictionary
  delete secretKeyDict['temp'];

  // Generate a unique file name for the output photo
  const outputPhotoPath = path.join(path.dirname(photoPath), `${Date.now()}.jpeg`);

  // Convert the photo to JPEG format
  sharp(photoPath)
      .jpeg({ quality: 80 }) // Set the desired quality (e.g., 80)
      .toFile(outputPhotoPath, (error, info) => {
          if (error) {
              console.error('Error converting photo to JPEG:', error);
              res.status(500).json({ message: 'Error registering user' });
              return;
          }

          const checkExistingUserQuery = 'SELECT * FROM master_table_1 WHERE email = ?';
          const checkExistingUserValues = email;

          pool.query(checkExistingUserQuery, checkExistingUserValues, (error, results) => {
              if (error) {
                  console.error('Error checking existing user:', error);
                  res.status(500).json({ message: 'Error registering user' });
                  return;
              }

              if (results.length > 0) {
                  const userData = results[0];
                  console.log("User Data : ", userData);

                  // Hash the password using bcrypt
                  bcrypt.hash(userData.password, 10, (err, hashedPassword) => {
                      if (err) {
                          console.error('Error hashing password:', err);
                          res.status(500).json({ message: 'Error registering user' });
                          return;
                      }

                      // Create the users table if it doesn't exist
                      const createTableQuery = `CREATE TABLE IF NOT EXISTS users (
                          id INT PRIMARY KEY AUTO_INCREMENT,
                          title VARCHAR(255) NOT NULL,
                          fullName VARCHAR(255) NOT NULL,
                          designation VARCHAR(255) NOT NULL,
                          department VARCHAR(255) NOT NULL,
                          LabNameCode VARCHAR(255) NOT NULL,
                          CardNumber VARCHAR(255) NOT NULL,
                          BloodGroup VARCHAR(255) NOT NULL,
                          password VARCHAR(255) NOT NULL,
                          photoPath VARCHAR(255) NOT NULL,
                          email VARCHAR(50) NOT NULL,
                          contact VARCHAR(15) NOT NULL,
                          verification_status VARCHAR(255) NOT NULL,
                          verification_authority VARCHAR(255) NOT NULL,
                          division VARCHAR(20) NOT NULL,
                          subDivision VARCHAR(200) NOT NULL,
                          address VARCHAR(50) NOT NULL,
                          totp_secret VARCHAR(255) NOT NULL
                      )`;

                      pool.query(createTableQuery, (error) => {
                          if (error) {
                              console.error('Error creating users table:', error);
                              res.status(500).json({ message: 'Error registering user' });
                              return;
                          }

                          // Save the user data to the users table, including the secret key
                          const insertUserDataQuery = 'INSERT INTO users SET ?';
                          const insertUserDataValues = {
                              ...userData,
                              LabNameCode: labCode,
                              password: hashedPassword, // Use the hashed password
                              photoPath: outputPhotoPath,
                              verification_status: verification_status,
                              verification_authority: verification_authority,
                              totp_secret: base32Secret // Store the obtained secret key
                          };

                          pool.query(insertUserDataQuery, insertUserDataValues, (error, results) => {
                              if (error) {
                                  console.error('Error inserting user data:', error);
                                  res.status(500).json({ message: 'Error registering user' });
                              } else {
                                  res.status(200).json({ message: 'Registration successful' });
                              }
                          });
                      });
                  });
              } else {
                  // User with the same email or ID card number does not exist in the master table
                  res.status(404).json({ message: 'User not found in master table' });
              }
          });
      });
});



app.get('/generateSecret', (req, res) => {
  try {
      // Generate a secret key using Speakeasy
      const secret = speakeasy.generateSecret({ length: 20 });
      const base32Secret = secret.base32;
      console.log('Retrieved TOTP secret:', secret);
      
      // Store the secret key in the dictionary
      secretKeyDict['temp'] = base32Secret;
      
      // Return the secret key as a JSON response
      res.json({ secretKey: base32Secret });
  } catch (err) {
      console.error('Error generating secret key:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});


//Uploaded Photos API
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const passwordDict = {};


app.post('/login', (req, res) => {
  console.log("Request Body LOGIN: ", req.body);
  const { email, password , totp } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';
  const values = [email];
  passwordDict[email] = password;
  console.log('Provided TOTP token:', totp);

  // Retrieve the user data from the database
  pool.query(query, values, (error, results) => {
    if (error) {
      console.error('Error retrieving user data:', error);
      res.status(500).json({ message: 'Failed to authenticate' });
      return;
    }

    if (results.length === 1) {
      const user = results[0];
      console.log(user)

      // Retrieve the TOTP secret from the user data
      const secret = user.totp_secret;
      console.log("secret: ", secret)

      // Verify the TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.totp_secret,
        encoding: TOTP_ENCODING,
        token: totp,
        window: TOTP_WINDOW
      });
      console.log('TOTP verification result:', verified);
      if (verified) {
        // Compare hashed password using bcrypt
        bcrypt.compare(password, user.password, (bcryptErr, bcryptRes) => {
          if (bcryptErr || !bcryptRes) {
            console.log('Invalid password');
            res.status(401).json({ message: 'Invalid password' });
          } else {
            console.log('User authenticated successfully');
            const logoQuery = 'SELECT * FROM labLogos WHERE LabNameCode = ?';
            const logoValues = [user.LabNameCode];
      
            pool.query(logoQuery, logoValues, (logoError, logoResults) => {
              if (logoError) {
                console.error('Error fetching logo:', logoError);
                res.status(500).json({ message: 'Failed to fetch logo' });
              } else {
                if (logoResults.length === 1) {
                  const logo = logoResults[0];
                  const userPayload = {
                    title: user.title,
                    name: user.fullName,
                    designation: user.designation,
                    division: user.division,
                    subDivision: user.subDivision,
                    lab: user.LabNameCode,
                    id: user.CardNumber,
                    photoUrl: `http://192.168.0.222:4000/${user.photoPath}`,
                    email: user.email,
                    contact: user.contact,
                    password: passwordDict[email],
                    status: user.verification_status,
                    autho: user.verification_authority,
                    logoUrl: logo.logoUrl,
                    address: user.address,
                    emergency: user.contact,
                    bGroup: user.BloodGroup
                  };
                  console.log("userPayload", userPayload);
                  res.status(200).json({
                    message: 'Authentication successful',
                    user: userPayload,
                    decryptedPassword: password // Send decrypted password
                  });
                } else {
                  console.log('Logo not found');
                  res.status(404).json({ message: 'Logo not found' });
                }
              }
            });
          }
        });
      } else {
        console.log("Wrong or expired TOTP entered!");
        res.status(401).json({ message: "Wrong or expired TOTP" });
      }
    } else {
      console.log('User not found');
      res.status(404).json({ message: 'User not found' });
    }
  });
});

app.get('/users', cors() ,  (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to database:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const query = `
      SELECT * FROM users
      WHERE verification_status = 'unverified'
      AND verification_authority = 'NA'
    `;

    connection.query(query, (err, results) => {
      connection.release();

      if (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      console.log(results);
      res.json(results);
    });
  });
});
app.put('/users/:userId/revoke', cors(), (req, res) => {
  const userId = req.params.userId;
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to database:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const query = `
      UPDATE users
      SET verification_status = 'User Revoked'
      WHERE id = ?
    `;

    connection.query(query, [userId], (err, results) => {
      connection.release();

      if (err) {
        console.error('Error revoking user:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      res.sendStatus(200);
    });
  });
});




app.get('/verified-users', cors(), (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to database:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const query = `
      SELECT * FROM users
      WHERE verification_status = 'verified'
    `;

    connection.query(query, (err, results) => {
      connection.release();

      if (err) {
        console.error('Error fetching verified users:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      res.json(results);
    });
  });
});

app.get('/not-verified-users', cors(), (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to database:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const query = `
      SELECT * FROM users
      WHERE verification_status = 'User Revoked'
    `;

    connection.query(query, (err, results) => {
      connection.release();

      if (err) {
        console.error('Error fetching not verified users:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      res.json(results);
    });
  });
});

// OTP API{Registration}
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

app.post('/send-otp', (req, res) => {
  const { email } = req.body;
  const otp = randomstring.generate({ length: 4, charset: 'numeric' });
  
  pool.query('SELECT COUNT(*) AS count from master_table_1 where email = ?', [email] , (error,result)=>{
    if(error){
      console.error("Error Checking Email Availibility", error);
      res.status(500).json({message : 'Failed to check email availibility'});
    }else{
      const emailExists = result[0].count > 0;
      if(emailExists){
        sendOTP(email, otp)
        .then(() => {
          otpStorage[email] = otp;
          console.log(otpStorage);
          res.status(200).json({ otp: otp, message: 'OTP sent successfully' });
        })
        .catch(error => {
          console.error('Error sending OTP:', error);
          res.status(500).json({ message: 'Failed to send OTP' });
        });
      }else{
        res.status(400).json({message :"Email not Found"});
      }
    }
  })
});


async function sendOTP(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'ravikumarpandey1998@gmail.com',
        pass: 'wfalhsqmtfmfymsh'
      }
    });

    const mailOptions = {
      from: 'ravikumarpandey1998@gmail.com',
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP is: ${otp}`
    };

    await transporter.sendMail(mailOptions);

    console.log(mailOptions);
    console.log('OTP sent successfully');
  } catch (error) {
    throw error;
  }
}

// OTP API{LOGIN}
app.post('/request-otp', (req, res) => {
  const { email } = req.body;
  console.log("Req Body Login:",req.body);
  const otp = randomstring.generate({ length: 4, charset: 'numeric' });
  pool.query('SELECT * from users where email = ?', [email], (error, results, feilds) => {
    if (error) {
      console.error('Error Fetching email id from Database', error);
      res.status(500).json({ success: false, message: 'Failed to retreive email from server!' });
    } else if (results.length === 0) {
      console.log("No User Found with this emailid");
      res.status(404).json({ success: false, message: 'No User Found' });
    } else {
      const email = results[0].email;
      sendLoginOTP(email, otp)
        .then(() => {
          otpStorage[email] = otp;
          res.status(200).json({ success: true, otp: otp, message: 'OTP sent successfully' });
        })
        .catch(error => {
          console.error('Error sending OTP:', error);
          res.status(500).json({ success: false, message: 'Failed to send OTP' });
        });
    }
  });
});


async function sendLoginOTP(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'ravikumarpandey1998@gmail.com',
        pass: 'wfalhsqmtfmfymsh'
      }
    });

    const mailOptions = {
      from: 'ravikumarpandey1998@gmail.com',
      to: email,
      subject: 'OTP Verification for LOGIN',
      text: `Your OTP is: ${otp}`
    };

    await transporter.sendMail(mailOptions);

    console.log(mailOptions);
    console.log('OTP sent successfully');
  } catch (error) {
    throw error;
  }
}

  
// OTP API{Update details}
app.post('/update-otp', (req, res) => {
  const { CardNumber} = req.body;
  console.log("Req Body:",req.body);
  const otp = randomstring.generate({ length: 4, charset: 'numeric' });
  pool.query('SELECT * from users where CardNumber = ?', [CardNumber], (error, results, feilds) => {
    if (error) {
      console.error('Error Fetching CardNumber from Database', error);
      res.status(500).json({ success: false, message: 'Failed to retreive email from server!' });
    } else if (results.length === 0) {
      console.log("No User Found with this emailid");
      res.status(404).json({ success: false, message: 'No User Found' });
    } else {
      const email = results[0].email;
      sendOTP(email, otp)
        .then(() => {
          res.status(200).json({ success: true, otp: otp, message: 'OTP sent successfully' });
        })
        .catch(error => {
          console.error('Error sending OTP:', error);
          res.status(500).json({ success: false, message: 'Failed to send OTP' });
        });
    }
  });
});


async function sendOTP(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'ravikumarpandey1998@gmail.com',
        pass: 'wfalhsqmtfmfymsh'
      }
    });

    const mailOptions = {
      from: 'ravikumarpandey1998@gmail.com',
      to: email,
      subject: 'OTP verification for details modification',
      text: `Your OTP is: ${otp}`
    };

    await transporter.sendMail(mailOptions);

    console.log(mailOptions);
    console.log('OTP sent successfully');
  } catch (error) {
    throw error;
  }
}


app.get('/labnames', (req, res) => {

  const query = 'SELECT lab_name FROM csir_labs';
  
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching lab names:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      // Extract lab names from the query results
      console.log(results);
      const labNames = results.map((result) => result.lab_name);
  
      
      res.status(200).json(labNames);
    }
  });
});

// Endpoint to verify user credentials
app.post('/updateRequestVerify', (req, res) => {
  console.log("UPDATE REQ VERIFY", req.body)
  const { email, currentPassword, totpCode } = req.body;

  // Fetch user details from the database
  const selectQuery = 'SELECT totp_secret, password FROM users WHERE email = ?';
  pool.query(selectQuery, [email], (selectError, selectResults) => {
    if (selectError) {
      console.error('Error fetching user details:', selectError);
      return res.status(500).json({ message: 'Failed to fetch user details' });
    }

    if (selectResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { totp_secret, password } = selectResults[0];

    // Verify the provided TOTP code
    const verified = speakeasy.totp.verify({
      secret: totp_secret,
      encoding: 'base32',
      token: totpCode,
      window: 1 // Allow a time window of 1 interval (30 seconds) for verification
    });

    if (verified) {
      // TOTP verification successful, now authenticate user with password
      bcrypt.compare(currentPassword, password, (bcryptError, bcryptResult) => {
        if (bcryptError || !bcryptResult) {
          return res.status(401).json({ message: 'Authentication failed' });
        }

        // Both TOTP and password verification successful
        console.log("PASSED USED");
        res.status(200).json({ message: 'Authentication successful' });
      });
    } else {
      // TOTP verification failed
      console.log("TOTP FAILED")
      res.status(401).json({ message: 'TOTP verification failed' });
    }
  });
});


//update user details 

app.put('/updateDetails', upload.single('image'), (req, res) => {
  console.log("UPDATE REQ: ", req.body);
  console.log("UPDATE FILE: ", req.file);
  const { email, address, password } = req.body;

  // Fetch the user's TOTP secret from the database
  const selectQuery = 'SELECT totp_secret FROM users WHERE email = ?';
  pool.query(selectQuery, [email], (selectError, selectResults) => {
      if (selectError) {
          console.error('Error fetching user details:', selectError);
          res.status(500).json({ message: 'Failed to fetch user details' });
      } else {
          if (selectResults.length > 0) {


              bcrypt.genSalt(10, (saltErr, salt) => {
                  if (saltErr) {
                      console.error('Error generating salt:', saltErr);
                      res.status(500).json({ message: 'Failed to update user details' });
                  } else {
                      bcrypt.hash(password, salt, (hashErr, hashedPassword) => {
                          if (hashErr) {
                              console.error('Error hashing password:', hashErr);
                              res.status(500).json({ message: 'Failed to update user details' });
                          } else {
                              // Update the user's address and hashed password
                              const updateQuery = 'UPDATE users SET address = ?, password = ? WHERE email = ?';
                              const updateValues = [address, hashedPassword, email];
                              pool.query(updateQuery, updateValues, (updateError, updateResults) => {
                                  if (updateError) {
                                      console.error('Error updating user details:', updateError);
                                      res.status(500).json({ message: 'Failed to update user details' });
                                  } else {
                                      // Check if an image was uploaded
                                      if (req.file) {
                                          // Process the uploaded image with Sharp
                                          const photoPath = req.file.path;
                                          const outputPhotoPath = path.join(path.dirname(photoPath), `${Date.now()}.jpeg`);

                                          sharp(photoPath)
                                              .jpeg()
                                              .toFile(outputPhotoPath, (sharpErr, info) => {
                                                  if (sharpErr) {
                                                      console.error('Error converting image to JPEG:', sharpErr);
                                                      res.status(500).json({ message: 'Failed to convert image to JPEG' });
                                                  } else {
                                                      // Update the photo path in the database
                                                      const updatePhotoQuery = 'UPDATE users SET photoPath = ? WHERE email = ?';
                                                      const updatePhotoValues = [outputPhotoPath, email];
                                                      pool.query(updatePhotoQuery, updatePhotoValues, (photoError, photoResults) => {
                                                          if (photoError) {
                                                              console.error('Error updating photo path:', photoError);
                                                              res.status(500).json({ message: 'Failed to update photo path' });
                                                          } else {
                                                              res.status(200).json({ message: 'User details and photo path updated successfully' });
                                                          }
                                                      });
                                                  }
                                              });
                                      } else {
                                          // No image uploaded, only update user details
                                          res.status(200).json({ message: 'User details updated successfully' });
                                      }
                                  }
                              });
                          }
                      });
                  }
              });
          } else {
              // User not found in the database
              res.status(404).json({ message: 'User not found' });
          }
      }
  });
});



//USER UPDATE DETAILS ADMIN API
app.get('/getUserDetails/:cardNumber', (req, res) => {
  const cardNumber = req.params.cardNumber;
  const selectQuery = 'SELECT * FROM users WHERE CardNumber = ?';
  pool.query(selectQuery, [cardNumber], (error, results) => {
    if (error) {
      console.log("FAILED TO FETCH USER DETAILS");
      res.status(500).json({ message: 'FAILED TO FETCH USER DETAILS' });
    } else {
      if (results.length === 0) {
        console.log("User not found");
        res.status(404).json({ message: 'User not found' });
      } else {
        const userData = results[0];
        console.log(userData);
        res.status(200).json(userData);
      }
    }
  });
});


// API endpoint to fetch updated details
const csvParser = require('csv-parser')
app.get('/getUpdatedDetails/', (req, res) => {
  const cardNumber = req.params.cardNumber;
  const selectQuery = "SELECT * FROM updatedetails ";

  pool.query(selectQuery , [cardNumber] , (error,result)=>{
    if(error){
      console.log("FAILED TO FETCH FROM UPDATEDETAILS TABLE");
      res.status(500).json({message : 'FAILED TO FETCH FROM updatedetails'});
    }else{
      const updatedData = result[0];
      console.log(updatedData);
      res.status(200).json(updatedData);
    }
  });
  
});

// API endpoint to approve and update user details
app.post('/approveUpdate/:cardNumber', (req, res) => {
  console.log(req.body);
  const cardNumber = req.body.updatedDetails.CardNumber;
  console.log("Card Number" , cardNumber);
  const updatedDetails = req.body.updatedDetails;
  const updateQuery = 'UPDATE users SET designation = ?, division = ?, LabNameCode = ?, address = ? WHERE CardNumber = ?';
  const values = [updatedDetails.designation, updatedDetails.division, updatedDetails.labName, updatedDetails.address, cardNumber];
  pool.query(updateQuery, values, (error, results) => {
    if (error) {
      console.error('Error updating user details:', error);
      res.status(500).json({ message: 'Failed to update user details' });
    } else {
      console.log("USER UPDATED!!" , results);
      res.status(200).json({ message: 'User details updated successfully' });
    }
  });
});

const upload1 = multer({dest : 'uploads/UpdateDetaileFiles'})
//Api to handle Updatation of master table through File Upload
app.post('/handleUpdateFile',  async (req, res) => {
  try {
    console.log("Req Body:- ",req.body)
    const selectedFileName = req.body.fileName;
    const results = [];

    // Parse CSV file
    const csvFilePath = path.join(__dirname, 'uploads','csvFiles', selectedFileName);
    console.log("csvFilePath:- ",csvFilePath)
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log('CSV parsing complete');

        try {
          const connection = await pool.promise().getConnection();
          console.log('Connected to database');

          for (const row of results) {
            const query = `
              INSERT INTO mastertable1 (
                title, CardNumber, fullName, Designation, BloodGroup,
                Email, Contact, LabNameCode, Department, Division,
                subDivision, password, Emergency_Contact
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
              row.title || null,
              row.CardNumber || null,
              row.fullName || null,
              row.Designation || null,
              row.BloodGroup || null,
              row.Email || null,
              row.Contact || null,
              row.LabNameCode || null,
              row.Department || null,
              row.Division || null,
              row.subDivision || null,
              row.password || null,
              row.Emergency_Contact || null
            ];

            console.log('Before Query Execution✅');
            await connection.query(query, values);
            console.log('After Query Execution✅');
          }

          connection.release();
          console.log('Database connection released');
            // Move the file to the "executed" folder
            const executedFolderPath = path.join(__dirname, 'uploads', 'executed');
            const newFilePath = path.join(executedFolderPath, selectedFileName);
  
            fs.rename(csvFilePath, newFilePath, (renameError) => {
              if (renameError) {
                console.error('Error moving file:', renameError);
                return res.status(500).json({ error: 'Error moving file to executed folder' });
              }
              console.log('File moved to executed folder');
              res.status(200).json({ message: 'File uploaded, data inserted, and file moved to executed folder.' });
            });
        } catch (dbError) {
          console.error('Error executing query:', dbError);
          res.status(500).json({ error: 'Error executing database query' });
        }
      });
  } catch (fileError) {
    console.error('Error parsing CSV file:', fileError);
    res.status(500).json({ error: 'Error parsing CSV file' });
  }
});
//16.30.46 25-08-2023
//Setting up multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/csvFiles');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadCsv = multer({storage});
app.post('/uploadCsvFiles', uploadCsv.array('csvFile', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    res.status(200).send('Files uploaded successfully.');
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).send('Error uploading files.');
  }
});

app.get('/getCsvFiles' , (req,res)=>{
  const directory = 'uploads/csvFiles';
  fs.readdir(directory,(err,file)=>{
    if(err){
      return res.status(500).json({error: 'Error reading directory'});
    }
    const fileNames = file.map(filename => path.basename(filename));
    res.json({files:fileNames});
    
  });
});

//Upload Delete CSV FILES
const storageDel = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/csvDelFiles');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const newFileName = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('New file name:', newFileName);
    cb(null, newFileName);
  }
});

const uploadCsvDel = multer({ storage: storageDel });

app.post('/uploadDelCsvFiles', uploadCsvDel.array('csvFile', 10), (req, res) => {
  console.log('Triggered');
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
    console.log('Uploaded files:', req.files);

    res.status(200).send('Files uploaded successfully.');
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).send('Error uploading files.');
  }
});

app.get('/getDelCsvFiles' , (req,res)=>{
  const directory = 'uploads/csvDelFiles';
  fs.readdir(directory,(err,file)=>{
    if(err){
      return res.status(500).json({error: 'Error reading directory'});
    }
    const fileNames = file.map(filename => path.basename(filename));
    res.json({files:fileNames});
  });
});


app.post('/deleteEntries', async (req, res) => {
  try {
    const { fileName } = req.body;
    console.log(fileName);
    // Parse CSV file to get email and card number pairs
    const filePath = path.join(__dirname, 'uploads/csvDelFiles', fileName);
    const csvData = await fs.promises.readFile(filePath, 'utf-8');
    const parsedData = csvData.split('\n').map(row => {
      const [email, cardNumber] = row.split(','); // Assuming CSV format: email,cardNumber
      return { email, cardNumber };
    });

    // Delete entries from the database based on email and card number
    const connection = await pool.promise().getConnection();
    for (const entry of parsedData) {
      const deleteQuery = `
        DELETE FROM masterTable1
        WHERE email = ? AND cardNumber = ?
      `;
      const deleteValues = [entry.email, entry.cardNumber];
      await connection.query(deleteQuery, deleteValues);
    }
    connection.release();

    // Remove the CSV file after deletion
    fs.unlink(filePath, (unlinkError) => {
      if (unlinkError) {
        console.error('Error deleting CSV file:', unlinkError);
      }
    });

    res.status(200).json({ message: 'Entries deleted successfully.' });
  } catch (error) {
    console.error('Error deleting entries:', error);
    res.status(500).json({ error: 'Error deleting entries.' });
  }
});



app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  console.log("email: ",email)
  console.log("otp: ",otp)
  const storedOtp = otpStorage[email];
  console.log("Stored OTP:" , storedOtp);

  if (otp === storedOtp) {
    delete otpStorage[email];
    res.status(200).json({ success: true, message: 'OTP verification successful' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const PORT = 3000;

const app = express();

app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  user: "root",
  host: "loginsystem.c8yzldilma0u.ap-southeast-1.rds.amazonaws.com",
  // host: "localhost",
  password: "password",
  database: "LoginSystem",
});

// Register user into the database
app.post("/api/signup", (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const email = req.body.email;
  const password = req.body.password;
  const gender = req.body.gender;
  const dob = req.body.dob;

  db.query(
    "INSERT INTO users (u_firstname, u_lastname, u_email, u_password, u_gender, u_dob) VALUES (?,?,?,?,?,?)",
    [firstname, lastname, email, password, gender, dob],
    (err, result) => {
      console.log(err);
    }
  );
});

// Register a job into the database
app.post("/api/registerjob", (req, res) => {
  const title = req.body.title;
  const company = req.body.company;
  const location = req.body.location;
  const job_type = req.body.job_type;
  const apply_link = req.body.apply_link;
  const date = req.body.date;
  const contact = req.body.contact;
  const userId = req.body.userId;
  const jobSalary = req.body.jobSalary;

  db.query(
    "INSERT INTO jobs (j_title, j_company, j_location, j_type, j_link, j_date, j_contact, j_u_id, j_salary) VALUES (?,?,?,?,?,?,?,?,?)",
    [
      title,
      company,
      location,
      job_type,
      apply_link,
      date,
      contact,
      userId,
      jobSalary,
    ],
    (err, result) => {
      console.log(err);
    }
  );
});

// authenticate user
app.post("/api/authenticate", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.query(
    "SELECT * FROM users WHERE u_email = ? AND u_password = ?",
    [email, password],
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }

      if (result.length > 0) {
        res.send(result);
      } else {
        res.send({ message: "Wrong username/password" });
      }
    }
  );
});

// Check if email exists
app.post("/api/emailalreadyregistered", (req, res) => {
  const email = req.body.email;

  db.query("SELECT * FROM users WHERE u_email = ?", [email], (err, result) => {
    if (err) {
      res.send({ err: err });
    }

    if (result.length > 0) {
      res.send(result);
    } else {
      res.send({ message: "Cannot find the User" });
    }
  });
});

// Get User Details
app.post("/api/getuser", (req, res) => {
  const id = req.body.id;

  db.query("SELECT * FROM users WHERE u_id = ?", [id], (err, result) => {
    if (err) {
      res.send({ err: err });
    }

    if (result.length > 0) {
      res.send(result);
    } else {
      res.send({ message: "Cannot find the User" });
    }
  });
});

// Check if the Email is present in the database
app.post("/api/forgotpassword", (req, res) => {
  const email = req.body.email;

  db.query("SELECT * FROM users WHERE u_email = ?", [email], (err, result) => {
    if (err) {
      res.send({ err: err });
    }

    if (result.length > 0) {
      res.send(result);
    } else {
      res.send({ message: "Email not found" });
    }
  });
});

//Get all user Uploaded jobs
app.post("/api/getuseruploadedjobs", (req, res) => {
  const userId = req.body.userId;
  db.query(
    'SELECT json_arrayagg(JSON_OBJECT("id", j_id, "title", j_title, "company", j_company, "location", j_location, "job_type", j_type, "apply_link", j_link, "contact", j_contact, "job_salary", j_salary)) as job FROM LoginSystem.jobs where j_u_id = ?;',
    [userId],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send({ error: "Unable to fetch jobs" });
        return;
      }
      if (result.length > 0) {
        res.send(JSON.parse(result[0].job));
      } else {
        res.status(404).send({ error: "No jobs found" });
      }
    }
  );
});

//Delete a job uploaded
app.post("/api/deletejob", (req, res) => {
  const userId = req.body.userId;
  db.query(
    "DELETE FROM LoginSystem.jobs WHERE j_id = ?",
    [userId],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send({ error: "Unable to fetch jobs" });
        return;
      }
    }
  );
});

//Get user uploaded jobs
app.get("/api/getjobs", (req, res) => {
  db.query(
    'SELECT json_arrayagg(JSON_OBJECT("id", j_id, "title", j_title, "company", j_company, "location", j_location, "job_type", j_type, "apply_link", j_link, "contact", j_contact, "job_salary", j_salary)) as job FROM LoginSystem.jobs;',
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send({ error: "Unable to fetch jobs" });
        return;
      }
      if (result.length > 0) {
        res.send(JSON.parse(result[0].job));
      } else {
        res.status(404).send({ error: "No jobs found" });
      }
    }
  );
});

//Get recent 10 jobs
app.get("/api/getrecentjobs", (req, res) => {
  db.query(
    'SELECT json_arrayagg(JSON_OBJECT("id", j_id, "title", j_title, "company", j_company, "location", j_location, "job_type", j_type, "apply_link", j_link, "contact", j_contact, "job_salary", j_salary)) as job FROM (SELECT * FROM LoginSystem.jobs ORDER BY j_date DESC LIMIT 10) as sorted_jobs;',
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send({ error: "Unable to fetch jobs" });
        return;
      }
      if (result.length > 0) {
        res.send(JSON.parse(result[0].job));
      } else {
        res.status(404).send({ error: "No jobs found" });
      }
    }
  );
});

// Configure HTTPS with SSL/TLS certificates
// const httpsOptions = {
//   cert: fs.readFileSync("../server/cert.pem"),
//   key: fs.readFileSync("../server/key.pem"),
// };
// https.createServer(httpsOptions, app).listen(PORT, () => {
//   console.log("running server on port - " + PORT);
// });

app.listen(PORT, () => {
  console.log("running server on port - " + PORT);
});

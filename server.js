const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const PORT = 3000;

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
  next();
});

app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  user: "root",
  host: "hospital-3.c8yzldilma0u.ap-southeast-1.rds.amazonaws.com",
  // host: "localhost",
  password: "password",
  database: "LoginSystem",
});

// Encrypting the password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Register user into the database
app.post("/api/signup", async (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const email = req.body.email;
  const password = await hashPassword(req.body.password);
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
    "SELECT * FROM users WHERE u_email = ?",
    [email],
    async (err, result) => {
      if (err) {
        res.send({ err: err });
      }

      if (result.length > 0) {
        if (await bcrypt.compare(password, result[0].u_password)) {
          res.send(result);
        } else {
          res.send({ message: "Wrong email/password" });
        }
      } else {
        res.send({ message: "Email doesn't exist.." });
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

// update password
app.post("/api/updatepassword", async (req, res) => {
  const password = await hashPassword(req.body.password);
  const id = req.body.id;

  db.query(
    "UPDATE `LoginSystem`.`users` SET `u_password` = ? WHERE (`u_id` = ?);",
    [password, id],
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }

      if (id === null) {
        res.send({ message: "Something went wrong" });
      } else {
        res.send(result);
      }
    }
  );
});

// update profile
app.post("/api/updateprofile", async (req, res) => {
  const id = req.body.id;
  const title = req.body.title;
  const qualification = req.body.qualification;

  db.query(
    "UPDATE `LoginSystem`.`users` SET `u_title` = ?, `u_qualification`= ? WHERE (`u_id` = ?);",
    [title, qualification, id],
    (err, result) => {
      if (err) {
        res.send({ err: err });
      }

      if (id === null) {
        res.send({ message: "Something went wrong" });
      } else {
        res.send(result);
      }
    }
  );
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

app.listen(PORT, () => {
  console.log("running server on port - " + PORT);
});

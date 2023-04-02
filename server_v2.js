const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcrypt");
const PORT = 3002;

const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use((req, res, next) => {
  const allowedOrigins = [
    "https://ihospitaljobs.com",
    "https://localhost:3001",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.use(express.json());
app.use(cors());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Encrypting the password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Register user
app.post("/api/signup", async (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const email = req.body.email;
  const password = await hashPassword(req.body.password); // hash the password
  const gender = req.body.gender;
  const dob = req.body.dob;

  const { data, error } = await supabase.from("users").insert([
    {
      u_firstname: firstname,
      u_lastname: lastname,
      u_email: email,
      u_password: password,
      u_gender: gender,
      u_dob: dob,
    },
  ]);

  if (error) {
    console.log(error);
    res.status(500).send({ error: "Unable to create user" });
    return;
  }
});

// Register a job
app.post("/api/registerjob", async (req, res) => {
  const title = req.body.title;
  const company = req.body.company;
  const location = req.body.location;
  const job_type = req.body.job_type;
  const apply_link = req.body.apply_link;
  const date = req.body.date;
  const contact = req.body.contact;
  const userId = req.body.userId;
  const jobSalary = req.body.jobSalary;

  const { data, error } = await supabase.from("jobs").insert([
    {
      j_title: title,
      j_company: company,
      j_location: location,
      j_type: job_type,
      j_link: apply_link,
      j_date: date,
      j_contact: contact,
      j_u_id: userId,
      j_salary: jobSalary,
    },
  ]);

  if (error) {
    console.log(error);
    res.status(500).send({ error: "Unable to create user" });
    return;
  }
});

// Authenticate user
app.post("/api/authenticate", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  supabase
    .from("users")
    .select("*")
    .eq("u_email", email)
    .then((result) => {
      if (result.error) {
        res.send({ error: result.error });
      } else if (result.data.length > 0) {
        const user = result.data[0];
        if (bcrypt.compareSync(password, user.u_password)) {
          res.send(result.data);
        } else {
          res.send({ message: "Wrong email/password" });
        }
      } else {
        res.send({ message: "Email doesn't exist.." });
      }
    })
    .catch((error) => {
      console.log(error);
      res.send({ error: "Unable to authenticate user" });
    });
});

// Check if email is already registered
app.post("/api/emailalreadyregistered", async (req, res) => {
  const email = req.body.email;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("u_email", email);

  if (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal Server Error" });
  }

  if (data && data.length > 0) {
    return res.status(200).send({ message: "Email already exists" });
  } else {
    return res.status(200).send({});
  }
});

// Get User Details
app.post("/api/getuser", async (req, res) => {
  const id = req.body.id;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("u_id", id)
      .limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      res.send(data[0]);
    } else {
      res.send({ message: "Cannot find the User" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Unable to fetch user" });
  }
});

// Check if the Email is present in the database
app.post("/api/forgotpassword", async (req, res) => {
  const email = req.body.email;

  const { data, error } = await supabase.auth.api.resetPasswordForEmail(email);

  if (error) {
    res.send({ error: error.message });
  } else {
    res.send({ data });
  }
});

// update password
app.post("/api/updatepassword", async (req, res) => {
  const newPassword = req.body.password;
  const userId = req.body.id;

  const { error } = await supabase.auth.api.updateUser(userId, {
    password: newPassword,
  });

  if (error) {
    res.send({ error: error.message });
  } else {
    res.send({ message: "Password updated successfully" });
  }
});

// update profile
app.post("/api/updateprofile", async (req, res) => {
  const userId = req.body.id;
  const title = req.body.title;
  const qualification = req.body.qualification;

  const { data, error } = await supabase
    .from("users")
    .update({
      u_title: title,
      u_qualification: qualification,
    })
    .eq("u_id", userId);

  if (error) {
    res.send({ error: error.message });
  } else {
    res.send({ message: "Profile updated successfully" });
  }
});

// Get all user uploaded jobs
app.post("/api/getuseruploadedjobs", async (req, res) => {
  const userId = req.body.userId;
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "j_id, j_title, j_company, j_location, j_type, j_link, j_contact, j_salary"
      )
      .eq("j_u_id", userId);
    if (error) throw error;
    if (data && data.length > 0) {
      res.send(data);
    } else {
      res.status(404).send({ error: "No jobs found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Unable to fetch jobs" });
  }
});

// Delete a job uploaded
app.post("/api/deletejob", async (req, res) => {
  const jobId = req.body.jobId;
  try {
    const { data, error } = await supabase
      .from("jobs")
      .delete()
      .eq("j_id", jobId);
    if (error) throw error;
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Unable to delete job" });
  }
});

// Get all jobs
app.get("/api/getjobs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "j_id, j_title, j_company, j_location, j_type, j_link, j_contact, j_salary"
      );
    if (error) throw error;
    if (data.length > 0) {
      res.send(data);
    } else {
      res.status(404).send({ error: "No jobs found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Unable to fetch jobs" });
  }
});

// Get recent 10 jobs
app.get("/api/getrecentjobs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "j_id, j_title, j_company, j_location, j_type, j_link, j_contact, j_salary"
      )
      .order("j_date", { ascending: false })
      .limit(10);

    if (error) throw error;

    if (data.length > 0) {
      res.send(data);
    } else {
      res.status(404).send({ error: "No jobs found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Unable to fetch jobs" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port - " + PORT);
});

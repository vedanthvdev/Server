const router = require("express").Router();
const bcrypt = require("bcrypt");
const supabase = require("../db/supabase");
const { hashPassword } = require("../utils/password");

router.post("/signup", async (req, res) => {
  const { firstname, lastname, email, password, gender, dob } = req.body;
  const hashedPassword = await hashPassword(password);

  const { data, error } = await supabase.from("users").insert([
    {
      u_firstname: firstname,
      u_lastname: lastname,
      u_email: email,
      u_password: hashedPassword,
      u_gender: gender,
      u_dob: dob,
    },
  ]);

  if (error) {
    console.log(error);
    return res.status(500).send({ error: "Unable to create user" });
  }

  res.status(201).send({ message: "User created successfully" });
});

router.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("u_email", email);

    if (error) {
      return res.status(500).send({ error: "Unable to authenticate user" });
    }

    if (data.length === 0) {
      return res.send({ message: "Email doesn't exist.." });
    }

    const user = data[0];
    const match = await bcrypt.compare(password, user.u_password);
    if (match) {
      res.send(data);
    } else {
      res.send({ message: "Wrong email/password" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Unable to authenticate user" });
  }
});

router.post("/emailalreadyregistered", async (req, res) => {
  const { email } = req.body;

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
  }

  res.status(200).send({});
});

router.post("/getuser", async (req, res) => {
  const { id } = req.body;

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

router.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("u_email", email);

  if (data.length === 0) {
    res.send({ message: "Email not found" });
  } else {
    res.send(data);
  }
});

router.post("/updatepassword", async (req, res) => {
  const newPassword = await hashPassword(req.body.password);
  const userId = req.body.id;

  const { error } = await supabase
    .from("users")
    .update({ u_password: newPassword })
    .eq("u_id", userId);

  if (error) {
    res.send({ error: error.message });
  } else {
    res.send({ message: "Password updated successfully" });
  }
});

router.post("/updateprofile", async (req, res) => {
  const { id, title, qualification } = req.body;

  const { data, error } = await supabase
    .from("users")
    .update({ u_title: title, u_qualification: qualification })
    .eq("u_id", id);

  if (error) {
    res.send({ error: error.message });
  } else {
    res.send({ message: "Profile updated successfully" });
  }
});

module.exports = router;

const router = require("express").Router();
const supabase = require("../db/supabase");

const JOB_SELECT_FIELDS =
  "j_id, j_title, j_company, j_location, j_type, j_link, j_contact, j_salary";

router.post("/registerjob", async (req, res) => {
  const {
    title, company, location, job_type,
    apply_link, date, contact, userId, jobSalary,
  } = req.body;

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
    return res.status(500).send({ error: "Unable to register job" });
  }

  res.status(201).send({ message: "Job registered successfully" });
});

router.get("/getjobs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(JOB_SELECT_FIELDS);

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

router.get("/getrecentjobs", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(JOB_SELECT_FIELDS)
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

router.post("/getuseruploadedjobs", async (req, res) => {
  const { userId } = req.body;

  try {
    const { data, error } = await supabase
      .from("jobs")
      .select(JOB_SELECT_FIELDS)
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

router.post("/deletejob", async (req, res) => {
  const { jobId } = req.body;

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

router.post("/updateclick", async (req, res) => {
  const { id: jobId } = req.body;

  const num = await supabase.from("jobs").select("j_click").eq("j_id", jobId);

  const { data, error } = await supabase
    .from("jobs")
    .update({ j_click: num.data[0].j_click + 1 })
    .eq("j_id", jobId);

  if (error) {
    res.send({ error: error.message });
  } else {
    res.send({ message: "click ++" });
  }
});

module.exports = router;

const express = require("express");
const cors = require("cors");
const customCors = require("./middleware/cors");
const authRoutes = require("./routes/auth");
const jobRoutes = require("./routes/jobs");

const app = express();

app.use(customCors);
app.use(express.json());
app.use(cors());

app.use("/api", authRoutes);
app.use("/api", jobRoutes);

module.exports = app;

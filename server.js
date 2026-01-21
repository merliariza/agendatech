const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

const app = express();

app.set("trust proxy", 1);

app.use(
  session({
    secret: "secretSuperSeguro123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);


app.use(
  cors({
    origin: ["http://127.0.0.1:5502", "http://localhost:5502"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads/products", express.static("uploads/products"));

app.use("/api/users", require("./routes/users.js"));
app.use("/api/admin", require("./routes/admin.js"));
app.use("/api/products", require("./routes/products.js"));
app.use("/api/update-data", require("./routes/updatedata.js"));
app.use("/api/change-password", require("./routes/changepassword.js"));
app.use("/api/admin-users", require("./routes/adminusers.js"));
app.use("/api/appointments", require("./routes/appointments.js"));
app.use("/api/cart", require("./routes/cart.js"));
app.use("/api/orders", require("./routes/orders.js"));

app.get("/api/check-session", (req, res) => {
  res.json({
    authenticated: !!req.session.userId,
    userId: req.session.userId || null,
  });
});

app.listen(3000, () => {
  console.log("SERVIDOR OK -> http://localhost:3000");
});

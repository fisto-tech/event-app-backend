const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const masterRoutes = require('./routes/master');
const customerRoutes = require('./routes/customers');
const employeeRoutes = require('./routes/employees');
const followupRoutes = require('./routes/followup');
const webpush = require("web-push");

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/followups', followupRoutes);


// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

const VAPID_PUBLIC_KEY = process.env.NOTIFICATION_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.NOTIFICATION_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:test@test.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// temporary memory storage
let subscription = null;

app.post("/api/subscribe", (req, res) => {
  subscription = req.body;
  console.log("User subscribed");
  res.status(201).json({});
});

app.get("/api/send", async (req, res) => {

  if (!subscription) {
    return res.status(400).send("No subscription available");
  }

  const payload = JSON.stringify({
    title: "Test Notification",
    body: "Hello from Node backend 🚀"
  });

  try {
    await webpush.sendNotification(subscription, payload);
    res.send("Notification sent");
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }

});



// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// const vapidKeys = webpush.generateVAPIDKeys();
// console.log(vapidKeys);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

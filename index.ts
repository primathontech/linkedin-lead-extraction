import express from "express";
import cors from "cors";

import { connectToDatabase } from "./src/db/connection";
import leadSeatchRouter from "./src/leadSearch/routes";
import organizationRoutes from "./src/organization/routes";

const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port, fallback to 3000

// Function to initialize middleware
const initializeMiddleware = (app: express.Application) => {
  // Enable CORS for all routes
  app.use(cors());

  // Middleware to parse URL-encoded requests
  app.use(express.urlencoded({ extended: true }));

  // Middleware to parse JSON bodies
  app.use(express.json());
};

// Function to initialize routes
const initializeRoutes = (app: express.Application) => {
  // Use the lead search routes
  app.use("/api", leadSeatchRouter);
  app.use("/api", organizationRoutes);
};

// Main server startup function
const startServer = async () => {
  try {
    // Initialize database connection
    connectToDatabase();
  
    initializeMiddleware(app);
    initializeRoutes(app);
    // Start the server
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1); // Exit the process if the server fails to start
  }
};

// Start the server
startServer();

const swaggerAutogen = require("swagger-autogen");

const doc = {
  info: {
    title: "User API",
    description: "This is the documentation for the User API.",
  },
  host: process.env.NODE_ENV === 'production' 
    ? "new-nodejs-project.onrender.com"  // Production URL
    : "localhost:5003",  // Local development URL
  schemes: [process.env.NODE_ENV === 'production' ? "https" : "http"], // Use HTTPS in production, HTTP in development
};

const outputFile = "./swagger-output.json"; // The output Swagger file
const endpointsFiles = ["./routes/userRoutes.js"]; // Your route files

swaggerAutogen()(outputFile, endpointsFiles); // Generate the Swagger documentation

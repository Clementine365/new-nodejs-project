const swaggerAutogen = require("swagger-autogen");

const doc = {
  info: {
    title: "User API",
    description: "This is the documentation for the User API.",
  },
  host: "localhost:5000", // Change this if deploying
  schemes: ["http"], // HTTP or HTTPS depending on your setup
};

const outputFile = "./swagger-output.json"; // This is the generated file
const endpointsFiles = ["./routes/userRoutes.js"]; // Your route files

swaggerAutogen()(outputFile, endpointsFiles); // Ensuring proper usage


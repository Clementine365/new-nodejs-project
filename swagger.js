const swaggerAutogen = require("swagger-autogen")();

require("dotenv").config(); // Load .env here

const doc = {
  info: {
    title: "User API",
    description: "This is the documentation for the User API.",
  },
  host: process.env.NODE_ENV === 'production'
    ? "new-nodejs-project.onrender.com"
    : "localhost:5003",
  schemes: [process.env.NODE_ENV === 'production' ? "https" : "http"],
  tags: [
    {
      name: "Users",
      description: "Operations related to users"
    }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "connect.sid" // Session cookie used by express-session
      }
    }
  },
  security: [
    {
      cookieAuth: []
    }
  ]
};

const outputFile = "./swagger-output.json";
const endpointsFiles = [
  "./index.js",
  "./routes/userRoutes.js"
];

swaggerAutogen(outputFile, endpointsFiles, doc);

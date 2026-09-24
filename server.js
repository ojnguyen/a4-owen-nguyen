import express from "express"; // Can do this instead of require("express") since "type": "module" (in package.json)

const app = express();

// Registers static-file middleware
// This has to be last so it doesnt override any of the above middleware.
app.use(express.static("public"));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


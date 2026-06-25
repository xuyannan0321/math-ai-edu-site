const app = require("./app");
const { env, assertRuntimeEnv } = require("./config/env");

assertRuntimeEnv();

app.listen(env.port, () => {
  console.log(`Math AI Edu API is running on http://localhost:${env.port}`);
});

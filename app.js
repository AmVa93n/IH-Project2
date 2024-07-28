// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config();

// ℹ️ Connects to the database
require("./db");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");

// Handles the handlebars
// https://www.npmjs.com/package/hbs
const hbs = require("hbs");
hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

const capitalize = require("./utils/capitalize");
const projectName = "Omniglot";

app.locals.appTitle = `${capitalize(projectName)}`;

const getNotifs = require("./middleware/notifications");
app.use(getNotifs)

// 👇 Start handling routes here
const indexRoutes = require("./routes/index.routes");
app.use("/", indexRoutes);

const checkoutRoutes = require("./routes/checkout.routes");
app.use("/", checkoutRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const accountRoutes = require("./routes/account.routes");
app.use("/account", accountRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./error-handling")(app);

module.exports = app;

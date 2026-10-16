// Express 4 does not forward rejected async handlers automatically.
const fs = require("fs").promises;
module.exports = controllers => Object.fromEntries(Object.entries(controllers).map(([name, handler]) => [name,
  typeof handler === "function" ? (req, res, next = error => { throw error; }) => Promise.resolve().then(() => handler(req, res, next)).catch(async error => {
    // Also runs when obtaining a connection fails before a controller's try block.
    await Promise.all((req.files || []).map(file => fs.unlink(file.path).catch(() => {})));
    return next(error);
  }) : handler,
]));

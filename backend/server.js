const app = require("./index");

const PORT = process.env.PORT || 4000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Backend listening on port ${PORT}`);
});
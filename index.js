const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("The server running successfully!");
});

app.listen(port, () => {
    console.log("The server running successfully on port:", port)
})
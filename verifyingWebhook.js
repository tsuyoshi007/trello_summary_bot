require('dotenv').config();
const PORT = process.env.PORT;

const express = require('express');
const app = express();
app.use(express.json());

app.head('/trello', function (req, res) {
  res.status(200).send('haha');
});

app.post('/slack', function (req, res) {
  res.send(req.body.challenge);
});

app.listen(PORT);

const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require('uuid'),
    mongoose = require('mongoose'),
    Models = require('./models.js');

const port = process.env.PORT || 8080;
    
const app = express();

const Movies = Models.Movie;
const Users = Models.User;

app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public')); 

mongoose.connect('mongodb://localhost:27017/myMoviesDB', {
    useNewUrlParser: true, useUnifiedTopology: true
});

// in-memory data
let topMovies = [
    {
        title: 'In Bruges'
    },
    {
        title: 'Head-On'
    },
    {
        title: 'The Intouchables'
    },
    {
        title: 'The Dark Knight'
    },
    {
        title: 'Brokeback Mountain'
    },
    {
        title: 'Matrix'
    },
    {
        title: 'Seven Years In Tibet'
    },
    {
        title: 'Ghost Dog'
    },
    {
        title: 'Walk The Line'
    },
    {
        title: 'Django Unchained'
    }
];

// Error Handling
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Whoopsie, seems like an error occured.');
});

// GET requests
app.get('/', (req, res) => {
    res.send('Welcome to my Movie App!')
});
// access the API documentation
app.get('/documentation', (req, res) => {
    res.sendFile(__dirname + '/public/documentation.html')
});

app.get('/movies', (req, res) => {
    res.json(topMovies);
});

app.get('/movies/:title', (req,res) => {
    res.send('An object with details about the movie is shown.')
    //handler method
});

app.get('/movies/:genre', (req, res) => {
    res.send('An object about the movie genre is shown.')
    //handler method
});

app.get('/movies/:director', (req, res) => {
    res.send('An object with details about the director is shown.')
    //handler method
});

// POST requests
app.post('/users', (req,res) => {
    let newUser= req.body;
    res.send('You have registered sucessfully!')
    //handler method
});

// PUT requests
app.put('/users/:username', (req, res) => {
    res.send('A sucessful update of the user profile.')
    //handler method
});

app.put('/users/:username/:title', (req, res) => {
    res.send('Movie object is added to a user\'s list.')
    //handler method
});

// DELETE requests
app.delete('/users/:username/:title', (req, res) => {
    res.send('Successful deletion of a movie from a user\'s list.')
    //handler method
});

app.delete('/users/:username', (req, res) => {
    res.send('Successful deletion of a user\'s account.')
    //handler method
});

// listen for requests
app.listen(port, () => {
    console.log(`Your app is listening on port ${port}`);
});
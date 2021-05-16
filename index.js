const express = require('express'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require('uuid'),
    mongoose = require('mongoose'),
    Models = require('./models.js');

const port = process.env.PORT || 8080;
    
const app = express();

app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public')); 

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myMoviesDB', {
    useNewUrlParser: true, useUnifiedTopology: true
});

// Error Handling
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Whoopsie, seems like an error occured.');
});

// GET requests
// Welcome page of app
app.get('/', (req, res) => {
    res.send('Welcome to my Movie App!')
});
// access the API documentation
app.get('/documentation', (req, res) => {
    res.sendFile(__dirname + '/public/documentation.html')
});

// Get a list of all movies
app.get('/movies', (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Get a movie by title
app.get('/movies/:Title', (req,res) => {
    Movies.findOne({Title: req.params.Title})
        .then((movie) => {
            res.status(201).json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Get info about genre
app.get('/movies/genres/:Genre', (req, res) => {
    Movies.findOne({'Genre.Name': req.params.Genre})
        .then((genre) => {
            res.status(201).json(genre.Genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

app.get('/movies/directors/:Name', (req, res) => {
    Movies.findOne({'Director.Name': req.params.Name})
        .then((director) => {
            res.status(201).json(director.Director);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Get all the users
app.get('/users', (req, res) => {
    Users.find()
        .then((users) => {
            res.status(201).json(users);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Get a user by username
app.get('/users/:Username', (req, res) => {
    Users.findOne({Username: req.params.Username})
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// POST requests

// Add a user
/* We'll expect JSON in this format
    {
        ID: Integer,
        Username: String,
        Password: String,
        Email: String,
        Birthday: Date
    }*/

app.post('/users', (req,res) => {
    Users.findOne({Username: req.body.Username})
        .then((user) => {
            if(user) {
                return res.status(400).send(req.body.Username + 'already exists');
            } else {
                Users
                    .create({
                        Username: req.body.Username,
                        Password: req.body.Password,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday
                    })
                    .then((user) => {res.status(201).json(user)})
                .catch((error) => {
                    console.error(error);
                    res.status(500).send('Error: ' + error);
                })    
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

// Add a movie to a user's list of favorites
/* We'll expect JSON in this format
    {
        FavoriteMovies: String
    }*/
app.post('/users/:Username/Movies/:FavoriteMovies', (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username },
        {$push: 
            { 
            FavoriteMovies: req.params.FavoriteMovies 
            }
        },
        {new: true }, // This line makes sure that the updated document is returned
        (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
  });

// PUT requests
// Update a user's info, by username
/* We'll expect a JSON in this format
{
    Username: String, (required)
    Password: String, (required)
    Email: String, (required)
    Birthday: Date
}*/
app.put('/users/:Username', (req, res) => {
    Users.findOneAndUpdate({Username: req.params.Username},
        {$set:
            {
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }
        },
        {new: true}, //This line makes sure the updated document is returned
        (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// DELETE requests
// Delete a movie from user's favorite movies list
/* We'll expect JSON in this format
    {
        FavoriteMovies: String
    }*/
app.delete('/users/:Username/movies/:FavoriteMovies', (req, res) => {
    Users.findOneAndRemove({Username: req.params.Username},
        {$pull:
            {
                FavoriteMovies: req.params.FavoriteMovies
            }
        },
        {new: true}, // This line makes sure that the updated document is returned
        (err, updatedUser) => {
        if(err) {
            console.error(err);
            res.status(500).send('Error: ' + err);
        } else {
            res.json(updatedUser);
        }
    });
});

// Delete a user by username
app.delete('/users/:Username', (req, res) => {
    Users.findOneAndRemove({Username: req.params.Username})
        .then((user) => {
            if(!user) {
                res.status(400).send(req.params.Username + ' was not found.');
            } else {
                res.status(200).send(req.params.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status (500).send('Error: ' + err);
        });
});

// listen for requests
app.listen(port, () => {
    console.log(`Your app is listening on port ${port}`);
});
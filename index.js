const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  app = express();
mongoose = require('mongoose'),
  Models = require('./models/models.js'),
  Movies = Models.Movie;
Users = Models.User;
cors = require('cors'),
  { check, validationResult } = require('express-validator');

app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public'));

const passport = require('passport');
require('./helpers/passport.js');

// Needed for testing: CORS measure to restrict access from all domains
app.use(cors());

// let allowedOrigins = ['https://localhost:1234', 'https://localhost:1234/login', 'http://localhost:8080', 'https://allmymovies.herokuapp.com/', 'http://localhost:8080/login', 'https://allmymovies.herokuapp.com/login'];

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) === -1) {
//       let message = 'The CORS policy for this application does not allow access from origin ' + origin;
//       return callback(new Error(message), false);
//     }
//     return callback(null, true);
//   }
// }));


// To connect to local database
// mongoose.connect('mongodb://localhost:27017/myMoviesDB', {
//     useNewUrlParser: true, useUnifiedTopology: true
// });

// To connect to online database
mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true, useUnifiedTopology: true
});

let auth = require('./middleware/auth.js')(app);

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
// Access the API documentation
app.get('/documentation', (req, res) => {
  res.sendFile(__dirname + '/public/documentation.html')
});

// Get a list of all movies; temp. removed:  
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get info about a movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      res.status(200).json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get info about a genre
app.get('/movies/genres/:Genre', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ 'Genre.Name': req.params.Genre })
    .then((genre) => {
      res.status(200).json(genre.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get info about a director by name
app.get('/movies/directors/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ 'Director.Name': req.params.Name })
    .then((director) => {
      res.status(200).json(director.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get all the users
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.find()
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get a user by username
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// POST requests
// Register a user
/* We'll expect JSON in this format
    {
        ID: Integer,
        Username: String,
        Password: String,
        Email: String,
        Birthday: Date
    }*/

app.post('/users',
  [
    check('Username', 'Username is required.').isLength({ min: 5 }),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required.').not().isEmpty(),
    check('Email', 'Email does not appear to be valid.').isEmail()
  ],
  (req, res) => {
    let errors = validationResult(req); // checks the validation object for errors
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(409).send(req.body.Username + 'already exists');
        } else {
          let hashedPassword = Users.hashPassword(req.body.Password);
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => {
              res.status(201).json(user)
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
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
app.post('/users/:Username/movies/:FavoriteMovies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username },
    {
      $push:
      {
        FavoriteMovies: req.params.FavoriteMovies
      }
    },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if (err) {
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
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
  [
    check('Username', 'Username is required.').isLength({ min: 5 }),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required.').not().isEmpty(),
    check('Email', 'Email does not appear to be valid.').isEmail()
  ],
  (req, res) => {
    let errors = validationResult(req); // checks the validation object for errors
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOneAndUpdate({ Username: req.params.Username },
      {
        $set:
        {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        }
      },
      { new: true }, //This line makes sure the updated document is returned
      (err, updatedUser) => {
        if (err) {
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
app.delete('/users/:Username/movies/:FavoriteMovies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username },
    {
      $pull:
      {
        FavoriteMovies: req.params.FavoriteMovies
      }
    },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
});

// Delete a user by username
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(409).send(req.params.Username + ' was not found.');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Listen for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on port ' + port);
});
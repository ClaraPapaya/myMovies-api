const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  app = express(),
  mongoose = require('mongoose'),
  Models = require('./models/models.js'),
  Movies = Models.Movie,
  Users = Models.User,
  { check, validationResult } = require('express-validator');

app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public'));

const passport = require('passport');
require('./helpers/passport.js');

// CORS policy
const cors = require('cors');
let allowedOrigins = ['https://clarapapaya.github.io/myMovies-Angular-client/', 'https://allmymovies.netlify.app', 'https://allmymovies.herokuapp.com/', 'http://localhost:8080'];
app.use(cors({
  // origin: (origin, callback) => {
  //   if (!origin) return callback(null, true);
  //   if (allowedOrigins.indexOf(origin) === -1) {
  //     let message = 'The CORS policy for this application does not allow access from origin ' + origin;
  //     return callback(new Error(message), false);
  //   }
  //   return callback(null, true);
  // }
}));

/* To connect to local database:
mongoose.connect('mongodb://localhost:27017/myMoviesDB', {
  useNewUrlParser: true, useUnifiedTopology: true
}); */

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
/**
 * @method getWelcomePage
 * @param {string} endpoint to fetch welcome page
 * @returns {string} 
 */
app.get('/', (req, res) => {
  res.send('Welcome to my Movie App!')
});

/**
 * @method getDocumentation
 * @param {string} endpoint to fetch documentation file
 * @returns {function} returns HTML file 
 */
app.get('/documentation', (req, res) => {
  res.sendFile(__dirname + '/public/documentation.html')
});

/**
 * @method getAllMovies
 * @param {string} endpoint to fetch all movies
 * @param {function} authentication method using passport
 * @param {function} callback to find the list of movies
 * @returns {array} returns an array of objects (movies)
*/
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

/**
 * @method getMovieByTitle
 * @param {string} endpoint to fetch a specific movie
 * @param {function} authentication method using passport
 * @param {function} callback to find a movie by title
 * @returns {object} returns object of one movie
*/
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

/**
 * @method getGenreByName
 * @param {string} endpoint to fetch details about a genre
 * @param {function} authentication method using passport
 * @param {function} callback to get a genre by name
 * @returns {object} returns object of one genre
 */
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

/**
 * @method getDirectorByName
 * @param {string} endpoint to fetch details about a director
 * @param {function} authentication method using passport
 * @param {function} callback to get a director by name
 * @returns {object} returns object of one director
 */
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

/**
 * @method getAllUsers
 * @param {string} endpoint to fetch all users
 * @param {function} authentication method using passport
 * @param {function} callback to get a user by username
 * @returns {array} returns list of all users
 */
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

/**
 * @method getUserByUsername
 * @param {string} endpoint to fetch details about a specific user
 * @param {function} authentication method using passport
 * @param {function} callback to get a user by username
 * @returns {object} returns object of one user
 */
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
/**
 * @method registerUser
 * @param {string} endpoint to post user data into the database
 * @param {function} validationResult validates input using express-validator
 * @param {function} callback to check if user already exists
 * @returns {object} that creates user in database
 * We'll expect JSON in this format
    {
        ID: Integer,
        Username: String,
        Password: String,
        Email: String,
        Birthday: Date
    }
*/
app.post('/users',
  [
    check('Username', 'Username is required.').isLength({ min: 5 }),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required.').not().isEmpty(),
    check('Email', 'Email does not appear to be valid.').isEmail()
  ],
  (req, res) => {
    let errors = validationResult(req);
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

/**
 * @method addFavoriteMovie
 * @param {string} endpoint to put a movie on users favorite movies list
 * @param {function} authentication method using passport
 * @param {function} callback to find a user and update their FavoriteMovies
 * @returns {object} returns updated user object
 * We'll expect JSON in this format
    {
        FavoriteMovies: String
    }
*/
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username },
    {
      $addToSet:
      {
        FavoriteMovies: req.params.MovieID
      }
    },
    { new: true }, // confirms updated document is returned
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
/**
 * @method editUser
 * @param {string} endpoint to user profile
 * @param {function} authentication method using passport
 * @param {function} validationResult validates input using express-validator
 * @param {function} callback to find user and update their profile data
 * @return {object} returns updated user object
 * We'll expect a JSON in this format
    {
    Username: String, (required)
    Password: String, (required)
    Email: String, (required)
    Birthday: Date
    }
*/
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
  [
    check('Username', 'Username is required.').isLength({ min: 5 }),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required.').not().isEmpty(),
    check('Email', 'Email does not appear to be valid.').isEmail()
  ],
  (req, res) => {
    let errors = validationResult(req);
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
      { new: true }, // confirms updated document is returned
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
/**
 * @method deleteFromFavMovie
 * @param {string} endpoint to user's favorite movies list
 * @param {function} authentication method using passport
 * @param {function} callback to find user and update their FavoriteMovies
 * @returns {object} returns updated user object
 * We'll expect JSON in this format
    {
    FavoriteMovies: String
    }
*/
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username },
    {
      $pull:
      {
        FavoriteMovies: req.params.MovieID
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

/**
 * @method deleteUser
 * @param {string} endpoint to user profile
 * @param {function} authentication method using passport
 * @param {function} callback to find user and remove the object
 * @returns {string} message that confirms the deletion
*/
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

/**
 * @method Listen for local requests
 * @param {function} callback to listen to local port 8080
 * @returns local port
*/
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on port ' + port);
});
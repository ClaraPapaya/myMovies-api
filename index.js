const express = require('express'),
    morgan = require('morgan');

const port = process.env.PORT || 8080;
    
const app = express();


let topMovies = [
    {title: 'In Bruges'},
    {title: 'Head-On'},
    {title: 'The Intouchables'},
    {title: 'The Dark Knight'},
    {title: 'Brokeback Mountain'},
    {title: 'Matrix'},
    {title: 'Seven Years In Tibet'},
    {title: 'Ghost Dog'},
    {title: 'Walk The Line'},
    {title: 'Django Unchained'}
];

app.use(morgan('common'));
app.use(express.static('public')); 

// Error Handling
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Whoopsie, seems like an error occured.');
});

// GET requests
app.get('/movies', (req, res) => {
    res.json(topMovies);
});

app.get('/',( req, res) => {
    res.send('Welcome to my Movie App!')
});

// listen for requests
app.listen(port, () => {
    console.log('Your app is listening on port ${port}');
});
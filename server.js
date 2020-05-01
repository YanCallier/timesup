const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const MongoClient = require('mongodb').MongoClient;

// const uri = 'mongodb://localhost:27017/';
// const uri = "mongodb+srv://yanAdmin:DATE2naissance@cluster0-mjp15.mongodb.net/test?retryWrites=true";
const uri = "mongodb+srv://yanAdmin:DATE2naissance@cluster0-hcaod.gcp.mongodb.net/test?retryWrites=true&w=majority";

app.use("/", express.static(__dirname));

// app.get('/in', function (req, res) {

//     MongoClient.connect(uri, { useNewUrlParser: true }, function (err, client) {
//         if (err) console.log('conexion error : ' + err);
//         let collection = client.db('timesup').collection('games');
//         console.log(req.query.word);

//         collection.updateOne(
//             { "name": "game0" },
//             { $push: { words: req.query.word } }
//         )
//         client.close();
//         res.redirect('/')
//     });
// });

// app.get('/out', function (req, res) {

//     MongoClient.connect(uri, { useNewUrlParser: true }, function (err, client) {
//         if (err) console.log('conexion error : ' + err);
//         // let collection = client.db('timesup').collection('games');
//         // console.log(req.query.word);

//         // collection.findOne(
//         //     { "name": "game0" },
//         //     { $push: { words: req.query.word } }
//         // )
//         client.close();
//         res.send([1, 2, 3]);
//         // res.redirect('/');
//         // res.redirect('/', { name: "test" })
//     });
// });

var words = [];
var pickedWords = [];
io.on('connection', function (socket) {
    console.log(socket.id);

    socket.on('addWord', (word) => {
        words.push(word);
    })

    socket.on('draw', () => {

        var randomWordId = Math.floor(Math.random() * Math.floor(words.length));
        let pickedWord = words.splice(randomWordId, 1)[0];
        if (pickedWord) {
            pickedWords.push(pickedWord);
        }
        else {
            pickedWord = "Le chapeau est vide !"
        }
        socket.emit('draw', pickedWord);

    });

    socket.on('reFill', () => {
        words = pickedWords;
        pickedWords = [];
    })

    socket.on('endGame', () => {
        words = [];
        pickedWords = [];
    })

    socket.on('disconnect', (reason) => {
        console.log(('Événement socket.io [disconnect]socket.id : ' + socket.id + 'reason : ' + reason));
    });
});

app.use(function (req, res) { res.status(404).send('Cette page n\'existe pas') });
const PORT = process.env.PORT || 8080;
server.listen(PORT, function () {
    console.log('ping');
});
// HD93D-9YJC9-3MRVK-F96GR-29HMZ
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
// const MongoClient = require('mongodb').MongoClient;
// const translate = require('@k3rn31p4nic/google-translate-api');
// const tunnel = require('tunnel');
// var agent = tunnel.httpsOverHttp({
//     proxy: {
//         host: 'localhost',
//         port: 8123
//     }
// });

// translate('Tu es incroyable!', { to: 'en' }).then(res => {
//     console.log(res.text); // OUTPUT: You are amazing!
// }).catch(err => {
//     console.error(err);
// });
const words = require('an-array-of-french-words')


// const uri = 'mongodb://localhost:27017/';
// const uri = "mongodb+srv://yanAdmin:DATE2naissance@cluster0-mjp15.mongodb.net/test?retryWrites=true";
const uri = "mongodb+srv://yanAdmin:DATE2naissance@cluster0-hcaod.gcp.mongodb.net/test?retryWrites=true&w=majority";


// app.get('in/:gameID', function (req, res) {
//     // res.send("tagId is set to " + req.params.tagId);
//     // console.log(req.query.gameID);
//     console.log("test");
//     res.redirect('/')
// });




// app.get('/', function (req, res) {

//     // MongoClient.connect(uri, { useNewUrlParser: true }, function (err, client) {
//     //     if (err) console.log('conexion error : ' + err);
//     //     let collection = client.db('timesup').collection('games');
//     //     console.log(req.query.word);

//     //     collection.updateOne(
//     //         { "name": "game0" },
//     //         { $push: { words: req.query.word } }
//     //     )
//     //     client.close();
//     //     res.redirect('/')
//     // });
//     console.log(req.query.gameID)
//     next();
//     // res.redirect('/')
// });

// app.use("/", express.static(__dirname));

// app.use('/', function (req, res, next) {
//     console.log('Request Type:', req.query.gameID);
//     games[req.query.gameID].players.push();
//     next();
// });

app.use("/", express.static(__dirname));
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

// var words = [];
// var pickedWords = [];
// var passedWords = [];
const games = {};



io.on('connection', function (socket) {

    socket.on('creaGame', () => {
        games[socket.id] = {
            words: [],
            pickedWords: [],
            passedWords: [],
            players: [],
            status: null,
        };
    });

    socket.on('gameStatus', (status) => {
        games[socket.gameID].status = status;
    });

    socket.on('newPlayer', (gameID) => {
        if (games[gameID]) {
            games[gameID].players.push(socket.id);
            // console.log(socket.id + " rentre dans la game " + gameID + " : " + games[gameID].players);
            socket.gameID = gameID;
            socket.emit('welcomeInGame', games[gameID].status);
            socket.emit('nbWords',
                games[gameID].words.length,
                games[gameID].pickedWords.length);
            socket.join(gameID);
        }
        else {
            socket.emit('unavailableGame');
        }
    });

    socket.on('majNbWords', () => {
        io.in(socket.gameID).emit('nbWords',
            games[socket.gameID].words.length,
            games[socket.gameID].pickedWords.length);
    });

    socket.on('inTheChapo', (choosenWords) => {
        games[socket.gameID].words.push(...choosenWords);
    });

    socket.on('beginTurn', () => {
        io.in(socket.gameID).emit('beginTurn');
    });

    socket.on('draw', () => {
        var randomWordId = Math.floor(Math.random() * Math.floor(games[socket.gameID].words.length));
        let pickedWord = games[socket.gameID].words.splice(randomWordId, 1)[0];
        socket.emit('draw', pickedWord);
    });

    socket.on('endWord', (data) => {
        if (data.guess) {
            games[socket.gameID].pickedWords.push(data.word);
            io.in(socket.gameID).emit('guessWord', data.word);
        }
        else {
            games[socket.gameID].passedWords.push(data.word);
        }
    });

    socket.on('endTurn', (endReason, lastword) => {
        if (lastword) {
            games[socket.gameID].passedWords.push(lastword);
        }
        for (word of games[socket.gameID].passedWords) {
            games[socket.gameID].words.push(word);
        }
        games[socket.gameID].passedWords = [];
        io.in(socket.gameID).emit('endTurn', endReason);
    });

    socket.on('reFill', () => {
        if (games[socket.gameID].words.length > 0) {
            socket.emit('reFillRefused', 'Il y a des mots à piocher avant de remplir le chapeau')
        }
        else {
            games[socket.gameID].words = games[socket.gameID].pickedWords;
            games[socket.gameID].pickedWords = [];
        }
    })

    // socket.on('genWords', (word) => {
    //     translate(word, { from: 'fr', to: 'en' }).then(res => {
    //         console.log(res.text);
    //         //=> I speak English
    //         console.log(res.from.language.iso);
    //         //=> nl
    //     }).catch(err => {
    //         console.error(err);
    //     });
    // });

    socket.on('endGame', () => {
        games[socket.gameID].words = [];
        games[socket.gameID].pickedWords = [];
        io.in(socket.gameID).emit('nbWords', games[socket.gameID].words.length);
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
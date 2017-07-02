const config = require('./config');
const log = require('log4js').getLogger();
const app = require('express')();
const KinozalTV = require('node-kinozaltv-api');

const kinozalTV = new KinozalTV(config.kinozal.username, config.kinozal.password, config.kinozal.proxy);
kinozalTV.authenticate().then(null, err => log.error(err));

const server = app.listen(config.port, () => log.info("Listening on port %s...", server.address().port));

app.use((request, response, next) => {
    log.info(request.method + ' ' + request.url);
    next();
});


app.get('/kinozal/search', (request, response) =>
    kinozalTV.search(request.query).then(
        list => response.json(list),
        err => {
            log.info(err);
            response.status(500).send("Service unavailable");
        }
    )
);

app.get('/kinozal/download', (request, response) => {
    let fileName = '/tmp/' + request.query.id + '.torrent';
    kinozalTV.downloadTorrent(request.query.id, fileName).then(
        res => response.sendFile(fileName),
        err => {
            log.info(err);
            response.status(500).send("Service unavailable");
        }
    )}
);

app.get('*', (request, response) => response.status(404).send('Not found'));

process.on('SIGINT', () => {
    log.info('Server has stopped');
    process.exit(0);
});
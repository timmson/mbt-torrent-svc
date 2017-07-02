const config = require('./config');
const log = require('log4js').getLogger();
const app = require('express')();
const KinozalTV = require('node-kinozaltv-api');


const kinozalTV = new KinozalTV(config.kinozal.username, config.kinozal.password).authenticate().then(null, err => log.error(err));

app.get('*', (request, response) => response.status(404).send('Not found'));
const server = app.listen(config.port, () => log.info("Listening on port %s...", server.address().port));

app.get('/kinozal/search', (request, response) => kinozalTV.search(request.query).then(
    list => response.json(list),
    err => {
        log.info(err);
        response.status(500).send("Service unavailable");
    }));


process.on('SIGINT', () => {
    log.info('Server has stopped');
    process.exit(0);
});
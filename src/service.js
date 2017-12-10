const config = require("./config.js");
const log = require("log4js").getLogger();

const MediatorApi = require("./modules/mediator-api.js");
const mediatorApi = new MediatorApi(config);


log.info("Torrent Bot has started");
log.info("Please press [CTRL + C] to stop");

process.on("SIGINT", () => {
    log.info("Torrent Bot has stopped");
    process.exit(0);
});

process.on("SIGTERM", () => {
    log.info("Torrent Bot has stopped");
    process.exit(0);
});
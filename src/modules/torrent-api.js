const log = require("log4js").getLogger("torrent-api");
const {KinozalTv, RuTrackerOrg} = require("node-t-tracker");
const request = require("request");

const trackers = {
    kinozal: "kn",
    rutracker: "ru"
};

function TorrentApi(config) {
    this.kinozalTV = new KinozalTv(config.kinozal.username, config.kinozal.password, config.proxy, request);
    this.kinozalTV.authenticate().catch(err => log.error(err));

    this.ruTrackerOrg = new RuTrackerOrg(config.rutracker.username, config.rutracker.password, config.proxy, request);
    this.ruTrackerOrg.authenticate().catch(err => log.error(err));

    log.info("Authorized");
}

TorrentApi.prototype.searchMovie = function (s) {
    return new Promise(async (resolve, reject) => {
        try {
            let list = await this.kinozalTV.search({title: s});
            resolve(list.map(row => merge(row, trackers.kinozal)));
        } catch (err) {
            log.error(err);
            reject(err);
        }
    });
};

TorrentApi.prototype.searchSoftware = function (s) {
    return new Promise(async (resolve, reject) => {
        try {
            let list = await this.ruTrackerOrg.search({title: s});
            resolve(list.map(row => merge(row, trackers.rutracker)));
        } catch (err) {
            log.error(err);
            reject(err);
        }
    });
};


TorrentApi.prototype.topMovies = function (genre) {
    return new Promise(async (resolve, reject) => {
        try {
            let list =await this.kinozalTV.getTop(genre);
            resolve(list.map(row => merge(row, trackers.kinozal)));
        } catch (err) {
            log.error(err);
            reject(err);
        }
    });
};

TorrentApi.prototype.detail = function (textId) {
    let id = split(textId);
    return new Promise(async (resolve, reject) => {
        try {
            let detail = null;
            switch (id[1]) {
                case trackers.kinozal:
                    detail = await this.kinozalTV.getDetail(id[0]);
                    detail = merge(detail, trackers.kinozal);
                    break;
                case trackers.rutracker:
                    detail = await this.ruTrackerOrg.getDetail(id[0]);
                    detail = merge(detail, trackers.rutracker);
                    break;
            }
            resolve(detail)
        } catch (err) {
            log.error(JSON.stringify(err));
            reject(err);
        }
    });
};

TorrentApi.prototype.getDownloadStream = function (textId) {
    let id = split(textId);
    let stream = null;
    switch (id[1]) {
        case "kn":
            stream = this.kinozalTV.getDownloadStream(id[0]);
            break;
        case "ru":
            stream = this.ruTrackerOrg.getDownloadStream(id[0]);
            break;
    }
    return stream;
};

function merge(row, type) {
    row.id = type + row.id.toString();
    return row;
}

function split(id) {
    return [id.substr(2, id.length - 2), id.substr(0, 2)];
}


module.exports = TorrentApi;

const log = require("log4js").getLogger();
const KinozalTv = require("node-t-tracker").KinozalTv;

function TorrentApi(config) {
    log.info(config.proxy);
    this.kinozalTV = new KinozalTv(config.kinozal.username, config.kinozal.password, config.proxy);
    this.kinozalTV.authenticate().catch(err => log.error(err));
}

TorrentApi.prototype.search = function (s) {
    return new Promise(async (resolve, reject) => {
        try {
            resolve(await this.kinozalTV.search({title: s}));
        } catch (err) {
            log.info(err);
            reject(err);
        }
    });
};

TorrentApi.prototype.top = function (genre) {
    return new Promise(async (resolve, reject) => {
        try {
            resolve(await this.kinozalTV.getTop(genre));
        } catch (err) {
            log.info(err);
            reject(err);
        }
    });
};

TorrentApi.prototype.detail = function (id) {
    return new Promise(async (resolve, reject) => {
        try {
            resolve(await this.kinozalTV.getDetail(id));
        } catch (err) {
            log.info(err);
            reject(err);
        }
    });
};

TorrentApi.prototype.getDownloadStream = function (id) {
    return this.kinozalTV.getDownloadStream(id);
};

TorrentApi.prototype.getImageUrl = function (id) {
    return new Promise((resolve, reject) => this.detail(id).then(detail => resolve(detail.img), err => reject(err)));
};

module.exports = TorrentApi;

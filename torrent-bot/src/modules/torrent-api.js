const request = require("request");
const qs = require("querystring");

function TorrentApi(_torrentSvc) {
    this.torrentSvc = _torrentSvc;
}

TorrentApi.prototype.search = function (s) {
    return new Promise((resolve, reject) => {
        request(this.torrentSvc + "/kinozal/search?" + qs.stringify({title: s}),
            (err, response, body) => (err || response.statusCode !== 200) ? reject(this.getMessageError(err, response)) : resolve(JSON.parse(body))
        )
    });
};

TorrentApi.prototype.top = function (s) {
    return new Promise((resolve, reject) => {
        request(this.torrentSvc + "/kinozal/top?" + qs.stringify({title: s}),
            (err, response, body) => (err || response.statusCode !== 200) ? reject(this.getMessageError(err, response)) : resolve(JSON.parse(body))
        )
    });
};

TorrentApi.prototype.download = function (id) {
    return new Promise((resolve, reject) => resolve(request(this.getDownloadUrl(id))));
};

TorrentApi.prototype.detail = function (id) {
    return new Promise((resolve, reject) =>
        request(this.torrentSvc + "/kinozal/detail?" + qs.stringify({id: id}),
            (err, response, body) => (err || response.statusCode !== 200) ? reject(this.getMessageError(err, response)) : resolve(JSON.parse(body))
        )
    );
};

TorrentApi.prototype.getImageUrl = function (id) {
    return new Promise((resolve, reject) => this.detail(id).then(detail => resolve(detail.img), reject));
};

TorrentApi.prototype.getDownloadUrl = function (id) {
    return this.torrentSvc + "/kinozal/download?" + qs.stringify({id: id});
};

TorrentApi.prototype.getMessageError = function(err, response) {
    return err || new Error("Error code " + response ? response.statusCode : "");
};

module.exports = TorrentApi;

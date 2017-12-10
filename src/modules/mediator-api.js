const log = require("log4js").getLogger();
const MessageApi = require("./message-api.js");
const TorrentApi = require("./torrent-api.js");

function MediatorApi(config) {
    this.messageApi = new MessageApi(config.telegram);
    this.torrentApi = new TorrentApi(config);

    let _self = this;
    this.messageApi.on("text", (message) => _self.handleMessage(message));
    this.messageApi.on("callback_query", (message) => _self.handleCallback(message));
}

MediatorApi.prototype.handleMessage = async function (message) {
    log.info(message.from.username + " <- " + message.text);
    const text = message.text;
    if (text[0] === "/") {
        if (text.search(/(ru\d|kn\d)/) >= 0) {
            try {
                let detail = await this.torrentApi.detail(text);
                await this.sendTorrentDetail(message.from, detail);
            } catch (err) {
                this.messageApi.sendText(message.from, error.toString(), {})
            }
        } else {
            switch (text) {
                case "/start" :
                    await this.messageApi.sendText(message.from, "Type / to show more commands");
                    break;

                case "/stop" :
                    await this.messageApi.sendText(message.from, "Ok, see you later!");
                    break;

                case "/comedy":
                    await this.getTop(message.from, "comedy", 10);
                    break;

                case "/fantasy":
                    await this.getTop(message.from, "fantasy", 10);
                    break;

                case "/horror":
                    await this.getTop(message.from, "horror", 10);
                    break;

                case "/action":
                    await this.getTop(message.from, "action", 10);
                    break;

                case "/thriller":
                    await this.getTop(message.from, "thriller", 10);
                    break;

                case "/drama":
                    await this.getTop(message.from, "drama", 10);
                    break;

                case "/russian":
                    await this.getTop(message.from, "russian", 10);
                    break;

                case "/kids":
                    await this.getTop(message.from, "kids", 10);
                    break;
            }
        }
    } else {
        try {
            if (text.startsWith("rutracker")) {
                let list = await this.torrentApi.searchSoftware(text.split(" ")[1]);
                if (list.length === 0) {
                    this.messageApi.sendText(message.from, "Nothing found", {})
                }
                for (let i = 0; i < list.length && i < 20; i++) {
                    await this.sendTorrentInfo(message.from, list[i], null);
                }
            } else {
                let list = await this.torrentApi.searchMovie(message.text);
                if (list.length === 0) {
                    this.messageApi.sendText(message.from, "Nothing found", {})
                }
                for (let i = 0; i < list.length && i < 20; i++) {
                    try {
                        let imageUrl = await this.torrentApi.getImageUrl(list[i].id);
                        await this.sendTorrentInfo(message.from, list[i], imageUrl);
                    } catch (err) {
                        this.sendTorrentInfo(message.from, list[i], null);
                    }
                }
            }
        } catch (err) {
            this.messageApi.sendText(message.from, error.toString(), {});
        }
    }
};

MediatorApi.prototype.handleCallback = async function (message) {
    try {
        await this.messageApi.answerCallbackQuery(message.from, message.id, "Downloading ...");
        log.info(message.data);
        await this.messageApi.sendDocument(message.from, await this.torrentApi.getDownloadStream(message.data), {caption: message.data + ".torrent"});
    } catch (err) {
        log.error(err);
        this.messageApi.answerCallbackQuery(message.from, message.id, err.toString()).catch(err => {
        });
    }
};

MediatorApi.prototype.sendTorrentInfo = function (to, row, imageUrl) {
    const parameters = {
        caption: row.title + "\n" + row.size + "\nDetails: /" + row.id,
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    {
                        text: "⬇️ Download",
                        callback_data: row.id
                    }
                ]
            ]
        })
    };

    return imageUrl ? this.messageApi.sendPhoto(to, imageUrl, parameters) : this.messageApi.sendText(to, parameters.caption, parameters);
};

MediatorApi.prototype.sendTorrentDetail = function (to, row) {
    return this.messageApi.sendText(to, "<b>" + row.title + "</b>\n\n" + removeBR(row.specs) + "\n\n" + removeBR(row.description) + "\nid" + row.id, {
        parse_mode: "HTML",
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    {
                        text: "⬇️ Download",
                        callback_data: row.id
                    }
                ]
            ]
        })
    });
};

MediatorApi.prototype.getTop = async function (to, genre, limit) {
    try {
        let list = await this.torrentApi.topMovies(genre);
        list.length === 0 ? this.messageApi.sendText(to, "Nothing found", {}) : list.slice(0, limit || 10).forEach(
            async row => {
                try {
                    let url = await this.torrentApi.getImageUrl(row.id);
                    await this.sendTorrentInfo(to, row, url);
                } catch (err) {
                    log.error(err);
                }
            }
        );
    } catch (err) {
        log.error(err);
        this.messageApi.sendText(to.from, err.toString(), {});
    }
};

function removeBR(str) {
    return str.split("<br>").join("");
}

module.exports = MediatorApi;
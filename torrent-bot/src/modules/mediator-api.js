const log = require("log4js").getLogger();
const MessageApi = require("./message-api.js");
const TorrentApi = require("./torrent-api.js");

function MediatorApi(config) {
    this.messageApi = new MessageApi(config.telegram);
    this.torrentApi = new TorrentApi(process.env["torrent_svc"]);

    let _self = this;
    this.messageApi.on("text", (message) => _self.handleMessage(message));
    this.messageApi.on("callback_query", (message) => _self.handleCallback(message));
}

MediatorApi.prototype.handleMessage = function (message) {
    log.info(message.from.username + " <- " + message.text);
    const text = message.text;
    if (text[0] === "/") {
        if (text.search(/id\d/) >= 0) {
            this.torrentApi.detail(text.substr(3, text.length)).then(
                detail => this.sendTorrentDetail(message.from, detail).catch(log.error),
                error => this.messageApi.sendText(message.from, error.toString(), {})
            )
        } else {
            switch (text) {
                case "/start" :
                    this.messageApi.sendText(message.from, "Type / to show more commands");
                    break;

                case "/stop" :
                    this.messageApi.sendText(message.from, "Ok, see you later!");
                    break;

                case "/top":
                    let args = message.text.split(" ");
                    let limit = args.length === 2 ? parseInt(args[1]) : 10;
                    this.torrentApi.top().then(
                        list => list.length === 0 ? this.messageApi.sendText(message.from, "Nothing found", {}) : list.slice(limit - 10, limit).forEach(row =>
                            this.torrentApi.getImageUrl(row.id).then(
                                url => this.sendTorrentInfo(message.from, row, url).catch(log.error),
                                error => this.sendTorrentInfo(message.from, row, null).catch(log.error)
                            )
                        ),
                        error => this.messageApi.sendText(message.from, error.toString(), {})
                    );
                    break;
            }
        }
    } else {
        this.torrentApi.search(message.text).then(
            list => list.length === 0 ? this.messageApi.sendText(message.from, "Nothing found", {}) : list.forEach(row =>
                this.torrentApi.getImageUrl(row.id).then(
                    url => this.sendTorrentInfo(message.from, row, url).catch(log.error),
                    error => this.sendTorrentInfo(message.from, row, null).catch(log.error)
                )
            ),
            error => this.messageApi.sendText(message.from, error.toString(), {})
        );
    }
};

MediatorApi.prototype.handleCallback = async function (message) {
    try {
        await this.messageApi.answerCallbackQuery(message.from, message.id, "Downloading ...");
        await this.messageApi.sendDocument(message.from, this.torrentApi.getDownloadUrl(message.data), {caption: message.data + ".torrent"});
    } catch (err) {
        log.error(err);
        this.messageApi.answerCallbackQuery(message.from, message.id, err.toString())
    }
};

MediatorApi.prototype.sendTorrentInfo = function (to, row, imageUrl) {
    const parameters = {
        caption: row.title + "\n Details: /id" + row.id,
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    {
                        text: "⬇️ Download",
                        callback_data: row.id.toString()
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
                        callback_data: row.id.toString()
                    }
                ]
            ]
        })
    });
};

function removeBR(str) {
    return str.split("<br>").join("");
}

module.exports = MediatorApi;
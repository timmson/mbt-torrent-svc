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

MediatorApi.prototype.handleCallback = function (message) {
    if (message.message.chat.type === "channel") {
        log.debug(message);
        this.messageApi.editMessageReplyMarkup(message.from, getLikeButton(parseInt(message.data)), {
            message_id: message.message.message_id,
            chat_id: message.message.chat.id,
        }).catch(err => log.error(err));
    } else {
        let data = message.data.split("|");
        if (data[0] === "download") {
            this.torrentApi.download(data[1]).then(stream => {
                this.messageApi.answerCallbackQuery(message.from, message.id, "ОК");
                this.messageApi.sendDocument(message.from, stream, {caption: data[1] + ".torrent"});
            });
        } else {
            this.torrentApi.add(data[1]).then(
                ret =>
                    this.messageApi.answerCallbackQuery(message.from, message.id, ret),
                error => {
                    log.error(error);
                    this.messageApi.answerCallbackQuery(message.from, message.id, error.toString());
                }
            );
        }
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
                        callback_data: "download|" + row.id.toString()
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
                        callback_data: "download|" + row.id.toString()
                    }
                ]
            ]
        })
    });
};

function removeBR(str) {
    return str.split("<br>").join("");
}

function getLikeButton(cnt) {
    return JSON.stringify({inline_keyboard: [[{text: "❤ " + cnt, callback_data: "" + (cnt + 1)}]]});
}

module.exports = MediatorApi;
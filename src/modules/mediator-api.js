const log = require("log4js").getLogger();
const Agent = require("socks-proxy-agent");
const Telegraf = require("telegraf");
const Markup = require("telegraf/markup");
const TorrentApi = require("./torrent-api.js");




let that = null;


function MediatorApi(config) {
    that = this;
    that.bot = new Telegraf(config.telegram.token, {
        telegram: {
            agent: new Agent("socks://127.0.0.1:9050")
        }
    });
    that.bot.on("text", (ctx) => that.handleMessage(ctx));
    that.bot.on("callback_query", (ctx) => that.handleCallback(ctx));
    that.torrentApi = new TorrentApi(config);
}

MediatorApi.prototype.handleMessage = async function (ctx) {
    log.info(ctx.from.username + " <- " + ctx.text);
    const text = message.text;
    if (text[0] === "/") {
        if (text.search(/(ru\d|kn\d)/) >= 0) {
            try {
                let detail = await that.torrentApi.detail(text.substr(1));
                await sendTorrentDetail(ctx, detail);
            } catch (err) {
                ctx.reply(message.from, err.toString(), {})
            }
        } else {
            if (text === "/start") {
                await ctx.reply("Hi, use the buttons below to choose genre or send me you would like to find");
            } else if (text === "/stop") {
                await ctx.reply("Ok, see you later!");
            } else if (GENRES.indexOf(text.slice(1)) >= 0) {
                let list = await that.torrentApi.topMovies(text.slice(1));
                sendTorrentList(ctx, list.slice(0, 10));
            } else {
                await ctx.reply("Sorry, command isn`t support");
            }
        }
    } else {
        try {
            let list = [].concat.apply([], await Promise.all([that.torrentApi.searchMovie(text), that.torrentApi.searchSoftware(text)]));
            await sendTorrentList(ctx, list);
        } catch (err) {
            log.error(err);
            ctx.reply(err.toString());
        }
    }
};


MediatorApi.prototype.handleCallback = async function (ctx) {
    try {
        await ctx.answerCbQuery("Downloading ...");
        log.info(ctx.callbackQuery.data);
        await ctx.replyWithDocument({
            source: await that.torrentApi.getDownloadStream(ctx.callbackQuery.data)
        });
    } catch (err) {
        log.error(err);
        await ctx.answerCbQuery(err.toString());
    }
};


module.exports = MediatorApi;
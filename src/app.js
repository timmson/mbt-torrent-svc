const config = require("./config.js");
const log = require("log4js").getLogger();
//const Agent = require("socks-proxy-agent");

const Telegraf = require("telegraf");
const Markup = require("telegraf/markup");
const bot = new Telegraf(config.telegram.token, {
    telegram: {
        agent: new require("socks-proxy-agent")("socks://127.0.0.1:9050")
    }
});


const TorrentApi = require("./modules/torrent-api");
const torrentApi = new TorrentApi(config);


const GENRES = ["comedy", "fantasy", "horror", "action", "thriller", "drama", "russian", "kids"];

const removeBR = (str) => {
    return str.split("<br>").join("");
};

let sendTorrentList = (ctx, list) => {
    return new Promise(resolve => {
        if (list.length === 0) {
            resolve(ctx.reply("Nothing was found"));
        } else {
            list.forEach(async torrent => {
                try {
                    await ctx.reply(torrent.title + " " + torrent.size + "\n /" + torrent.id,
                        Markup.inlineKeyboard([
                            Markup.callbackButton("⬇️Download", torrent.id),
                            /**
                             * TODO it later
                             Markup.callbackButton("🖥 Download to PC", torrent.id),
                             */
                            Markup.callbackButton("🌍️ Open", torrent.url),

                        ]).extra());
                } catch (err) {
                    log.error(err);
                    ctx.reply(err.toString());
                }
            });
            resolve("OK");
        }
    });
};

let sendTorrentDetail = (ctx, detail) => {
    return new Promise(async resolve => {
        try {
            await ctx.replyWithPhoto({
                source: await torrentApi.getImageUrl(detail.id)
            });
            await ctx.replyWithHTML("<b>" + detail.title + "</b>\n\n" + removeBR(detail.specs) + "\n\n" + removeBR(detail.description) + "\n" + detail.id,
                Markup.inlineKeyboard([
                    Markup.callbackButton("⬇️Download", detail.id),
                    /**
                     * TODO it later
                     Markup.callbackButton("🖥 Download to PC", torrent.id),
                     */
                    Markup.callbackButton("🌍️ Open", detail.url),

                ]).extra()
            );
        } catch (err) {

        }
        resolve("OK");
    });
};

bot.on("text", async (ctx) => {
    log.info(ctx.from.username + " <- " + ctx.text);
    const text = message.text;
    if (text[0] === "/") {
        if (text.search(/(ru\d|kn\d)/) >= 0) {
            try {
                let detail = await torrentApi.detail(text.substr(1));
                await sendTorrentDetail(ctx, detail);
            } catch (err) {
                await ctx.reply(err.toString());
            }
        } else {
            if (text === "/start") {
                await ctx.reply("Hi, use the buttons below to choose genre or send me you would like to find");
            } else if (text === "/stop") {
                await ctx.reply("Ok, see you later!");
            } else if (GENRES.indexOf(text.slice(1)) >= 0) {
                let list = await torrentApi.topMovies(text.slice(1));
                sendTorrentList(ctx, list.slice(0, 10));
            } else {
                await ctx.reply("Sorry, command isn`t support");
            }
        }
    } else {
        try {
            let list = [].concat.apply([], await Promise.all([torrentApi.searchMovie(text), torrentApi.searchSoftware(text)]));
            await sendTorrentList(ctx, list);
        } catch (err) {
            log.error(err);
            ctx.reply(err.toString());
        }
    }
});


bot.on("callback_query", async (ctx) => {
    try {
        await ctx.answerCbQuery("Downloading ...");
        log.info(ctx.callbackQuery.data);
        await ctx.replyWithDocument({
            source: await torrentApi.getDownloadStream(ctx.callbackQuery.data)
        });
    } catch (err) {
        log.error(err);
        await ctx.answerCbQuery(err.toString());
    }
});

bot.startPolling();

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
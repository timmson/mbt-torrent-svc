const log = require('log4js').getLogger('message-api');
const request = require('request');
const TelegramBotApi = require('node-telegram-bot-api');


function MessageApi(config) {
    this.bot = new TelegramBotApi(config.token, config.params);
    this.ownerId = config.owner;
}

MessageApi.prototype.isOwner = function (id) {
    return this.ownerId === id;
};

MessageApi.prototype.on = function (name, handler) {
    return this.bot.on(name, handler);
};

MessageApi.prototype.sendText = function (to, text, params) {
    log.info(to.username + ' <- ' + '[text:' + text + ']');
    return this.bot.sendMessage(to.id, text, params);
};

MessageApi.prototype.sendPhoto = function (to, photoUrl, params) {
    log.info(to.username + ' <- ' + '[image:' + photoUrl + ']');
    return this.bot.sendPhoto(to.id, request(photoUrl), params);
};

MessageApi.prototype.sendVideo = function (to, videoUrl, params) {
    log.info(to.username + ' <- ' + '[video:' + videoUrl + ']');
    return this.bot.sendVideo(to.id, request(videoUrl), params);
};

MessageApi.prototype.sendDocument = function (to, documentUrl, params) {
    log.info(to.username + ' <- ' + '[file:' + documentUrl + ']');
    return this.bot.sendDocument(to.id, request(documentUrl), params);
};

MessageApi.prototype.answerCallbackQuery = function (to, messageId, text) {
    log.info(to.username + ' <- ' + '[answer_callback_query:' + text + ']');
    return this.bot.answerCallbackQuery(messageId, text, false);
};

MessageApi.prototype.editMessageReplyMarkup = function (to, form, ids) {
    log.info(to.username + ' <- ' + '[edit_reply_markup]');
    return this.bot.editMessageReplyMarkup(form, ids);
};


module.exports = MessageApi;

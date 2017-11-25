const request = require('request');

let message = {
    to: {
        id: "@testChannelName",
        username: "@testChannelName"
    },
    version: 2,
    type: "image_link",
    image: "https://blog-assets.risingstack.com/2016/Sep/side-trace/debugging-made-easy.png",
    url: "http://ya.ru",
    isLike: true
};

let body = JSON.stringify(message);
request.post({
    url: 'http://localhost:8080/send',
    body: body,
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
    }
}, (err, response, body) => {
    console.log(err || "OK")
});
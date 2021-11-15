const WebSocketServer = require('websocket').server;
const http = require('http');

let history = [];
let clients = [];

const colors = ['blue', 'red', 'green', 'yellow', 'purple'];

const httpServer = http.createServer(() => { });
httpServer.listen(443, () => { });

const wsServer = new WebSocketServer({ httpServer });

wsServer.on('request', request => {
    const connection = request.accept(null, request.origin);

    console.log(`${new Date()} Connection from origin ${request.origin}.`);

    const index = clients.push(connection) - 1;
    let userName = undefined;
    let userColor = undefined;

    console.log(`${new Date()} Connection accepted.`);

    if (history.length > 0)
        connection.sendUTF(JSON.stringify({ type: 'history', data: history }));

    connection.on('message', message => {
        if (message.type === 'utf8') { // accept only text
            // first message sent by user is their name
            if (!userName) {
                userName = message.utf8Data;
                userColor = colors[Math.floor(Math.random() * 5)];

                connection.sendUTF(JSON.stringify({ type: 'color', data: userColor }));
                console.log(`${new Date()} User is known as: ${userName} with ${userColor} color.`);
            } else {
                console.log(`${new Date()} Received Message from ${userName}: ${message.utf8Data}`);

                const msg = {
                    time: (new Date()).getTime(),
                    text: message.utf8Data,
                    author: userName,
                    color: userColor
                };

                history.push(msg);
                history = history.slice(-100);
                // broadcast message to all connected clients
                const json = JSON.stringify({ type: 'message', data: msg });
                clients.forEach(c => c.sendUTF(json));
            }
        }
        connection.on('close', c => {
            if (userName !== false && userColor !== false) {
                console.log(`${new Date()} Peer ${connection.remoteAddress} disconnected.`);
                clients.splice(index, 1);
            }
        });

    });
});

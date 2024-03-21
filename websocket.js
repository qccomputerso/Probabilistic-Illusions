const websocket = new WebSocket(
	location.href.toLowerCase().includes("github") ?
	"wss://hexagon-game.win" :
	"ws://localhost:8001/"
);

const onReceive = {};

websocket.addEventListener("message", e => {
	const message = JSON.parse(e.data)
	console.log(message)
	for (const type in onReceive) {
		console.log(message.type, type)
		if (message.type !== type) continue;
		console.log("through")
		onReceive[type](message);
		break;
	}
});

export const Websocket = {
	websocket,
	send(data) {
		websocket.send(JSON.stringify(data));
	},
	onReceive(type, response) {
		onReceive[type] = response;
	},
	refreshWebsocket() {
		this.websocket = new WebSocket(
			location.href.toLowerCase().includes("github") ?
			"wss://hexagon-game.win" :
			"ws://localhost:8001/"
		);
		this.websocket.addEventListener("message", e => {
			const message = JSON.parse(e.data)
			for (const type in onReceive) {
				if (message.type !== type) continue;
				onReceive[type](message);
				break;
			}
		});
	}
}

setInterval(() => Websocket.send({ type: "ping" }), 10000)

Websocket.onReceive("pong", () => console.log("pong", new Date()))

Websocket.websocket.addEventListener("error", ({ message }) => {
	throw new Error("Websocket: " + message);
});
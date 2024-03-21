import { Websocket } from "./websocket.js";

const playerData = {
	name: null,
	id: null,
};

const tabs = new Map([
	["titlescreen", document.getElementById("titlescreen-tab")],
	["gameboard", document.getElementById("gameboard-tab")],
	["disconnected", document.getElementById("disconnected-tab")],
	["reconnecting", document.getElementById("reconnecting-tab")]
]);

const gameNumber = 3;
let currentGame = -1;
let currentPoints = 100;

function showTab(tab) {
	for (const [_, tabElement] of tabs) {
		tabElement.style.display = "none";
	}
	tabs.get(tab).style.display = "";
}

function showGame(game) {
	console.log(game)
	currentGame = game;
	for (let i = -1; i < gameNumber; i++) {
		document.getElementById("game" + i).style.display = "none";
	}
	document.getElementById("game" + game).style.display = "";
}

showTab("titlescreen");

const startPlayingButton = document.getElementById("startplaying-button");
startPlayingButton.addEventListener("click", () => {
	playerData.name = document.getElementById("name").value || `Guest ${Math.floor(Math.random() * 1000000)}`;
	document.getElementById("welcome-message").innerText = `Welcome, ${playerData.name}!`;
	Websocket.send({ type: "init", name: playerData.name });
	startPlayingButton.disabled = true;
});

Websocket.onReceive("init", ({ id, currentGame }) => {
	playerData.id = id;
	showTab("gameboard");
	startPlayingButton.disabled = false;
	showGame(currentGame);
});

Websocket.onReceive("next", ({ currentGame }) => {
	showGame(currentGame);
	currentPoints = 100;
});

document.getElementById("make-bet-1").addEventListener("click", () => {
	Websocket.send({ "type": "gamble", amount: currentPoints });
	document.getElementById("status-text-1").innerText = "Currently betting money";
});
document.getElementById("decline-bet-1").addEventListener("click", () => {
	Websocket.send({ "type": "gamble", amount: 0 });
	document.getElementById("status-text-1").innerText = "Currently not betting money";
});

Websocket.onReceive("gamble", ({ amount }) => {
	if (currentGame === 1) {
		document.getElementById("status-text-1").innerText = amount ? "Currently betting money" : "Currently not betting money";
	} else if (currentGame === 2) {
		document.getElementById("status-text-2").innerText = `Currently betting $${amount.toFixed(2)}`
	}
});

document.getElementById("submit-bet-2").addEventListener("click", () => {
	const val = Math.min(Math.max(document.getElementById("amount-bet-2").value, 0), currentPoints);
	Websocket.send({ "type": "gamble", amount: val });
});

Websocket.onReceive("gamble_1_result", ({ result }) => {
	if (result > currentPoints) {
		document.getElementById("flavour-text-1").innerText = "Nice! You got more money!";
	} else if (result < currentPoints) {
		document.getElementById("flavour-text-1").innerText = "Oops! You lost a bit of money!";
	} else {
		document.getElementById("flavour-text-1").innerText = "You played safe and gained and lost nothing.";
	}
	currentPoints = result;
	document.getElementById("money-1").innerText = "$" + currentPoints.toFixed(2);
	document.getElementById("status-text-1").innerText = "";
});

Websocket.onReceive("gamble_2_result", ({ result }) => {
	if (result > currentPoints) {
		document.getElementById("flavour-text-2").innerText = "Nice! You got more money!";
	} else if (result < currentPoints) {
		document.getElementById("flavour-text-2").innerText = "Oops! You lost a bit of money!";
	} else {
		document.getElementById("flavour-text-2").innerText = "You played safe and gained and lost nothing.";
	}
	currentPoints = result;
	document.getElementById("money-2").innerText = "$" + currentPoints.toFixed(2);
	document.getElementById("status-text-2").innerText = "";
});


function attemptingReconnect() {
	let isValid = true;
	let timeoutConnection = setTimeout(() => isValid = false, 25000);
	Websocket.onReceive("reconnect", ({ success, currentGame }) => {
		clearTimeout(timeoutConnection);
		if (!success) {
			isValid = false;
			showTab("disconnected");
		} else {
			if (playerData.id === null) showTab("titlescreen");
			else {
				showTab("gameboard");
				showGame(currentGame);
			}
		}
	})
	function _reconnect() {
		Websocket.refreshWebsocket();
		Websocket.websocket.addEventListener("open", () => {
			Websocket.websocket.send({ "type": "reconnect", id: playerData.id});
			Websocket.websocket.addEventListener("close", () => {
				if (!isValid) showTab("disconnected");
				else attemptingReconnect();
			});
			Websocket.websocket.addEventListener("error", ({ message }) => {
				throw new Error("Websocket: " + message);
			});
		});
	}
	_reconnect();
}
Websocket.websocket.addEventListener("close", () => {
	console.log("bye");
	attemptingReconnect();
});
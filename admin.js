import { Websocket } from "./websocket.js";

const gameNumber = 3;
let currentGame = 0;

const tabs = new Map([
	["titlescreen", document.getElementById("titlescreen-tab")],
	["gameboard", document.getElementById("gameboard-tab")],
	["disconnected", document.getElementById("disconnected-tab")]
]);

function showTab(tab) {
	for (const [_, tabElement] of tabs) {
		tabElement.style.display = "none";
	}
	tabs.get(tab).style.display = "";
}

function showGame(game) {
	currentGame = game;
	for (let i = -1; i < gameNumber; i++) {
		console.log("game" + i)
		document.getElementById("game" + i).style.display = "none";
	}
	document.getElementById("game" + game).style.display = "";
}

function nextGame() {
	currentGame++;
	Websocket.send({ "type": "next" });
	showGame(currentGame);
	if (currentGame === 1) {
		document.getElementById("game1-ranking").innerHTML = playerList.map(x => `${x.name} $100.00`).join("<br>");
	}
	if (currentGame === 2) {
		document.getElementById("game2-ranking").innerHTML = playerList.map(x => `${x.name} $100.00`).join("<br>");
	}
}

showTab("titlescreen");

document.getElementById("start-game").addEventListener("click", () => nextGame());

const startPlayingButton = document.getElementById("startplaying-button");
startPlayingButton.addEventListener("click", () => {
	Websocket.send({ type: "init", isAdmin: true, password: document.getElementById("pw").value });
	startPlayingButton.disabled = true;
});

const playerList = [];
Websocket.onReceive("join", ({ id, name }) => {
	playerList.push({ id, name, money: 0 });
	document.getElementById("player-list").innerHTML = playerList.map(x => x.name).join("<br>");
});

Websocket.onReceive("disconnect", ({ id }) => {
	playerList.splice(playerList.findIndex(val => val.id === id), 1);
	document.getElementById("player-list").innerHTML = playerList.length ? playerList.map(x => x.name).join("<br>") : "Nobody here";
});

Websocket.onReceive("init", ({ success }) => {
	if (!success) return;
	showTab("gameboard");
	showGame(0);
});

document.getElementById("flip-coins").addEventListener("click", () => {
	Websocket.send({ "type": "gamble" });
});

document.getElementById("flip-coins-2").addEventListener("click", () => {
	Websocket.send({ "type": "gamble" });
});

Websocket.onReceive("finish_gamble_1", ({ players }) => {
	players.sort((a, b) => b.points - a.points);
	console.log(players.map((x, i) => `${i + 1}. ${x.name} $${x.points.toFixed(2)}`).join("<br>"))
	document.getElementById("game1-ranking").innerHTML =
		players.map((x, i) => `${i + 1}. ${x.name} $${x.points.toFixed(2)} (Bet ${x.times})`).join("<br>");
});

Websocket.onReceive("finish_gamble_2", ({ players }) => {
	players.sort((a, b) => b.points - a.points);
	document.getElementById("game2-ranking").innerHTML =
		players.map((x, i) => `${i + 1}. ${x.name} $${x.points.toFixed(2)}`).join("<br>");
});

document.getElementById("start-game2").addEventListener("click", () => {
	console.log("h")
	nextGame();
})
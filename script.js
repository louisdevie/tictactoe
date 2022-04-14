const PALETTES = {
	background: "bdf",
	hover: "9bd",
	accent1: "345",
};

const NONE = 0
const PLAYER = 1;
const BOT = 2;

var board;

const WIN_REWARD = 10;
const DRAW_REWARD = 8;
const LOOSE_REWARD = 0;

const STATUS_NOT_ENDED = 0;
const STATUS_PLAYER_WIN = 1; // must be the same as PLAYER
const STATUS_BOT_WIN = 2; // must be the same as BOT
const STATUS_DRAW = 3;

randomInt = (a, b) => a + Math.floor(Math.random() * (b - a));

getCell = c => document.getElementById("cell-" + String(c));

function onLoad() {
	let palette1 = randomInt(0, 3);
	let palette2 = (randomInt(0, 2) + palette1 + 1) % 3;
	let palette3 = 3 - palette1 - palette2;

	let root = document.querySelector(":root");
	root.style.setProperty("--background", "#" + PALETTES.background[palette1] + PALETTES.background[palette2] + PALETTES.background[palette3]);
	root.style.setProperty("--accent-1", "#" + PALETTES.accent1[palette1] + PALETTES.accent1[palette2] + PALETTES.accent1[palette3]);
	root.style.setProperty("--hover", "#" + PALETTES.hover[palette1] + PALETTES.hover[palette2] + PALETTES.hover[palette3]);

	// work around the cache
	for (const btn of document.getElementsByClassName("cell")) {
		btn.disabled = true;
	}
}

function startGame(botFirst) {
	document.getElementById("popup-start").style.display = "none";

	board = Array(9).fill(NONE);

	if (botFirst) {
		botTurn();
	} else {
		playerTurn();
	}
}

function botTurn() {
	let cell = optimal();

	board[cell] = BOT;
	getCell(cell).innerHTML = drawCircle();

	if (!gameEnd()) {
		playerTurn();
	}
}

function playerTurn() {
	for (let i=0; i<9; i++) {
		getCell(i).disabled = Boolean(board[i]);
	}
}

function playOn(cell) {
	board[cell] = PLAYER;
	getCell(cell).innerHTML = drawCross();

	for (let i=0; i<9; i++) {
		getCell(i).disabled = true;
	}

	if (!gameEnd()) {
		botTurn();
	}
}

function drawCross() {
	return '<svg with="100mm" height="100mm" viewbox="0 0 100 100">'
		+  '<g style="stroke:black;stroke-width:4;fill:none">'
		+  '<path d="M ' + randomInt(70, 85) + ',' + randomInt(70, 85)
		+  ' L ' + randomInt(15, 30) + ',' + randomInt(15, 30)
		+  ' ' + randomInt(15, 30) + ',' + randomInt(70, 85)
		+  ' ' + randomInt(70, 85) + ',' + randomInt(15, 30)
		+  '" /></g></svg>';
}

function drawCircle() {
	let m = (a, b) => Math.floor((a + b ) / 2)
	let xa = randomInt(70, 85);	let ya = randomInt(15, 30);
	let xb = randomInt(85, 95);	let yb = randomInt(45, 55);
	let xc = randomInt(45, 55);	let yc = randomInt(85, 95);
	let xd = randomInt(5, 15);	let yd = randomInt(45, 55);
	let xe = randomInt(45, 55);	let ye = randomInt(5, 15);
	let xf = randomInt(70, 85);	let yf = randomInt(15, 30);
	return '<svg with="100mm" height="100mm" viewbox="0 0 100 100">'
		+  '<g style="stroke:black;stroke-width:4;fill:none">'
		+  '<path d="M ' + xa + ',' + ya
		+  ' Q ' + xb + ',' + yb
		+  ' ' + m(xb, xc) + ',' + m(yb, yc)
		+  ' ' + xc + ',' + yc
		+  ' ' + m(xc, xd) + ',' + m(yc, yd)
		+  ' ' + xd + ',' + yd
		+  ' ' + m(xd, xe) + ',' + m(yd, ye)
		+  ' ' + xe + ',' + ye
		+  ' ' + xf + ',' + yf
		+  '" /></g></svg>';
}

function optimal() {
	var rewards = Array(9).fill(-2);

	for (const c of available(board)) {
		let new_board = [...board];
		new_board[c] = BOT;
		rewards[c] = simulation_player(new_board);
	}

	console.log(rewards);

	var best = undefined;
	var bestReward = -1;
	for (let i=0; i<9; i++) {
		if (rewards[i] > bestReward) {
			best = [i];
			bestReward = rewards[i];
		} else if (rewards[i] == bestReward) {
			best.push(i);
		}
	}
	
	return best[Math.floor(Math.random()*best.length)];
}

function* available(b) {
	for (let i=0; i<9; i++) {
		if (b[i] == NONE) {
			yield i;
		}
	}
}

function simulation_player(b) {
	var reward = 0;
	var a = 0;

	switch (status(b, false)) {
		case STATUS_PLAYER_WIN: return LOOSE_REWARD;
		case STATUS_BOT_WIN: return WIN_REWARD;
		case STATUS_DRAW: return DRAW_REWARD;
	}

	for (const c of available(b)) {
		let new_board = [...b];
		new_board[c] = PLAYER;

		reward += simulation_bot(new_board);
		a++;
	}

	return reward / a;
}

function simulation_bot(b) {
	var reward = 0;
	var a = 0;

	switch (status(b, false)) {
		case STATUS_PLAYER_WIN: return LOOSE_REWARD;
		case STATUS_BOT_WIN: return WIN_REWARD;
		case STATUS_DRAW: return DRAW_REWARD;
	}

	for (const c of available(b)) {
		let new_board = [...b];
		new_board[c] = BOT;

		reward += simulation_player(new_board);
		a++;
	}

	return reward / a;
}

function status(b, hl) {
	for (const p of [PLAYER, BOT]) {
		// rows
		for (let i=0; i<9; i+=3) {
			if ((b[i] == p) && (b[i+1] == p) && (b[i+2] == p)) {
				if (hl) highlight([i, i+1, i+2]);
				return p;
			}
		}

		// columns
		for (let i=0; i<3; i++) {
			if ((b[i] == p) && (b[i+3] == p) && (b[i+6] == p)) {
				if (hl) highlight([i, i+3, i+6]);
				return p;
			}
		}

		// diagonals
		if ((b[0] == p) && (b[4] == p) && (b[8] == p)) {
			if (hl) highlight([0, 4, 8]);
			return p;
		}
		if ((b[2] == p) && (b[4] == p) && (b[6] == p)) {
			if (hl) highlight([2, 4, 6]);
			return p;
		}		
	}

	// draw test
	for (let i=0; i<9; i++) {
		if (b[i] == NONE) {
			return STATUS_NOT_ENDED;
		}
	}

	return STATUS_DRAW;
}

function gameEnd() {
	switch (status(board, false)) {
		case STATUS_NOT_ENDED: return false;
		case STATUS_DRAW: drawScreen(); return true;
		case STATUS_BOT_WIN: looseScreen(); return true;
		case STATUS_PLAYER_WIN: winScreen(); return true;
	}
}

function drawScreen() {
	status(board, true);
	document.getElementById("span-end").innerText = "Draw …";
	document.getElementById("popup-end").style.display = "block";
}

function looseScreen() {
	status(board, true);
	document.getElementById("span-end").innerText = "You lost !";
	document.getElementById("popup-end").style.display = "block";
}

function winScreen() {
	status(board, true);
	document.getElementById("span-end").innerText = "You won !";
	document.getElementById("popup-end").style.display = "block";
}

function highlight(cells) {
	for (const c of cells) {
		getCell(c).classList.add("highlighted");
	}
}
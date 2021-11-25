const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const fpsInterval = 1000 / 60;
var then = Date.now();

var renderParticles;
var gameStart = false;
var playerDeath = false;
var titleScreenOp = 0.2;
var playHovering = false;
var playGlow = 0;
var subheader = "By DkeRee";
const shake = {
	shake: false,
	magnitude: 0
};

const startFx = new Audio("audio/spawn.mp3");
const bounce = new Audio("audio/bounce.wav");
const deathFx = new Audio("audio/death.wav");

function getMousePos(event){
	const rect = canvas.getBoundingClientRect();
	return {
		x: (event.pageX - rect.left) / 2,
		y: (event.clientY - rect.top) / 2
	};
}

function isInside(pos, rect){
	return pos.x > rect.x && pos.x < rect.x + rect.width * 2.2 && pos.y < rect.y + rect.height / 2 && pos.y > rect.y;
}

function quake(ms, magnitude){
	shake.shake = true;
	shake.magnitude = magnitude;

	setTimeout(() => {
		shake.shake = false;
	}, ms);
}

canvas.width = 400;
canvas.height = 300;

class Enemy {
	constructor(x, y, xDir, yDir) {
		this.x = x;
		this.y = y;
		this.xDir = xDir;
		this.yDir = yDir;
		this.width = 65;
		this.height = 65;
		this.color = "#F04747";
	}

	update() {
		const padding = this.width;
		if (this.x + padding >= canvas.width || this.x <= 0){
			bounce.play();
			bounce.currentTime = 0;
			this.xDir *= -1;
			quake(200, 8);
		}
		if (this.y + padding >= canvas.height || this.y <= 0){
			bounce.play();
			bounce.currentTime = 0;
			this.yDir *= -1;
			quake(200, 8);
		}

		this.x += this.xDir;
		this.y += this.yDir;
	}

	render() {
		ctx.shadowBlur = 10;
		ctx.shadowColor = this.color;
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.color;
		ctx.strokeRect(this.x, this.y, this.width, this.height);
	}
}

const player = {
	score: 0,
	x: canvas.width / 2,
	y: canvas.height / 2,
	amountX: 0,
	amountY: 0,
	width: 30,
	height: 30,
	keys: {},
	color: "#7289DA",
	death: function(){
		const particles = [];
		const playerX = this.x + this.width / 2;
		const playerY = this.y + this.height / 2;
		const color = this.color;

		class Particle {
			constructor() {
				this.x = playerX;
				this.y = playerY;
				this.width = 3;
				this.height = 3;
				this.xDir = Math.random() < 0.5 ? Math.random() * 10 : -Math.random() * 10;
				this.velocity = Math.random() * 5;
			}

			update(i) {
				this.velocity -= 0.3;

				this.x += this.xDir;
				this.y -= this.velocity;

				if (this.y > canvas.height) particles.splice(i, 1);
			}

			render(i) {
				this.update(i);

				ctx.shadowBlur = 10;
				ctx.shadowColor = color;
				ctx.fillStyle = color;
				ctx.fillRect(this.x, this.y, this.width, this.height);
			}
		}

		for (var i = 0; i < 50; i++){
			particles.push(new Particle());
		}

		ctx.clearRect(this.x, this.y, this.width + 10, this.height + 10);

		return function(){
			for (var i = 0; i < particles.length; i++){
				particles[i].render(i);
			}
			return function(){
				return particles.length;
			}
		}
	},
	reset: function(){
		this.score = 0;
		this.x = canvas.width / 2;
		this.y = canvas.height / 2;
		this.amountX = 0;
		this.amountY = 0;
		this.keys = {};
	},
	update: function(){
		this.score++;

		if (this.amountX !== 0) this.amountX > 0 ? this.amountX = Math.round(10 * (this.amountX - 0.1)) / 10 : this.amountX = Math.round(10 * (this.amountX + 0.1)) / 10;
		if (this.amountY !== 0) this.amountY > 0 ? this.amountY = Math.round(10 * (this.amountY - 0.1)) / 10 : this.amountY = Math.round(10 * (this.amountY + 0.1)) / 10;

		if (this.keys[87] || this.keys[38]) this.amountY = -3;
		if (this.keys[83] || this.keys[40]) this.amountY = 3;

		if (this.keys[68] || this.keys[39]) this.amountX = 3;
		if (this.keys[65] || this.keys[37]) this.amountX = -3;

		this.x += this.amountX;
		this.y += this.amountY;
	},
	render: function(){
		ctx.shadowBlur = 10;
		ctx.shadowColor = this.color;
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.color;
		ctx.strokeRect(this.x, this.y, this.width, this.height);
	}
};
var enemies = [new Enemy(300, 100, 3, 3), new Enemy(15, 200, -3, 3), new Enemy(35, 10, -3, -3)];

const play = {
	x: 157,
	y: 173,
	width: 40,
	height: 90
};

canvas.addEventListener("mousemove", e => {
	const mousePos = getMousePos(e);

	if (isInside(mousePos, play) && !gameStart){
		playHovering = true;
		canvas.style.cursor = "pointer";
	} else {
		playHovering = false;
		canvas.style.cursor = "auto";
	}
});

canvas.addEventListener("click", e => {
	const mousePos = getMousePos(e);
	if (isInside(mousePos, play) && !gameStart) start();
});

window.addEventListener("keydown", e => {
	player.keys[e.which] = true;
});

window.addEventListener("keyup", e => {
	delete player.keys[e.which];
});

window.onblur = function(){
	player.keys = {};
};

function start(){
	startFx.play();
	startFx.currentTime = 0;
	player.reset();
	enemies = [new Enemy(300, 100, 3, 3), new Enemy(15, 200, -3, 3), new Enemy(35, 10, -3, -3)];
	gameStart = true;
}

function death(){
	gameStart = false;
	ctx.restore();
	playerDeath = true;
	renderParticles = player.death();
	quake(500, 20);

	subheader = `Final Score: ${player.score}`;
}

function step(){
	var now = Date.now();
	var elapsed = now - then;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	if (shake.shake){
		const xShake = Math.random() < 0.5 ? Math.random() * shake.magnitude : Math.random * -shake.magnitude;
		const yShake = Math.random() < 0.5 ? Math.random() * shake.magnitude : Math.random * -shake.magnitude;

		ctx.save();
		ctx.translate(xShake, yShake);
	}

	ctx.shadowBlur = 10;
	ctx.shadowColor = "#F04747";
	ctx.lineWidth = 3;
	ctx.strokeStyle = "#F04747";
	ctx.strokeRect(0, 0, canvas.width, canvas.height);

	ctx.font = "20px monospace";
	ctx.fillStyle = `rgba(255, 255, 255, ${(0.2 - titleScreenOp) * 10})`;
	ctx.textAlign = "right";
	ctx.fillText(player.score, canvas.width - 30, 30);

	for (var i = 0; i < enemies.length; i++){
		enemies[i].render();
	}
	if (gameStart) player.render();
	if (playerDeath){
		const renderer = renderParticles();
		if (renderer() == 0) playerDeath = false;
	}

	if (shake) ctx.restore();

	if (elapsed > fpsInterval && gameStart){
		then = now - (elapsed % fpsInterval);
		const padding = player.width;

		for (var i = 0; i < enemies.length; i++){
			enemies[i].update();

			if (player.x < enemies[i].x + enemies[i].width){
				if (player.x + player.width > enemies[i].x){
					if (player.y < enemies[i].y + enemies[i].height){
						if (player.y + player.height > enemies[i].y){
							deathFx.play();
							deathFx.currentTime = 0;
							death();
						}
					}
				}
			}
		}

		if (player.x + padding >= canvas.width || player.x <= 0){
			deathFx.play();
			deathFx.currentTime = 0;
			death();
		}
		if (player.y + padding >= canvas.height || player.y <= 0){
			deathFx.play();
			deathFx.currentTime = 0;
			death();
		}

		player.update();
	}

	if (gameStart && titleScreenOp > 0){
		titleScreenOp -= 0.01;
	} else if (!gameStart && titleScreenOp < 0.2){
		titleScreenOp += 0.01;
	}

	ctx.shadowBlur = 10;
	ctx.shadowColor = "#F04747";
	ctx.fillStyle = `rgba(0, 0, 0, ${titleScreenOp})`;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.shadowBlur = 10;
	ctx.shadowColor = "#F04747";
	ctx.fillStyle = `rgba(255, 255, 255, ${titleScreenOp * 10})`;
	ctx.font = "70px monospace";
	ctx.textAlign = "center";
	ctx.fillText("Boxgle", canvas.width / 2, 100);

	ctx.font = "30px monospace";
	ctx.fillText(subheader, canvas.width / 2, 150);

	ctx.shadowColor = 10;
	ctx.shadowColor = "#F04747";
	ctx.fillStyle = `rgba(255, 255, 255, ${titleScreenOp * 10})`;
	ctx.textAlign = "center";
	ctx.font = "30px monospace";
	ctx.fillText("PLAY", (canvas.width / 2) + 2, 202)

	if (playHovering && playGlow < 10){
		playGlow++;
	} else if (!playHovering && playGlow > 0){
		playGlow--;
	}

	ctx.shadowBlur = playGlow;
	ctx.shadowColor = "#7289DA";
	ctx.lineWidth = 3;
	ctx.strokeStyle = `rgba(114, 137, 218, ${titleScreenOp * 10})`;
	ctx.strokeRect(157, 173, 90, 40);

	requestAnimationFrame(step);
}

requestAnimationFrame(step);
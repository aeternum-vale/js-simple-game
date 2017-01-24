"use strict";

var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 600;

var LEFT_BUTTON = 37;
var UP_BUTTON = 38;
var RIGHT_BUTTON = 39;
var DOWN_BUTTON = 40;
var SHOOT_BUTTON = 17;

var GLOBAL_WIDTH = 2000;
var GLOBAL_HEIGHT = 2000;

var canvas = document.getElementsByTagName('canvas')[0];
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
var ctx = canvas.getContext('2d');


var pressedButtons = {};
var player = new Player();
var map = new Map();

var explosions = [];

window.onkeydown = function (e) {
	pressedButtons[e.keyCode] = true;
};

window.onkeyup = function (e) {
	delete pressedButtons[e.keyCode];
};

var prevTime = 0;
var fps = document.getElementById("fps");

setInterval(function () {
	update();
	draw();

	fps.textContent = (1000/(performance.now() - prevTime)).toFixed(2);
	prevTime = performance.now();

}, 40);

function clearScreen() {
	ctx.save();
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	ctx.restore();
}

function drawFrame() {
	ctx.save();

	ctx.beginPath();
	ctx.rect(0.5, 0.5, CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1);
	ctx.stroke();

	ctx.restore();
}


function draw() {
	clearScreen();
	map.draw();
	player.draw();

	for (var i = 0; i < explosions.length; i++)
		explosions[i].draw();

	drawFrame();
}

function update() {
	player.update();

	for (var i = 0; i < explosions.length; i++)
		if (explosions[i].update())
			explosions.splice(i--, 1);

	map.update();
}

function degToRad(angle) {
	return angle * Math.PI / 180;
}

function radToDeg(angle) {
	return angle * 180 / Math.PI;
}

function randomInteger(min, max) {
	var rand = min + Math.random() * (max - min);
	rand = Math.round(rand);
	return rand;
}

function Point(x, y) {
	this.x = x || 0;
	this.y = y || 0;

	this.offset = function (point) {
		this.x += point.x;
		this.y += point.y;
	};

}


function getLocalPositionByGlobal(localPosition, globalPosition) {
	var vagp = player.getVisibleAreaGlobalPosition();
	localPosition.x =  globalPosition.x - vagp.x;
	localPosition.y =  globalPosition.y - vagp.y;
}



function Player() {

	var RADIUS = 10;
	var DRAWING_LINE_WIDTH = 1;
	var BARREL_WIDTH_ANGLE = -70;
	var BARREL_LENGTH = 10;

	var BASE_RADIUS = RADIUS * 1.3;


	var ROTATION_SPEED = 8;
	var SHOOTING_ENERGY_AMOUNT = 15;


	var globalPosition = new Point(CANVAS_WIDTH/2, CANVAS_HEIGHT - RADIUS - DRAWING_LINE_WIDTH - BARREL_LENGTH);
	var localPosition = new Point();

	var p0 = new Point();
	var p1 = new Point();

	var angle = 0;

	var aim = new Aim();


	this.getVisibleAreaGlobalPosition = function() {
		return new Point(globalPosition.x - localPosition.x, globalPosition.y - localPosition.y);
	};

	var impulses = [];
	function Impulse (energyAmount, angle) {
		var REDUCE_RATE = .1;
		var energyStock = energyAmount;

		this.update = function () {

			energyStock -= REDUCE_RATE * energyStock;
			return energyStock >= 1;
		};

		this.getOffsetVector = function () {
			var length = energyStock;//MAX_SPEED * (energyStock/energyAmount);
			return new Point(length * Math.cos(degToRad(angle)), length * Math.sin(degToRad(angle)));
		};
	}


	var upButtonPressed = false;
	var downButtonPressed = false;
	var shootButtonPressed = false;

	var MAX_SPEED = 10;
	var SPEED_INCREASE_RATE = 1.3;
	var currentSpeed = 0;

	
	this.update = function () {

		if (pressedButtons[LEFT_BUTTON])
			angle -= ROTATION_SPEED;
			
		if (pressedButtons[RIGHT_BUTTON])
			angle += ROTATION_SPEED;

		angle %= 360;


		//shooting

		if (pressedButtons[SHOOT_BUTTON] && !shootButtonPressed) {
			shootButtonPressed = true;
			impulses.push(new Impulse(SHOOTING_ENERGY_AMOUNT, angle + 90));
			var aiml = aim.getLocalPosition();
			var vagp = this.getVisibleAreaGlobalPosition();

			explosions.push(new Explosion(new Point(aiml.x + vagp.x, aiml.y + vagp.y)));
		}

		if (!pressedButtons[SHOOT_BUTTON]) {
			shootButtonPressed = false;
		}


		//moving


		if (pressedButtons[UP_BUTTON] || pressedButtons[DOWN_BUTTON]) {
			if (currentSpeed == 0)
				currentSpeed = 1;
			else
				currentSpeed *= SPEED_INCREASE_RATE;

			if (currentSpeed > MAX_SPEED)
				currentSpeed = MAX_SPEED;
		}

		if (pressedButtons[UP_BUTTON]) {
			upButtonPressed = true;

			globalPosition.x += currentSpeed * Math.cos(degToRad(angle - 90));
			globalPosition.y += currentSpeed * Math.sin(degToRad(angle - 90));
		}

		if (pressedButtons[DOWN_BUTTON]) {
			downButtonPressed = true;

			globalPosition.x += currentSpeed * Math.cos(degToRad(angle + 90));
			globalPosition.y += currentSpeed * Math.sin(degToRad(angle + 90));
		}

		if (!pressedButtons[UP_BUTTON] && upButtonPressed) {
			upButtonPressed = false;
			impulses.push(new Impulse(currentSpeed, angle - 90));
			currentSpeed = 0;
		}

		if (!pressedButtons[DOWN_BUTTON] && downButtonPressed) {
			downButtonPressed = false;
			impulses.push(new Impulse(currentSpeed, angle + 90));
			currentSpeed = 0;
		}

		


		//impulses


		for (var i = 0; i < impulses.length; i++) {
			globalPosition.offset(impulses[i].getOffsetVector());

			if (!impulses[i].update())
				impulses.splice(i--, 1);
		}


		//collisions

		


		//getting local coords

		if (globalPosition.x > CANVAS_WIDTH/2 && globalPosition.x < GLOBAL_WIDTH - CANVAS_WIDTH/2) {
			localPosition.x = CANVAS_WIDTH/2;
		} else {
			if (globalPosition.x <= CANVAS_WIDTH/2)
				localPosition.x = globalPosition.x;
			else
				localPosition.x = globalPosition.x - (GLOBAL_WIDTH - CANVAS_WIDTH);
		}

		if (globalPosition.y > CANVAS_HEIGHT/2 && globalPosition.y < GLOBAL_HEIGHT - CANVAS_HEIGHT/2) {
			localPosition.y = CANVAS_HEIGHT/2;
		} else {
			if (globalPosition.y <= CANVAS_HEIGHT/2)
				localPosition.y = globalPosition.y;
			else
				localPosition.y = globalPosition.y - (GLOBAL_HEIGHT - CANVAS_HEIGHT);
		}

		p0.x = RADIUS * Math.cos(degToRad(BARREL_WIDTH_ANGLE));
		p0.y = RADIUS * Math.sin(degToRad(BARREL_WIDTH_ANGLE));
		p1.x = RADIUS * Math.cos(Math.PI - degToRad(BARREL_WIDTH_ANGLE));
		p1.y = RADIUS * Math.sin(Math.PI - degToRad(BARREL_WIDTH_ANGLE));


		aim.update();
	};


	
	this.draw = function () {
		ctx.save();

		ctx.translate(localPosition.x, localPosition.y);
		ctx.rotate(degToRad(angle));

		ctx.lineWidth = DRAWING_LINE_WIDTH;
		ctx.fillStyle = "#ccc";

		ctx.beginPath();

		ctx.rect(-BASE_RADIUS, -BASE_RADIUS, BASE_RADIUS * 2, BASE_RADIUS * 2);
		ctx.fill();
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(p0.x, p0.y - BARREL_LENGTH);
		ctx.lineTo(p0.x, p0.y);
		ctx.arc(0, 0, RADIUS, degToRad(BARREL_WIDTH_ANGLE), Math.PI - degToRad(BARREL_WIDTH_ANGLE) );
		ctx.lineTo(p1.x, p1.y - BARREL_LENGTH);
		ctx.closePath();

		ctx.fill();
		ctx.stroke();

		ctx.restore();

		aim.draw();

	};


	function Aim() {

		var AIM_DIST = 150;
		var AIM_RADIUS = 10;
		var AIM_SMALL_RADIUS = AIM_RADIUS * .6;
		var AIM_ROTATION_SPEED = 10;
		var ALPHA = 15;


		var aimLocalPosition = new Point();
		var aimAngle = 0;

		this.getLocalPosition = function () {
			return aimLocalPosition;
		};

		this.draw = function() {
			ctx.save();


			ctx.lineWidth = 2;
			ctx.fillStyle = "#ccc";
			ctx.lineCap = "round";

			ctx.translate(aimLocalPosition.x, aimLocalPosition.y);

			ctx.beginPath();
			ctx.arc(0, 0, AIM_SMALL_RADIUS, 0, Math.PI * 2);
			ctx.stroke();


			ctx.rotate(degToRad(aimAngle));

			for (var i = 0; i < 4; i++) {
				ctx.beginPath();
				ctx.arc(0, 0, AIM_RADIUS, degToRad(-ALPHA + 90 * i), degToRad(ALPHA + 90 * i));
				ctx.stroke();
			}

			ctx.restore();
		};


		this.update = function() {
			aimLocalPosition.x = localPosition.x + AIM_DIST * Math.cos(degToRad(angle - 90));
			aimLocalPosition.y = localPosition.y + AIM_DIST * Math.sin(degToRad(angle - 90));


			aimAngle -= AIM_ROTATION_SPEED;
			aimAngle %= 360;

		};
	}

}


function Explosion(globalPosition) {

	var LIFETIME = 15;
	var MAX_RADIUS = 100;

	var currentFrame = 0;
	var currentRadius;
	var glowOpacity = 1;
	var participleOpacity = 1;




	var localPosition = new Point();


	var participles = [];

	var fbAmount = randomInteger(10, 20);
	for (var i = 0; i < fbAmount; i++)
		participles.push(new Participle( Math.random() * 360 / fbAmount + i * 360 / fbAmount, Math.random() * 4 + 6,
			Math.random() * 2 + 1));

	var fbAmount = randomInteger(50, 90);
	for (var i = 0; i < fbAmount; i++)
		participles.push(new Participle( Math.random() * 360 / fbAmount + i * 360 / fbAmount, Math.random() * 4 + 1,
			Math.random() * 6 + 3));


	var textGlowColor;
	var startGlowColor = new HSLColor(34, 93, 51);
	var currentGlowColor = new HSLColor();
	var endGlowColor = new HSLColor(7, 100, 9);


	this.update = function() {

		getLocalPositionByGlobal(localPosition, globalPosition);
		currentRadius = MAX_RADIUS * currentFrame/LIFETIME;


		var GLOW_OPACITY_BORDER = .7;
		var PARTICIPLE_OPACITY_BORDER = .5;

		if  (currentFrame/LIFETIME >= GLOW_OPACITY_BORDER)
			glowOpacity = 1 - ((currentFrame/LIFETIME - GLOW_OPACITY_BORDER) * (1/(1 - GLOW_OPACITY_BORDER)));

		if  (currentFrame/LIFETIME >= PARTICIPLE_OPACITY_BORDER)
			participleOpacity = 1 - ((currentFrame/LIFETIME - PARTICIPLE_OPACITY_BORDER) *
				(1/(1 - PARTICIPLE_OPACITY_BORDER)));


		for (var i = 0; i < participles.length; i++)
			participles[i].update();


		if (currentFrame++ >= LIFETIME)
			return true;

	};

	this.draw = function() {
		// ctx.save();
		// ctx.fillStyle = "#F4FA58";
		// ctx.globalAlpha = glowOpacity;
		// ctx.translate(localPosition.x, localPosition.y);
		// ctx.beginPath();
		// ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
		// //ctx.fill();
		// ctx.lineWidth = 15 * glowOpacity;
		// ctx.strokeStyle = "yellow";
		// ctx.stroke();
		// ctx.restore();

		currentGlowColor.h = getTransitionalValue(startGlowColor.h, endGlowColor.h, currentFrame/LIFETIME);
		currentGlowColor.s = getTransitionalValue(startGlowColor.s, endGlowColor.s, currentFrame/LIFETIME);
		currentGlowColor.l = getTransitionalValue(startGlowColor.l, endGlowColor.l, currentFrame/LIFETIME);
		textGlowColor = currentGlowColor.getStr(glowOpacity);


		for (var i = 0; i < participles.length; i++)
			participles[i].drawGlow();

		for (var i = 0; i < participles.length; i++)
			participles[i].drawParticiple();

	};



	function getTransitionalValue(start, end, percent) {
		var shift = Math.abs(start - end) * percent;

		if (start < end)
			return start + shift;
		else
			return start - shift;
	}

	function Participle(angle, speed, radius) {

		var maxSpeed = speed || 5;
		radius = radius || 5;

		var curSpeed = 0;

		var fbGlobalPosition = new Point(globalPosition.x, globalPosition.y);
		var localPosition = new Point();

		this.update = function() {

			curSpeed = Math.cos(Math.PI/2 * currentFrame/LIFETIME) * maxSpeed;

			fbGlobalPosition.x += curSpeed * Math.cos(degToRad(angle));
			fbGlobalPosition.y += curSpeed * Math.sin(degToRad(angle));

			getLocalPositionByGlobal(localPosition, fbGlobalPosition);

		};



		this.drawGlow = function () {
			ctx.save();

			ctx.globalAlpha = glowOpacity;

			ctx.shadowBlur = 10;
			ctx.shadowColor = textGlowColor;
			ctx.fillStyle = textGlowColor;

			ctx.beginPath();

			ctx.arc(localPosition.x, localPosition.y, radius, 0, Math.PI * 2);
			ctx.fill();


			ctx.restore();
		};



		this.drawParticiple = function() {
			ctx.save();

			ctx.globalAlpha = participleOpacity;
			ctx.fillStyle = "white";

			ctx.beginPath();
			ctx.arc(localPosition.x, localPosition.y, radius, 0, Math.PI * 2);
			ctx.fill();

			ctx.restore();
		};
	}
}

function Map() {

	var SEGMENT_SIZE = 100;
	var startPoint = new Point();


	this.update = function () {
		var vagp = player.getVisibleAreaGlobalPosition();

		startPoint.x = SEGMENT_SIZE - (vagp.x % SEGMENT_SIZE);
		startPoint.y = SEGMENT_SIZE - (vagp.y % SEGMENT_SIZE);
	};

	this.draw = function () {
		ctx.save();

		ctx.strokeStyle = "#ddd";
		ctx.lineWidth = 1;

		ctx.beginPath();

		for (var i = 0; i < CANVAS_WIDTH / SEGMENT_SIZE; i++) {
			ctx.moveTo(startPoint.x + i * SEGMENT_SIZE, 0);
			ctx.lineTo(startPoint.x + i * SEGMENT_SIZE, CANVAS_HEIGHT);

			ctx.moveTo(0, startPoint.y + i * SEGMENT_SIZE);
			ctx.lineTo(CANVAS_WIDTH, startPoint.y + i * SEGMENT_SIZE);
		}

		ctx.stroke();
		ctx.restore();
	};
}

function HSLColor (h, s, l) {
	this.h = h || 0;
	this.s = s || 0;
	this.l = l || 0;

	this.getStr = function (alpha) {
		return "hsla(" + this.h + "," + this.s + "%," + this.l + "%," + alpha.toFixed(2) + ")";
	};
}
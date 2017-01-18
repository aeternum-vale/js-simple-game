"use strict";

var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 600;

var LEFT_BUTTON = 37;
var UP_BUTTON = 38;
var RIGHT_BUTTON = 39;
var DOWN_BUTTON = 40;

var GLOBAL_WIDTH = 2000;
var GLOBAL_HEIGHT = 2000;


var canvas = document.getElementsByTagName('canvas')[0];
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
var ctx = canvas.getContext('2d');


var pressedButtons = {};
var player = new Player();
var map = new Map();

window.onkeydown = function (e) {
	pressedButtons[e.keyCode] = true;
};

window.onkeyup = function (e) {
	pressedButtons[e.keyCode] = false;
};

setInterval(function () {
	update();
	draw();
}, 40);

function clearScreen() {
	ctx.save();
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	ctx.restore();
}

function drawFrame() {
	ctx.save();

	ctx.rect(0.5, 0.5, CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1);
	ctx.stroke();

	ctx.restore();
}


function draw() {
	clearScreen();
	map.draw();
	player.draw();
	drawFrame();
}

function update() {
	player.update();
	map.update();
}

function degToRad(angle) {
	return angle * Math.PI / 180;
}

function radToDeg(angle) {
	return angle * 180 / Math.PI;
}

function Point(x, y) {
	this.x = x || 0;
	this.y = y || 0;

	/*this.offset = function (point) {
		this.x += point.x;
		this.y += point.y;
	};*/
	
}

function Player() {

	var RADIUS = 10;
	var LINE_WIDTH = 1;
	var ALPHA = -70; //DEGREES
	var BARREL_LENGTH = 10;

	var BASE_RADIUS = RADIUS * 1.3;

	var SPEED = 10;
	var ROTATION_SPEED = 8;

	var globalPosition = new Point(CANVAS_WIDTH/2, CANVAS_HEIGHT - RADIUS - LINE_WIDTH - BARREL_LENGTH);
	var localPosition = new Point();

	var p0 = new Point();
	var p1 = new Point();

	var angle = 0; //DEGREES


	var energyAmount = 15;
	var energyStock = 0;
	var lastAngle = 0;

	var aim = new Aim();

	this.setAngle = function(_angle) {
		angle = _angle;
	};
	
	this.getAngle = function() {
		return angle;
	};


	this.getGlobalPosition = function() {
		return globalPosition;
	};

	this.getLocalPosition = function() {
		return localPosition;
	};

	this.update = function () {

		if (pressedButtons[LEFT_BUTTON])
			angle -= ROTATION_SPEED;
			
		if (pressedButtons[RIGHT_BUTTON])
			angle += ROTATION_SPEED;

		angle %= 360;
			
		if (pressedButtons[UP_BUTTON]) {
			energyStock = energyAmount;
			lastAngle = angle;

			globalPosition.x += SPEED * Math.cos(degToRad(angle - 90));
			globalPosition.y += SPEED * Math.sin(degToRad(angle - 90));
		}

		if (pressedButtons[DOWN_BUTTON]) {
			energyStock = energyAmount;
			lastAngle = angle + 180;

			globalPosition.x -= SPEED * Math.cos(degToRad(angle - 90));
			globalPosition.y -= SPEED * Math.sin(degToRad(angle - 90));
		}

		if (!pressedButtons[UP_BUTTON] && !pressedButtons[DOWN_BUTTON])
		if (energyStock > 0) {
			globalPosition.x += SPEED * (energyStock/energyAmount) * Math.cos(degToRad(lastAngle - 90));
			globalPosition.y += SPEED * (energyStock/energyAmount) * Math.sin(degToRad(lastAngle - 90));
			energyStock--;
		}

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

		p0.x = RADIUS * Math.cos(degToRad(ALPHA));

		p0.y = RADIUS * Math.sin(degToRad(ALPHA));
		p1.x = RADIUS * Math.cos(Math.PI - degToRad(ALPHA));
		p1.y = RADIUS * Math.sin(Math.PI - degToRad(ALPHA));


		aim.update();
	};


	
	this.draw = function () {
		ctx.save();

		ctx.translate(localPosition.x, localPosition.y);
		ctx.rotate(degToRad(angle));

		ctx.lineWidth = LINE_WIDTH;
		ctx.fillStyle = "#ccc";

		ctx.beginPath();

		ctx.rect(-BASE_RADIUS, -BASE_RADIUS, BASE_RADIUS * 2, BASE_RADIUS * 2);
		ctx.fill();
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(p0.x, p0.y - BARREL_LENGTH);
		ctx.lineTo(p0.x, p0.y);
		ctx.arc(0, 0, RADIUS, degToRad(ALPHA), Math.PI - degToRad(ALPHA) );
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

		var coords = new Point();
		var aimAngle = 0;

		this.draw = function() {
			ctx.save();
			var alpha = 15;
			var beta = 50;

			ctx.lineWidth = 2;
			ctx.fillStyle = "#ccc";
			ctx.lineCap = "round";

			ctx.translate(coords.x, coords.y);

			ctx.beginPath();
			ctx.arc(0, 0, AIM_SMALL_RADIUS, 0, Math.PI * 2);
			ctx.stroke();


			ctx.rotate(degToRad(aimAngle));

			for (var i = 0; i < 4; i++) {
				ctx.beginPath();
				ctx.arc(0, 0, AIM_RADIUS, degToRad(-alpha + 90 * i), degToRad(alpha + 90 * i));
				ctx.stroke();
			}

			ctx.restore();
		};


		this.update = function() {
			coords.x = localPosition.x + AIM_DIST * Math.cos(degToRad(angle - 90));
			coords.y = localPosition.y + AIM_DIST * Math.sin(degToRad(angle - 90));


			aimAngle -= AIM_ROTATION_SPEED;
			aimAngle %= 360;

		};
	}


}

function Map() {

	var SEGMENT_SIZE = 100;
	var startPoint = new Point();


	this.update = function () {
		var g = player.getGlobalPosition();
		var l = player.getLocalPosition();

		startPoint.x = SEGMENT_SIZE - ((g.x - l.x) % SEGMENT_SIZE);
		startPoint.y = SEGMENT_SIZE - ((g.y - l.y) % SEGMENT_SIZE);
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
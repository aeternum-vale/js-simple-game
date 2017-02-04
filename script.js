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


var canvas;
var ctx;

var pressedButtons;
var player;
var enemy;
var map;
var explosions;

var prevTime;
var fps;


function init(){
    canvas = document.getElementsByTagName('canvas')[0];
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');


    pressedButtons = {};
    player = new Player();
    enemy = new Enemy();
    map = new Map();
    explosions = [];

    prevTime = 0;
    fps = document.getElementById("fps");

    window.onkeydown = function (e) {
        pressedButtons[e.keyCode] = true;
    };

    window.onkeyup = function (e) {
        delete pressedButtons[e.keyCode];
    };


    setInterval(function () {
        update();
        draw();

        fps.textContent = (1000 / (performance.now() - prevTime)).toFixed(2);
        prevTime = performance.now();

    }, 40);
}


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
    enemy.draw();

    for (var i = 0; i < explosions.length; i++)
        explosions[i].draw();

    drawFrame();
}

function update() {
    player.update();
    enemy.update();


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
    localPosition.x = globalPosition.x - vagp.x;
    localPosition.y = globalPosition.y - vagp.y;
}

function Impulse(energyAmount, angle) {
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



function Machine() {
    this._globalPosition = new Point();
    this._localPosition = new Point();
    this._angle = 0;
    this._impulses = [];
    this._currentSpeed = 0;
}

Machine.prototype.RADIUS = 10;
Machine.prototype.DRAWING_LINE_WIDTH = 1;
Machine.prototype.BASE_RADIUS = 13;
Machine.prototype.SHOOTING_ENERGY_AMOUNT = 15;
Machine.prototype.ROTATION_SPEED = 8;

Machine.prototype._updateImpulses = function () {
    for (var i = 0; i < this._impulses.length; i++) {
        this._globalPosition.offset(this._impulses[i].getOffsetVector());

        if (!this._impulses[i].update())
            this._impulses.splice(i--, 1);
    }
};


Machine.prototype.update = function () {

};
Machine.prototype.draw = function () {

};






Enemy.prototype = Object.create(Machine.prototype);
Enemy.prototype.constructor = Enemy;

function Enemy() {
    Machine.apply(this, arguments);
    this._globalPosition = new Point(440, 440);
}


Enemy.prototype.update = function () {
    getLocalPositionByGlobal(this._localPosition, this._globalPosition);
};

Enemy.prototype.draw = function () {

    ctx.save();

    ctx.translate(this._localPosition.x, this._localPosition.y);
    ctx.rotate(degToRad(this._angle));

    ctx.lineWidth = this.DRAWING_LINE_WIDTH;
    ctx.fillStyle = "#BADA55";
    ctx.strokeStyle = "#000";

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.RADIUS * 1.5, this.RADIUS);
    ctx.lineTo(this.RADIUS * 2, 0);
    ctx.lineTo(this.RADIUS * 1.9, this.RADIUS * 1.75);
    ctx.lineTo(0, this.RADIUS * 1.5);

    ctx.lineTo(-this.RADIUS * 1.9, this.RADIUS * 1.75);
    ctx.lineTo(-this.RADIUS * 2, 0);
    ctx.lineTo(-this.RADIUS * 1.5, this.RADIUS);

    ctx.closePath();
    ctx.fill();
    ctx.stroke();


    ctx.beginPath();
    ctx.moveTo(-this.RADIUS, 0);
    ctx.quadraticCurveTo(-this.RADIUS, this.RADIUS, 0, this.RADIUS * 2);
    ctx.quadraticCurveTo(this.RADIUS, this.RADIUS, this.RADIUS, 0);
    ctx.arc(0, 0, this.RADIUS, 0, -Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();


    ctx.restore();
};





Player.prototype = Object.create(Machine.prototype);
Player.prototype.constructor = Player;

function Player() {

    Machine.apply(this, arguments);

    this._globalPosition = new Point(CANVAS_WIDTH / 2, CANVAS_HEIGHT - this.RADIUS - this.DRAWING_LINE_WIDTH - this.BARREL_LENGTH);

    this._p0 = new Point();
    this._p1 = new Point();
    this._aim = new Aim();

    this._upButtonPressed = false;
    this._downButtonPressed = false;
    this._shootButtonPressed = false;

}

Player.prototype.BARREL_WIDTH_ANGLE = -70;
Player.prototype.BARREL_LENGTH = 10;
Player.prototype.MAX_SPEED = 10;
Player.prototype.SPEED_INCREASE_RATE = 1.3;

Player.prototype.getVisibleAreaGlobalPosition = function () {
    return new Point(this._globalPosition.x -  this._localPosition.x,  this._globalPosition.y - this._localPosition.y);
};

Player.prototype.getLocalPosition = function () {
    return this._localPosition;
};

Player.prototype.getAngle = function () {
    return this._angle;
};




Player.prototype.update = function () {

    if (pressedButtons[LEFT_BUTTON])
        this._angle -= this.ROTATION_SPEED;

    if (pressedButtons[RIGHT_BUTTON])
        this._angle += this.ROTATION_SPEED;

    this._angle %= 360;

    //shooting

    if (pressedButtons[SHOOT_BUTTON] && !this._shootButtonPressed) {
        this._shootButtonPressed = true;
        this._impulses.push(new Impulse(this.SHOOTING_ENERGY_AMOUNT, this._angle + 90));
        var aiml = this._aim.getLocalPosition();
        var vagp = this.getVisibleAreaGlobalPosition();

        explosions.push(new Explosion(new Point(aiml.x + vagp.x, aiml.y + vagp.y)));
    }

    if (!pressedButtons[SHOOT_BUTTON]) {
        this._shootButtonPressed = false;
    }

    //moving

    if (pressedButtons[UP_BUTTON] || pressedButtons[DOWN_BUTTON]) {
        if (this._currentSpeed == 0)
            this._currentSpeed = 1;
        else
            this._currentSpeed *= this.SPEED_INCREASE_RATE;

        if (this._currentSpeed > this.MAX_SPEED)
            this._currentSpeed = this.MAX_SPEED;
    }

    if (pressedButtons[UP_BUTTON]) {
        this._upButtonPressed = true;

        this._globalPosition.x += this._currentSpeed * Math.cos(degToRad(this._angle - 90));
        this._globalPosition.y += this._currentSpeed * Math.sin(degToRad(this._angle - 90));
    }

    if (pressedButtons[DOWN_BUTTON]) {
        this._downButtonPressed = true;

        this._globalPosition.x += this._currentSpeed * Math.cos(degToRad(this._angle + 90));
        this._globalPosition.y += this._currentSpeed * Math.sin(degToRad(this._angle + 90));
    }

    if (!pressedButtons[UP_BUTTON] && this._upButtonPressed) {
        this._upButtonPressed = false;
        this._impulses.push(new Impulse(this._currentSpeed, this._angle - 90));
        this._currentSpeed = 0;
    }

    if (!pressedButtons[DOWN_BUTTON] && this._downButtonPressed) {
        this._downButtonPressed = false;
        this._impulses.push(new Impulse(this._currentSpeed, this._angle + 90));
        this._currentSpeed = 0;
    }

    //impulses

    this._updateImpulses();

    //collisions

    //getting local coords

    if (this._globalPosition.x > CANVAS_WIDTH / 2 && this._globalPosition.x < GLOBAL_WIDTH - CANVAS_WIDTH / 2) {
        this._localPosition.x = CANVAS_WIDTH / 2;
    } else {
        if (this._globalPosition.x <= CANVAS_WIDTH / 2)
            this._localPosition.x = this._globalPosition.x;
        else
            this._localPosition.x = this._globalPosition.x - (GLOBAL_WIDTH - CANVAS_WIDTH);
    }

    if (this._globalPosition.y > CANVAS_HEIGHT / 2 && this._globalPosition.y < GLOBAL_HEIGHT - CANVAS_HEIGHT / 2) {
        this._localPosition.y = CANVAS_HEIGHT / 2;
    } else {
        if (this._globalPosition.y <= CANVAS_HEIGHT / 2)
            this._localPosition.y = this._globalPosition.y;
        else
            this._localPosition.y = this._globalPosition.y - (GLOBAL_HEIGHT - CANVAS_HEIGHT);
    }

    this._p0.x = this.RADIUS * Math.cos(degToRad(this.BARREL_WIDTH_ANGLE));
    this._p0.y = this.RADIUS * Math.sin(degToRad(this.BARREL_WIDTH_ANGLE));
    this._p1.x = this.RADIUS * Math.cos(Math.PI - degToRad(this.BARREL_WIDTH_ANGLE));
    this._p1.y = this.RADIUS * Math.sin(Math.PI - degToRad(this.BARREL_WIDTH_ANGLE));

    this._aim.update();
};




Player.prototype.draw = function () {

    ctx.save();

    ctx.translate(this._localPosition.x, this._localPosition.y);
    ctx.rotate(degToRad(this._angle));

    ctx.lineWidth = this.DRAWING_LINE_WIDTH;
    ctx.fillStyle = "#ccc";

    ctx.beginPath();

    ctx.rect(-this.BASE_RADIUS, -this.BASE_RADIUS, this.BASE_RADIUS * 2, this.BASE_RADIUS * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this._p0.x, this._p0.y - this.BARREL_LENGTH);
    ctx.lineTo(this._p0.x, this._p0.y);
    ctx.arc(0, 0, this.RADIUS, degToRad(this.BARREL_WIDTH_ANGLE), Math.PI - degToRad(this.BARREL_WIDTH_ANGLE));
    ctx.lineTo(this._p1.x, this._p1.y - this.BARREL_LENGTH);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    ctx.restore();

    this._aim.draw();
};


function Aim() {
    this._aimLocalPosition = new Point();
    this._aimAngle = 0;
    this._playerLocalPosition;
}

Aim.prototype.AIM_DIST = 150;
Aim.prototype.AIM_RADIUS = 10;
Aim.prototype.AIM_SMALL_RADIUS = Aim.prototype.AIM_RADIUS * .6;
Aim.prototype.AIM_ROTATION_SPEED = 10;
Aim.prototype.ALPHA = 15;

Aim.prototype.getLocalPosition = function () {
    return this._aimLocalPosition;
};

Aim.prototype.update = function () {
    if (!this._playerLocalPosition) this._playerLocalPosition = player.getLocalPosition();

    var pa = player.getAngle();

    this._aimLocalPosition.x = this._playerLocalPosition.x + this.AIM_DIST * Math.cos(degToRad(pa - 90));
    this._aimLocalPosition.y = this._playerLocalPosition.y + this.AIM_DIST * Math.sin(degToRad(pa - 90));


    this._aimAngle -= this.AIM_ROTATION_SPEED;
    this._aimAngle %= 360;
};

Aim.prototype.draw = function () {
    ctx.save();

    ctx.lineWidth = 2;
    ctx.fillStyle = "#ccc";
    ctx.lineCap = "round";

    ctx.translate(this._aimLocalPosition.x, this._aimLocalPosition.y);

    ctx.beginPath();
    ctx.arc(0, 0, this.AIM_SMALL_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(degToRad(this._aimAngle));

    for (var i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, this.AIM_RADIUS, degToRad(-this.ALPHA + 90 * i), degToRad(this.ALPHA + 90 * i));
        ctx.stroke();
    }

    ctx.restore();
};



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
        participles.push(new Participle(Math.random() * 360 / fbAmount + i * 360 / fbAmount, Math.random() * 4 + 6,
            Math.random() * 2 + 1));

    var fbAmount = randomInteger(50, 90);
    for (var i = 0; i < fbAmount; i++)
        participles.push(new Participle(Math.random() * 360 / fbAmount + i * 360 / fbAmount, Math.random() * 4 + 1,
            Math.random() * 6 + 3));

    var textGlowColor;
    var startGlowColor = new HSLColor(34, 93, 51);
    var currentGlowColor = new HSLColor();
    var endGlowColor = new HSLColor(7, 100, 9);

    this.update = function () {

        getLocalPositionByGlobal(localPosition, globalPosition);
        currentRadius = MAX_RADIUS * currentFrame / LIFETIME;

        var GLOW_OPACITY_BORDER = .7;
        var PARTICIPLE_OPACITY_BORDER = .5;

        if (currentFrame / LIFETIME >= GLOW_OPACITY_BORDER)
            glowOpacity = 1 - ((currentFrame / LIFETIME - GLOW_OPACITY_BORDER) * (1 / (1 - GLOW_OPACITY_BORDER)));

        if (currentFrame / LIFETIME >= PARTICIPLE_OPACITY_BORDER)
            participleOpacity = 1 - ((currentFrame / LIFETIME - PARTICIPLE_OPACITY_BORDER) *
                (1 / (1 - PARTICIPLE_OPACITY_BORDER)));

        for (var i = 0; i < participles.length; i++)
            participles[i].update();


        if (currentFrame++ >= LIFETIME)
            return true;

    };

    this.draw = function () {
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

        ctx.save();

        currentGlowColor.h = getTransitionalValue(startGlowColor.h, endGlowColor.h, currentFrame / LIFETIME);
        currentGlowColor.s = getTransitionalValue(startGlowColor.s, endGlowColor.s, currentFrame / LIFETIME);
        currentGlowColor.l = getTransitionalValue(startGlowColor.l, endGlowColor.l, currentFrame / LIFETIME);
        textGlowColor = currentGlowColor.getStr(glowOpacity);

        ctx.globalAlpha = glowOpacity;

        ctx.shadowBlur = 10;
        ctx.shadowColor = textGlowColor;
        ctx.fillStyle = textGlowColor;

        for (var i = 0; i < participles.length; i++)
            participles[i].drawGlow();

        ctx.restore();
        ctx.save();

        ctx.globalAlpha = participleOpacity;
        ctx.fillStyle = "#fff";

        for (var i = 0; i < participles.length; i++)
            participles[i].drawParticiple();

        ctx.restore();
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

        this.update = function () {

            curSpeed = Math.cos(Math.PI / 2 * currentFrame / LIFETIME) * maxSpeed;

            fbGlobalPosition.x += curSpeed * Math.cos(degToRad(angle));
            fbGlobalPosition.y += curSpeed * Math.sin(degToRad(angle));

            getLocalPositionByGlobal(localPosition, fbGlobalPosition);
        };

        this.drawGlow = function () {
            ctx.beginPath();
            ctx.arc(localPosition.x, localPosition.y, radius, 0, Math.PI * 2);
            ctx.fill();
        };

        this.drawParticiple = function () {
            ctx.beginPath();
            ctx.arc(localPosition.x, localPosition.y, radius, 0, Math.PI * 2);
            ctx.fill();
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

function HSLColor(h, s, l) {
    this.h = h || 0;
    this.s = s || 0;
    this.l = l || 0;

    this.getStr = function (alpha) {
        return "hsla(" + this.h + "," + this.s + "%," + this.l + "%," + alpha.toFixed(2) + ")";
    };
}

init();
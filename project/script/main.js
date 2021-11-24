var dt = 0.01;
var autoPause = 5;

var camera = [-15, 15, 35];
var yaw = -60;
var pitch = -30;
var aperture = 60;

var light = [0, 9, 15];
var ballDirection = [0.1,0.3,-0.6];

var movementSpeed = 15;
var mouseSensitivity = 0.5;
var touchSensitivity = 0.2;
var gamepadSensitivity = 1.0;
var paddleSensitivity = 0.025;
var gamepadDeadzone = 0.1;

var skybox = './dat/blueprint.jpg';
var materials = [];
materials['green'] = { name: 'green', ka: [0.25, 0.15, 0.2], kd: [0.9, 0.9, 0.9], ks: [0.8, 0.8, 0.8], ns: 500.0, tx: [0.0, 1.0, 0.0] };
materials['red'] = { name: 'red', ka: [0.25, 0.15, 0.2], kd: [0.9, 0.9, 0.9], ks: [0.8, 0.8, 0.8], ns: 500.0, tx: [1.0, 0.0, 0.0] };
materials['gold'] = { name: 'gold', ka: [0.24725, 0.2245, 0.0645], kd: [0.34615, 0.3143, 0.0903], ks: [0.797357, 0.723991, 0.208006], ns: 83.2, tx: null };
materials['metal'] = { name: 'metal', ka: [0.0, 0.0, 0.0], kd: [0.8, 0.8, 0.8], ks: [0.5, 0.5, 0.5], ns: 225.0, tx: './dat/steel.jpg' };
materials['wood'] = { name: 'wood', ka: [0.0, 0.0, 0.0], kd: [0.64, 0.64, 0.64], ks:[0.5, 0.5, 0.5], ns: 96.0784, tx: './dat/wood.jpg' };
materials['face'] = { name: 'gold', ka: [0.24725, 0.2245, 0.0645], kd: [0.34615, 0.3143, 0.0903], ks: [0.797357, 0.723991, 0.208006], ns: 83.2, tx: './dat/author.jpg' };
materials['purple'] = { name: 'purple', ka: [0.05, 0.0, 0.05], kd: [0.9, 0.7, 0.9], ks: [0.05, 0.0, 0.05], ns: 50.0, tx: null };

var canvas;
var context;
var overlay;
var headup;
var queue;
var previous;
var accumulator;

function init(event) {
    canvas = document.getElementById('myFancyCanvas');
    context = canvas.getContext('experimental-webgl');
    overlay = document.getElementById('myTextCanvas');
    headup = overlay.getContext('2d');
    queue = [];
    previous = 0;
    accumulator = 0;
    setupPhysics();
    setupScene();
    drawInterface();
    enableNavigation();
    window.requestAnimationFrame(animate);
}

function animate(timestamp) {
    var delta = timestamp - previous;
    previous = timestamp;
    var step = delta * 0.001;
    if (step <= autoPause) accumulator += step;
    while (accumulator >= dt) {
        loopPhysics(dt);
        pollGamepad();
        accumulator -= dt;
    }
    renderEnvironment();
    for (var i in queue) renderObject(queue[i]);
    window.requestAnimationFrame(animate);
}

// function feedbackCamera() {
//     return "   CAMERA:   x=" + camera[0].toFixed(1) + ",   y=" + camera[1].toFixed(1) + ",   z=" + camera[2].toFixed(1) + ",   Y=" + yaw.toFixed(1) + ",   P=" + pitch.toFixed(1) + "   ";
// }
//
// function feedbackPaddle() {
//     return "   PADDLE:   x=" + queue['paddle'].position.matrix[12].toFixed(1) + ",   y=" + queue['paddle'].position.matrix[13].toFixed(1) + "   ";
// }
//
// function feedbackBall() {
//     return "   BALL:   x=" + queue['ball'].position.matrix[12].toFixed(1) + ",   y=" + queue['ball'].position.matrix[13].toFixed(1) + ",   z=" + queue['ball'].position.matrix[14].toFixed(1) + "   ";
// }

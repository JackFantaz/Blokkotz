var gamePhase = 'pause';
var score = 0;

function exploreGame() {
    gamePhase = 'exploration';
    drawInterface();
}

function playGame() {
    gamePhase = 'playing';
    queue['ball'].position.animation = linearMotion(1, 10, 0, ballDirection);
    drawInterface();
}

function haltGame() {
    gamePhase = 'halt';
    // queue['box'].handler = null;
    queue['ball'].position.animation = null;
    drawInterface();
}

function hitBrick(brickName) {
    if ((queue[brickName].material.name === 'gold') || (queue[brickName].material.name === 'face')) {
        changeMaterial(queue[brickName], 'metal');
        score += 50;
    } else if (queue[brickName].material.name === 'metal') {
        changeMaterial(queue[brickName], 'wood');
        score += 50;
    } else if (queue[brickName].material.name === 'wood') {
        delete queue[brickName];
        score += 100;
    }
    if (Object.keys(queue).length <= 3) window.setTimeout(haltGame, 1000);
    drawInterface();
}

function changeMaterial(object, material) {
    object.material = materials[material];
    object.texture = prepareTexture(object.material.tx, program, context, true, false);
}

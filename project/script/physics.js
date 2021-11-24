function setupPhysics() {
    // loadMesh(name, file, material, position, orientation, size, animation, handler);
    loadMesh('ball', './dat/ball.obj', 'red', [0,0,17.5], [0,0,0], [1,1,1], null, null);
    //loadMesh('ball', './dat/ball.obj', 'red', [0,-10,17.5], [0,0,0], [1,1,1], null, null);
    loadMesh('box', './dat/room.obj', 'purple', [0,0,0], [0,0,0], [10,10,20], null, handleBoxCollision('ball', 'box', ballDirection));
    loadMesh('brick_-18', './dat/brick_2.obj', 'face', [0,0,-18], [0,0,Math.PI/2], [1,2,1], null, handleBrickCollision('ball', 'brick_-18', ballDirection));
    for (var i = -15; i <= 3; i += 3) proceduralBrickCreation('brick_' + i, i, './dat/brick_1.obj', ['wood', 'metal', 'gold']);
    loadMesh('brick_6', './dat/brick_1.obj', 'wood', [-3,8,6], [0,0,0], [1,1,1], harmonicMotion(0.2, 1, [1,0,0]), handleBrickCollision('ball', 'brick_6', ballDirection));
    loadMesh('brick_9', './dat/brick_1.obj', 'metal', [4,0,9], [0,0,Math.PI/2], [1,1,1], harmonicMotion(0.1, 0.5, [1,0,0]), handleBrickCollision('ball', 'brick_9', ballDirection));
    loadMesh('paddle', './dat/brick_1.obj', 'green', [0,0,19.5], [0,0,0], [1,2,0.5], movePaddle(), handlePaddleCollision('ball', 'paddle', ballDirection));
    updateCameraOrientation();
}

function loopPhysics(dt) {
    if (gamePhase === 'exploration') {
        updateCameraPosition(dt);
        updateCameraOrientation();
    }
    for (var i in queue) if (queue[i].position.animation !== null) queue[i].position.animation(queue[i], dt);
    for (var i in queue) if (queue[i].handler !== null) queue[i].handler();
}

function proceduralBrickCreation(name, depth, mesh, possibleMaterials) {
    var directionFlag = randomElement(['horizontal', 'vertical']);
    var material = randomElement(possibleMaterials);
    var position;
    var orientation;
    if (directionFlag === 'horizontal') {
        position = [randomNumber(-5, 5), randomNumber(-8, 8), depth];
        orientation = [0,0,0];
    } else if (directionFlag === 'vertical') {
        position = [randomNumber(-8, 8), randomNumber(-5, 5), depth];
        orientation = [0,0,Math.PI/2];
    }
    var size = [1,1,1];
    var frequency = randomNumber(1, 5) * 0.1;
    var peak = randomNumber(1, 10) * 0.1;
    var direction = [1,0,0];
    loadMesh(name, mesh, material, position, orientation, size, harmonicMotion(frequency, peak, direction), handleBrickCollision('ball', name, ballDirection));
}

function handleBrickCollision(ballName, brickName, direction) {
    var prev = [false, false, false, false, false, false];
    return function() {
        var ball = queue[ballName];
        var brick = queue[brickName];
        if ((ball !== undefined) && (brick !== undefined)) {
            var bl = ball.position.bounds;
            var bk = brick.position.bounds;
            var c1 = bl.maxX >= bk.minX;
            var c2 = bl.minX <= bk.maxX;
            var c3 = bl.maxY >= bk.minY;
            var c4 = bl.minY <= bk.maxY;
            var c5 = bl.maxZ >= bk.minZ;
            var c6 = bl.minZ <= bk.maxZ;
            if (c1 && c2 && c3 && c4 && c5 && c6) {
                if (c1 !== prev.c1) direction[0] *= -1;
                if (c2 !== prev.c2) direction[0] *= -1;
                if (c3 !== prev.c3) direction[1] *= -1;
                if (c4 !== prev.c4) direction[1] *= -1;
                if (c5 !== prev.c5) direction[2] *= -1;
                if (c6 !== prev.c6) direction[2] *= -1;
                hitBrick(brickName);
            }
            prev = {c1, c2, c3, c4, c5, c6};
        }
    }
}

function handleBoxCollision(ballName, boxName, direction) {
    var limit = 75;
    var flagX = 0;
    var flagY = 0;
    return function() {
        var ball = queue[ballName];
        var box = queue[boxName];
        if ((ball !== undefined) && (box !== undefined)) {
            var bl = ball.position.bounds;
            var bx = box.position.bounds;
            if ((bl.minX <= bx.maxX) && (bl.maxX >= bx.minX) && (bl.minY <= bx.maxY) && (bl.maxY >= bx.minY) && (bl.minZ <= bx.maxZ) && (bl.maxZ >= bx.minZ)) {
                if ((bl.maxX >= bx.maxX) || (bl.minX <= bx.minX)) {
                    if (flagX < limit) direction[0] *= -1;
                    flagX += 1;
                } else flagX = 0;
                if ((bl.maxY >= bx.maxY) || (bl.minY <= bx.minY)) {
                    if (flagY < limit) direction[1] *= -1;
                    flagY += 1;
                } else flagY = 0;
                if (bl.minZ <= bx.minZ) direction[2] *= -1;
            } else {
                window.setTimeout(haltGame, 1000);
            }
        }
    }
}

function handlePaddleCollision(ballName, paddleName, direction) {
    var weight = 0.3;
    var prev = [false, false, false, false, false, false];
    return function() {
        var ball = queue[ballName];
        var paddle = queue[paddleName];
        if ((ball !== undefined) && (paddle !== undefined)) {
            var bl = ball.position.bounds;
            var pd = paddle.position.bounds;
            var c1 = bl.maxX >= pd.minX;
            var c2 = bl.minX <= pd.maxX;
            var c3 = bl.maxY >= pd.minY;
            var c4 = bl.minY <= pd.maxY;
            var c5 = bl.maxZ >= pd.minZ;
            var c6 = bl.minZ <= pd.maxZ;
            if (c1 && c2 && c3 && c4 && c5 && c6) {
                if (c1 !== prev.c1) direction[0] *= -1;
                if (c2 !== prev.c2) direction[0] *= -1;
                if (c3 !== prev.c3) direction[1] *= -1;
                if (c4 !== prev.c4) direction[1] *= -1;
                if (c5 !== prev.c5) direction[2] *= -1;
                if (c6 !== prev.c6) direction[2] *= -1;
                if (direction[2] > 0) direction[2] *= -1;
                var ballPosition = [ball.position.matrix[12], ball.position.matrix[13], ball.position.matrix[14]];
                var paddlePosition = [paddle.position.matrix[12], paddle.position.matrix[13], paddle.position.matrix[14]];
                var difference = m4.normalize(m4.subtractVectors(ballPosition, paddlePosition));
                var cumulative = m4.normalize(m4.addVectors(m4.scaleVector(direction, 1-weight), m4.scaleVector(difference, weight)));
                direction[0] = cumulative[0];
                direction[1] = cumulative[1];
                direction[2] = cumulative[2];
                if (direction[2] > 0) direction[2] *= -1;
            }
            prev = {c1, c2, c3, c4, c5, c6};
        }
    }
}

function movePaddle() {
    return function(paddle, time) {
        if (gamePhase === 'playing') {
            var correction = (yaw > 0) ? -1 : 1;
            if (keys['W'] || isGamepadPressed(12)) paddle.position.matrix = m4.translate(paddle.position.matrix, 0, movementSpeed*time, 0);
            if (keys['S'] || isGamepadPressed(13)) paddle.position.matrix = m4.translate(paddle.position.matrix, 0, -movementSpeed*time, 0);
            if (keys['A'] || isGamepadPressed(14)) paddle.position.matrix = m4.translate(paddle.position.matrix, -movementSpeed*time*2*correction, 0, 0);
            if (keys['D'] || isGamepadPressed(15)) paddle.position.matrix = m4.translate(paddle.position.matrix, movementSpeed*time*2*correction, 0, 0);
            if (gamepadAxisValue(1) < -gamepadDeadzone) paddle.position.matrix = m4.translate(paddle.position.matrix, 0, -gamepadAxisValue(1)*movementSpeed*time, 0);
            if (gamepadAxisValue(1) > gamepadDeadzone)  paddle.position.matrix = m4.translate(paddle.position.matrix, 0, -gamepadAxisValue(1)*movementSpeed*time, 0);
            if (gamepadAxisValue(0) < -gamepadDeadzone) paddle.position.matrix = m4.translate(paddle.position.matrix, gamepadAxisValue(0)*movementSpeed*time*2*correction, 0, 0);
            if (gamepadAxisValue(0) > gamepadDeadzone)  paddle.position.matrix = m4.translate(paddle.position.matrix, gamepadAxisValue(0)*movementSpeed*time*2*correction, 0, 0);
            if (paddle.position.matrix[12] > 8) paddle.position.matrix[12] = 8;
            if (paddle.position.matrix[12] < -8) paddle.position.matrix[12] = -8;
            if (paddle.position.matrix[13] > 8) paddle.position.matrix[13] = 8;
            if (paddle.position.matrix[13] < -8) paddle.position.matrix[13] = -8;
            paddle.position.bounds = bounds(paddle);
        }
    }
}

function linearMotion(acceleration, velocity, friction, direction) {
    var e = 0.000001;
    if (friction > 1) friction = 1;
    else if (friction < 0) friction = 0;
    return function(object, time) {
        velocity = velocity + acceleration * time;
        velocity = velocity * (1 - friction);
        if (Math.abs(velocity) < e) velocity = 0;
        var displacement = velocity * time;
        object.position.matrix = m4.translate(object.position.matrix, displacement*direction[0], displacement*direction[1], displacement*direction[2]);
        object.position.bounds = bounds(object);
    }
}

function harmonicMotion(frequency, peak, direction) {
    var omega = 2 * Math.PI * frequency;
    var amplitude = 2 * peak;
    var totalTime = 0;
    var previousPosition = 0;
    return function(object, time) {
        totalTime = totalTime + time;
        var position = amplitude * Math.cos(omega * totalTime);
        var displacement = position - previousPosition;
        previousPosition = position;
        object.position.matrix = m4.translate(object.position.matrix, displacement*direction[0], displacement*direction[1], displacement*direction[2]);
        object.position.bounds = bounds(object);
    }
}

function bounds(object) {
    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;
    var minZ = Infinity;
    var maxZ = -Infinity;
    for (var i = 0; i < object.position.points.length; i++) {
        var simpleVertex = [object.position.points[i].x, object.position.points[i].y, object.position.points[i].z, 1.0];
        var positionedVertex = m4.transformVector(object.position.matrix, simpleVertex);
        if (minX > positionedVertex[0]) minX = positionedVertex[0];
        if (maxX < positionedVertex[0]) maxX = positionedVertex[0];
        if (minY > positionedVertex[1]) minY = positionedVertex[1];
        if (maxY < positionedVertex[1]) maxY = positionedVertex[1];
        if (minZ > positionedVertex[2]) minZ = positionedVertex[2];
        if (maxZ < positionedVertex[2]) maxZ = positionedVertex[2];
    }
    return {minX, maxX, minY, maxY, minZ, maxZ};
}

function randomElement(collection) {
    return collection[randomNumber(0, collection.length-1)];
}

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

// function collision(object1, object2) {
//     var b1 = bounds(object1);
//     var b2 = bounds(object2);
//     var result = false;
//     if ((b1.maxX >= b2.minX) && (b1.minX <= b2.maxX))
//         if ((b1.maxY >= b2.minY) && (b1.minY <= b2.maxY))
//             if ((b1.maxZ >= b2.minZ) && (b1.minZ <= b2.maxZ)) result = true;
//     return result;
// }
//
// function leaving(bounded, bounder) {
//     var bd = bounds(bounded);
//     var br = bounds(bounder);
//     var result = false;
//     if ((bd.maxX >= br.maxX) || (bd.minX <= br.minX) || (bd.maxY >= br.maxY) || (bd.minY <= br.minY) || (bd.maxZ >= br.maxZ) || (bd.minZ <= br.minZ)) result = true;
//     return result;
// }
//
// function translate(matrix, dx, dy, dz) {
//     return m4.translate(matrix, dx, dy, dz);
// }
//
// function scale(matrix, sx, sy, sz) {
//     return m4.scale(matrix, sx, sy, sz);
// }
//
// function rotate(matrix, tx, ty, tz) {
//     var result = m4.xRotate(matrix, tx);
//     result = m4.yRotate(result, ty);
//     result = m4.zRotate(result, tz);
//     return result;
// }

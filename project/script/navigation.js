var keys;
var previousX;
var previousY;
var activeGamepad;

function enableNavigation() {
    keys = {'W': false, 'S': false, 'A': false, 'D': false, 'Q': false, 'E': false};
    overlay.onkeydown = doKeyPress;
    overlay.onkeyup = doKeyRelease;
    overlay.onblur = e => keys = {'W': false, 'S': false, 'A': false, 'D': false, 'Q': false, 'E': false};
    overlay.onmousedown = doMousePress;
    document.onmouseup = doMouseRelease;
    window.onmouseleave = doMouseRelease;
    overlay.addEventListener('wheel', doWheelRoll, {passive: false});
    overlay.ontouchstart = doTouchStart;
    overlay.ontouchend = doTouchStop;
    activeGamepad = -1;
    window.addEventListener("gamepadconnected", e => activeGamepad = e.gamepad.index);
    window.addEventListener("gamepaddisconnected", e => activeGamepad = -1);
}

function doKeyPress(e) {
    e.preventDefault();
    if ((e.keyCode === 119) || (e.keyCode === 87) || (e.keyCode === 38)) keys['W'] = true;
    else if ((e.keyCode === 115) || (e.keyCode === 83) || (e.keyCode === 40)) keys['S'] = true;
    else if ((e.keyCode === 97) || (e.keyCode === 65) || (e.keyCode === 37)) keys['A'] = true;
    else if ((e.keyCode === 100) || (e.keyCode === 68) || (e.keyCode === 39)) keys['D'] = true;
    else if ((e.keyCode === 113) || (e.keyCode === 81) || (e.keyCode === 33)) keys['Q'] = true;
    else if ((e.keyCode === 101) || (e.keyCode === 69) || (e.keyCode === 34)) keys['E'] = true;
}

function doKeyRelease(e) {
    e.preventDefault();
    if ((e.keyCode === 119) || (e.keyCode === 87) || (e.keyCode === 38)) keys['W'] = false;
    else if ((e.keyCode === 115) || (e.keyCode === 83) || (e.keyCode === 40)) keys['S'] = false;
    else if ((e.keyCode === 97) || (e.keyCode === 65) || (e.keyCode === 37)) keys['A'] = false;
    else if ((e.keyCode === 100) || (e.keyCode === 68) || (e.keyCode === 39)) keys['D'] = false;
    else if ((e.keyCode === 113) || (e.keyCode === 81) || (e.keyCode === 33)) keys['Q'] = false;
    else if ((e.keyCode === 101) || (e.keyCode === 69) || (e.keyCode === 34)) keys['E'] = false;
}

function doMousePress(e) {
    if (e.button === 0) {
        previousX = e.pageX;
        previousY = e.pageY;
        var button = checkForPressedButtons(e.pageX, e.pageY);
        if (!button && (gamePhase === 'exploration') || (gamePhase === 'playing')) document.addEventListener("mousemove", doMouseMove);
    }
}

function doMouseMove(e) {
    var offsetX = e.pageX - previousX;
    var offsetY = e.pageY - previousY;
    previousX = e.pageX;
    previousY = e.pageY;
    if (gamePhase === 'exploration') {
        yaw += offsetX * mouseSensitivity;
        pitch -= offsetY * mouseSensitivity;
        ensureValidAngles();
    } else if (gamePhase === 'playing') {
        var paddle = queue['paddle'];
        if (yaw > 0) offsetX *= -1;
        if (paddle !== undefined) paddle.position.matrix = m4.translate(paddle.position.matrix, offsetX*paddleSensitivity*2, -offsetY*paddleSensitivity, 0);
    }
}

function doMouseRelease(e) {
    document.removeEventListener("mousemove", doMouseMove);
    if (directionalPadUsed) {
        keys = {'W': false, 'S': false, 'A': false, 'D': false, 'Q': false, 'E': false};
        directionalPadUsed = false;
    }
}

function doWheelRoll(e) {
    e.preventDefault();
    if ((gamePhase === 'exploration') || (gamePhase === 'playing')) {
        if (e.deltaY > 0) aperture += 5;
        else if (e.deltaY < 0) aperture -= 5;
        if (aperture > 105) aperture = 105;
        else if (aperture < 45) aperture = 45;
    }
}

function doTouchStart(e) {
    e.preventDefault();
    previousX = e.touches[0].clientX;
    previousY = e.touches[0].clientY;
    var button = checkForPressedButtons(e.touches[0].clientX, e.touches[0].clientY);
    if (!button && ((gamePhase === 'exploration') || (gamePhase === 'playing'))) document.addEventListener("touchmove", doTouchMove);
}

function doTouchMove(e) {
    var offsetX = e.touches[0].clientX - previousX;
    var offsetY = e.touches[0].clientY - previousY;
    previousX = e.touches[0].clientX;
    previousY = e.touches[0].clientY;
    if (gamePhase === 'exploration') {
        yaw -= offsetX * touchSensitivity;
        pitch += offsetY * touchSensitivity;
        ensureValidAngles();
    } else if (gamePhase === 'playing') {
        var paddle = queue['paddle'];
        if (yaw > 0) offsetX *= -1;
        if (paddle !== undefined) paddle.position.matrix = m4.translate(paddle.position.matrix, offsetX*paddleSensitivity*2, -offsetY*paddleSensitivity, 0);
    }
}

function doTouchStop(e) {
    document.removeEventListener("touchmove", doTouchMove);
    if (directionalPadUsed) {
        keys = {'W': false, 'S': false, 'A': false, 'D': false, 'Q': false, 'E': false};
        directionalPadUsed = false;
    }
}

function updateCameraPosition(time) {
    if (keys['W'] || isGamepadPressed(12)) camera = m4.addVectors(camera, m4.scaleVector(front, movementSpeed*time));
    if (keys['S'] || isGamepadPressed(13)) camera = m4.subtractVectors(camera, m4.scaleVector(front, movementSpeed*time));
    if (keys['A'] || isGamepadPressed(14)) camera = m4.subtractVectors(camera, m4.scaleVector(m4.normalize(m4.cross(front, up)), movementSpeed*time));
    if (keys['D'] || isGamepadPressed(15)) camera = m4.addVectors(camera, m4.scaleVector(m4.normalize(m4.cross(front, up)), movementSpeed*time));
    if (keys['Q'] || isGamepadPressed(4)) camera = m4.addVectors(camera, m4.scaleVector(m4.normalize(m4.cross(m4.cross(front, up), front)), movementSpeed*time));
    if (keys['E'] || isGamepadPressed(5)) camera = m4.subtractVectors(camera, m4.scaleVector(m4.normalize(m4.cross(m4.cross(front, up), front)), movementSpeed*time));
    if (gamepadAxisValue(1) < -gamepadDeadzone) camera = m4.addVectors(camera, m4.scaleVector(front, -gamepadAxisValue(1)*movementSpeed*time));
    if (gamepadAxisValue(1) > gamepadDeadzone) camera = m4.subtractVectors(camera, m4.scaleVector(front, gamepadAxisValue(1)*movementSpeed*time));
    if (gamepadAxisValue(0) < -gamepadDeadzone) camera = m4.subtractVectors(camera, m4.scaleVector(m4.normalize(m4.cross(front, up)), -gamepadAxisValue(0)*movementSpeed*time));
    if (gamepadAxisValue(0) > gamepadDeadzone) camera = m4.addVectors(camera, m4.scaleVector(m4.normalize(m4.cross(front, up)), gamepadAxisValue(0)*movementSpeed*time));
    if (gamepadAnalogValue(6) > gamepadDeadzone) camera = m4.addVectors(camera, m4.scaleVector(m4.normalize(m4.cross(m4.cross(front, up), front)), gamepadAnalogValue(6)*movementSpeed*time));
    if (gamepadAnalogValue(7) > gamepadDeadzone) camera = m4.subtractVectors(camera, m4.scaleVector(m4.normalize(m4.cross(m4.cross(front, up), front)), gamepadAnalogValue(7)*movementSpeed*time));
}

function updateCameraOrientation() {
    if (gamePhase === 'exploration') light = camera;
    var direction = [];
    direction[0] = Math.cos(yaw*Math.PI/180) * Math.cos(pitch*Math.PI/180);
    direction[1] = Math.sin(pitch*Math.PI/180);
    direction[2] = Math.sin(yaw*Math.PI/180) * Math.cos(pitch*Math.PI/180);
    front = m4.normalize(direction);
}

function pollGamepad() {
    if (activeGamepad !== -1) {
        if ((gamePhase === 'pause') && (Object.keys(queue).length >= 3)) {
            if (isGamepadPressed(9)) playGame();
            else if (isGamepadPressed(8)) exploreGame();
        } else if (gamePhase === 'exploration') {
            if (isGamepadPressed(9)) playGame();
            if (gamepadAxisValue(2) < -gamepadDeadzone) yaw -= -gamepadAxisValue(2) * gamepadSensitivity;
            if (gamepadAxisValue(2) > gamepadDeadzone) yaw += gamepadAxisValue(2) * gamepadSensitivity;
            if (gamepadAxisValue(3) < -gamepadDeadzone) pitch += -gamepadAxisValue(3) * gamepadSensitivity;
            if (gamepadAxisValue(3) > gamepadDeadzone) pitch -= gamepadAxisValue(3) * gamepadSensitivity;
            ensureValidAngles();
        } else if (gamePhase === 'halt') {
            if (isGamepadPressed(9)) location.reload();
        }
        if ((gamePhase === 'exploration') || (gamePhase === 'playing')) {
            if (isGamepadPressed(0)) {
                aperture += 0.5;
                if (aperture > 105) aperture = 105;
                else if (aperture < 45) aperture = 45;
            }
            if (isGamepadPressed(3)) {
                aperture -= 0.5;
                if (aperture > 105) aperture = 105;
                else if (aperture < 45) aperture = 45;
            }
        }
    }
}

function isGamepadPressed(n) {
    if (activeGamepad !== -1) return navigator.getGamepads()[activeGamepad].buttons[n].pressed;
    else return false;
}

function gamepadAnalogValue(n) {
    if (activeGamepad !== -1) return navigator.getGamepads()[activeGamepad].buttons[n].value;
    else return 0;
}

function gamepadAxisValue(n) {
    if (activeGamepad !== -1) return navigator.getGamepads()[activeGamepad].axes[n];
    else return 0;
}

function ensureValidAngles() {
    if (yaw > 180) yaw -= 360;
    else if (yaw <= -180) yaw += 360;
    if (pitch > 89.5) pitch = 89.5;
    else if (pitch < -89.5) pitch = -89.5;
}

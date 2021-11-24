var directionalPadUsed = false;
var interfaceButtons;

function drawInterface() {
    clearCanvas(overlay);
    interfaceButtons = [];
    if (gamePhase === 'pause') {
        drawButton(0, 'Explore', overlay, exploreGame);
        drawButton(-80, 'Play', overlay, playGame);
    } else if (gamePhase === 'exploration') {
        drawDirectionalPad(overlay);
        drawButton(overlay.clientHeight/2-40, 'Play from here', overlay, playGame);
    } else if (gamePhase === 'playing') {
        drawScore(score);
    } else if (gamePhase === 'halt') {
        drawMessage(-80, 'GAME OVER', overlay);
        drawButton(0, 'Play again', overlay, ()=>location.reload());
        drawScore(score);
    }
}

function drawMessage(position, text, canvas) {
    var context = canvas.getContext('2d');
    setDrawingParameters('red', '50px Serif', 'top');
    var size = context.measureText(text).width;
    var width = size + 20;
    var height = 60;
    var x = (canvas.clientWidth / 2) - (width / 2);
    var y = (canvas.clientHeight / 2) - (height / 2) + position;
    context.fillText(text, x+10, y+5);
}

function drawButton(position, text, canvas, action) {
    var context = canvas.getContext('2d');
    setDrawingParameters('red', '50px Serif', 'top');
    var size = context.measureText(text).width;
    var width = size + 20;
    var height = 60;
    var x = (canvas.clientWidth / 2) - (width / 2);
    var y = (canvas.clientHeight / 2) - (height / 2) + position;
    setDrawingParameters('rgba(247, 247, 237, 0.8)', '', '');
    context.fillRect(x, y, width, height);
    setDrawingParameters('red', '50px Serif', 'top');
    context.fillText(text, x+10, y+5);
    interfaceButtons.push({ minX: x, maxX: x+width, minY: y, maxY: y+height, action: action });
}

function drawDirectionalPad(canvas) {
    var context = canvas.getContext('2d');
    var h = canvas.clientHeight;
    setDrawingParameters('rgba(247, 247, 237, 0.8)', '', '');
    context.beginPath();
    context.moveTo(50,  h-150);
    context.lineTo(100, h-150);
    context.lineTo(100, h-200);
    context.lineTo(150, h-200);
    context.lineTo(150, h-150);
    context.lineTo(200, h-150);
    context.lineTo(200, h-100);
    context.lineTo(150, h-100);
    context.lineTo(150, h-50);
    context.lineTo(100, h-50);
    context.lineTo(100, h-100);
    context.lineTo(50, h-100);
    context.closePath();
    context.fill();
    interfaceButtons.push({ minX: 100, maxX: 150, minY: h-200, maxY: h-150, action: touchKeyAction('W') });
    interfaceButtons.push({ minX: 100, maxX: 150, minY: h-100, maxY: h-50, action: touchKeyAction('S') });
    interfaceButtons.push({ minX: 50, maxX: 100, minY: h-150, maxY: h-100, action: touchKeyAction('A') });
    interfaceButtons.push({ minX: 150, maxX: 200, minY: h-150, maxY: h-100, action: touchKeyAction('D') });
    interfaceButtons.push({ minX: 100, maxX: 150, minY: h-150, maxY: h-100, action: ()=>{} });
}

function drawScore(value) {
    setDrawingParameters('red', '50px Serif', 'top');
    headup.fillText("Score: " + value, 10, 10);
}

function drawGameover() {
    var position = -80;
    var text = 'GAME OVER';
    setDrawingParameters('red', '50px Serif', 'top');
    var size = headup.measureText(text).width;
    var width = size + 20;
    var height = 60;
    var x = (overlay.clientWidth / 2) - (width / 2);
    var y = (overlay.clientHeight / 2) - (height / 2) + position;
    setDrawingParameters('rgba(247, 247, 237, 0.8)', '', '');
    headup.fillRect(0, 0, overlay.clientWidth, overlay.clientHeight);
    setDrawingParameters('red', '50px Serif', 'top');
    headup.fillText(text, x+10, y+5);
}

function checkForPressedButtons(pageX, pageY) {
    var cursor = pageToCanvas(pageX, pageY, overlay);
    var result = false;
    for (var i in interfaceButtons) {
        if ((interfaceButtons[i] !== undefined) && (cursor.x >= interfaceButtons[i].minX) && (cursor.x <= interfaceButtons[i].maxX) && (cursor.y >= interfaceButtons[i].minY) && (cursor.y <= interfaceButtons[i].maxY)) {
            interfaceButtons[i].action();
            result = true;
        }
    }
    return result;
}

function clearCanvas(canvas) {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

function touchKeyAction(character) {
    return function() {
        keys[character] = true;
        directionalPadUsed = true;
    }
}

function setDrawingParameters(color, font, baseline) {
    headup.fillStyle = color;
    headup.font = font;
    headup.textBaseline = baseline;
}

function pageToCanvas(pageX, pageY, canvas) {
    var box = canvas.getBoundingClientRect();
    var canvasX = Math.round(pageX - (box.left + window.scrollX) * (canvas.width / box.width));
    var canvasY = Math.round(pageY - (box.top + window.scrollY) * (canvas.height / box.height));
    return {x: canvasX, y: canvasY};
}

// function lightPixel(x, y, r, g, b, canvas) {
//     var context = canvas.getContext('2d');
//     var scene = context.getImageData(0, 0, canvas.clientWidth, canvas.clientHeight);
//     var a = 255;
//     var index = (x + y * scene.width) * 4;
//     scene.data[index + 0] = r;
//     scene.data[index + 1] = g;
//     scene.data[index + 2] = b;
//     scene.data[index + 3] = a;
//     context.putImageData(scene, 0, 0);
// }
//
// function windowToViewport(windowX, windowY, window, sCx, sCy) {
//     var viewportX = sCx * (windowX - window.xMin) + viewport.xMin;
//     var viewportY = sCy * (window.yMin - windowY) + viewport.yMax;
//     return {x: viewportX, y: viewportY}
// }
//
// function findClosestVertex(mouseX, mouseY, xs, ys, nvert, canvas) {
//     var minDistance = Math.max(canvas.width, canvas.height);
//     var minIndex = -1;
//     for (var i = 0; i < nvert; i++) {
//         var distance = Math.sqrt((mouseX - xs[i])**2 + (mouseY - ys[i])**2);
//         if (minDistance > distance) {
//             minDistance = distance;
//             minIndex = i;
//         }
//     }
//     return minIndex;
// }

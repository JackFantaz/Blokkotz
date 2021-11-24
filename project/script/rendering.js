var front;
var up;
var vertexCode;
var fragmentCode;
var skyboxVertexCode;
var skyboxFragmentCode;
var program;
var projectionMatrix;
var viewMatrix;
var skyboxData;
var illuminationData;
var lightingData;
var worldData;

function setupScene() {
    up = [0, 1, 0];
    loadShaders('./shader/vertex.vsh', './shader/fragment.fsh');
    window.setTimeout(doSetupScene, 100);
}

function doSetupScene() {
    if (shadersReady === 2) {
        program = programShaders(vertexCode, fragmentCode, context);
        worldData = prepareWorld(program, context);
        prepareSkybox('./shader/skybox.vsh', './shader/skybox.fsh', skybox, context);
        illuminationData = prepareIllumination(program, context);
        lightingData = prepareLighting(program, context);
        drawIllumination(light, [1.0, 1.0, 1.0], context, illuminationData);
        shadersReady = 3;
    } else window.setTimeout(doSetupScene, 100);
}

function renderEnvironment() {
    if (shadersReady === 3) {
        prepareDrawing([0.97, 0.97, 0.93], true, context);
        projectionMatrix = getProjectionMatrix(aperture, 0.001, 1000, canvas);
        viewMatrix = getViewMatrix(camera, front, up);
        if (skyboxReady === 3) drawSkybox(skyboxData, program, context);
        if (gamePhase === 'exploration') drawIllumination(light, [1.0, 1.0, 1.0], context, illuminationData);
    }
}

function renderObject(object) {
    drawGeometry(object.vertex, object.normal, context);
    drawColor(object.color, object.texel, object.texture, context);
    drawAmbient(camera, object.material, object.position.matrix, projectionMatrix, viewMatrix, context, lightingData, worldData);
    executeDrawing(object.vertex.vs.length, context, false);
}

function drawGeometry(vertices, normals, context) {
    renderAttribute(vertices.buffer, 3, vertices.location, context, false);
    renderAttribute(normals.buffer, 3, normals.location, context, false);
}

function drawColor(colors, texels, texture, context) {
    renderAttribute(colors.buffer, 3, colors.location, context, false);
    renderAttribute(texels.buffer, 2, texels.location, context, false);
    renderTexture(texture.texture, texture.location, context);
}

function drawAmbient(camera, material, movementMatrix, projectionMatrix, viewMatrix, context, lightingPointers, worldPointers) {
    renderLighting(camera, lightingPointers.cameraLocation, material.ka, lightingPointers.ambientLocation, material.kd, lightingPointers.diffuseLocation, material.ks, lightingPointers.specularLocation, material.ns, lightingPointers.shininessLocation, context);
    renderWorld(movementMatrix, projectionMatrix, viewMatrix, worldPointers.worldLocation, worldPointers.worldViewProjectionLocation, worldPointers.worldInverseTransposeLocation, context);
}

function drawSkybox(data, program, context) {
    renderSkybox(data.texture, program, context, data.positionLocation, data.positionBuffer, data.viewDirectionProjectionInverseLocation, data.skyboxLocation, data.skyboxProgram);
}

function drawIllumination(position, color, context, illuminationPointers) {
    renderIllumination(position, illuminationPointers.lightPositionLocation, color, illuminationPointers.lightColorLocation, context, false);
}

function programShaders(vertexCode, fragmentCode, context) {
    // var vertexCode = document.getElementById(vertexShaderId).innerText;
    // var fragmentCode = document.getElementById(fragmentShaderId).innerText;
    var vertexShader = context.createShader(context.VERTEX_SHADER);
    context.shaderSource(vertexShader, vertexCode);
    context.compileShader(vertexShader);
    var vertexCompiled = context.getShaderParameter(vertexShader, context.COMPILE_STATUS);
    if (!vertexCompiled) console.log(context.getShaderInfoLog(vertexShader));
    var fragmentShader = context.createShader(context.FRAGMENT_SHADER);
    context.shaderSource(fragmentShader, fragmentCode);
    context.compileShader(fragmentShader);
    var fragmentCompiled = context.getShaderParameter(fragmentShader, context.COMPILE_STATUS);
    if (!fragmentCompiled) console.log(context.getShaderInfoLog(fragmentShader));
    var program = context.createProgram();
    context.attachShader(program, vertexShader);
    context.attachShader(program, fragmentShader);
    context.linkProgram(program);
    var programLinked = context.getProgramParameter(program, context.LINK_STATUS);
    if (!programLinked) console.log(context.getProgramInfoLog(program));
    context.useProgram(program);
    return program;
}

function prepareAttribute(data, name, program, context, byte, dynamic) {
    var location = context.getAttribLocation(program, name);
    var buffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    if (byte) {
        if (dynamic) context.bufferData(context.ARRAY_BUFFER, new Uint8Array(data), context.DYNAMIC_DRAW);
        else context.bufferData(context.ARRAY_BUFFER, new Uint8Array(data), context.STATIC_DRAW);
    } else {
        if (dynamic) context.bufferData(context.ARRAY_BUFFER, new Float32Array(data), context.DYNAMIC_DRAW);
        else context.bufferData(context.ARRAY_BUFFER, new Float32Array(data), context.STATIC_DRAW);
    }
    context.bindBuffer(context.ARRAY_BUFFER, null);
    return {buffer, location};
}

function renderAttribute(buffer, size, location, context, byte) {
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    if (byte) context.vertexAttribPointer(location, size, context.UNSIGNED_BYTE, true, 0, 0);
    else context.vertexAttribPointer(location, size, context.FLOAT, false, 0, 0);
    context.enableVertexAttribArray(location);
    context.bindBuffer(context.ARRAY_BUFFER, null);
}

function prepareIndices(data, context, dynamic) {
    var buffer = context.createBuffer();
    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, buffer);
    if (dynamic) context.bufferData(context.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), context.DYNAMIC_DRAW);
    else context.bufferData(context.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), context.STATIC_DRAW);
    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, null);
    return buffer;
}

function renderIndices(buffer, context) {
    context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, buffer);
}

function prepareTexture(file, program, context, mipmap, blending) {
    var location = context.getUniformLocation(program, 'u_texture');
    var texture = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, texture);
    if (file !== null) {
        context.pixelStorei(context.UNPACK_ALIGNMENT, 2);
        context.texImage2D(context.TEXTURE_2D, 0, context.LUMINANCE, 2, 2, 0, context.LUMINANCE, context.UNSIGNED_BYTE, new Uint8Array([224, 160, 160, 224]));
        var image = new Image();
        image.src = file;
        image.onload = function() {
            context.bindTexture(context.TEXTURE_2D, texture);
            context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image);
            if (mipmap) {
                context.generateMipmap(context.TEXTURE_2D);
                if (blending) {
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR_MIPMAP_LINEAR);
                } else {
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST_MIPMAP_NEAREST);
                }
            } else {
                if (blending) {
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
                } else {
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
                    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
                }
            }
            context.bindTexture(context.TEXTURE_2D, null);
        };
    } else {
        context.pixelStorei(context.UNPACK_ALIGNMENT, 1);
        context.texImage2D(context.TEXTURE_2D, 0, context.LUMINANCE, 1, 1, 0, context.LUMINANCE, context.UNSIGNED_BYTE, new Uint8Array([255]));
    }
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    context.bindTexture(context.TEXTURE_2D, null);
    return {texture, location};
}

function renderTexture(texture, location, context) {
    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_2D, texture);
    context.uniform1i(location, 0);
}

function prepareIllumination(program, context) {
    var lightPositionLocation = context.getUniformLocation(program, 'u_lightPosition');
    var lightColorLocation = context.getUniformLocation(program, 'u_lightColor');
    return {lightPositionLocation, lightColorLocation};
}

function renderIllumination(position, lightPositionLocation, color, lightColorLocation, context, normalize) {
    context.uniform3fv(lightPositionLocation, position);
    if (normalize) context.uniform3fv(lightColorLocation, m4.normalize(color));
    else context.uniform3fv(lightColorLocation, color);
}

function prepareLighting(program, context) {
    var cameraLocation = context.getUniformLocation(program, 'u_viewPosition');
    var ambientLocation = context.getUniformLocation(program, 'u_ambient');
    var diffuseLocation = context.getUniformLocation(program, 'u_diffuse');
    var specularLocation = context.getUniformLocation(program, 'u_specular');
    var shininessLocation = context.getUniformLocation(program, 'u_shininess');
    return {cameraLocation, ambientLocation, diffuseLocation, specularLocation, shininessLocation};
}

function renderLighting(cameraPosition, cameraLocation, ambient, ambientLocation, diffuse, diffuseLocation, specular, specularLocation, shininess, shininessLocation, context) {
    context.uniform3fv(cameraLocation, cameraPosition);
    context.uniform3fv(ambientLocation, ambient);
    context.uniform3fv(diffuseLocation, diffuse);
    context.uniform3fv(specularLocation, specular);
    context.uniform1f(shininessLocation, shininess);
}

function prepareWorld(program, context) {
    var modeLocation = context.getUniformLocation(program, 'u_mode');
    context.uniform1i(modeLocation, 0);
    var worldLocation = context.getUniformLocation(program, 'u_world');
    var worldViewProjectionLocation = context.getUniformLocation(program, 'u_worldViewProjection');
    var worldInverseTransposeLocation = context.getUniformLocation(program, 'u_worldInverseTranspose');
    return {worldLocation, worldViewProjectionLocation, worldInverseTransposeLocation};
}

function renderWorld(movementMatrix, projectionMatrix, viewMatrix, worldLocation, worldViewProjectionLocation, worldInverseTransposeLocation, context) {
    context.uniformMatrix4fv(worldLocation, false, movementMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
    var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, movementMatrix);
    context.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
    var worldInverseMatrix = m4.inverse(movementMatrix);
    var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);
    context.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
}

function prepareDrawing(backgroundColor, backfaceCulling, context) {
    if (backfaceCulling) context.enable(context.CULL_FACE);
    context.enable(context.DEPTH_TEST);
    context.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], 1.0);
    context.clearDepth(1.0);
    context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
    context.viewport(0, 0, context.drawingBufferWidth, context.drawingBufferHeight);
}

function executeDrawing(length, context, indexed) {
    if (indexed) context.drawElements(context.TRIANGLES, length, context.UNSIGNED_SHORT, 0);
    else context.drawArrays(context.TRIANGLES, 0, length/3);
}

function prepareSkybox(vertex, fragment, picture, context) {
    loadSkyboxShaders(vertex, fragment);
    window.setTimeout(()=>doPrepareSkybox(picture, context), 100);
}

function doPrepareSkybox(picture, context) {
    if (skyboxReady === 2) {
        var positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
        var vertexShader = context.createShader(context.VERTEX_SHADER);
        context.shaderSource(vertexShader, skyboxVertexCode);
        context.compileShader(vertexShader);
        context.getShaderParameter(vertexShader, context.COMPILE_STATUS);
        var fragmentShader = context.createShader(context.FRAGMENT_SHADER);
        context.shaderSource(fragmentShader, skyboxFragmentCode);
        context.compileShader(fragmentShader);
        context.getShaderParameter(fragmentShader, context.COMPILE_STATUS);
        var skyboxProgram = context.createProgram();
        context.attachShader(skyboxProgram, vertexShader);
        context.attachShader(skyboxProgram, fragmentShader);
        context.linkProgram(skyboxProgram);
        context.getProgramParameter(skyboxProgram, context.LINK_STATUS);
        var positionLocation = context.getAttribLocation(skyboxProgram, 'a_position');
        var skyboxLocation = context.getUniformLocation(skyboxProgram, 'u_skybox');
        var viewDirectionProjectionInverseLocation = context.getUniformLocation(skyboxProgram, 'u_viewDirectionProjectionInverse');
        var positionBuffer = context.createBuffer();
        context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);
        context.bufferData(context.ARRAY_BUFFER, new Float32Array(positions), context.STATIC_DRAW);
        var texture = context.createTexture();
        context.bindTexture(context.TEXTURE_CUBE_MAP, texture);
        context.pixelStorei(context.UNPACK_ALIGNMENT, 2);
        context.texImage2D(context.TEXTURE_CUBE_MAP_POSITIVE_X, 0, context.LUMINANCE, 2, 2, 0, context.LUMINANCE, context.UNSIGNED_BYTE, new Uint8Array([224, 160, 160, 224]));
        context.texImage2D(context.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, context.LUMINANCE, 2, 2, 0, context.LUMINANCE, context.UNSIGNED_BYTE, new Uint8Array([224, 160, 160, 224]));
        context.texImage2D(context.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, context.LUMINANCE, 2, 2, 0, context.LUMINANCE, context.UNSIGNED_BYTE, new Uint8Array([224, 160, 160, 224]));
        context.texImage2D(context.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, context.LUMINANCE, 2, 2, 0, context.LUMINANCE, context.UNSIGNED_BYTE, new Uint8Array([224, 160, 160, 224]));
        context.texImage2D(context.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, context.LUMINANCE, 2, 2, 0, context.LUMINANCE, context.UNSIGNED_BYTE, new Uint8Array([224, 160, 160, 224]));
        context.texImage2D(context.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, context.LUMINANCE, 2, 2, 0, context.LUMINANCE, context.UNSIGNED_BYTE, new Uint8Array([224, 160, 160, 224]));
        context.texParameteri(context.TEXTURE_CUBE_MAP, context.TEXTURE_MAG_FILTER, context.NEAREST);
        context.texParameteri(context.TEXTURE_CUBE_MAP, context.TEXTURE_MIN_FILTER, context.NEAREST);
        context.texParameteri(context.TEXTURE_CUBE_MAP, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
        context.texParameteri(context.TEXTURE_CUBE_MAP, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
        var image = new Image();
        image.src = picture;
        image.onload = function() {
            context.bindTexture(context.TEXTURE_CUBE_MAP, texture);
            context.texImage2D(context.TEXTURE_CUBE_MAP_POSITIVE_X, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image);
            context.texImage2D(context.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image);
            context.texImage2D(context.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image);
            context.texImage2D(context.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image);
            context.texImage2D(context.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image);
            context.texImage2D(context.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, image);
            context.generateMipmap(context.TEXTURE_CUBE_MAP);
            context.texParameteri(context.TEXTURE_CUBE_MAP, context.TEXTURE_MAG_FILTER, context.LINEAR);
            context.texParameteri(context.TEXTURE_CUBE_MAP, context.TEXTURE_MIN_FILTER, context.LINEAR_MIPMAP_LINEAR);
            context.texParameteri(context.TEXTURE_CUBE_MAP, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
            context.texParameteri(context.TEXTURE_CUBE_MAP, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
            context.bindTexture(context.TEXTURE_CUBE_MAP, null);
        };
        context.bindBuffer(context.ARRAY_BUFFER, null);
        context.bindTexture(context.TEXTURE_CUBE_MAP, null);
        skyboxData = {texture, positionLocation, positionBuffer, viewDirectionProjectionInverseLocation, skyboxLocation, skyboxProgram};
        skyboxReady = 3;
    } else window.setTimeout(()=>doPrepareSkybox(picture, context), 100);
}

function renderSkybox(texture, program, context, positionLocation, positionBuffer, viewDirectionProjectionInverseLocation, skyboxLocation, skyboxProgram) {
    var cf = context.isEnabled(context.CULL_FACE);
    var df = context.getParameter(context.DEPTH_FUNC);
    context.useProgram(skyboxProgram);
    if (!cf) context.enable(context.CULL_FACE);
    context.depthFunc(context.LEQUAL);
    context.bindBuffer(context.ARRAY_BUFFER, positionBuffer);
    context.enableVertexAttribArray(positionLocation);
    context.vertexAttribPointer(location, 2, context.FLOAT, false, 0, 0);
    var viewDirection = m4.copy(viewMatrix);
    viewDirection[12] = 0;
    viewDirection[13] = 0;
    viewDirection[14] = 0;
    var viewDirectionProjection = m4.multiply(projectionMatrix, viewDirection);
    var viewDirectionProjectionInverse = m4.inverse(viewDirectionProjection);
    context.uniformMatrix4fv(viewDirectionProjectionInverseLocation, false, viewDirectionProjectionInverse);
    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_CUBE_MAP, texture);
    context.uniform1i(skyboxLocation, 0);
    context.drawArrays(context.TRIANGLES, 0, 6);
    if (!cf) context.disable(context.CULL_FACE);
    context.depthFunc(df);
    context.useProgram(program);
}

function getViewMatrix(cameraPosition, cameraFront, cameraUp) {
    var target = m4.addVectors(cameraPosition, cameraFront);
    return m4.inverse(m4.lookAt(cameraPosition, target, cameraUp));
}

function getProjectionMatrix(lensAperture, frontPlane, backPlane, canvas) {
    var angle = lensAperture * Math.PI / 180;
    var ratio = canvas.clientWidth / canvas.clientHeight;
    return m4.perspective(angle, ratio, frontPlane, backPlane);
}

function getMovementMatrix(position, rotation, scale) {
    var matrix = m4.identity();
    matrix = m4.translate(matrix, position[0], position[1], position[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    return matrix;
}

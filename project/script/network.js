var shadersReady = 0;
var skyboxReady = 0;

function loadShaders(vertexShader, fragmentShader) {
    sendAjaxRequest('GET', vertexShader, '', setVertexCode, 'TEXT');
    sendAjaxRequest('GET', fragmentShader, '', setFragmentCode, 'TEXT');
}

function loadSkyboxShaders(vertexShader, fragmentShader) {
    sendAjaxRequest('GET', vertexShader, '', setSkyboxVertexCode, 'TEXT');
    sendAjaxRequest('GET', fragmentShader, '', setSkyboxFragmentCode, 'TEXT');
}

function loadMesh(name, file, material, position, orientation, size, animation, handler) {
    if (shadersReady === 3) sendAjaxRequest('GET', file, '', enqueueObject(name, materials[material], position, orientation, size, animation, handler), 'TEXT');
    else window.setTimeout(()=>loadMesh(name, file, material, position, orientation, size, animation, handler), 100);
}

function enqueueObject(name, material, translation, rotation, scale, animation, handler) {
    return function(mesh) {
        var lines = mesh.split('\n');
        var vertices = [];
        var vi = 1;
        var texels = [];
        var ti = 1;
        var normals = [];
        var ni = 1;
        for (var i in lines) {
            var tokens = lines[i].split(' ');
            if (tokens[0] === 'v') {
                var x = parseFloat(tokens[1]);
                var y = parseFloat(tokens[2]);
                var z = parseFloat(tokens[3]);
                vertices[vi] = {x, y, z};
                vi++;
            } else if (tokens[0] === 'vt') {
                var u = parseFloat(tokens[1]);
                var v = parseFloat(tokens[2]);
                texels[ti] = {u, v};
                ti++;
            } else if (tokens[0] === 'vn') {
                var x = parseFloat(tokens[1]);
                var y = parseFloat(tokens[2]);
                var z = parseFloat(tokens[3]);
                normals[ni] = {x, y, z};
                ni++;
            }
        }
        var vs = [];
        var ts = [];
        var ns = [];
        for (var i in lines) {
            var tokens = lines[i].split(' ');
            if (tokens[0] === 'f') {
                var skip = true;
                for (var j in tokens) {
                    if (skip) {
                        skip = false;
                    } else {
                        var subtokens = tokens[j].split('/');
                        vs.push(vertices[parseInt(subtokens[0])].x);
                        vs.push(vertices[parseInt(subtokens[0])].y);
                        vs.push(vertices[parseInt(subtokens[0])].z);
                        ts.push(texels[parseInt(subtokens[1])].u);
                        ts.push(texels[parseInt(subtokens[1])].v);
                        ns.push(normals[parseInt(subtokens[2])].x);
                        ns.push(normals[parseInt(subtokens[2])].y);
                        ns.push(normals[parseInt(subtokens[2])].z);
                    }
                }
            }
        }
        var cs = [];
        var actualTexture;
        if (Array.isArray(material.tx)) {
            for (var i = 0; i < vs.length; i += 3) {
                cs[i] = material.tx[0];
                cs[i+1] = material.tx[1];
                cs[i+2] = material.tx[2];
            }
            actualTexture = null;
        } else {
            for (var i = 0; i < vs.length; i += 3) {
                cs[i] = 1.0;
                cs[i+1] = 1.0;
                cs[i+2] = 1.0;
            }
            actualTexture = material.tx;
        }
        var vertex = prepareAttribute(vs, 'a_position', program, context, false, false);
        var normal = prepareAttribute(ns, 'a_normal', program, context, false, false);
        var color = prepareAttribute(cs, 'a_color', program, context, false, false);
        var texel = prepareAttribute(ts, 'a_texcoord', program, context, false, false);
        vertex.vs = vs;
        normal.ns = ns;
        color.cs = cs;
        texel.ts = ts;
        var isAuthor = material.tx === './dat/author.jpg';
        var texture = prepareTexture(actualTexture, program, context, !isAuthor, false);
        var v_list = [];
        for (var i in vertices) v_list[i-1] = vertices[i];
        var position = {points: v_list, matrix: getMovementMatrix(translation, rotation, scale), animation: animation};
        var object = {name, vertex, normal, color, texel, texture, material, position, handler};
        object.position.bounds = bounds(object);
        queue[name] = object;
    }
}

function setVertexCode(code) {
    vertexCode = code;
    shadersReady++;
}

function setFragmentCode(code) {
    fragmentCode = code;
    shadersReady++;
}

function setSkyboxVertexCode(code) {
    skyboxVertexCode = code;
    skyboxReady++;
}

function setSkyboxFragmentCode(code) {
    skyboxFragmentCode = code;
    skyboxReady++;
}

function sendAjaxRequest(method, destination, parameters, handler, format) {
    var ajax;
    var	list;
    var created;
    var i;
    var getParameters;
    var postParameters;
    ajax = false;
    list = new Array('Microsoft.XmlHttp', 'MSXML4.XmlHttp', 'MSXML3.XmlHttp', 'MSXML2.XmlHttp', 'MSXML.XmlHttp');
    try {
        ajax = new XMLHttpRequest();
    } catch (e) {}
    if (!ajax) {
        created = false;
        for (var i = 0 ; i < list.length && !created; i++) {
            try {
                ajax = new ActiveXObject(list[i]);
                created = true;
            } catch (e) {}
        }
    }
    if (ajax) {
        ajax.onreadystatechange = function() {
            if ((ajax.readyState === 4) && (ajax.status === 200)) {
                format = format.toUpperCase();
                if (format === 'TEXT') {
                    handler(ajax.responseText);
                } else if (format === 'XML') {
                    handler(ajax.responseXML);
                }
            }
        };
        method = method.toUpperCase();
        if (method === 'GET') {
            getParameters = "?" + parameters;
            postParameters = null;
        } else if (method === 'POST') {
            getParameters = "";
            postParameters = parameters;
        }
        ajax.open(method, destination + getParameters, true);
        // ajax.setRequestHeader('connection', 'close');
        ajax.send(postParameters);
    }
}

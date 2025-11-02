// ============================
// WebGL Colored Cube Example
// ============================

// -------- 1. Get WebGL Context -------
const canvas = document.getElementById("glcanvas");
/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

if (!gl) {
    alert("WebGL not supported in this browser.");
}

// ------- 2. Define Shaders (GLSL) -------
// Vertex shader: handles positions + a model-view-projection matrix
const vsSource = `
attribute vec3 aPosition;
attribute vec3 aColor;
uniform mat4 uMVP;
varying vec3 vColor;
void main(void) {
    gl_Position = uMVP * vec4(aPosition, 1.0);
    vColor = aColor;
}
`;

// Fragment shader: receives color from vertex shader
const fsSource = `
precision mediump float;
varying vec3 vColor;
void main(void) {
    gl_FragColor = vec4(vColor, 1.0);
}
`;

// ------- 3. Shader Compile Helpers -------
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vsSource, fsSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

const program = createProgram(gl, vsSource, fsSource);
gl.useProgram(program);

// ------- 4. Define Cube Geometry -------
const positions = new Float32Array([
    // Front face (Z+)
    -1, -1, 1,
    1, -1, 1,
    1, 1, 1,
    -1, 1, 1,
    // Back face (Z-)
    -1, -1, -1,
    -1, 1, -1,
    1, 1, -1,
    1, -1, -1,
    // Top face (Y+)
    -1, 1, -1,
    -1, 1, 1,
    1, 1, 1,
    1, 1, -1,
    // Bottom face (Y-)
    -1, -1, -1,
    1, -1, -1,
    1, -1, 1,
    -1, -1, 1,
    // Right face (X+)
    1, -1, -1,
    1, 1, -1,
    1, 1, 1,
    1, -1, 1,
    // Left face (X-)
    -1, -1, -1,
    -1, -1, 1,
    -1, 1, 1,
    -1, 1, -1,
]);

// 6 faces, each a different color (repeated 4 times per face)
const colors = new Float32Array([
    // Front - red
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    // Back - green
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    // Top - blue
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    // Bottom - yellow
    1, 1, 0,
    1, 1, 0,
    1, 1, 0,
    1, 1, 0,
    // Right - magenta
    1, 0, 1,
    1, 0, 1,
    1, 0, 1,
    1, 0, 1,
    // Left - white
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
    1, 1, 1,
]);

// Indices tell WebGL how to make triangles from the 24 vertices
const indices = new Uint16Array([
    0, 1, 2,  0, 2, 3,    // front
    4, 5, 6,  4, 6, 7,    // back
    8, 9,10,  8,10,11,    // top
    12,13,14,  12,14,15,   // bottom
    16,17,18,  16,18,19,  // right
    20,21,22,  20,22,23   // left
]);

// ------- Create Buffers -------
// Position buffer
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

// Color buffer
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

// Index buffer
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// ------- 6. Connect Buffers to Shader Attributes -------
const aPosition = gl.getAttribLocation(program, "aPosition");
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);

const aColor = gl.getAttribLocation(program, "aColor");
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aColor);

// We keep ELEMENT_ARRAY_BUFFER bound for drawElements
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

// ------- 7. Matrices (Model-View-Projection) -------
function degToRad(d) {
    return d * Math.PI / 180; // Controls size of cube
}

function makePerspective(fovy, aspect, near, far) {
    const f = 0.5 / Math.tan(fovy / 2); // Also changes size of cube
    const rangeInv = 1.0 / (near - far);
    const out = new Float32Array(16);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;

    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;

    out[8] = 0;
    out[9] = 0;
    out[10] = (near + far) * rangeInv;
    out[11] = -1;

    out[12] = 0;
    out[13] = 0;
    out[14] = near * far * rangeInv * 2;
    out[15] = 0;
    return out;
}

function makeIdentity() {
    const out = new Float32Array(16);
    out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
    return out;
}

function multiplyMatrix(a, b) {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; ++i) {
        const ai0 = a[i]; const ai1 = a[i + 4]; const ai2 = a[i + 8]; const ai3 = a[i + 12];
        out[i] = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
        out[i + 4] = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
        out[i + 8] = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
        out[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
    }
    return out;
}

function makeTranslation(tx, ty, tz) {
    const out = makeIdentity();
    out[12] = tx;
    out[13] = ty;
    out[14] = tz;
    return out;
}

function makeRotationY(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const out = makeIdentity();
    out[0] = c;
    out[2] = s;
    out[8] = -s;
    out[10] = c;
    return out;
}

// rotate around x to get a view of the top/bottom
function makeRotationX(rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const out = makeIdentity();
    out[5] = c;   // yy
    out[6] = -s;  // yz
    out[9] = s;   // zy
    out[10] = c;  // zz
    return out;
}

const uMVP = gl.getUniformLocation(program, "uMVP");

// ------- 8. Render Loop -------
gl.enable(gl.DEPTH_TEST); // so cube faces don't bleed through
gl.clearColor(0.1, 0.1, 0.1, 1.0);

let angle = 0;
function render() {
    // update angle (controls speed of "spin")
    angle += 0.0075;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = canvas.width / canvas.height;
    const proj = makePerspective(degToRad(45), aspect, 0.1, 100.0);

    // view = translate backwards so we can see cube
    const view = makeTranslation(0, 0, -6);
    const rotY = makeRotationY(angle);
    const rotX = makeRotationX(angle * 0.6); // a bit slower on x
    const model = multiplyMatrix(rotY, rotX);

    // MVP = proj * view * model (order matters!)
    const pv = multiplyMatrix(proj, view);
    const mvp = multiplyMatrix(pv, model);

    gl.uniformMatrix4fv(uMVP, false, mvp);

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}

render();
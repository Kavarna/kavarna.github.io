"use strict"

const canvas = document.querySelector("#glCanvas");
const gl = canvas.getContext("webgl");

const vsSource = `
    attribute vec4 aVertexPosition;

    uniform mat4 uMVP;
    uniform mat4 uProjMat;

    void main() {
        gl_Position = uProjMat * uMVP * aVertexPosition;
    }

`;

const fsSource = `
    uniform mediump vec4 uColor;
    void main() {
        gl_FragColor = uColor;
    }
`;

function loadShader(type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Error compiling shaders " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initShaderProgram(vsCode, fsCode) {
    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Error linking shaders " + gl.GetProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function initBuffers() {
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const Positions = [
        -1.0,  1.0,
         1.0,  1.0,
        -1.0, -1.0,
         1.0, -1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(Positions),
        gl.STATIC_DRAW);

    return {
        vertexBuffer: positionBuffer,
    };
}

function main() {

    if (gl === null) {
        alert("Unable to initialize WebGL.");
        return;
    }

    console.log("WebGL initialized");

    const shaderProgram = initShaderProgram(vsSource, fsSource);
    if (!shaderProgram) {
        alert("Unable to create shader progam");
        return;
    }
    console.log("Shader program initialized");

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjMat"),
            MVP: gl.getUniformLocation(shaderProgram, "uMVP"),
            color: gl.getUniformLocation(shaderProgram, "uColor"),
        }
    };

    const buffers = initBuffers();
    if (!buffers) {
        alert("Unable to create a buffer");
        return;
    }
    console.log("Vertex buffer initialized");

    var mat = mat4.create();

    var red = 0.0, green = 0.0, blue = 0.0;
    var deltaRed = 1, deltaGreen = 1, deltaBlue = 1;
    function render() {
        red += 0.01 * 0.16 * deltaRed;
        green += 0.05 * 0.16 * deltaGreen;
        blue += 0.03 * 0.16 * deltaBlue;
        if (red > 1.0 || red < 0.0)
            deltaRed *= -1;
        if (green > 1.0 || green < 0.0)
            deltaGreen *= -1;
        if (blue > 1.0 || blue < 0.0)
            deltaBlue *= -1;
        gl.clearColor(red, green, blue, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fov = 45 * Math.PI / 180;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.create();

        mat4.perspective(projectionMatrix,
            fov, aspect, zNear, zFar);

        const MVP = mat4.create();
        mat4.translate(MVP, MVP, [0.0, 0.0, -6.0]);

        {
            const numComponents = 2;
            const type = gl.FLOAT;
            const normalized = false;
            const stride = 0;
            const offset = 0;

            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
            gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition,
                numComponents, type, normalized, stride, offset);
            gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
        }

        gl.useProgram(programInfo.program);

        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.MVP, false, MVP);
        gl.uniform4f(programInfo.uniformLocations.color, 1.0 - red, 1.0 - green, 1.0 - blue, 1.0);

        {
            const offset = 0;
            const vertexCount = 4;
            gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
        }

        requestAnimationFrame(render);
    };

    render();

}


main()
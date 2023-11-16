"use strict";
var canvas, gl;
let lastPosition = { x: innerWidth / 2, y: innerHeight / 2 };
let lastDistance = 0;

const gui = new dat.GUI();
const color = { r: 255, g: 255, b: 255 };
const colorFolder = gui.addFolder("Colors");
colorFolder.add(color, "r", 0, 255);
colorFolder.add(color, "g", 0, 255);
colorFolder.add(color, "b", 0, 255);
colorFolder.open();
function loadShaderAsync(shaderURL, callback) {
  var req = new XMLHttpRequest();
  req.open("GET", shaderURL, true);
  req.onload = function () {
    if (req.status < 200 || req.status >= 300) {
      callback("could Not load" + shaderURL);
    } else {
      callback(null, req.responseText);
    }
  };
  req.send();
}
function init() {
  if ("ontouchstart" in window || navigator.maxTouchPoints) {
  }
  async.map(
    {
      vsText: "./mandel.vs.glsl",
      fsText: "./mandel.fs.glsl",
    },
    loadShaderAsync,
    runDemo
  );
}
function runDemo(loadErrors, loadShaders) {
  // AttachCallBack
  addEvent(window, "resize", onResizeWindow);
  addEvent(window, "wheel", onZoom);
  addEvent(window, "mousemove", onMousemove);
  canvas = document.querySelector("canvas");
  gl = canvas.getContext("webgl2");
  if (!gl) {
    gl = canvas.getContext("webgl");
    if (!gl) {
      alert("Browser dosen't support webgl");
      return;
    }
  }
  let vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, loadShaders[0]);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    const compileError = gl.getShaderInfoLog(vertexShader);
    console.error(compileError);
  }
  let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, loadShaders[1]);
  gl.compileShader(fragmentShader);
  let mandelbrotProgram = gl.createProgram();
  gl.attachShader(mandelbrotProgram, vertexShader);
  gl.attachShader(mandelbrotProgram, fragmentShader);
  gl.linkProgram(mandelbrotProgram);
  if (!gl.getProgramParameter(mandelbrotProgram, gl.LINK_STATUS)) {
    console.error("failed to link" + gl.getProgramInfoLog(mandelbrotProgram));
  }
  gl.validateProgram(mandelbrotProgram);

  if (!gl.getProgramParameter(mandelbrotProgram, gl.VALIDATE_STATUS)) {
    console.error(
      "failed To validate" + gl.getProgramInfoLog(mandelbrotProgram)
    );
  }
  gl.useProgram(mandelbrotProgram);
  const uniforms = {
    viewportDimensions: gl.getUniformLocation(
      mandelbrotProgram,
      "viewportDimensions"
    ),
    minI: gl.getUniformLocation(mandelbrotProgram, "minI"),
    maxI: gl.getUniformLocation(mandelbrotProgram, "maxI"),
    minR: gl.getUniformLocation(mandelbrotProgram, "minR"),
    maxR: gl.getUniformLocation(mandelbrotProgram, "maxR"),
    color: gl.getUniformLocation(mandelbrotProgram, "userColors"),
  };
  if (
    uniforms.maxI == null ||
    uniforms.minI == null ||
    uniforms.minR == null ||
    uniforms.maxR == null ||
    uniforms.viewportDimensions == null ||
    uniforms.color == null
  ) {
    console.error("uniforms not found", uniforms);
  }
  let viewportDimensions = [canvas.width, canvas.height];
  let minI = -3.0;
  let maxI = +3.0;
  let minR = -3.0;
  let maxR = +3.0;
  let vertexBuffer = gl.createBuffer();
  let vertices = [-1, 1, -1, -1, 1, -1, -1, 1, 1, 1, 1, -1];
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  let vertexPosition = gl.getAttribLocation(
    mandelbrotProgram,
    "vertexPosition"
  );
  gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexPosition);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    const compileError = gl.getShaderInfoLog(fragmentShader);
    console.error(compileError);
  }
  function onResizeWindow() {
    if (!canvas) {
      return;
    }
    let size = innerWidth > innerHeight ? innerHeight : innerWidth;
    canvas.height = innerHeight;
    canvas.width = innerWidth;

    gl.viewport(0, 0, canvas.width, canvas.height);
    var oldRealRange = maxR - minR;
    maxR = ((maxI - minI) * canvas.width) / canvas.height + minR;
    var newRealRange = maxR - minR;

    minR -= (newRealRange - oldRealRange) / 2;
    maxR = ((maxI - minI) * canvas.width) / canvas.height + minR;
    viewportDimensions = [canvas.width, canvas.height];
  }
  let thisFrameTime;
  let lastFrameTime = performance.now();
  let dt;
  let lastPrintTime = performance.now();
  let frames = [];
  let loop = () => {
    thisFrameTime = performance.now();
    dt = thisFrameTime - lastFrameTime;
    frames.push(dt);
    if (lastPrintTime + 750 < thisFrameTime) {
      lastPrintTime = thisFrameTime;
      let avg = 0;
      for (let i = 0; i < frames.length; i++) {
        avg += frames[i];
      }
      avg /= frames.length;
    }
    lastFrameTime = thisFrameTime;
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.uniform2fv(uniforms.viewportDimensions, viewportDimensions);
    gl.uniform1f(uniforms.minI, minI);
    gl.uniform1f(uniforms.maxI, maxI);
    gl.uniform1f(uniforms.minR, minR);
    gl.uniform1f(uniforms.maxR, maxR);
    gl.uniform3f(uniforms.color, color.r / 255, color.g / 255, color.b / 255);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(loop);
  };
  function onZoom(e) {
    var imaginaryRange = maxI - minI;
    var newRange;
    if (e.deltaY < 0) {
      newRange = imaginaryRange * 0.95;
    } else if (e.deltaY > 0) {
      newRange = imaginaryRange * 1.05;
    }
    if (newRange) {
      var delta = newRange - imaginaryRange;

      minI -= delta / 2;
      maxI = minI + newRange;

      onResizeWindow();
    }
  }
  addEventListener("touchstart", (e) => {
    lastPosition.x = e.touches[0].clientX;
    lastPosition.y = e.touches[0].clientY;

    if (e.touches.length >= 2) {
      lastDistance = calculateDistance(e.touches[0], e.touches[1]);
    }
  });
  addEventListener("touchmove", (e) => {
    if (e.touches.length == 1) {
      e.preventDefault();

      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;

      e.movementX = x - lastPosition.x;
      e.movementY = y - lastPosition.y;
      lastPosition.x = x;
      lastPosition.y = y;
      onMousemove(e);
    }
    if (e.touches.length >= 2) {
      e.preventDefault();
      const currentDistance = calculateDistance(e.touches[0], e.touches[1]);
      e.deltaY = -currentDistance + lastDistance;
      lastDistance = currentDistance;
      onZoom(e);
    }
  });
  function calculateDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function onMousemove(e) {
    if (e.buttons === 1 || e.type == "touchmove") {
      var iRange = maxI - minI;
      var rRange = maxR - minR;

      var iDelta = (e.movementY / canvas.clientHeight) * iRange;
      var rDelta = (e.movementX / canvas.clientWidth) * rRange;

      minI += iDelta;
      maxI += iDelta;
      minR -= rDelta;
      maxR -= rDelta;
    }
  }
  onResizeWindow();

  loop();
}

function addEvent(object, type, callback) {
  if (object == null || typeof object == "undefined") return;
  if (object.addEventListener) {
    object.addEventListener(type, callback, false);
  } else if (object.attachEvent) {
    object.attachEvent("on" + type, callback);
  } else {
    object["on" + type] = callback;
  }
}

function removeEvent(object, type, callback) {
  if (object == null || typeof object == "undefined") return;
  if (object.removeEventListener) {
    object.removeEventListener(type, callback, false);
  } else if (object.detachEvent) {
    object.detachEvent("on" + type, callback);
  } else {
    object["on" + type] = callback;
  }
}
document.addEventListener("gesturestart", function (e) {
  e.preventDefault();
  // special hack to prevent zoom-to-tabs gesture in safari
  document.body.style.zoom = 0.99;
});

document.addEventListener("gesturechange", function (e) {
  e.preventDefault();
  // special hack to prevent zoom-to-tabs gesture in safari
  document.body.style.zoom = 0.99;
});

document.addEventListener("gestureend", function (e) {
  e.preventDefault();
  // special hack to prevent zoom-to-tabs gesture in safari
  document.body.style.zoom = 0.99;
});

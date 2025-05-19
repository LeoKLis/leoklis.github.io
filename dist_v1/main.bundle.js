/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _triangle_wgsl__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./triangle.wgsl */ "./src/triangle.wgsl");

// We get gpu and lib to work with
const adapter = await navigator.gpu?.requestAdapter();
const device = await adapter.requestDevice();
// We determine where to draw (canvas texture)
const canvas = document.getElementById("canvas");
const context = canvas.getContext('webgpu');
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
    device: device,
    format: canvasFormat,
});
const rand = (min, max) => {
    if (min === undefined) {
        min = 0;
        max = 1;
    }
    else if (max === undefined) {
        max = min;
        min = 0;
    }
    return min + Math.random() * (max - min);
};
const pipeline = device.createRenderPipeline({
    label: "triangle.wgsl triangle",
    layout: "auto",
    vertex: {
        module: device.createShaderModule({
            code: _triangle_wgsl__WEBPACK_IMPORTED_MODULE_0__["default"],
        }),
    },
    fragment: {
        module: device.createShaderModule({
            code: _triangle_wgsl__WEBPACK_IMPORTED_MODULE_0__["default"],
        }),
        targets: [{ format: canvasFormat, }],
    },
});
const uniformBufferSize = 4 * 4 * 3 + // array<vec4f, 3> color
    2 * 4 + // vec2f scale
    2 * 4; // vec2f offset
const kColorOffset = 0;
const kScaleOffset = 12;
const kOffsetOffset = 14;
const kNumObjects = 15;
const objectInfos = [];
for (let i = 0; i < kNumObjects; i++) {
    const uniformBuffer = device.createBuffer({
        label: `Uniform buffer for obj ${i}`,
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const uniformValues = new Float32Array(uniformBufferSize / 4);
    uniformValues.set([
        rand(0.5, 1.0), rand(0.0, 0.4), rand(0.0, 0.1), 1,
        rand(0.0, 0.1), rand(0.5, 1.0), rand(0.0, 0.4), 1,
        rand(0.0, 0.4), rand(0.0, 0.1), rand(0.5, 1.0), 1
    ], kColorOffset);
    uniformValues.set([rand(-0.8, 0.8), rand(-0.6, 0.6)], kOffsetOffset);
    const bindGroup = device.createBindGroup({
        label: `Bind group for obj ${i}`,
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
        ],
    });
    objectInfos.push({
        scale: 0.5,
        uniformBuffer,
        uniformValues,
        bindGroup,
    });
}
function render() {
    resizeCanvasToDisplaySize(canvas);
    const textureView = context.getCurrentTexture().createView();
    const renderPassDescriptor = {
        label: "basic canvas render pass",
        colorAttachments: [
            {
                view: textureView,
                clearValue: { r: 0.6, g: 0.6, b: 0.6, a: 1.0 },
                loadOp: 'load',
                storeOp: 'store',
            },
        ],
    };
    const commandEncoder = device?.createCommandEncoder();
    const pass = commandEncoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(pipeline);
    const aspect = canvas.width / canvas.height;
    for (const { scale, bindGroup, uniformBuffer, uniformValues } of objectInfos) {
        uniformValues.set([scale / aspect, scale], kScaleOffset);
        device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
        pass.setBindGroup(0, bindGroup);
        pass.draw(3, 1, 0, 0);
    }
    pass.end();
    const commandBuffer = commandEncoder.finish();
    device.queue.submit([commandBuffer]);
}
const canvasToSizeMap = new WeakMap();
function resizeCanvasToDisplaySize(canvas) {
    // Get the canvas's current display size
    let { width, height } = canvasToSizeMap.get(canvas) || canvas;
    // Make sure it's valid for WebGPU
    width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
    height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
    // Only if the size is different, set the canvas size
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        canvas.width = width;
        canvas.height = height;
    }
    return needResize;
}
const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
        canvasToSizeMap.set(entry.target, {
            width: entry.devicePixelContentBoxSize[0].inlineSize,
            height: entry.devicePixelContentBoxSize[0].blockSize,
        });
    }
    render();
});
observer.observe(canvas);

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1);

/***/ }),

/***/ "./src/triangle.wgsl":
/*!***************************!*\
  !*** ./src/triangle.wgsl ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ("struct Attributes {\r\n    color: array<vec4f, 3>,\r\n    scale: vec2f,\r\n    offset: vec2f,\r\n}\r\n\r\n@group(0) @binding(0) var<uniform> attrs: Attributes;\r\n\r\nstruct Gradient {\r\n    @builtin(position) position : vec4f,\r\n    @location(0) color : vec4f,\r\n};\r\n\r\n@vertex\r\nfn vert(@builtin(vertex_index) vertexIndex: u32) -> Gradient {\r\n    var pos = array(\r\n        vec2f(0.0, 0.2),\r\n        vec2f(-0.5, -0.5),\r\n        vec2f(0.5,-0.5),\r\n    );\r\n\r\n    var out: Gradient;\r\n    out.position = vec4f(pos[vertexIndex] * attrs.scale + attrs.offset, 0.0, 1.0);\r\n    out.color = attrs.color[vertexIndex];\r\n    return out;\r\n}\r\n\r\n@fragment\r\nfn frag(grad: Gradient) -> @location(0) vec4f {\r\n    return grad.color;\r\n}\r\n");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/async module */
/******/ 	(() => {
/******/ 		var webpackQueues = typeof Symbol === "function" ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 		var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 		var webpackError = typeof Symbol === "function" ? Symbol("webpack error") : "__webpack_error__";
/******/ 		var resolveQueue = (queue) => {
/******/ 			if(queue && queue.d < 1) {
/******/ 				queue.d = 1;
/******/ 				queue.forEach((fn) => (fn.r--));
/******/ 				queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 			}
/******/ 		}
/******/ 		var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 			if(dep !== null && typeof dep === "object") {
/******/ 				if(dep[webpackQueues]) return dep;
/******/ 				if(dep.then) {
/******/ 					var queue = [];
/******/ 					queue.d = 0;
/******/ 					dep.then((r) => {
/******/ 						obj[webpackExports] = r;
/******/ 						resolveQueue(queue);
/******/ 					}, (e) => {
/******/ 						obj[webpackError] = e;
/******/ 						resolveQueue(queue);
/******/ 					});
/******/ 					var obj = {};
/******/ 					obj[webpackQueues] = (fn) => (fn(queue));
/******/ 					return obj;
/******/ 				}
/******/ 			}
/******/ 			var ret = {};
/******/ 			ret[webpackQueues] = x => {};
/******/ 			ret[webpackExports] = dep;
/******/ 			return ret;
/******/ 		}));
/******/ 		__webpack_require__.a = (module, body, hasAwait) => {
/******/ 			var queue;
/******/ 			hasAwait && ((queue = []).d = -1);
/******/ 			var depQueues = new Set();
/******/ 			var exports = module.exports;
/******/ 			var currentDeps;
/******/ 			var outerResolve;
/******/ 			var reject;
/******/ 			var promise = new Promise((resolve, rej) => {
/******/ 				reject = rej;
/******/ 				outerResolve = resolve;
/******/ 			});
/******/ 			promise[webpackExports] = exports;
/******/ 			promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 			module.exports = promise;
/******/ 			body((deps) => {
/******/ 				currentDeps = wrapDeps(deps);
/******/ 				var fn;
/******/ 				var getResult = () => (currentDeps.map((d) => {
/******/ 					if(d[webpackError]) throw d[webpackError];
/******/ 					return d[webpackExports];
/******/ 				}))
/******/ 				var promise = new Promise((resolve) => {
/******/ 					fn = () => (resolve(getResult));
/******/ 					fn.r = 0;
/******/ 					var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 					currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 				});
/******/ 				return fn.r ? promise : getResult();
/******/ 			}, (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue)));
/******/ 			queue && queue.d < 0 && (queue.d = 0);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module used 'module' so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.bundle.js.map
"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-docker";
exports.ids = ["vendor-chunks/is-docker"];
exports.modules = {

/***/ "(rsc)/./node_modules/is-docker/index.js":
/*!*****************************************!*\
  !*** ./node_modules/is-docker/index.js ***!
  \*****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ isDocker)\n/* harmony export */ });\n/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:fs */ \"node:fs\");\n\n\nlet isDockerCached;\n\nfunction hasDockerEnv() {\n\ttry {\n\t\tnode_fs__WEBPACK_IMPORTED_MODULE_0__.statSync('/.dockerenv');\n\t\treturn true;\n\t} catch {\n\t\treturn false;\n\t}\n}\n\nfunction hasDockerCGroup() {\n\ttry {\n\t\treturn node_fs__WEBPACK_IMPORTED_MODULE_0__.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');\n\t} catch {\n\t\treturn false;\n\t}\n}\n\nfunction isDocker() {\n\t// TODO: Use `??=` when targeting Node.js 16.\n\tif (isDockerCached === undefined) {\n\t\tisDockerCached = hasDockerEnv() || hasDockerCGroup();\n\t}\n\n\treturn isDockerCached;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaXMtZG9ja2VyL2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQXlCOztBQUV6Qjs7QUFFQTtBQUNBO0FBQ0EsRUFBRSw2Q0FBVztBQUNiO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsU0FBUyxpREFBZTtBQUN4QixHQUFHO0FBQ0g7QUFDQTtBQUNBOztBQUVlO0FBQ2Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL215LXYwLXByb2plY3QvLi9ub2RlX21vZHVsZXMvaXMtZG9ja2VyL2luZGV4LmpzPzdjZTEiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xuXG5sZXQgaXNEb2NrZXJDYWNoZWQ7XG5cbmZ1bmN0aW9uIGhhc0RvY2tlckVudigpIHtcblx0dHJ5IHtcblx0XHRmcy5zdGF0U3luYygnLy5kb2NrZXJlbnYnKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaCB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGhhc0RvY2tlckNHcm91cCgpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gZnMucmVhZEZpbGVTeW5jKCcvcHJvYy9zZWxmL2Nncm91cCcsICd1dGY4JykuaW5jbHVkZXMoJ2RvY2tlcicpO1xuXHR9IGNhdGNoIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaXNEb2NrZXIoKSB7XG5cdC8vIFRPRE86IFVzZSBgPz89YCB3aGVuIHRhcmdldGluZyBOb2RlLmpzIDE2LlxuXHRpZiAoaXNEb2NrZXJDYWNoZWQgPT09IHVuZGVmaW5lZCkge1xuXHRcdGlzRG9ja2VyQ2FjaGVkID0gaGFzRG9ja2VyRW52KCkgfHwgaGFzRG9ja2VyQ0dyb3VwKCk7XG5cdH1cblxuXHRyZXR1cm4gaXNEb2NrZXJDYWNoZWQ7XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/is-docker/index.js\n");

/***/ })

};
;
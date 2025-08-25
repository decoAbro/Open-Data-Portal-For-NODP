"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/default-browser-id";
exports.ids = ["vendor-chunks/default-browser-id"];
exports.modules = {

/***/ "(rsc)/./node_modules/default-browser-id/index.js":
/*!**************************************************!*\
  !*** ./node_modules/default-browser-id/index.js ***!
  \**************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ defaultBrowserId)\n/* harmony export */ });\n/* harmony import */ var node_util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:util */ \"node:util\");\n/* harmony import */ var node_process__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! node:process */ \"node:process\");\n/* harmony import */ var node_child_process__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! node:child_process */ \"node:child_process\");\n\n\n\n\nconst execFileAsync = (0,node_util__WEBPACK_IMPORTED_MODULE_0__.promisify)(node_child_process__WEBPACK_IMPORTED_MODULE_2__.execFile);\n\nasync function defaultBrowserId() {\n\tif (node_process__WEBPACK_IMPORTED_MODULE_1__.platform !== 'darwin') {\n\t\tthrow new Error('macOS only');\n\t}\n\n\tconst {stdout} = await execFileAsync('defaults', ['read', 'com.apple.LaunchServices/com.apple.launchservices.secure', 'LSHandlers']);\n\n\t// `(?!-)` is to prevent matching `LSHandlerRoleAll = \"-\";`.\n\tconst match = /LSHandlerRoleAll = \"(?!-)(?<id>[^\"]+?)\";\\s+?LSHandlerURLScheme = (?:http|https);/.exec(stdout);\n\n\treturn match?.groups.id ?? 'com.apple.Safari';\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZGVmYXVsdC1icm93c2VyLWlkL2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBb0M7QUFDRDtBQUNTOztBQUU1QyxzQkFBc0Isb0RBQVMsQ0FBQyx3REFBUTs7QUFFekI7QUFDZixLQUFLLGtEQUFnQjtBQUNyQjtBQUNBOztBQUVBLFFBQVEsUUFBUTs7QUFFaEIsMkRBQTJEO0FBQzNELHdEQUF3RCx3Q0FBd0M7O0FBRWhHO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9teS12MC1wcm9qZWN0Ly4vbm9kZV9tb2R1bGVzL2RlZmF1bHQtYnJvd3Nlci1pZC9pbmRleC5qcz9lYTczIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7cHJvbWlzaWZ5fSBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IHByb2Nlc3MgZnJvbSAnbm9kZTpwcm9jZXNzJztcbmltcG9ydCB7ZXhlY0ZpbGV9IGZyb20gJ25vZGU6Y2hpbGRfcHJvY2Vzcyc7XG5cbmNvbnN0IGV4ZWNGaWxlQXN5bmMgPSBwcm9taXNpZnkoZXhlY0ZpbGUpO1xuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBkZWZhdWx0QnJvd3NlcklkKCkge1xuXHRpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ2RhcndpbicpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ21hY09TIG9ubHknKTtcblx0fVxuXG5cdGNvbnN0IHtzdGRvdXR9ID0gYXdhaXQgZXhlY0ZpbGVBc3luYygnZGVmYXVsdHMnLCBbJ3JlYWQnLCAnY29tLmFwcGxlLkxhdW5jaFNlcnZpY2VzL2NvbS5hcHBsZS5sYXVuY2hzZXJ2aWNlcy5zZWN1cmUnLCAnTFNIYW5kbGVycyddKTtcblxuXHQvLyBgKD8hLSlgIGlzIHRvIHByZXZlbnQgbWF0Y2hpbmcgYExTSGFuZGxlclJvbGVBbGwgPSBcIi1cIjtgLlxuXHRjb25zdCBtYXRjaCA9IC9MU0hhbmRsZXJSb2xlQWxsID0gXCIoPyEtKSg/PGlkPlteXCJdKz8pXCI7XFxzKz9MU0hhbmRsZXJVUkxTY2hlbWUgPSAoPzpodHRwfGh0dHBzKTsvLmV4ZWMoc3Rkb3V0KTtcblxuXHRyZXR1cm4gbWF0Y2g/Lmdyb3Vwcy5pZCA/PyAnY29tLmFwcGxlLlNhZmFyaSc7XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/default-browser-id/index.js\n");

/***/ })

};
;
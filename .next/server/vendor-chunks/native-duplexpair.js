"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/native-duplexpair";
exports.ids = ["vendor-chunks/native-duplexpair"];
exports.modules = {

/***/ "(rsc)/./node_modules/native-duplexpair/index.js":
/*!*************************************************!*\
  !*** ./node_modules/native-duplexpair/index.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nconst Duplex = (__webpack_require__(/*! stream */ \"stream\").Duplex);\n\nconst kCallback = Symbol('Callback');\nconst kOtherSide = Symbol('Other');\n\nclass DuplexSocket extends Duplex {\n  constructor(options) {\n    super(options);\n    this[kCallback] = null;\n    this[kOtherSide] = null;\n  }\n\n  _read() {\n    const callback = this[kCallback];\n    if (callback) {\n      this[kCallback] = null;\n      callback();\n    }\n  }\n\n  _write(chunk, encoding, callback) {\n    this[kOtherSide][kCallback] = callback;\n    this[kOtherSide].push(chunk);\n  }\n\n  _final(callback) {\n    this[kOtherSide].on('end', callback);\n    this[kOtherSide].push(null);\n  }\n}\n\nclass DuplexPair {\n  constructor(options) {\n    this.socket1 = new DuplexSocket(options);\n    this.socket2 = new DuplexSocket(options);\n    this.socket1[kOtherSide] = this.socket2;\n    this.socket2[kOtherSide] = this.socket1;\n  }\n}\n\nmodule.exports = DuplexPair;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmF0aXZlLWR1cGxleHBhaXIvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQWE7QUFDYixlQUFlLG9EQUF3Qjs7QUFFdkM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbXktdjAtcHJvamVjdC8uL25vZGVfbW9kdWxlcy9uYXRpdmUtZHVwbGV4cGFpci9pbmRleC5qcz8zNjllIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbmNvbnN0IER1cGxleCA9IHJlcXVpcmUoJ3N0cmVhbScpLkR1cGxleDtcblxuY29uc3Qga0NhbGxiYWNrID0gU3ltYm9sKCdDYWxsYmFjaycpO1xuY29uc3Qga090aGVyU2lkZSA9IFN5bWJvbCgnT3RoZXInKTtcblxuY2xhc3MgRHVwbGV4U29ja2V0IGV4dGVuZHMgRHVwbGV4IHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgIHRoaXNba0NhbGxiYWNrXSA9IG51bGw7XG4gICAgdGhpc1trT3RoZXJTaWRlXSA9IG51bGw7XG4gIH1cblxuICBfcmVhZCgpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9IHRoaXNba0NhbGxiYWNrXTtcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIHRoaXNba0NhbGxiYWNrXSA9IG51bGw7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfVxuXG4gIF93cml0ZShjaHVuaywgZW5jb2RpbmcsIGNhbGxiYWNrKSB7XG4gICAgdGhpc1trT3RoZXJTaWRlXVtrQ2FsbGJhY2tdID0gY2FsbGJhY2s7XG4gICAgdGhpc1trT3RoZXJTaWRlXS5wdXNoKGNodW5rKTtcbiAgfVxuXG4gIF9maW5hbChjYWxsYmFjaykge1xuICAgIHRoaXNba090aGVyU2lkZV0ub24oJ2VuZCcsIGNhbGxiYWNrKTtcbiAgICB0aGlzW2tPdGhlclNpZGVdLnB1c2gobnVsbCk7XG4gIH1cbn1cblxuY2xhc3MgRHVwbGV4UGFpciB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICB0aGlzLnNvY2tldDEgPSBuZXcgRHVwbGV4U29ja2V0KG9wdGlvbnMpO1xuICAgIHRoaXMuc29ja2V0MiA9IG5ldyBEdXBsZXhTb2NrZXQob3B0aW9ucyk7XG4gICAgdGhpcy5zb2NrZXQxW2tPdGhlclNpZGVdID0gdGhpcy5zb2NrZXQyO1xuICAgIHRoaXMuc29ja2V0MltrT3RoZXJTaWRlXSA9IHRoaXMuc29ja2V0MTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IER1cGxleFBhaXI7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/native-duplexpair/index.js\n");

/***/ })

};
;
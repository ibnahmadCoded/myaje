"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/dashboard/page",{

/***/ "(app-pages-browser)/./src/app/dashboard/page.js":
/*!***********************************!*\
  !*** ./src/app/dashboard/page.js ***!
  \***********************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _components_ui_usermenu__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/components/ui/usermenu */ \"(app-pages-browser)/./src/components/ui/usermenu.js\");\n/* harmony import */ var _barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,LayoutGrid,LineChart,Menu,Package,Store,User!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/layout-grid.js\");\n/* harmony import */ var _barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,LayoutGrid,LineChart,Menu,Package,Store,User!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/package.js\");\n/* harmony import */ var _barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,LayoutGrid,LineChart,Menu,Package,Store,User!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/store.js\");\n/* harmony import */ var _barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,LayoutGrid,LineChart,Menu,Package,Store,User!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/chart-line.js\");\n/* harmony import */ var _barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,LayoutGrid,LineChart,Menu,Package,Store,User!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/bell.js\");\n/* harmony import */ var _barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! __barrel_optimize__?names=Bell,LayoutGrid,LineChart,Menu,Package,Store,User!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/menu.js\");\n/* __next_internal_client_entry_do_not_use__ default auto */ \nvar _s = $RefreshSig$();\n\n\n\nconst DashboardLayout = (param)=>{\n    let { children } = param;\n    _s();\n    const [isSidebarOpen, setIsSidebarOpen] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    const sidebarRef = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)(null);\n    // Detect mobile view\n    const [isMobile, setIsMobile] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)({\n        \"DashboardLayout.useEffect\": ()=>{\n            const checkMobileView = {\n                \"DashboardLayout.useEffect.checkMobileView\": ()=>{\n                    const isMobileWidth = window.innerWidth <= 768;\n                    setIsMobile(isMobileWidth);\n                    // On mobile, sidebar is closed by default\n                    // On desktop, sidebar remains closed\n                    if (isMobileWidth) {\n                        setIsSidebarOpen(false);\n                    }\n                }\n            }[\"DashboardLayout.useEffect.checkMobileView\"];\n            // Check initial screen size\n            checkMobileView();\n            // Add event listener for window resize\n            window.addEventListener('resize', checkMobileView);\n            // Cleanup event listener\n            return ({\n                \"DashboardLayout.useEffect\": ()=>window.removeEventListener('resize', checkMobileView)\n            })[\"DashboardLayout.useEffect\"];\n        }\n    }[\"DashboardLayout.useEffect\"], []);\n    const menuItems = [\n        {\n            icon: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_3__[\"default\"], {\n                size: 20\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                lineNumber: 45,\n                columnNumber: 13\n            }, undefined),\n            label: 'Dashboard',\n            href: '/dashboard'\n        },\n        {\n            icon: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_4__[\"default\"], {\n                size: 20\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                lineNumber: 46,\n                columnNumber: 13\n            }, undefined),\n            label: 'Inventory',\n            href: '/inventory'\n        },\n        {\n            icon: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_5__[\"default\"], {\n                size: 20\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                lineNumber: 47,\n                columnNumber: 13\n            }, undefined),\n            label: 'Storefront',\n            href: '/storefront'\n        },\n        {\n            icon: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_6__[\"default\"], {\n                size: 20\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                lineNumber: 48,\n                columnNumber: 13\n            }, undefined),\n            label: 'Accounting',\n            href: '/accounting'\n        }\n    ];\n    // Hover logic for desktop\n    const handleMouseEnter = ()=>{\n        if (!isMobile) {\n            setIsSidebarOpen(true);\n        }\n    };\n    const handleMouseLeave = ()=>{\n        if (!isMobile) {\n            setIsSidebarOpen(false);\n        }\n    };\n    // Determine sidebar visibility and width\n    const sidebarVisibility = isSidebarOpen ? 'translate-x-0' : '-translate-x-full';\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        className: \"min-h-screen bg-green-50\",\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                ref: sidebarRef,\n                className: \"fixed top-0 left-0 h-full bg-green-50/40 shadow-lg transition-transform duration-300 w-64 z-40 ease-in-out \".concat(sidebarVisibility),\n                onMouseEnter: handleMouseEnter,\n                onMouseLeave: handleMouseLeave,\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                        className: \"flex items-center justify-between p-4\",\n                        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"h1\", {\n                            className: \"font-bold text-xl\",\n                            children: \"Myaje Suite\"\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                            lineNumber: 79,\n                            columnNumber: 11\n                        }, undefined)\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                        lineNumber: 78,\n                        columnNumber: 9\n                    }, undefined),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"nav\", {\n                        className: \"mt-8\",\n                        children: menuItems.map((item, index)=>/*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"a\", {\n                                href: item.href,\n                                className: \"flex items-center px-4 py-3 text-gray-700 hover:bg-amber-100\",\n                                children: [\n                                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                                        className: \"mr-3\",\n                                        children: item.icon\n                                    }, void 0, false, {\n                                        fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                                        lineNumber: 89,\n                                        columnNumber: 15\n                                    }, undefined),\n                                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                                        children: item.label\n                                    }, void 0, false, {\n                                        fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                                        lineNumber: 90,\n                                        columnNumber: 15\n                                    }, undefined)\n                                ]\n                            }, index, true, {\n                                fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                                lineNumber: 84,\n                                columnNumber: 13\n                            }, undefined))\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                        lineNumber: 82,\n                        columnNumber: 9\n                    }, undefined),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                        className: \"px-4 py-2\",\n                        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                            className: \"flex items-center justify-between text-gray-700\",\n                            children: [\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                                    className: \"text-sm font-medium\",\n                                    children: \"Notifications\"\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                                    lineNumber: 98,\n                                    columnNumber: 13\n                                }, undefined),\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                                    className: \"p-2 hover:bg-green-100 rounded-full\",\n                                    children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_7__[\"default\"], {\n                                        size: 20\n                                    }, void 0, false, {\n                                        fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                                        lineNumber: 100,\n                                        columnNumber: 15\n                                    }, undefined)\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                                    lineNumber: 99,\n                                    columnNumber: 13\n                                }, undefined)\n                            ]\n                        }, void 0, true, {\n                            fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                            lineNumber: 97,\n                            columnNumber: 11\n                        }, undefined)\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                        lineNumber: 96,\n                        columnNumber: 9\n                    }, undefined),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_ui_usermenu__WEBPACK_IMPORTED_MODULE_2__.UserMenu, {}, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                        lineNumber: 105,\n                        columnNumber: 9\n                    }, undefined)\n                ]\n            }, void 0, true, {\n                fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                lineNumber: 72,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"fixed top-0 left-0 w-10 h-full z-30\",\n                onMouseEnter: handleMouseEnter\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                lineNumber: 109,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"transition-all duration-300 \".concat(isSidebarOpen ? 'ml-64' : 'ml-0'),\n                children: [\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"header\", {\n                        className: \"bg-green-50\",\n                        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                            className: \"flex items-center justify-between px-6 py-4\",\n                            children: isMobile && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"button\", {\n                                onClick: ()=>setIsSidebarOpen(!isSidebarOpen),\n                                className: \"p-2 rounded-lg hover:bg-green-100\",\n                                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Bell_LayoutGrid_LineChart_Menu_Package_Store_User_lucide_react__WEBPACK_IMPORTED_MODULE_8__[\"default\"], {\n                                    size: 20\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                                    lineNumber: 124,\n                                    columnNumber: 17\n                                }, undefined)\n                            }, void 0, false, {\n                                fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                                lineNumber: 120,\n                                columnNumber: 15\n                            }, undefined)\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                            lineNumber: 118,\n                            columnNumber: 11\n                        }, undefined)\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                        lineNumber: 117,\n                        columnNumber: 9\n                    }, undefined),\n                    /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"main\", {\n                        className: \"p-6\",\n                        children: children\n                    }, void 0, false, {\n                        fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                        lineNumber: 131,\n                        columnNumber: 9\n                    }, undefined)\n                ]\n            }, void 0, true, {\n                fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n                lineNumber: 115,\n                columnNumber: 7\n            }, undefined)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\Users\\\\LENOVO\\\\Desktop\\\\myaje\\\\frontend\\\\src\\\\app\\\\dashboard\\\\page.js\",\n        lineNumber: 70,\n        columnNumber: 5\n    }, undefined);\n};\n_s(DashboardLayout, \"uJbeIHw7zXLdcwR5N5I5l0aRWqA=\");\n_c = DashboardLayout;\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (DashboardLayout);\nvar _c;\n$RefreshReg$(_c, \"DashboardLayout\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL3NyYy9hcHAvZGFzaGJvYXJkL3BhZ2UuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUUyRDtBQUNQO0FBUzlCO0FBRXRCLE1BQU1ZLGtCQUFrQjtRQUFDLEVBQUVDLFFBQVEsRUFBRTs7SUFDbkMsTUFBTSxDQUFDQyxlQUFlQyxpQkFBaUIsR0FBR2QsK0NBQVFBLENBQUM7SUFDbkQsTUFBTWUsYUFBYWQsNkNBQU1BLENBQUM7SUFFMUIscUJBQXFCO0lBQ3JCLE1BQU0sQ0FBQ2UsVUFBVUMsWUFBWSxHQUFHakIsK0NBQVFBLENBQUM7SUFFekNFLGdEQUFTQTtxQ0FBQztZQUNSLE1BQU1nQjs2REFBa0I7b0JBQ3RCLE1BQU1DLGdCQUFnQkMsT0FBT0MsVUFBVSxJQUFJO29CQUMzQ0osWUFBWUU7b0JBRVosMENBQTBDO29CQUMxQyxxQ0FBcUM7b0JBQ3JDLElBQUlBLGVBQWU7d0JBQ2pCTCxpQkFBaUI7b0JBQ25CO2dCQUNGOztZQUVBLDRCQUE0QjtZQUM1Qkk7WUFFQSx1Q0FBdUM7WUFDdkNFLE9BQU9FLGdCQUFnQixDQUFDLFVBQVVKO1lBRWxDLHlCQUF5QjtZQUN6Qjs2Q0FBTyxJQUFNRSxPQUFPRyxtQkFBbUIsQ0FBQyxVQUFVTDs7UUFDcEQ7b0NBQUcsRUFBRTtJQUVMLE1BQU1NLFlBQVk7UUFDaEI7WUFBRUMsb0JBQU0sOERBQUNyQiw2SEFBVUE7Z0JBQUNzQixNQUFNOzs7Ozs7WUFBUUMsT0FBTztZQUFhQyxNQUFNO1FBQWE7UUFDekU7WUFBRUgsb0JBQU0sOERBQUNwQiw2SEFBT0E7Z0JBQUNxQixNQUFNOzs7Ozs7WUFBUUMsT0FBTztZQUFhQyxNQUFNO1FBQWE7UUFDdEU7WUFBRUgsb0JBQU0sOERBQUNuQiw2SEFBS0E7Z0JBQUNvQixNQUFNOzs7Ozs7WUFBUUMsT0FBTztZQUFjQyxNQUFNO1FBQWM7UUFDdEU7WUFBRUgsb0JBQU0sOERBQUNsQiw2SEFBU0E7Z0JBQUNtQixNQUFNOzs7Ozs7WUFBUUMsT0FBTztZQUFjQyxNQUFNO1FBQWM7S0FDM0U7SUFFRCwwQkFBMEI7SUFDMUIsTUFBTUMsbUJBQW1CO1FBQ3ZCLElBQUksQ0FBQ2IsVUFBVTtZQUNiRixpQkFBaUI7UUFDbkI7SUFDRjtJQUVBLE1BQU1nQixtQkFBbUI7UUFDdkIsSUFBSSxDQUFDZCxVQUFVO1lBQ2JGLGlCQUFpQjtRQUNuQjtJQUNGO0lBRUEseUNBQXlDO0lBQ3pDLE1BQU1pQixvQkFBb0JsQixnQkFDdEIsa0JBQ0E7SUFFSixxQkFDRSw4REFBQ21CO1FBQUlDLFdBQVU7OzBCQUViLDhEQUFDRDtnQkFDQ0UsS0FBS25CO2dCQUNMa0IsV0FBVyw4R0FBZ0ksT0FBbEJGO2dCQUN6SEksY0FBY047Z0JBQ2RPLGNBQWNOOztrQ0FFZCw4REFBQ0U7d0JBQUlDLFdBQVU7a0NBQ2IsNEVBQUNJOzRCQUFHSixXQUFVO3NDQUFvQjs7Ozs7Ozs7Ozs7a0NBR3BDLDhEQUFDSzt3QkFBSUwsV0FBVTtrQ0FDWlQsVUFBVWUsR0FBRyxDQUFDLENBQUNDLE1BQU1DLHNCQUNwQiw4REFBQ0M7Z0NBRUNkLE1BQU1ZLEtBQUtaLElBQUk7Z0NBQ2ZLLFdBQVU7O2tEQUVWLDhEQUFDVTt3Q0FBS1YsV0FBVTtrREFBUU8sS0FBS2YsSUFBSTs7Ozs7O2tEQUNqQyw4REFBQ2tCO2tEQUFNSCxLQUFLYixLQUFLOzs7Ozs7OytCQUxaYzs7Ozs7Ozs7OztrQ0FXWCw4REFBQ1Q7d0JBQUlDLFdBQVU7a0NBQ2IsNEVBQUNEOzRCQUFJQyxXQUFVOzs4Q0FDYiw4REFBQ1U7b0NBQUtWLFdBQVU7OENBQXNCOzs7Ozs7OENBQ3RDLDhEQUFDVztvQ0FBT1gsV0FBVTs4Q0FDaEIsNEVBQUN4Qiw2SEFBSUE7d0NBQUNpQixNQUFNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tDQUtsQiw4REFBQ3ZCLDZEQUFRQTs7Ozs7Ozs7Ozs7MEJBSVgsOERBQUM2QjtnQkFDQ0MsV0FBWTtnQkFDWkUsY0FBY047Ozs7OzswQkFJaEIsOERBQUNHO2dCQUFJQyxXQUFXLCtCQUFnRSxPQUFqQ3BCLGdCQUFnQixVQUFVOztrQ0FFdkUsOERBQUNnQzt3QkFBT1osV0FBVTtrQ0FDaEIsNEVBQUNEOzRCQUFJQyxXQUFVO3NDQUNaakIsMEJBQ0MsOERBQUM0QjtnQ0FDQ0UsU0FBUyxJQUFNaEMsaUJBQWlCLENBQUNEO2dDQUNqQ29CLFdBQVU7MENBRVYsNEVBQUN6Qiw2SEFBSUE7b0NBQUNrQixNQUFNOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0NBT3BCLDhEQUFDcUI7d0JBQUtkLFdBQVU7a0NBQ2JyQjs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS1g7R0ExSE1EO0tBQUFBO0FBNEhOLGlFQUFlQSxlQUFlQSxFQUFDIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXExFTk9WT1xcRGVza3RvcFxcbXlhamVcXGZyb250ZW5kXFxzcmNcXGFwcFxcZGFzaGJvYXJkXFxwYWdlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2UgY2xpZW50JztcclxuXHJcbmltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlUmVmLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IFVzZXJNZW51IH0gZnJvbSAnQC9jb21wb25lbnRzL3VpL3VzZXJtZW51JztcclxuaW1wb3J0IHsgXHJcbiAgTGF5b3V0R3JpZCwgXHJcbiAgUGFja2FnZSwgXHJcbiAgU3RvcmUsIFxyXG4gIExpbmVDaGFydCxcclxuICBNZW51LFxyXG4gIEJlbGwsXHJcbiAgVXNlclxyXG59IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XHJcblxyXG5jb25zdCBEYXNoYm9hcmRMYXlvdXQgPSAoeyBjaGlsZHJlbiB9KSA9PiB7XHJcbiAgY29uc3QgW2lzU2lkZWJhck9wZW4sIHNldElzU2lkZWJhck9wZW5dID0gdXNlU3RhdGUoZmFsc2UpO1xyXG4gIGNvbnN0IHNpZGViYXJSZWYgPSB1c2VSZWYobnVsbCk7XHJcblxyXG4gIC8vIERldGVjdCBtb2JpbGUgdmlld1xyXG4gIGNvbnN0IFtpc01vYmlsZSwgc2V0SXNNb2JpbGVdID0gdXNlU3RhdGUoZmFsc2UpO1xyXG5cclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgY29uc3QgY2hlY2tNb2JpbGVWaWV3ID0gKCkgPT4ge1xyXG4gICAgICBjb25zdCBpc01vYmlsZVdpZHRoID0gd2luZG93LmlubmVyV2lkdGggPD0gNzY4O1xyXG4gICAgICBzZXRJc01vYmlsZShpc01vYmlsZVdpZHRoKTtcclxuICAgICAgXHJcbiAgICAgIC8vIE9uIG1vYmlsZSwgc2lkZWJhciBpcyBjbG9zZWQgYnkgZGVmYXVsdFxyXG4gICAgICAvLyBPbiBkZXNrdG9wLCBzaWRlYmFyIHJlbWFpbnMgY2xvc2VkXHJcbiAgICAgIGlmIChpc01vYmlsZVdpZHRoKSB7XHJcbiAgICAgICAgc2V0SXNTaWRlYmFyT3BlbihmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gQ2hlY2sgaW5pdGlhbCBzY3JlZW4gc2l6ZVxyXG4gICAgY2hlY2tNb2JpbGVWaWV3KCk7XHJcblxyXG4gICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciB3aW5kb3cgcmVzaXplXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgY2hlY2tNb2JpbGVWaWV3KTtcclxuXHJcbiAgICAvLyBDbGVhbnVwIGV2ZW50IGxpc3RlbmVyXHJcbiAgICByZXR1cm4gKCkgPT4gd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGNoZWNrTW9iaWxlVmlldyk7XHJcbiAgfSwgW10pO1xyXG5cclxuICBjb25zdCBtZW51SXRlbXMgPSBbXHJcbiAgICB7IGljb246IDxMYXlvdXRHcmlkIHNpemU9ezIwfSAvPiwgbGFiZWw6ICdEYXNoYm9hcmQnLCBocmVmOiAnL2Rhc2hib2FyZCcgfSxcclxuICAgIHsgaWNvbjogPFBhY2thZ2Ugc2l6ZT17MjB9IC8+LCBsYWJlbDogJ0ludmVudG9yeScsIGhyZWY6ICcvaW52ZW50b3J5JyB9LFxyXG4gICAgeyBpY29uOiA8U3RvcmUgc2l6ZT17MjB9IC8+LCBsYWJlbDogJ1N0b3JlZnJvbnQnLCBocmVmOiAnL3N0b3JlZnJvbnQnIH0sXHJcbiAgICB7IGljb246IDxMaW5lQ2hhcnQgc2l6ZT17MjB9IC8+LCBsYWJlbDogJ0FjY291bnRpbmcnLCBocmVmOiAnL2FjY291bnRpbmcnIH0sXHJcbiAgXTtcclxuXHJcbiAgLy8gSG92ZXIgbG9naWMgZm9yIGRlc2t0b3BcclxuICBjb25zdCBoYW5kbGVNb3VzZUVudGVyID0gKCkgPT4ge1xyXG4gICAgaWYgKCFpc01vYmlsZSkge1xyXG4gICAgICBzZXRJc1NpZGViYXJPcGVuKHRydWUpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGhhbmRsZU1vdXNlTGVhdmUgPSAoKSA9PiB7XHJcbiAgICBpZiAoIWlzTW9iaWxlKSB7XHJcbiAgICAgIHNldElzU2lkZWJhck9wZW4oZmFsc2UpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8vIERldGVybWluZSBzaWRlYmFyIHZpc2liaWxpdHkgYW5kIHdpZHRoXHJcbiAgY29uc3Qgc2lkZWJhclZpc2liaWxpdHkgPSBpc1NpZGViYXJPcGVuIFxyXG4gICAgPyAndHJhbnNsYXRlLXgtMCcgXHJcbiAgICA6ICctdHJhbnNsYXRlLXgtZnVsbCc7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi1oLXNjcmVlbiBiZy1ncmVlbi01MFwiPlxyXG4gICAgICB7LyogU2lkZWJhciAqL31cclxuICAgICAgPGRpdiBcclxuICAgICAgICByZWY9e3NpZGViYXJSZWZ9XHJcbiAgICAgICAgY2xhc3NOYW1lPXtgZml4ZWQgdG9wLTAgbGVmdC0wIGgtZnVsbCBiZy1ncmVlbi01MC80MCBzaGFkb3ctbGcgdHJhbnNpdGlvbi10cmFuc2Zvcm0gZHVyYXRpb24tMzAwIHctNjQgei00MCBlYXNlLWluLW91dCAke3NpZGViYXJWaXNpYmlsaXR5fWB9XHJcbiAgICAgICAgb25Nb3VzZUVudGVyPXtoYW5kbGVNb3VzZUVudGVyfVxyXG4gICAgICAgIG9uTW91c2VMZWF2ZT17aGFuZGxlTW91c2VMZWF2ZX1cclxuICAgICAgPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHAtNFwiPlxyXG4gICAgICAgICAgPGgxIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXhsXCI+TXlhamUgU3VpdGU8L2gxPlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICA8bmF2IGNsYXNzTmFtZT1cIm10LThcIj5cclxuICAgICAgICAgIHttZW51SXRlbXMubWFwKChpdGVtLCBpbmRleCkgPT4gKFxyXG4gICAgICAgICAgICA8YVxyXG4gICAgICAgICAgICAgIGtleT17aW5kZXh9XHJcbiAgICAgICAgICAgICAgaHJlZj17aXRlbS5ocmVmfVxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHB4LTQgcHktMyB0ZXh0LWdyYXktNzAwIGhvdmVyOmJnLWFtYmVyLTEwMFwiXHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtci0zXCI+e2l0ZW0uaWNvbn08L3NwYW4+XHJcbiAgICAgICAgICAgICAgPHNwYW4+e2l0ZW0ubGFiZWx9PC9zcGFuPlxyXG4gICAgICAgICAgICA8L2E+XHJcbiAgICAgICAgICApKX1cclxuICAgICAgICA8L25hdj5cclxuXHJcbiAgICAgICAgey8qIE5vdGlmaWNhdGlvbnMgKi99XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC00IHB5LTJcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtZ3JheS03MDBcIj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bVwiPk5vdGlmaWNhdGlvbnM8L3NwYW4+XHJcbiAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwicC0yIGhvdmVyOmJnLWdyZWVuLTEwMCByb3VuZGVkLWZ1bGxcIj5cclxuICAgICAgICAgICAgICA8QmVsbCBzaXplPXsyMH0gLz5cclxuICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgPFVzZXJNZW51IC8+XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgey8qIE1haW4gQ29udGVudCBBcmVhIHdpdGggSG92ZXIgWm9uZSAqL31cclxuICAgICAgPGRpdiBcclxuICAgICAgICBjbGFzc05hbWU9e2BmaXhlZCB0b3AtMCBsZWZ0LTAgdy0xMCBoLWZ1bGwgei0zMGB9XHJcbiAgICAgICAgb25Nb3VzZUVudGVyPXtoYW5kbGVNb3VzZUVudGVyfVxyXG4gICAgICAvPlxyXG5cclxuICAgICAgey8qIE1haW4gQ29udGVudCAqL31cclxuICAgICAgPGRpdiBjbGFzc05hbWU9e2B0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0zMDAgJHtpc1NpZGViYXJPcGVuID8gJ21sLTY0JyA6ICdtbC0wJ31gfT5cclxuICAgICAgICB7LyogVG9wIE5hdmlnYXRpb24gKi99XHJcbiAgICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJiZy1ncmVlbi01MFwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcHgtNiBweS00XCI+XHJcbiAgICAgICAgICAgIHtpc01vYmlsZSAmJiAoXHJcbiAgICAgICAgICAgICAgPGJ1dHRvbiBcclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzU2lkZWJhck9wZW4oIWlzU2lkZWJhck9wZW4pfVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIHJvdW5kZWQtbGcgaG92ZXI6YmctZ3JlZW4tMTAwXCJcclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICA8TWVudSBzaXplPXsyMH0gLz5cclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgKX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvaGVhZGVyPlxyXG5cclxuICAgICAgICB7LyogUGFnZSBDb250ZW50ICovfVxyXG4gICAgICAgIDxtYWluIGNsYXNzTmFtZT1cInAtNlwiPlxyXG4gICAgICAgICAge2NoaWxkcmVufVxyXG4gICAgICAgIDwvbWFpbj5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgRGFzaGJvYXJkTGF5b3V0OyJdLCJuYW1lcyI6WyJSZWFjdCIsInVzZVN0YXRlIiwidXNlUmVmIiwidXNlRWZmZWN0IiwiVXNlck1lbnUiLCJMYXlvdXRHcmlkIiwiUGFja2FnZSIsIlN0b3JlIiwiTGluZUNoYXJ0IiwiTWVudSIsIkJlbGwiLCJVc2VyIiwiRGFzaGJvYXJkTGF5b3V0IiwiY2hpbGRyZW4iLCJpc1NpZGViYXJPcGVuIiwic2V0SXNTaWRlYmFyT3BlbiIsInNpZGViYXJSZWYiLCJpc01vYmlsZSIsInNldElzTW9iaWxlIiwiY2hlY2tNb2JpbGVWaWV3IiwiaXNNb2JpbGVXaWR0aCIsIndpbmRvdyIsImlubmVyV2lkdGgiLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIm1lbnVJdGVtcyIsImljb24iLCJzaXplIiwibGFiZWwiLCJocmVmIiwiaGFuZGxlTW91c2VFbnRlciIsImhhbmRsZU1vdXNlTGVhdmUiLCJzaWRlYmFyVmlzaWJpbGl0eSIsImRpdiIsImNsYXNzTmFtZSIsInJlZiIsIm9uTW91c2VFbnRlciIsIm9uTW91c2VMZWF2ZSIsImgxIiwibmF2IiwibWFwIiwiaXRlbSIsImluZGV4IiwiYSIsInNwYW4iLCJidXR0b24iLCJoZWFkZXIiLCJvbkNsaWNrIiwibWFpbiJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/app/dashboard/page.js\n"));

/***/ })

});
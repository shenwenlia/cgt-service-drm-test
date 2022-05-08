"use strict";

const path = require("path");
const ResourceManager = require("@sap/cgt-util").ResourceManager;

module.exports = new ResourceManager(path.resolve(__dirname, "i18n.properties"));

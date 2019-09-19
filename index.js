const axios = require("./src/axios");

module.exports = (url, options) =>
	url ? axios(url, options) : Promise.reject("URL cannot be empty");

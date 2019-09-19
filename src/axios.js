const { isJson } = require("./utils");
const { stringify } = require("querystring");
const { parse } = require("url");
const http = require("http");
const https = require("https");

const axios = (url, options = {}) => {
	return new Promise((resolve, reject) => {
		const req = parse(url);

		const client = req.protocol == "https:" ? https : http;

		req["method"] = options.method || "GET";

		req["headers"] = {};
		options.headers &&
			Object.keys(options.headers).forEach(
				key =>
					(req["headers"][key.toLowerCase()] = options.headers[key])
			);

		req["auth"] = options.auth;

		const body = options.body
			? options.body.length
				? options.body
				: req["headers"]["content-type"] == "application/json"
				? JSON.stringify(options.body)
				: stringify(options.body)
			: false;

		const _req = client.request(req, res => {
			let resBody = "";

			const cond =
				res.statusCode >= 300 &&
				res.statusCode < 400 &&
				res.headers.location &&
				options.followredirect != false;

			if (cond) {
				return resolve(axios(res.headers.location, options));
			}

			res.on("data", data => (resBody += data));

			res.on("end", end =>
				resolve({
					headers: res.headers,
					status: res.statusCode,
					statusText: res.statusMessage,
					url: res.url || url,
					body: isJson(resBody) || resBody
				})
			);

			res.on("error", err => reject(err));
		});

		_req.setHeader("user-agent", "axios-slim");
		req["headers"]["accept"] || _req.setHeader("accept", "*/*");

		req["headers"]["content-type"] ||
			_req.setHeader(
				"content-type",
				body && !Buffer.isBuffer(body)
					? "application/x-www-form-urlencoded"
					: "application/octet-stream"
			);

		body && _req.setHeader("content-length", body.length);
		body && _req.write(body);
		_req.on("error", err => reject(err)).end();
	});
};

module.exports = axios;

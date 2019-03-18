// npm install html-webpack-plugin raw-loader --save-dev

var path = require("path");
var webpack = require("webpack");
var HtmlWebpackPlugin = require('html-webpack-plugin');

var _now = new Date();
var _start = new Date(_now.getFullYear(), 0, 0);
var _diff = (_now - _start) + ((_start.getTimezoneOffset() - _now.getTimezoneOffset()) * 60 * 1000);
var _oneDay = 1000 * 60 * 60 * 24;
var _day = Math.floor(_diff / _oneDay);
var _year = _now.getFullYear();
if (_day < 100) _day = "0" + _day.toString();
else _day = _day.toString();
var _hour = _now.getHours();
if (_hour < 10) _hour = "0" + _hour.toString();
else _hour = _hour.toString();
var _min = _now.getMinutes();
if (_min < 10) _min = "0" + _min.toString();
else _min = _min.toString();

var _version = _year + "." + _day + "." + _hour + _min;


module.exports = function(env) {

	var pack = require("./package.json");
	var MiniCssExtractPlugin = require("mini-css-extract-plugin");

	var production = !!(env && env.production === "true");
	var asmodule = !!(env && env.module === "true");
	var standalone = !!(env && env.standalone === "true");

	var babelSettings = {
		extends: path.join(__dirname, '/.babelrc')
	};

	var config = {
		mode: production ? "production" : "development",
		entry: {
			myapp: "./sources/app.js"
		},
		output: {
			path: path.join(__dirname, "codebase"),
			publicPath:"/codebase/",
			filename: "[name].js",
			chunkFilename: "[name].bundle.js"
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					use: "babel-loader?" + JSON.stringify(babelSettings)
				},
				{
					test: /\.(svg|png|jpg|gif)$/,
					use: "url-loader?limit=25000"
				},
				{
					test: /\.(less|css)$/,
					use: [ MiniCssExtractPlugin.loader, "css-loader", "less-loader" ]
				},
				//обработка html
				{
					test: /\.html$/,
					include: path.resolve(__dirname, 'sources/html/include'), //файлы-вставик для шаблона
					use: ['raw-loader']
				  },
			]
		},
		stats:"minimal",
		resolve: {
			extensions: [".js"],
			modules: ["./sources", "node_modules"],
			alias:{
				"jet-views":path.resolve(__dirname, "sources/views"),
				"jet-locales":path.resolve(__dirname, "sources/locales")
			}
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename:"[name].css"
			}),
			new webpack.DefinePlugin({
				// VERSION: `"${pack.version}"`,
				VERSION: `"${_version}"`,
				APPNAME: `"${pack.name}"`,
				PRODUCTION : production,
				BUILD_AS_MODULE : (asmodule || standalone)
			}),
			//запускаем плагин для генерации html файла
			new HtmlWebpackPlugin({
				filename: `index.html`, //имя файла
				template: path.resolve(__dirname, "./sources/html/template.html"), // имя шаблона
				inject: false,
			})
		],
		devServer:{
			stats:"errors-only"
		}
	};

	if (!production){
		config.devtool = "inline-source-map";
	}

	if (asmodule){
		if (!standalone){
			config.externals = config.externals || {};
			config.externals = [ "webix-jet" ];
		}

		const out = config.output;
		const sub = standalone ? "full" : "module";

		out.library = pack.name.replace(/[^a-z0-9]/gi, "");
		out.libraryTarget= "umd";
		out.path = path.join(__dirname, "dist", sub);
		out.publicPath = "/dist/"+sub+"/";
	}

	return config;
}
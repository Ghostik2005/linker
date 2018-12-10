import "./styles/app.css";
import {JetApp, EmptyRouter, HashRouter } from "webix-jet";
import "./locales/ru";

export default class app extends JetApp{
	constructor(config){
		const defaults = {
			id 		: APPNAME,
			version : VERSION,
			router 	: EmptyRouter,
			debug 	: !PRODUCTION,

			user:           "",
			r_url:          (location.hostname === 'localhost') ? "http://saas.local/merge3_logic" : "../merge3_logic",
			x_api:          "x_login",
			searchDelay:    1000,
			posPpage:       20,
			start	: "/login",
			adm: false
		};
		super({ ...defaults, ...config });
		this.attachEvent("app:error:resolve", function(name, error) {
			window.console.error(error);
		})
		var app = this;
		webix.attachEvent("onBeforeAjax", 
		function(mode, url, data, request, headers, files, promise){
			headers["x-api-key"] = app.config.x_api;
		});
	}
}



webix.ready(() => new app().render() );
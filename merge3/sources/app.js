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
			adm: false,
			//sklad_cook: 'sklad_auth_coockie'
			sklad_cook: "manuscriptsid"
		};
		super({ ...defaults, ...config });
		this.attachEvent("app:error:resolve", function(name, error) {
			window.console.error(error);
		})
		var app = this;
		var search = location.search;
		app.config.testmode = (search.search('enabletestmode') == 1) ? true : false;
		app.config.testmode = true;

		let index = search.indexOf(app.config.sklad_cook);
		if (index != -1) {
			app.config.skladcookie = search.split(app.config.sklad_cook+'=')[1];
		};
		webix.attachEvent("onBeforeAjax", function(mode, url, data, request, headers, files, promise){
			headers["x-api-key"] = app.config.x_api;
		});
	}
}



webix.ready(() => new app().render() );
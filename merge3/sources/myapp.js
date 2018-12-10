import "./styles/app.css";
import {JetApp, EmptyRouter, HashRouter } from "webix-jet";

export default class MyApp extends JetApp{
	constructor(config){
		const defaults = {
			id 		: APPNAME,
			version : VERSION,
			router 	: EmptyRouter,
			debug 	: !PRODUCTION,
			start 	: "/top/start"
		};


		super({ ...defaults, ...config });
		console.log('a', APPNAME);
		console.log('v', VERSION)
		console.log('p', PRODUCTION);
	}
}



if (!BUILD_AS_MODULE){
	webix.ready(() => new MyApp().render() );
}
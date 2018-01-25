import "./styles/styles.css";
//import "./libs/webix/webix.js";
//import "./libs/webix/skin.js";
import {JetApp, JetView} from "webix-jet";
import {StoreRouter, EmptyRouter} from "webix-jet";
import {init_first} from "./views/globals";

webix.ready(() => {
    webix.protoUI({
        name: "cWindow",
        defaults: {
            modal: false,
            move: true,
            position: "center"
            },
        $init: function(config){
            webix.extend(config, {
                head: {
                    view: "toolbar",
                    cols: [
                        {view: "label", label: "Название окна"},
                        {view: "button",
                            type: "icon",
                            icon: "times",
                            css: "times",
                            height: 26,
                            width:26,
                            click: function () {
                                this.getTopParentView().hide();
                                }
                            }
                        ]
                    }
                })
            }
        }, webix.ui.window);
    let u1 = (location.hostname === 'localhost') ? "http://saas.local/linker_logic" : "../linker_logic";
    var app = new JetApp({
        id:         "mainApp",
        name:       "linker",
        version:    "18.025.1630",
        //start:      "/start/body",
        start:      "/login",
        admin:      "admin",
        user:       "",
        //user:       "stasya",
        r_url:      u1,
        //router:     StoreRouter,
        router:     EmptyRouter,
        x_api:      "x_login",
        debug:      true
    });
    
    webix.attachEvent("onBeforeAjax", 
        function(mode, url, data, request, headers, files, promise){
            //console.log('x-api', app.config.x_api);
            headers["x-api-key"] = app.config.x_api;
            }
        );

    app.render();
    
    init_first(app);
    


    app.attachEvent("app:error:resolve", function(name, error){
        window.console.error(error);
    });
});

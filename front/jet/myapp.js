import "./styles/styles.css";
//import "./libs/webix/webix.js";
//import "./libs/webix/skin.js";
import {JetApp, JetView} from "webix-jet";
import {StoreRouter} from "webix-jet";

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
    var app = new JetApp({
        id:         "mainApp",
        name:       "linker",
        version:    "2017.334.1230",
        start:      "/start/body",
        user:       "stasya",
        r_url:      "/linker_logic",
        router:     StoreRouter,
        x_api:      "api-key",
        debug:      true
    });
    app.render();

    webix.attachEvent("onBeforeAjax", 
        function(mode, url, data, request, headers, files, promise){
            headers["x-api-key"] = app.config.x_api;
            }
        );
    //console.log(app);

    app.attachEvent("app:error:resolve", function(name, error){
        window.console.error(error);
    });
});

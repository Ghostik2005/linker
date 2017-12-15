import "./styles/styles.css";
import {JetApp, JetView, UrlRouter} from "webix-jet";
import {get_strana_all, get_vendor_all, get_dv_all} from "./views/globals";;

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
        user:       "admin",
        r_url:      "/linker_logic",
        route:      UrlRouter,
        x_api:      "api-key",
        debug:true
    });
    app.render();

    webix.attachEvent("onBeforeAjax", 
        function(mode, url, data, request, headers, files, promise){
            headers["x-api-key"] = app.config.x_api;
            }
        );
    //console.log(app);
    get_strana_all(app);
    get_vendor_all(app);
    get_dv_all(app);

    app.attachEvent("app:error:resolve", function(name, error){
        window.console.error(error);
    });
});

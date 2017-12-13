import "./styles/styles.css";
import {JetApp, JetView, UrlRouter} from "webix-jet";

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
        route: UrlRouter,
        debug:true
    });
    app.render();


    app.attachEvent("app:error:resolve", function(name, error){
        window.console.error(error);
    });
});

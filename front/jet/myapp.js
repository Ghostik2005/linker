import "./styles/styles.css";
//import "./libs/webix/webix.js";
//import "./libs/webix/skin.js";
import {JetApp, JetView} from "webix-jet";
import {StoreRouter, EmptyRouter, UrlRouter} from "webix-jet";
import {init_first} from "./views/globals";
import "./locales/ru";

webix.ready( () => {

    webix.i18n.setLocale('ru-RU');

    webix.protoUI({
        name:"activeList"
        },webix.ui.list, webix.ActiveContent);
        
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
        id:             "mainApp",
        name:           "linker",
        version:        "18.100.1755",
        start:          "/login",
        admin:          "34",
        user:           "",
        role:           "0",
        r_url:          (location.hostname === 'localhost') ? "http://saas.local/linker_logic" : "../linker_logic",
        //router:         StoreRouter,
        router:         EmptyRouter,
        //router:         UrlRouter,
        x_api:          "x_login",
        debug:          true,
        searchDelay:    1000,
        lch:            0,
        roles:          {}
    });
    
    webix.attachEvent("onBeforeAjax", 
        function(mode, url, data, request, headers, files, promise){
            headers["x-api-key"] = app.config.x_api;
            }
        );

    app.render();

    console.log('search', location.search);

    window.onerror = function (message, source, lineNr) {
        webix.message({"text": "Возникла ошибка. Мы работаем над ее исправлением. Текст в консоли", "type": "error", width: "800px", delay: "5"}); //
        window.console.log("message:", message);
        window.console.log("source:", source);
        return false; 
        };

    app.attachEvent("app:error:resolve", function(name, error) {
        window.console.error(error);
        })

    });

import "./styles/styles.css";
import "./styles/animate.css";
//import "./libs/webix/webix.js";
//import "./libs/webix/skin.js";
import {JetApp, JetView} from "webix-jet";
import {StoreRouter, EmptyRouter, UrlRouter} from "webix-jet";
import {init_first} from "./views/globals";
import "./locales/ru";

webix.ready( () => {


    //webix.ui.customcombo = Object.create(webix.ui.multicombo);




    var app = new JetApp({
        id:             "mainApp",
        name:           "linker",
        version:        "18.320.1530",
        start:          "/login",
        user:           "",
        role:           "0",
        eventS:         undefined,
        r_url:          (location.hostname === 'localhost') ? "http://saas.local/linker_logic" : "../linker_logic",
        router:         EmptyRouter,
        //router:         UrlRouter,
        x_api:          "x_login",
        debug:          !true,
        searchDelay:    1000,
        popDelay:       800,
        roles:          {},
        expert:         true,
        link:           false,
        getButt:        (view, buttonsList) => {
                            let bList = [];
                            let views = view.getChildViews()
                            views.forEach( (element, i, views) => {
                                if (element.getChildViews().length > 0) {
                                    if (element.$scope)
                                        bList = element.$scope.app.config.getButt(element, bList);
                                } else {
                                    if (element.config.view === "button" && element.config.resizable) {
                                        bList.push(element);
                                        };
                                    };
                                })
                            if (buttonsList) {
                                bList = bList.concat(buttonsList);
                                };
                            return bList;
                            },
        posPpage:       20,
        notify:         true,
        nDelay:         -1,
        save:           false,
        dtParams:       undefined,
    });

    
    webix.attachEvent("onBeforeAjax", 
        function(mode, url, data, request, headers, files, promise){
            headers["x-api-key"] = app.config.x_api;
            }
        );

    app.render();

    //console.log('search', location.search);


    window.onerror = function (message, source, lineNr, col, err) {
        webix.message({"text": "Возникла ошибка - мы работаем над ее исправлением. Текст в консоли", "type": "error", width: "800px", delay: "5"}); //
        window.console.log("message:", message);
        window.console.log("source:", source);
        window.console.log("err:", err);
        var suppr = true;
        return suppr; 
        };

    app.attachEvent("app:error:resolve", function(name, error) {
        window.console.error(error);
        })


    });



import "./styles/styles.css";
//import "./libs/webix/webix.js";
//import "./libs/webix/skin.js";
import {JetApp, JetView} from "webix-jet";
import {StoreRouter, EmptyRouter} from "webix-jet";
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
        version:        "18.081.1730",
        start:          "/login",
        admin:          "34",
        user:           "",
        role:           "0",
        r_url:          (location.hostname === 'localhost') ? "http://saas.local/linker_logic" : "../linker_logic",
        //router:         StoreRouter,
        router:         EmptyRouter,
        x_api:          "x_login",
        debug:          true,
        searchDelay:    1000,
        lch:            0,
        //roles:          {'0': {'skipped': false, 'spradd': false, 'adm': false, 'spredit': false, 'useradd': false, 'userdel': false, 'lnkdel': false, 'vendoradd': false},
                         //'9': {'skipped': true, 'spradd': false, 'adm': false, 'spredit': false, 'useradd': false, 'userdel': false, 'lnkdel': false, 'vendoradd': false},
                         //'10': {'skipped': true, 'spradd': true, 'adm': true, 'spredit': true, 'useradd': false, 'userdel': false, 'lnkdel': true, 'vendoradd': true},
                         //'34': {'skipped': true, 'spradd': true, 'adm': true, 'spredit': true, 'useradd': true, 'userdel': true, 'lnkdel': true, 'vendoradd': true},
                         //'35': {'skipped': true, 'spradd': true, 'adm': true, 'spredit': true, 'useradd': true, 'userdel': true, 'lnkdel': true, 'vendoradd': true}
                        //}
        roles:          {}
    });
    
    webix.attachEvent("onBeforeAjax", 
        function(mode, url, data, request, headers, files, promise){
            headers["x-api-key"] = app.config.x_api;
            }
        );
        
    //webix.attachEvent("onAjaxError", function(i) {
        //console.log('i', i);
        //}
    //);
    
    app.render();

    window.onerror = function (message, source, lineNr) {
        webix.message({"text": "Возникла ошибка. Мы работаем над ее исправлением. Текст в консоли", "type": "error", width: "800px", delay: "5"}); //
        window.console.log("message:", message);
        window.console.log("source:", source);
        //window.console.log("linenumber:", lineNr);
        //return true;
        return false; 
        };

    app.attachEvent("app:error:resolve", function(name, error) {
        window.console.error(error);
        })
    
    init_first(app);
});

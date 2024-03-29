import "./styles/styles.css";
import "./styles/animate.css";
//import "./libs/webix/skin.js";
import { JetApp, JetView } from "webix-jet";
import { EmptyRouter } from "webix-jet";
import "./locales/ru";

webix.ready(() => {
    console.log("PRODUCTION", PRODUCTION)

    var app = new JetApp({
        production: PRODUCTION,
        id: "mainApp",
        name: "linker",
        b_prod: "",
        b_ver: "",
        version: VERSION,
        start: "/login",
        user: "",
        role: "0",
        group: "-1",
        eventS: undefined,
        // r_url:          (!PRODUCTION) ? "http://saas.local/linker_logic" : "../linker_logic",
        r_url: (!PRODUCTION) ? "http://online365.mshub.ru/test_linker_logic" : "../linker_logic",
        router: EmptyRouter,
        x_api: "x_login",
        debug: !true,
        searchDelay: 1000,
        popDelay: 800,
        roles: {},
        expert: true,
        link: false,
        defaultView: "LinkerView",
        getButt: (view, buttonsList) => {
            let bList = [];
            let views = view.getChildViews()
            views.forEach((element, i, views) => {
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
        posPpage: 20,
        notify: true,
        nDelay: -1,
        save: false,
        dtParams: undefined,
    });


    webix.attachEvent("onBeforeAjax",
        function (mode, url, data, request, headers, files, promise) {
            headers["x-api-key"] = app.config.x_api;
        }
    );

    app.render();

    window.onerror = function (message, source, lineNr, col, err) {
        webix.message({ "text": "Возникла ошибка - мы работаем над ее исправлением. Текст в консоли", "type": "error", width: "800px", delay: "5" }); //
        window.console.log("message:", message);
        window.console.log("source:", source);
        window.console.log("err:", err);
        var suppr = true;
        return suppr;
    };

    app.attachEvent("app:error:resolve", function (name, error) {
        window.console.error(error);
    })


});



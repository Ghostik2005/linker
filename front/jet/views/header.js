"use strict";

import {JetView} from "webix-jet";
import {request, deleteCookie, getCookie} from "../views/globals";


export default class HeaderView extends JetView{
    config(){
        let app = this.app;
        let th = this;
        var uuid = require("uuid");
        var eventS;
        try {
            eventS.close()
        } catch (e) {
            };
        let iid = uuid.v4() + "::" + app.config.user;
        let sse_url = (location.hostname === 'localhost') ? "http://saas.local/events/SSE?" : "../events/SSE?";
        sse_url += iid

        if (app.config.notify) {
            eventS = new EventSource(sse_url);
            eventS.onmessage = function(e) {
                webix.message({'type': 'info', 'text': e.data, 'expire': app.config.nDelay});
                };

            eventS.addEventListener('update', function(e) {
                webix.message({'type': 'event', 'text': e.data, 'expire': app.config.nDelay});
                });

            eventS.addEventListener('close', function(e) {
                eventS.close();
                });
        } else {
            };
            
        //window.onbeforeunload = function (event_s) {
            //return "Уверены?"
            //}

        var onExit = function (e) {
            let user = getCookie('linker_user');
            let url = app.config.r_url + "?setExit";
            let params = {"user":user};
            request(url, params);
            //alert('f');
            }

        //посылаем сигнал на сервер "отдать из работы"
        window.addEventListener('beforeunload', onExit, false);

        return {view: 'toolbar',
            css: 'realy_header',
            cols: [
                {view: "label", label: "<a href='http://ms71.org'><span class='ms-logo', style='margin-left: -5px !important; background-image: url(addons/img/logo.png);'></span></a>",
                    width: 44, align: 'center', height: 36},
                {view: "label", label: "МАНУСКРИПТ-СОЛЮШН: Связки и эталоны | " + this.app.config.user, css: 'ms-logo-text',
                    height: 36, width: 550},
                {},
                {view:"button", type: 'htmlbutton', tooltip: "Выход",
                    resizable: true,
                    sWidth: 106,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='side_icon', style='line-height: 20px; padding-left: 5px'>Выйти</span>",
                    oldLabel: "<span class='side_icon webix_icon fa-sign-out'></span>",
                    on: {
                        onItemClick: () => {
                            onExit();
                            deleteCookie('linker_user');
                            deleteCookie('linker_auth_key');
                            deleteCookie('linker_role');
                            this.app.config.user = '';
                            this.app.config.role = '0';
                            this.app.config.x_api = 'x_login';
                            location.href = (location.hostname === 'localhost') ? "http://localhost:8080" : "/linker/";
                            }
                        },
                    },
            ]}
        }
    ready() {
        }
    }

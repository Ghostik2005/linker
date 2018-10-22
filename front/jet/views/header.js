"use strict";

import {JetView} from "webix-jet";
import {request, deleteCookie, getCookie} from "../views/globals";
import {spinIconEnable, spinIconDisable} from "../views/globals";

export default class HeaderView extends JetView{
    config(){
        let app = this.app;
        let th = this;
        var uuid = require("uuid");
        //app.config.eventS
        try {
            app.config.eventS.close()
        } catch (e) {
            };
        let iid = uuid.v4() + "::" + app.config.user;
        let sse_url = (location.hostname === 'localhost') ? "http://saas.local/events/SSE?" : "../events/SSE?";
        sse_url += iid

        function newSSE() {
            app.config.eventS = new EventSource(sse_url);
            if (app.config.notify) {
                app.config.eventS.onmessage = function(e) {
                    webix.message({'type': 'info', 'text': e.data, 'expire': app.config.nDelay});
                    };
                };

            app.config.eventS.addEventListener('update', function(e) {
                webix.message({'type': 'event', 'text': e.data, 'expire': app.config.nDelay});
                });

            app.config.eventS.addEventListener('enablespin', function(e) {
                let n = e.data.split("::");
                if (n[0]==='spr') {
                    $$("_spr_button").blockEvent();
                    spinIconEnable($$("_spr_button"));
                    }
                if (n[0]==='spr_roz') {
                    $$("_spr_roz_button").blockEvent();
                    spinIconEnable($$("_spr_roz_button"));
                    }
                });

            app.config.eventS.addEventListener('disablespin', function(e) {
                let n = e.data.split("::");
                let butt;
                if (n[0]==='spr') {
                    butt = $$("_spr_button");
                } else if (n[0]==='spr_roz') {
                    butt = $$("_spr_roz_button")
                    }

                if (butt) {
                    if (butt.config.lastModified !== +n[1]) {
                        butt.config.lastModified = +n[1];
                        let time_text = new Date(butt.config.lastModified*1000).toLocaleString("ru");
                        let tooltipExt = (butt.config.lastModified > 0) ? time_text : " неизвестно";
                        butt.define({"tooltip": butt.config.tooltipTemplate + "\nПоследняя выгрузка: " + tooltipExt});
                        butt.refresh();
                        }
                    butt.unblockEvent();
                    spinIconDisable(butt);
                    }
                });

            app.config.eventS.addEventListener('close', function(e) {
                eventS.close();
                });
            }

        
        var si = setTimeout( function tick() {
            if (!app.config.eventS || app.config.eventS.readyState !== 1) {
                newSSE()
                };
            si = setTimeout(tick, 4000);
            }, 50);


            
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
                            deleteCookie("linker-app");
                            //Удалить то что ниже в понедельник 1 октября после обновления
                            deleteCookie('linker_user');
                            deleteCookie('linker_auth_key');
                            deleteCookie('linker_role');
                            //////////////
                            th.app.config.user = '';
                            th.app.config.role = '0';
                            th.app.config.x_api = 'x_login';
                            location.href = (location.hostname === 'localhost') ? "http://localhost:8080" : "/linker/";
                            }
                        },
                    },
            ]}
        }
    ready() {
        }
    }

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
        let sse_url = (location.hostname === 'localhost') ? "http://saas.local/events_logic/SSE?" : "../events/SSE?";
        sse_url += iid;

        function newSSE() {
            app.config.eventS = new EventSource(sse_url);
            if (app.config.notify) {
                app.config.eventS.onmessage = function(e) {
                    webix.message({'type': 'info', 'text': e.data, 'expire': app.config.nDelay});
                    };
                };

            app.config.eventS.addEventListener('error_badge', function(e) {
                webix.message('qqq')

            });

            if (+app.config.role === 34 || +app.config.role === 10) {
                setTimeout( () => {
                    let b = th.getRoot().getParentView().getChildViews()[1].getChildViews()[0].getChildViews()[0].$scope.$$("_errorbut");
                    function badge(e) {

                        if (+e.data > 0) {
                            if (app.config.expert) b.$view.childNodes[0].childNodes[0].childNodes[0].classList.add('alert_b');
                            else b.$view.childNodes[0].childNodes[0].childNodes[0].childNodes[0].classList.add('alert_b');
                        } else {
                            if (app.config.expert) b.$view.childNodes[0].childNodes[0].childNodes[0].classList.remove('alert_b');
                            else b.$view.childNodes[0].childNodes[0].childNodes[0].childNodes[0].classList.remove('alert_b');
                        }
                        // app.config.eventS.removeEventListener('badgeErr', badge);
                    };

                    app.config.eventS.addEventListener("badgeErr", badge);
                }, 200)
            }

            app.config.eventS.addEventListener('update', function(e) {
                webix.message({'type': 'event', 'text': e.data, 'expire': app.config.nDelay});
            });

            app.config.eventS.addEventListener('enablespin', function(e) {
                let n = e.data.split("::");
                let butt;
                if (n[0]==='spr') {
                    butt = $$("_spr_button");
                    }
                if (n[0]==='spr_roz') {
                    butt = $$("_spr_roz_button");
                    }
                if (butt) {
                    butt.blockEvent();
                    spinIconEnable(butt);
                    let tooltipExt = "\n выгружает: " +n[2]
                    butt.define({"tooltip": butt.config.tooltipTemplate + tooltipExt});
                    butt.refresh();
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
                        butt.config.lastUser = n[2]
                        let u = ". Выгружал: " + (butt.config.lastUser || "неизвестно")
                        let time_text = new Date(butt.config.lastModified*1000).toLocaleString("ru");
                        let tooltipExt = (butt.config.lastModified > 0) ? time_text : " неизвестно";
                        butt.define({"tooltip": butt.config.tooltipTemplate + "\nПоследняя выгрузка: " + tooltipExt + u});
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
            let x,r;
            let user = getCookie('linker-app');
            if (user) {
                [user, x, r] = user.split('::');
                let url = app.config.r_url + "?setExit";
                let params = {"user":user};
                request(url, params);
                };
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
                    sWidth: 102,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='side_icon button_label'>Выйти</span>",
                    oldLabel: "<span class='side_icon webix_icon fa-sign-out'></span>",
                    on: {
                        onItemClick: () => {
                            onExit();
                            deleteCookie("linker-app");
                            //Удалить то что ниже в понедельник 1 октября после обновления
                            //deleteCookie('linker_user');
                            //deleteCookie('linker_auth_key');
                            //deleteCookie('linker_role');
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

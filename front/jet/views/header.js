"use strict";

import {JetView} from "webix-jet";
import {deleteCookie} from "../views/globals";


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
        webix.message({'type': 'error1', 'text': "e.data", 'expire': -1});
        eventS = new EventSource(sse_url);
        eventS.onmessage = function(e) {
            //th.$$('_sse').setValue(e.data);
            //th.$$('_sse').refresh();
            };

        eventS.addEventListener('update', function(e) {
            webix.message({'type': 'debug', 'text': e.data, 'expire': -1});
            //th.$$('_sse').setValue(e.data);
            //th.$$('_sse').refresh();
            });

        eventS.addEventListener('close', function(e) {
            eventS.close();
            });
        
        //window.onbeforeunload = function (event_s) {
            //return "Уверены?"
            //}

        //перед закрытием очищает куки и посылает на сервер logout
        //window.addEventListener('beforeunload', function (event_s) {
            //var rel = getCookie('reload');
            //var user =  getCookie('user');
            //var date = new Date;
            //date.setDate(date.getDate() - 1);
            //var d1 = '' + ';expire=' + date.toUTCString();
            //document.cookie = 'reload=' + d1;
            //if (rel != '1') {
                //document.cookie = 'key=' + d1;
                //document.cookie = 'user=' + d1;
                //webix.ajax().headers({'Content-type': 'application/json'}).post(auth_url, {'logout': user});
                //};
        //}, false);

        return {view: 'toolbar',
            css: 'header',
            cols: [
                {view: "label", label: "<a href='http://ms71.org'><span class='ms-logo', style='background-image: url(addons/img/ms_logo.jpg);'></span></a>",
                    width: 44, align: 'center', height: 36},
                {view: "label", label: "Манускрипт солюшн: Линкер | " + this.app.config.user, css: 'ms-logo-text',
                    height: 36, width: 550},
                //{},
                //{view: "text", label: "<span style='color: #404040'>sse:</span>", labelWidth: 35, value: "Новое значение", width: 300, localId: "_sse",
                    //on: {
                        //onItemClick: function() {
                            //try {
                                //eventS.close()
                            //} catch (e) {
                                //};
                            //let iid = uuid.v4() + "::" + app.config.user;
                            //let sse_url = (location.hostname === 'localhost') ? "http://saas.local/events/SSE?" : "../events/SSE?";
                            //sse_url += iid
                            //eventS = new EventSource(sse_url);
                            //eventS.onmessage = function(e) {
                                //th.$$('_sse').setValue(e.data);
                                //th.$$('_sse').refresh();
                                //};
                            //eventS.addEventListener('join', function(e) {
                                //th.$$('_sse').setValue(e.data);
                                //th.$$('_sse').refresh();
                                //});
                            //eventS.addEventListener('update', function(e) {
                                //webix.message({'type': 'debug', 'text': e.data, 'expire': -1});
                                ////th.$$('_sse').setValue(e.data);
                                ////th.$$('_sse').refresh();
                                //});
                            //eventS.addEventListener('close', function(e) {
                                //eventS.close();
                                //});
                            //}
                        //}
                    //},
                {},
                {view:"button", css: "butt", type: 'htmlbutton', tooltip: "Выход",
                    label: "<span class='webix_icon fa-sign-out', style='color: #3498db'></span>", width: 40,
                    on: {
                        onItemClick: () => {
                            deleteCookie('linker_user');
                            deleteCookie('linker_auth_key');
                            deleteCookie('linker_role');
                            this.app.config.user = '';
                            this.app.config.role = '0';
                            this.app.config.x_api = 'x_login';
                            location.href = (location.hostname === 'localhost') ? "http://localhost:8080" : "/linker/";
                            //this.show("/login")
                            }
                        },
                    },
            ]}
        }
    ready() {
        this.$$("_sse").callEvent('onItemClick')
        }
    }

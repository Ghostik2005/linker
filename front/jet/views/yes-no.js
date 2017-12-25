//"use strict";

import {JetView} from "webix-jet";
import {request} from "../views/globals";


export default class ConfirmView extends JetView{
    config(){
        return {view: "cWindow",
            modal: true,
            body: { view: "form",
                margin: 0,
                _params: {},
                on: {
                    onShow: function(id){
                        $$("_yes").focus();
                        }
                    },
                elements: [
                    //{height: 44},
                    {view: "label", label: "Подтвердите", height: 44, align: "center"},
                    {cols: [
                        {view: "button", type: "base", label: "Нет", width: 120, height: 44,
                            click: () => {
                                webix.message("Очищаем форму и закрываем");
                                this.getRoot().getBody().config._params = {};
                                this.hide()
                                }
                            },
                        {},
                        {view: "button", type: "base", label: "Да (Enter)", width: 120, height: 44, localId: "_yes",
                            click: () => {
                                let pars = this.getRoot().getBody().config._params;
                                let sh_prc = pars.sh_prc;
                                let user = this.app.config.user;
                                let url = this.app.config.r_url + pars.command;
                                let type = pars.type;
                                var callback = pars.callback;
                                let params = {"user": user, "sh_prc": sh_prc};
                                this.hide()
                                if (type === "sync") {
                                    console.log('sync');
                                } else {
                                    console.log('async');
                                    request(url, params).then(function(data) {
                                        data = data.json();
                                        console.log('req', data);
                                        if (data.result) {
                                            if (callback) callback(data)
                                            else console.log('ecall', data);
                                        } else {
                                            webix.message('error');
                                            };
                                        })
                                    }
                                webix.message("Очищаем форму, отправляем данные на сервер и закрываем");
                                //console.log("params", params);
                                }
                            }
                        ]}
                    ],
            on: {
                onBeforeShow: function() {
                    },
                onShow: function() {
                    }
                }
            }
            }
        }
    show(quest, params){
        this.getRoot().getHead().getChildViews()[0].setValue("Подтвердите действие");
        if (params) this.getRoot().getBody().config._params = params;
        //console.log("root", this.getRoot());
        this.getRoot().getBody().getChildViews()[0].setValue(quest);
        this.getRoot().show();
        }
    hide(){
        this.getRoot().hide()
        }
    getValues() {
        return this.getRoot().getBody().getValues();
        }

    }



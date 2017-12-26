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
                                //webix.message("Очищаем форму и закрываем");
                                this.getRoot().getBody().config._params = {};
                                this.hide()
                                }
                            },
                        {},
                        {view: "button", type: "base", label: "Да", width: 120, height: 44, localId: "_yes",
                            click: () => {
                                let pars = this.getRoot().getBody().config._params;
                                let sh_prc = pars.sh_prc;
                                let user = this.app.config.user;
                                let url = this.app.config.r_url + pars.command;
                                let type = pars.type;
                                let action = (pars.action) ? pars.action : "no_action";
                                let id_spr = (pars.id_spr) ? pars.id_spr : NaN;
                                var callback = pars.callback;
                                var th = pars.th
                                let params = {"user": user, "sh_prc": sh_prc, "action": action, "id_spr": id_spr};
                                this.hide()
                                if (type === "sync") {
                                    ///////////console.log('sync'); //синхронный запрос
                                } else {
                                    request(url, params).then(function(data) {
                                        data = data.json();
                                        if (data.result) {
                                            if (callback) callback(data, th)
                                            else console.log('error callback', data);
                                        } else {
                                            webix.message('error');
                                            };
                                        })
                                    }
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



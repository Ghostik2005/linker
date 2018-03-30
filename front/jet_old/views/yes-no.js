//"use strict";

import {JetView} from "webix-jet";
import {request, checkVal} from "../views/globals";


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
                                let sh_prc = (pars.sh_prc) ? pars.sh_prc : undefined;
                                let user = this.app.config.user;
                                let url = this.app.config.r_url + pars.command;
                                let type = (pars.type) ? pars.type : undefined;
                                let action = (pars.action) ? pars.action : "no_action";
                                let id_spr = (pars.id_spr) ? pars.id_spr : undefined;
                                var callback = (pars.callback) ? pars.callback : undefined;
                                var th = (pars.th) ? pars.th : undefined;
                                let params = {"user": user, "sh_prc": sh_prc, "action": action, "id_spr": id_spr};
                                this.hide()
                                if (type === "sync") {
                                    ///////////console.log('sync'); //синхронный запрос
                                } else {
                                    request(url, params).then(function(data) {
                                        data = checkVal(data, 'a');
                                        if (data) {
                                            if (callback) callback(data, th);
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



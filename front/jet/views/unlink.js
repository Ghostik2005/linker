//"use strict";

import {JetView} from "webix-jet";
import {request} from "../views/globals";


export default class UnlinkView extends JetView{
    config(){
        function unlnk(th, act) {
            let pars = th.getRoot().getBody().config._params;
            let sh_prc = pars.sh_prc;
            let user = th.app.config.user;
            let url = th.app.config.r_url + pars.command;
            let type = pars.type;
            let action = act;
            var callback = pars.callback;
            let params = {"user": user, "sh_prc": sh_prc, "action": action,};
            th.hide()
            if (type === "sync") {
                console.log('sync');
            } else {
                request(url, params).then(function(data) {
                    data = data.json();
                    if (data.result) {
                        if (callback) callback(data)
                        else console.log('ecall', data);
                    } else {
                        webix.message('error');
                        };
                    })
                }
            }
            
        return {view: "cWindow",
            modal: true,
            body: { view: "form",
                margin: 0,
                _params: {},
                elements: [
                    //{height: 44},
                    {view: "label", label: "Причина разрыва связкии", height: 44, align: "center"},
                    {cols: [
                        {view: "button", type: "base", label: "Ошибка", width: 120, height: 44,
                            click: () => {
                                unlnk(this, "return");
                                }
                            },
                        {},
                        {view: "button", type: "base", label: "Устарела", width: 120, height: 44, disabled: true,
                            on: {
                                onAfterRender: function () {
                                    let user = this.$scope.app.config.user;
                                    if (user === 'admin') {
                                        this.enable();
                                        }
                                    }
                                },
                            click: () => {
                                unlnk(this, "delete");
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



//"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, parseToLink} from "../views/globals";


export default class UnlinkView extends JetView{
    config(){
        let app = this.app;
        function unlnk(th, act) {
            let pars = th.getRoot().getBody().config._params;
            let sh_prc = pars.sh_prc;
            let user = th.app.config.user;
            let url = th.app.config.r_url + pars.command;
            let callback = pars.callback;
            let params = {"user": user, "sh_prc": sh_prc, "action": act};
            th.hide()
            if (pars.type === "sync") {
                console.log('sync');
            } else {
                request(url, params).then(function(data) {
                    data = checkVal(data, 'a');
                    if (data) {
                        if (callback) callback(data);
                        if (act === "return") {
                            let item = checkVal(request(th.app.config.r_url + "?getPrcsItem", {"user": user, "sh_prc": sh_prc}, !0).response, 's').datas;
                            parseToLink(item);
                            if (!app.config.roles[app.config.role].skipped) pars.parent.getRoot().getParentView().$scope.hide();
                            }
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
                                $$("_break").hide();
                                }
                            },
                        {},
                        (app.config.roles[app.config.role].lnkdel) ? {view: "button", type: "base", label: "Устарела", width: 120, height: 44, disabled: true,
                            on: {
                                onAfterRender: function () {
                                    if (app.config.roles[app.config.role].lnkdel) this.enable();
                                    }
                                },
                            click: () => {
                                unlnk(this, "delete");
                                }
                            } : {width: 1}
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



//"use strict";

import { JetView } from "webix-jet";
import { request, checkVal, parseToLink } from "../views/globals";


export default class UnlinkView extends JetView {
    config() {
        let app = this.app;
        function unlnk(th, act) {
            let pars = th.getRoot().getBody().config._params;
            let sh_prc = pars.sh_prc;
            let user = th.app.config.user;
            let url = pars.command;
            let callback = pars.callback;
            let params = { "user": user, "sh_prc": sh_prc, "action": act };
            th.hide()
            if (pars.type === "sync") {
                console.log('sync');
            } else {
                request(url, params, 0,).then(function (data) {
                    data = checkVal(data, 'a');
                    if (data) {
                        if (callback) callback(data);
                        if (act === "return") {
                            let item = checkVal(request("getPrcsItem", { "user": user, "sh_prc": sh_prc }, !0, th.app).response, 's').datas;
                            parseToLink(item);
                            if (!app.config.roles[app.config.role].skipped) pars.parent.getRoot().getParentView().$scope.hide();
                        }
                    };
                })
            }
        }

        return {
            view: "cWindow",
            modal: true,
            body: {
                view: "form",
                margin: 0,
                _params: {},
                elements: [
                    { view: "label", label: "Причина разрыва связкии", height: 44, align: "center" },
                    {
                        cols: [
                            {
                                view: "button", type: "base", label: "Ошибка", width: 120, height: 44,
                                click: () => {
                                    unlnk(this, "return");
                                    this._break.hide();
                                }
                            },
                            {},
                            {
                                view: "button", type: "base", label: "Устарела", width: 120, height: 44, hidden: !app.config.roles[app.config.role].lnkdel,
                                click: () => {
                                    unlnk(this, "delete");
                                }
                            }
                        ]
                    }
                ],
            }
        }
    }
    show(quest, params, _break) {
        this._break = _break;
        this.getRoot().getHead().getChildViews()[0].setValue("Подтвердите действие");
        if (params) this.getRoot().getBody().config._params = params;
        this.getRoot().getBody().getChildViews()[0].setValue(quest);
        this.getRoot().show();
    }
    hide() {
        this.getRoot().hide()
    }
    getValues() {
        return this.getRoot().getBody().getValues();
    }

}



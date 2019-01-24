"use strict";

import {JetView} from "webix-jet";
import {allIs, request, checkVal} from "../views/globals";


export default class NewIssueView extends JetView{
    config(){
        var app = this.app;
        
        return {view: "cWindow",
            modal: true,
            body: { view: "form",
                localId: "_n_is",
                margin: 0,
                id_spr: undefined,
                th: undefined,
                callback: undefined,
                elements: [
                    {rows: [
                        {view: "text", label: "Название", value: "", name: "_filter", placeholder: "Введите форму выпуска", localId: "_filt",
                            on: {
                                onTimedKeyPress: function(code, event) {
                                    let value = this.getValue().toString().toLowerCase();
                                    this.$scope.$$("__e_table").filter("c_issue", value);
                                    },
                                },
                            },
                        {cols: [
                            {rows: [
                                {view: "label", label: "Формы выпуска"},
                                {view:"list",
                                    localId: "__table",
                                    width:350,
                                    height: document.documentElement.clientHeight * 0.7,
                                    template:"#c_issue#",
                                    select:true,
                                    on: {
                                        onItemDblClick: function(cid) {
                                            let item = this.getItem(cid);
                                            this.remove(cid);
                                            this.$scope.$$("__e_table").add(item);
                                            this.$scope.$$("__e_table").sort("c_issue", "asc")
                                            },
                                        },
                                    },
                                ]},
                            {width: 10},
                            {rows: [
                                {view: "label", label: "Все формы выпуска"},
                                {view:"list",
                                    localId: "__e_table",
                                    width:350,
                                    template:"#c_issue#",
                                    select:true,
                                    on: {
                                        onItemDblClick: function(cid) {
                                            let item = this.getItem(cid);
                                            this.remove(cid);
                                            this.$scope.$$("__table").add(item);
                                            this.$scope.$$("__table").sort("c_issue", "asc")
                                            },
                                        },
                                    },
                                ]},
                            ]},
                        {height: 10},
                        {cols: [
                            {view: "button", type: "base", label: "Отменить", width: 120,
                                click: () => {
                                    this.hide();
                                    }
                                },
                            {},
                            {view: "button", type: "base", label: "Применить", width: 120,
                                click: () => {
                                    this.$$("__table").selectAll();
                                    let tgs = this.$$("__table").getSelectedItem();
                                    var p = '';
                                    let th = this.$$("_n_is").config.th;
                                    let id_spr = this.$$("_n_is").config.id_spr;
                                    let callback = this.$$("_n_is").config.callback;
                                    if (tgs) {
                                        let t = typeof(tgs);
                                        try {
                                            tgs.forEach(function(item, i, tgs) {
                                                p += item.c_issue + '; ';
                                                });
                                        } catch(err) {
                                            p = tgs.c_issue;
                                            }
                                        }
                                    if (th) {th.$$("_issue").setValue(p);
                                        th.$$("_issue").refresh();
                                        };
                                    if (callback) callback(id_spr, p);
                                    this.hide();
                                    }
                                }
                            ]}
                        ]}
                    ],
                }
            }
        }
        
    show(new_head, id_spr, th, callback){
        this.$$("__e_table").clearAll();
        this.$$("_n_is").reconstruct();
        this.$$("__table").clearAll();
        this.$$("_filt").setValue("");
        this.$$("_n_is").config.id_spr = id_spr;
        this.$$("_n_is").config.th = th;
        this.$$("_n_is").config.callback = callback;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        let url = this.app.config.r_url + "?getIs"
        let params = {"user": this.app.config.user, "id_spr": id_spr};
        let res = request(url, params, !0).response;
        res = checkVal(res, 's');
        if (res) {
            this.$$("__table").parse(res);
            };
        let pp = allIs.data.order;
        pp.forEach( (item, i, pp) => {
            this.$$("__e_table").add(allIs.getItem(item));
            });
        pp = this.$$("__table").data.order;
        pp.forEach( (item, i, pp) => {
            this.$$("__e_table").remove(item);
            });
        this.$$("_filt").focus();

        }
    hide(){
        this.getRoot().hide()
        }
    }



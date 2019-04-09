//"use strict";

import {JetView} from "webix-jet";
import {singleRefReload, get_tg} from "../views/globals";


export default class NewtgView extends JetView{
    config(){
        let th = this;
        let app = th.app;

        return {view: "cWindow",
            modal: true,
            on: {
                onHide: () => {
                    this.$$("_filt").setValue("");
                    this.$$("t_list").clearAll();
                    this.$$("e_list").clearAll();
                    this.$$("_n_tg").reconstruct();
                    },
                onShow: () => {
                    this.$$("_filt").setValue("");
                    let id_spr = this.$$("_n_tg").config.id_spr
                    var qw = this.$$("e_list");
                    qw.clearAll(true);
                    qw.parse(singleRefReload(this.app, "getTgAll"));
                    if (typeof(id_spr) === 'number'){
                        let pp = this.$$("t_list");
                        pp.clearAll(true);
                        pp.parse(get_tg(app, id_spr));
                        pp.data.order.forEach(function(item) {
                            qw.remove(item);
                            });
                    };
                    this.$$("_filt").focus();
                    },
                },
            body: { view: "form",
                localId: "_n_tg",
                margin: 0,
                id_spr: undefined,
                th: undefined,
                callback: undefined,
                elements: [
                    {rows: [
                        {view: "text", label: "Название", value: "", name: "_filter", placeholder: "Введите название группы", localId: "_filt",
                            on: {
                                onTimedKeyPress: function(code, event) {
                                    let value = this.getValue().toString().toLowerCase();
                                    this.$scope.$$("e_list").filter("c_tgroup", value);
                                    },
                                },
                            },
                        {cols: [
                            {rows: [
                                {view: "label", label: "Товарные группы"},
                                {view:"list",
                                    localId: "t_list",
                                    width:350,
                                    height: document.documentElement.clientHeight * 0.7,
                                    template:"#c_tgroup#",
                                    select:true,
                                    on: {
                                        onItemDblClick: function(cid) {
                                            let item = this.getItem(cid);
                                            this.remove(cid);
                                            this.$scope.$$("e_list").add(item);
                                            this.$scope.$$("e_list").sort("c_tgroup", "asc")
                                            },
                                        },
                                    },
                                ]},
                            {width: 10},
                            {rows: [
                                {view: "label", label: "Все товарные группы"},
                                {view:"list",
                                    localId: "e_list",
                                    width:350,
                                    template:"#c_tgroup#",
                                    select:true,
                                    on: {
                                        onItemDblClick: function(cid) {
                                            let item = this.getItem(cid);
                                            this.remove(cid);
                                            this.$scope.$$("t_list").add(item);
                                            this.$scope.$$("t_list").sort("c_tgroup", "asc")
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
                                    this.$$("t_list").selectAll();
                                    let tgs = this.$$("t_list").getSelectedItem();
                                    var p = '';
                                    let tgs_id = [];
                                    let th = this.$$("_n_tg").config.th;
                                    let id_spr = this.$$("_n_tg").config.id_spr;
                                    let callback = this.$$("_n_tg").config.callback;
                                    if (tgs) {
                                        let t = typeof(tgs);  
                                        try {
                                            tgs.forEach(function(item, i, tgs) {
                                                p += item.c_tgroup + '; ';
                                                tgs_id.push(item.id);
                                                });
                                        } catch(err) {
                                            p = tgs.c_tgroup;
                                            tgs_id.push(tgs.id);
                                            }
                                        }
                                    if (th) {th.$$("_c_tgroup").setValue(p);
                                        th.$$("_c_tgroup").refresh();
                                        };
                                    if (callback) {
                                        if (id_spr) {
                                        callback(id_spr, p, tgs_id);
                                        } else {
                                            callback("tgr", tgs_id);
                                        }
                                    } 
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
        this.$$("_n_tg").config.id_spr = id_spr;
        this.$$("_n_tg").config.th = th;
        this.$$("_n_tg").config.callback = callback;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        }
    hide(){
        this.getRoot().hide()
        }
    }



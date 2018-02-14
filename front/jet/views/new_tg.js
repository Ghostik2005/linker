//"use strict";

import {JetView} from "webix-jet";
import {get_refs, allTg, tg, get_tg} from "../views/globals";


export default class NewtgView extends JetView{
    config(){

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
                    get_tg(this, id_spr);
                    var qw = this.$$("e_list");
                    qw.clearAll(true);
                    this.$$("t_list").clearAll();
                    this.$$("t_list").parse(tg);
                    let pp = allTg.data.order;
                    pp.forEach(function(item, i, pp) {
                        qw.add(allTg.getItem(item));
                        });
                    //qw.parse(allTg); //непонятно почему глючит при повторном вызове, если перед этим удалять позиции из list'а???
                    pp = this.$$("t_list").data.order;
                    pp.forEach(function(item, i, pp) {
                        qw.remove(item);
                        });
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
                                    //height: document.documentElement.clientHeight * 0.7,
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
                                    //console.log('tgs', tgs);
                                    var p = '';
                                    let th = this.$$("_n_tg").config.th;
                                    let id_spr = this.$$("_n_tg").config.id_spr;
                                    let callback = this.$$("_n_tg").config.callback;
                                    if (tgs) {
                                        let t = typeof(tgs);
                                        try {
                                            tgs.forEach(function(item, i, tgs) {
                                                p += item.c_tgroup + '; ';
                                                });
                                        } catch(err) {
                                            p = tgs.c_tgroup;
                                            }
                                        }
                                    //console.log('p', p)
                                    if (th) th.$$("_c_tgroup").setValue(p);
                                    if (callback) callback(id_spr, p);
                                    this.hide();
                                    }
                                }
                            ]}
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



//"use strict";

import {JetView} from "webix-jet";
import {request, get_refs, allTg, tg, get_tg} from "../views/globals";


export default class NewtgView extends JetView{
    config(){
        function check_b(value) {
            var esum=0;
            if (isNaN(value) || value.length !== 13) return false;
            for (let i=0; i<13; i++) esum += Number(value[i])*(i%2*2+1);
            return !(esum % 10)
            }

        return {view: "cWindow",
            modal: true,
            on: {
                onHide: () => {
                    this.$$("_filt").setValue("");
                    this.$$("t_list").clearAll();
                    this.$$("e_list").clearAll();
                    console.log('alltg', allTg);
                    },
                onShow: () => {
                    this.$$("_filt").setValue("");
                    let id_spr = this.$$("_n_tg").config.id_spr
                    get_tg(this, id_spr);
                    this.$$("t_list").clearAll();
                    this.$$("e_list").clearAll();
                    this.$$("t_list").parse(tg);
                    //console.log('alltg', allTg);
                    //console.log('this', this);
                    this.$$("e_list").parse(allTg); //непонятно почему глючит при повторном вызове???
                    let l_data = this.$$("t_list").data.order;
                    l_data.forEach(function(item, i, l_data) {
                        try {
                            this.$$("e_list").remove(item);
                        } catch(err) {
                            console.log(err)
                            };
                        });
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
                            },
                        {cols: [
                            {rows: [
                                {view: "label", label: "Товарные группы"},
                                {view:"list",
                                    localId: "t_list",
                                    width:350,
                                    height:550,
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
                                    height:550,
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
                                    var parse = '';
                                    let th = this.$$("_n_tg").config.th;
                                    let id_spr = this.$$("_n_tg").config.id_spr;
                                    let callback = this.$$("_n_tg").config.callback;
                                    if (tgs) {
                                        let t = typeof(tgs);
                                        try {
                                            tgs.forEach(function(item, i, tgs) {
                                                parse += item.c_tgroup + ' ';
                                                });
                                        } catch(err) {
                                            parse = tgs.c_tgroup;
                                            }
                                        }
                                    if (th) th.$$("_c_tgroup").setValue(parse);
                                    if (callback) callback(id_spr, parse);
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



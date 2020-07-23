//"use strict";

import {JetView} from "webix-jet";
import {refLoad} from "../views/globals";

export default class addCGView extends JetView{
    config(){
        let th = this;
        let app = th.app;

        return {view: "cWindow",
            modal: true,
            on: {
                onHide: () => {
                    this.$$("_filt").setValue("");
                    this.$$("e_list").clearAll();
                    this.$$("_n_tg").reconstruct();
                    },
                onShow: () => {
                    this.$$("_filt").setValue("");
                    var qw = this.$$("e_list");
                    qw.clearAll(true);
                    qw.parse(refLoad(app, this.type));
                    this.$$("_filt").focus();
                    },
                },
            body: { view: "form",
                localId: "_n_tg",
                height: document.documentElement.clientHeight * 0.75,
                margin: 0,
                elements: [
                    {rows: [
                        {view: "text", label: "Название", value: "", name: "_filter", placeholder: "Введите название группы", localId: "_filt",
                            on: {
                                onTimedKeyPress: function(code, event) {
                                    let value = this.getValue().toString().toLowerCase();
                                    this.$scope.$$("e_list").filter("value", value);
                                },
                            },
                        },
                        {rows: [
                            {view: "label", label: "Свойства"},
                            {view:"list",
                                localId: "e_list",
                                width:550,
                                template:"#value#",
                                select:true,
                                multiselect: false,
                                on: {
                                    onItemDblClick: function(cid) {
                                        this.$scope.$$("_apply").callEvent("onItemClick")
                                        },
                                    },
                                },
                            ]},
                        {cols: [
                            {view: "button", type: "base", label: "Отменить", width: 120,
                                click: () => {
                                    this.hideW();
                                    }
                                },
                            {},
                            {view: "button", type: "base", label: "Применить", width: 120, localId: "_apply",
                                on: {
                                    onItemClick: () => {
                                        let tgs = this.$$("e_list").getSelectedItem();
                                        this.hideW();
                                        if (this.callback) this.callback(this.type, tgs);

                                        }
                                    }
                                }
                            ]}
                        ]}
                    ],
                }
            }
        }
        
    showW(new_head, type, callback){
        //this.id_spr = id_spr;
        this.type = type;
        this.callback = callback;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        }
    hideW(){
        this.getRoot().hide()
        }
    }



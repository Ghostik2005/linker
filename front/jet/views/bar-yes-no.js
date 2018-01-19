//"use strict";

import {JetView} from "webix-jet";
import {request} from "../views/globals";


export default class ConfirmBarView extends JetView{
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
                                this.getRoot().getBody().config._params = {};
                                this.hide()
                                }
                            },
                        {},
                        {view: "button", type: "base", label: "Да", width: 120, height: 44, localId: "_yes",
                            click: () => {
                                let pars = this.getRoot().getBody().config._params;
                                var callback = (pars.callback) ? pars.callback : undefined;
                                this.hide();
                                if (callback) callback(pars.params);
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
    }



"use strict";

import {JetView} from "webix-jet";
//import {request, checkVal} from "../views/globals";


export default class NewExcludeView extends JetView{
    
    config(){
        var app = this.app;
        var th = this;
        
        var form = { view: "form",
            localId: "_n_f",
            parent: undefined,
            margin: 0,
            rules:{
                "name": webix.rules.isNotEmpty,
                },
            elements: [
                {cols: [
                    {view: "text", label: "Слово исключение", value: "", width: 220, name: "name", labelPosition: "top", labelAlign: "center",
                        required: true, invalidMessage: "Введите значение", localId: "name",
                        },
                    {view:"radio", label:"условие", value:1, width: 220, labelPosition: "top", labelAlign: "center", vertical: false, localId: "conditions",
                        options:[
                            {id:0, value:"<span style='color: #666666'>начинается</span>"},
                            {id:1, value:"<span style='color: #666666'>содержит</span>"}
                            ]
                        },
                    ]},
                {height: 15},
                {height: 30, cols: [
                    {view: "button", type: "base", label: "Отменить", width: 120,
                        click: () => {
                            this.hide();
                            }
                        },
                    {},
                    {view: "button", type: "base", label: "Сохранить", width: 120,
                        click: () => {
                            let valid = this.$$("_n_f").validate({hidden:false, disabled:false});
                            if (valid) {
                                let _f = this.$$("_n_f").getValues();
                                _f['change'] = 2;
                                _f['process'] = 1;
                                let c = this.$$("conditions").getValue();
                                if (+c===1) {
                                    _f['options_st'] = 0;
                                    _f['options_in'] = 1;
                                } else if (+c===0) {
                                    _f['options_st'] = 1;
                                    _f['options_in'] = 0;
                                    };
                                _f['owner'] = app.config.user;
                                this.$$("_n_f").config.parent.add(_f, 0);
                                this.hide();
                            } else {
                                }
                            }
                        }
                    ]}
                ],
            }

        var rrr = {view: "cWindow",
            modal: true,
            on: {
                onShow: () => {
                    this.$$("name").focus();
                    },
                onHide: () => {
                    this.$$("_n_f").clear();
                    this.$$("_n_f").clearValidation();
                    }
                },
            body: form
            }
        return rrr
        }

    show(new_head, parent){
        this.$$("_n_f").config.parent = parent;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        }
    hide(){
        this.getRoot().hide()
        }

    }



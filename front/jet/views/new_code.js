"use strict";

import {JetView} from "webix-jet";
//import {request, checkVal} from "../views/globals";


export default class NewCodeView extends JetView{
    
    config(){
        var app = this.app;
        var th = this;
        
        function check_s(value) {
            let ret = true;
            if (parseFloat(value) == value) {
                let parent = th.$$("_n_f").config.parent;
                if (parent) {
                    parent.eachRow( 
                        (id) => {
                            let item = parent.getItem(id)
                            if (+item.code === +value) ret = false;
                        }, true);
                    }
            } else {
                ret = false;
                }
            if (th.$$("_n_f").config.item) ret = true;
            return ret;
            }

        var form = { view: "form",
            localId: "_n_f",
            parent: undefined,
            item: undefined,
            margin: 0,
            rules:{
                "code": check_s,
                "name": webix.rules.isNotEmpty,
                //"inn": webix.rules.isNotEmpty,
                },
            elements: [
                {cols: [
                    {view: "text", localId: "code", label: "Код", value: "", width: 120, name: "code", labelPosition: "top", labelAlign: "center",
                        required: true, invalidMessage: "Ошибочный код", readonly: true
                        },
                    {view: "text", label: "Название", value: "", width: 220, name: "name", labelPosition: "top", labelAlign: "center",
                        localId: "name",
                        required: true, invalidMessage: "Введите значение"
                        },
                    {view: "text", label: "Непонятное поле", value: "", width: 150, name: "inn", labelPosition: "top", labelAlign: "center",
                        localId: "inn",
                        required: !true, invalidMessage: "Введите значение"
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
                                _f['owner'] = app.config.user;
                                if (this.$$("_n_f").config.item) {
                                    this.$$("_n_f").config.parent.updateItem(this.$$("_n_f").config.item.id, _f);
                                } else {
                                    this.$$("_n_f").config.parent.add(_f, 0);
                                    }
                                this.hide();
                                this.$$("_n_f").config.parent.$scope.show_b();
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
                    this.$$("code").focus();
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

    show(new_head, parent, item){
        this.$$("_n_f").config.parent = parent;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        if (item) {
            this.$$("_n_f").config.item = item;
            this.$$('code').setValue(item.code);
            this.$$("name").setValue(item.name);
            this.$$("inn").setValue(item.inn);
            this.$$("code").define({"readonly": true});
        } else {
            this.$$("_n_f").config.item = undefined;
            this.$$("code").define({"readonly": false});
            }
        this.$$('_n_f').refresh();
        this.$$('code').refresh();
        }
    hide(){
        this.getRoot().hide()
        }

    }



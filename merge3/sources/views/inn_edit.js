"use strict";

import {JetView} from "webix-jet";

export default class InnEditView extends JetView{
    config(){
        let app = this.app;
        let view_this = this;

        var check_inn = function(value) {
            if (view_this.item) return true;
            var inn_val = value;
            let ret = false;
            value = "" + value; //переводим в строку
            value = value.split(''); //бьем на символы
            if (value.length == 10) {// инн 10 символов
                if (value[9] == ((2 * value[0] + 4 * value[1] + 10 * value[2] + 3 * value[3] + 5 * value[4] + 9 * value[5] + 4 * value[6] + 6 * value[7] + 8 * value[8]) % 11) % 10) {
                    ret = true;
                    }
            } else if (value.length == 12) { // инн 12 символов
                if ((value[10] == ((7 * value[0] + 2 * value[1] + 4 * value[2] + 10 * value[3] + 3 * value[4] + 5 * value[5] + 9 * value[6] + 4 * value[7] + 6 * value[8] + 8 * value[9]) % 11) % 10)
                    && (value[11] == ((3 * value[ 0] + 7 * value[1] + 2 * value[2] + 4 * value[3] + 10 * value[4] + 3 * value[5] + 5 * value[6] + 9 * value[7] + 4 * value[8] + 6 * value[9] + 8 * value[10]) % 11) % 10) ) {
                    ret = true;
                    };
                };
            if (ret===true) {
                //проводим проверку на уникальность в базе
                let data = view_this.parent.data;
                data.each( (item) => {
                    if (+item.inn===+inn_val) ret = false;
                });
                if (ret===false) {
                    view_this.$$("_inn").define({"invalidMessage": "Такой ИНН есть в базе"});
                    view_this.$$("_inn").refresh();
                }
                return ret;
            }
            view_this.$$("_inn").define({"invalidMessage": "Не корректный ИНН"});
            view_this.$$("_inn").refresh();
            return false;

        }

        let body = { view: "form",
            localId: "prop_form",
            //margin: 0,
            padding: 0,
            rules:{
                "inn": check_inn,
                "c_inn": webix.rules.isNotEmpty,
                },
            elements: [
                {rows: [
                    {height: 2},
                    {cols: [
                        {width: 10},
                        {view: "text", label: "ИНН", 
                            name: "inn",
                            labelPosition:"top",
                            localId: "_inn",
                             width: 190,
                            invalidMessage: "Некоректный ИНН",
                        },
                        {view: "text", label: "Название",
                            name: "c_inn",
                            labelPosition:"top",
                            invalidMessage: "Название не должно быть пустым",
                            localId: "_name",
                            width: 390,
                        },
                        {width: 10},
                    ]},
                    {padding: 5, localId: "_bottom",
                        cols: [
                        {width: 10},
                        {view: "button", type: "htmlbutton", localId: "_cancel", hidden: true,
                            tooltip: "Отменить",
                            label: "<span style='line-height: 16px; font-size: smaller'>Отменить</span>", 
                            width: 120, height: 36,
                            click: () => {
                                this.hide_w();
                                }
                            },
                        {},
                        {view: "button", type: "htmlbutton", localId: "_save",
                            tooltip: "Сохранить",
                            label: "<span style='line-height: 18px; font-size: smaller'>ОК</span>",
                            width: 80, height: 36,
                            click: () => {
                                let valid = this.$$("prop_form").validate({hidden:false, disabled:false});
                                if (valid) {
                                    if (this.item) {
                                        let edit_item = this.parent.getItem(this.item.id);
                                        edit_item.change = 1;
                                        edit_item.c_inn = this.$$("_name").getValue();
                                        this.parent.refresh();
                                    } else {
                                        let edit_item = {change: 2, c_inn: this.$$("_name").getValue(), 
                                                         inn: this.$$("_inn").getValue()};
                                        this.parent.add(edit_item, 0);
                                    }
                                    this.hide_w();
                                }
                            }
                        },
                        {width: 10},
                    ]},
                ]}
            ],
        }

        let view = {view: "cWindow",
            localId: "_window",
            modal: true,
            body: body,
            on: {
                onHide: () => {
                    this.$$("prop_form").clearValidation();
                    this.$$("_inn").setValue("")
                    this.$$("_inn").enable();
                    this.$$("_name").setValue("");
                },
            },
        }
        return view
        }
    

    ready() {
    }

    show_w(parent, new_header, item){
        let app = this.app;
        this.getRoot().getHead().getChildViews()[0].setValue(new_header);
        this.parent = parent;
        this.getRoot().show();
        this.$$("_name").focus();
        if (item) {
            this.item = item;
            new_header = new_header + ": " + item.c_inn;
            this.$$("_inn").setValue(item.inn);
            this.$$("_inn").disable()
            this.$$("_name").setValue(item.c_inn)
        } else {
            this.item = undefined
            this.$$("_inn").enable();
        };
    }

    hide_w(){

        this.getRoot().hide()
        }

    init() {
        }
    }



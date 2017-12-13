//"use strict";

import {JetView} from "webix-jet";


export default class ConfirmView extends JetView{
    config(){
        return {view: "cWindow",
            modal: true,
            body: { view: "form",
                margin: 0,
                on: {
                    onShow: function(id){
                        $$("_yes").focus();
                        }
                    },
                elements: [
                    {height: 66},
                    //{view: "label", label: "Подтвердите действие", width: 320, height: 44},
                    {cols: [
                        {view: "button", type: "base", label: "Нет", width: 120, height: 44,
                            click: () => {
                                webix.message("Очищаем форму и закрываем");
                                console.log(this.hide())
                                }
                            },
                        {},
                        {view: "button", type: "base", label: "Да (Enter)", width: 120, height: 44, id: "_yes",
                            click: () => {
                                webix.message("Очищаем форму, отправляем данные на сервер и закрываем");
                                console.log(this.hide())
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
    show(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        }
    hide(){
        this.getRoot().hide()
        }
    getValues() {
        return this.getRoot().getBody().getValues();
        }

    }



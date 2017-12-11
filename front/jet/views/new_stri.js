//"use strict";

import {JetView} from "webix-jet";


export default class NewstriView extends JetView{
    config(){
        return {view: "cWindow",
            modal: true,
            body: { view: "form",
                margin: 0,
                elements: [
                    {view: "text", label: "Название", value: "Ввод новой строки", width: 320, name: "_new_str"},
                    {cols: [
                        {view: "button", type: "base", label: "Отменить", width: 120},
                        {},
                        {view: "button", type: "base", label: "Сохранить", width: 120}
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
        //console.log(this.getRoot().getHead().getChildViews())
        }
    hide(){
        this.getRoot().hide()
        }
    getValues() {
        return this.getRoot().getBody().getValues();
        }

    }



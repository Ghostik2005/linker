//"use strict";

import {JetView} from "webix-jet";
import NewstriView from "../views/new_stri";


export default class NewformView extends JetView{
    config(){
        return {view: "cWindow",
            modal: true,
            body: { view: "form",
                //localid: "new_form",
                margin: 0,
                elements: [
                    {rows: [
                        {view: "label", label:"Название товара:   " + "Название 1"},
                        {view: "text", label: "", value: "Название 1"},
                        {height: 10, width: 600},
                        {cols: [
                            {rows: [
                                {view: "label", label:"Страна:"},
                                {view:"combo", value: "", width: 400},
                                {view: "label", label:"Производитель:" + "Китай"},
                                {cols: [
                                    {view:"combo", label: "", value: ""},
                                    {view: "button", type: "base", label: "+", width: 30,
                                        click: () => {
                                            this.popstri.show("Добавление производителя");
                                            //console.log(this.popstri.getValues());
                                            }
                                        },
                                    ]},
                                {view: "label", label:"Действующее вещество:"},
                                {cols: [
                                    {view:"combo", label: "", value: ""},
                                    {view: "button", type: "base", label: "+", width: 30,
                                        click: () => {
                                            this.popstri.show("Добавление д.вещества");
                                            //console.log(this.popstri.getValues());
                                            }
                                        },
                                    ]},
                                {view: "textarea", label: "Описание:", labelPosition:"top", value: "", height: 120}
                                ]},
                            {width: 5,},
                            {rows: [
                                {view: "form", css: "borders",
                                    elements: [
                                        {view: "checkbox", labelRight: "Рецептурный", labelWidth: 0, align: "left", name: "_prescr"},
                                        {view: "checkbox", labelRight: "Обязательный", labelWidth: 0, align: "left", name: "_mandat"},
                                        {view:"combo", label: "Сезон:", labelPosition:"top", value: ""},
                                        {view:"combo", label: "Условия хранения:", labelPosition:"top", value: ""},
                                        {view:"combo", label: "Группа:", labelPosition:"top", value: ""},
                                        {view:"combo", label: "НДС:", labelPosition:"top", value: ""},
                                    ]}
                                ]}
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
    show(new_head, item){
        if (item) {
            console.log(item)
            }
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
    hide(){
        this.getRoot().hide()
        }
    init() {
        this.popstri = this.ui(NewstriView);
        }
    }



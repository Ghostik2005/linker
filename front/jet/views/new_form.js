//"use strict";

import {JetView} from "webix-jet";


export default class newform extends JetView{
    config(){
        return {view: "cWindow",
            modal: true,
            body: { view: "form",
                localid: "new_form",
                margin: 0,
                elements: [
                    {rows: [
                        {view: "text", label: "Название товара:   " + "Название 1", labelPosition:"top", value: "Название 1"},
                        {height: 10, width: 600},
                        {cols: [
                            {rows: [
                                {view:"combo", label: "Страна:", labelPosition:"top", value: "", width: 400},
                                {view:"combo", label: "Производитель:" + "Китай", labelPosition:"top", value: ""},
                                {view:"combo", label: "Действующее вещество:", labelPosition:"top", value: ""},
                                {view: "textarea", label: "Описание:", labelPosition:"top", value: "", height: 150}
                                ]},
                            {width: 5,},
                            {rows: [
                                {view: "form", css: "borders",
                                    elements: [
                                        {view:"label", label: "Рецептурный"},
                                        {view:"label", label: "Обязательный"},
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
    show(){
        this.getRoot().show()
        }
    hide(){
        this.getRoot().hide()
        }
    }



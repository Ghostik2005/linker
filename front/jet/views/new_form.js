//"use strict";

import {JetView} from "webix-jet";
import NewstriView from "../views/new_stri";
import {strana, vendor, dv} from "../views/globals";

export default class NewformView extends JetView{
    config(){
        function strana_filter(item, value) {
            value = value.toString().toLowerCase()
            value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
            return item.c_strana.toString().toLowerCase().search(value) != -1;
            };
        return {view: "cWindow",
            modal: true,
            body: { view: "form",
                //localid: "new_form",
                margin: 0,
                elements: [
                    {rows: [
                        {view: "label", label:"Название товара:   " + "Название 1", name: 't_name'},
                        {view: "text", label: "", value: "Название 1", name: "c_tovar"},
                        {height: 10, width: 600},
                        {cols: [
                            {rows: [
                                {view: "label", label:"Страна:", name: "s_name"},
                                {view:"combo", width: 400, name: 'id_strana',
                                    options:  {
                                        filter: strana_filter,
                                        body: {
                                            template:"#c_strana#",
                                            yCount:15,
                                            data: strana
                                            }
                                        },
                                    on: {
                                        onAfterRender: function() {
                                            this.getList().sync($$("strana_dc"));
                                            }
                                        },
                                    },
                                {view: "label", label:"Производитель:" + "Китай", name: "v_name"},
                                {cols: [
                                    {view:"combo", label: "", value: "", name: "id_zavod",
                                        options:  {
                                            //filter: strana_filter,
                                            body: {
                                                template:"#c_zavod#",
                                                yCount:15,
                                                data: vendor
                                                }
                                            },
                                        on: {
                                            onAfterRender: function() {
                                                this.getList().sync($$("vendor_dc"));
                                                }
                                            },
                                        },
                                    {view: "button", type: "base", label: "+", width: 30,
                                        click: () => {
                                            this.popstri.show("Добавление производителя");
                                            }
                                        },
                                    ]},
                                {view: "label", label:"Действующее вещество:", name: 'dv_name'},
                                {cols: [
                                    {view:"combo", label: "", name: "id_dv",
                                        options:  {
                                            //filter: strana_filter,
                                            body: {
                                                template:"#act_ingr#",
                                                yCount:15,
                                                data: dv
                                                }
                                            },
                                        on: {
                                            onAfterRender: function() {
                                                this.getList().sync($$("dv_dc"));
                                                }
                                            },
                                        },
                                    {view: "button", type: "base", label: "+", width: 30,
                                        click: () => {
                                            this.popstri.show("Добавление д.вещества");
                                            }
                                        },
                                    ]},
                                {view: "label", label:"Штрих-код:"},
                                {cols: [
                                    {view:"text", label: "", value: "", readonly: true, name: "barcode"},
                                    {view: "button", type: "base", label: "+", width: 30,
                                        click: () => {
                                            this.popstri.show("Добавление ш.кода");
                                            }
                                        },
                                    ]},
                                {view: "textarea", label: "Описание:", labelPosition:"top", value: "", height: 120, name: "c_opisanie"}
                                ]},
                            {width: 5,},
                            {rows: [
                                {view: "form", css: "borders",
                                    elements: [
                                        {view: "label", labelWidth: 0},
                                        {view: "label", labelWidth: 0},
                                        {view: "checkbox", labelRight: "Рецептурный", labelWidth: 0, align: "left", name: "_prescr"},
                                        {view: "checkbox", labelRight: "Обязательный", labelWidth: 0, align: "left", name: "_mandat"},
                                        {view:"combo", label: "Сезон:", labelPosition:"top", value: ""},
                                        {view:"combo", label: "Условия хранения:", labelPosition:"top", value: ""},
                                        {view:"combo", label: "Группа:", labelPosition:"top", value: ""},
                                        {view:"combo", label: "НДС:", labelPosition:"top", value: ""},
                                    ]}
                                ]}
                            ]},
                        {cols: [
                            {view: "button", type: "base", label: "Отменить", width: 120, height: 32,
                                click: () => {
                                    webix.message("Очищаем форму и закрываем");
                                    this.hide();
                                    }
                                },
                            {},
                            {view: "button", type: "base", label: "Сохранить", width: 120, height: 32,
                                click: () => {
                                    webix.message("Очищаем форму, отправляем данные на сервер и закрываем");
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
    show(new_head, item){
        if (item) {
            //console.log(this.getRoot());
            console.log(this.getRoot().getBody());
            this.getRoot().getBody().parse(item);
            this.getRoot().getBody().refresh();
            console.log('parse', item);
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



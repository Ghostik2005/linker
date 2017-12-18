//"use strict";

import {JetView} from "webix-jet";
import NewstriView from "../views/new_stri";
import {strana, vendor, dv} from "../views/globals";
import {sezon, nds, group, hran} from "../views/globals";

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
                localId: "new_form",
                margin: 0,
                elements: [
                    {rows: [
                        {view: "label", label:"Название товара:   " + "Название 1", name: 't_name'},
                        {view: "text", label: "", value: "Название 1", name: "c_tovar"},
                        {height: 10, width: 700},
                        {cols: [
                            {rows: [
                                {view: "label", label:"Страна:", name: "s_name"},
                                {view:"combo", width: 400, value: "", name: 'id_strana',
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
                                                yCount:10,
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
                                    {view:"combo", label: "", value: "", name: "id_dv",
                                        options:  {
                                            //filter: strana_filter,
                                            body: {
                                                autoheight:false,
                                                view:"list",
                                                type:{ height:"auto" },
                                                template: "<div class='comboList'>#act_ingr#</div>",
                                                height: 400,
                                                yCount:0,
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
                                    localId: "new_f_right",
                                    elements: [
                                        {view: "label", labelWidth: 0},
                                        {view: "label", labelWidth: 0},
                                        {view: "checkbox", labelRight: "Рецептурный", labelWidth: 0, align: "left", name: "_prescr"},
                                        {view: "checkbox", labelRight: "Обязательный", labelWidth: 0, align: "left", name: "_mandat"},
                                        {view:"combo", label: "Сезон:", labelPosition:"top", value: "", name: "id_sezon", css: "small",
                                            options:  {
                                                body: {
                                                    //autoheight:false,
                                                    //view:"list",
                                                    //type:{ height:"auto" },
                                                    template: "#sezon#",
                                                    //height: 400,
                                                    yCount:5,
                                                    data: sezon
                                                    }
                                                },
                                            on: {
                                                onAfterRender: function() {
                                                    this.getList().sync($$("sezon_dc"));
                                                    }
                                                },
                                            },
                                        {view:"combo", label: "Условия хранения:", labelPosition:"top", value: "", name: "id_usloviya", css: "small",
                                            options:  {
                                                body: {
                                                    //autoheight:false,
                                                    //view:"list",
                                                    //type:{ height:"auto" },
                                                    template: "#usloviya#",
                                                    //height: 400,
                                                    yCount:10,
                                                    data: hran
                                                    }
                                                },
                                            on: {
                                                onAfterRender: function() {
                                                    this.getList().sync($$("hran_dc"));
                                                    }
                                                },
                                            },
                                        {view:"combo", label: "Группа:", labelPosition:"top", value: "", name: "id_group", css: "small",
                                            options:  {
                                                body: {
                                                    autoheight:false,
                                                    view:"list",
                                                    type:{ height:"auto" },
                                                    template: "<div class='comboList'>#group#</div>",
                                                    height: 400,
                                                    yCount:0,
                                                    data: group
                                                    }
                                                },
                                            on: {
                                                onAfterRender: function() {
                                                    this.getList().sync($$("group_dc"));
                                                    }
                                                },
                                            },
                                        {view:"combo", label: "НДС:", labelPosition:"top", value: "", name: "id_nds", css: "small",
                                            options:  {
                                                body: {
                                                    template:"#nds#",
                                                    yCount:10,
                                                    data: nds
                                                    }
                                                },
                                            on: {
                                                onAfterRender: function() {
                                                    this.getList().sync($$("nds_dc"));
                                                    }
                                                },
                                            },
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
                            {view: "button", type: "base", label: "Test", width: 120, height: 32,
                                click: () => {
                                    //console.log('root', this.getRoot());
                                    //console.log('root/body', this.getRoot().getBody());
                                    //console.log('root/child', this.getRoot().getChildViews());
                                    //console.log('root/body/child', this.getRoot().getBody().getChildViews()[0].getChildViews());
                                    }
                                },
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
            this.$$("new_form").parse(item);
            this.$$("new_f_right").parse(item);
            //this.getRoot().getBody().parse(item);
            //console.log('parse', item);
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



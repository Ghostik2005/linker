"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import LinksView from "../views/links_form";
import ConfirmView from "../views/yes-no";
import {request, filter_1, get_suppl} from "../views/globals";

export default class TopmenuView extends JetView{
    config(){
        return {
            rows: [
                {view: 'toolbar',
                    height: 40,
                    cols: [
                        {view: "combo", name: "suppliers", id: "_suppl",
                            readonly: !true, disabled: !true, width: 300,
                            options: {
                                filter: filter_1,
                                body: {
                                    css: "big-combo",
                                    template: "#c_vnd# - #n_sum2#",
                                    yCount: 10
                                    }
                                },
                            },
                        {},
                        {view:"button", type: 'form',
                            label: "TEST", width: 150,
                            click: () => {
                                webix.message({
                                    text: "test",
                                    type: "debug",
                                    })
                                }
                            },
                        {view:"button", id: '_links', type: 'htmlbutton',
                            label: "<span class='webix_icon fa-stumbleupon'></span><span style='line-height: 20px;'> Связки (Ctrl+L)</span>", width: 150,
                            click: () => {
                                this.poplinks.show("Линки");
                                }
                            },
                    ]},
                {view: 'toolbar',
                    //height: 48,
                    css: "header",
                    rows: [
                        {cols: [
                            {view: "label", label: "<a href='http://ms71.org'><span>Название препарата</span></a>",
                                },
                            {},
                            {view: "label", label: "<span style='color: #666666;'>Осталось свести: </span><span style='color: red; font-weight: bold;'>"+ 13 + "</span>", css: 'right',
                                },
                            ]},
                        {cols: [
                            {view: "label", label: "Россия", css: "header",
                                },
                            {},
                            {view: "button", type: "form",
                                label: "Посмотреть все", width: 190,
                                click: () => {
                                    webix.message('просмотр всех несвязанных товаров поставщика');
                                    }
                                },
                            ]},
                    ]},
                {view: 'toolbar',
                    height: 40,
                    cols: [
                        {view: "text", label: "", value: "", labelWidth: 1},
                        {view:"button", type: 'htmlbutton',
                            label: "Добавить (Ins)", width: 140,
                            click: () => {
                                this.popnew.show("Добавление в справочник");
                                }
                            },
                        {view:"button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-link'></span><span style='line-height: 20px;'>  Объединить (Ctrl+Home)</span>", width: 220,
                            click: () => {
                                this.popconfirm.show('Связать?');
                                }
                            },
                        {view:"button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-left'></span><span style='line-height: 20px;'>Ctrl+</span><span class='webix_icon fa-arrow-down'></span>", width: 90},
                        {view:"button", type: 'htmlbutton',
                            label: "Пропустить (Ctrl+M)", width: 160,
                            click: () => {
                                this.popconfirm.show('Пропустить?');
                                }
                            },
                        {view:"button", type: 'htmlbutton',
                            label: "<span style='line-height: 20px;'>Ctrl+</span><span class='webix_icon fa-arrow-up'></span><span class='webix_icon fa-angle-right'></span>", width: 90}
                    ]},
                ]
            }
        }
    init() {
        get_suppl("_suppl", this);
        //console.log(this);
        //console.log($$("_suppl"))
        this.popconfirm = this.ui(ConfirmView);
        this.popnew = this.ui(NewformView);
        this.poplinks = this.ui(LinksView);
        }
    }

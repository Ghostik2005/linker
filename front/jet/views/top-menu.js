"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import LinksView from "../views/links_form";

export default class TopmenuView extends JetView{
    config(){
        return {
            rows: [
                {view: 'toolbar',
                    height: 40,
                    cols: [
                        {view: "combo", width: 250},
                        {},
                        {view:"button", id: '_links', type: 'htmlbutton',
                            label: "Линки (Ctrl+L)", width: 150,
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
                            {view: "label", label: "<span style='color: #666666;'>Осталось: 13</span>", css: 'right',
                                },
                            ]},
                        {view: "label", label: "Россия", css: "header",
                            }
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
                            label: "Объединить (Ctrl+Home)", width: 200},
                        {view:"button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-left'></span><span style='line-height: 20px;'>Ctrl+</span><span class='webix_icon fa-arrow-down'></span>", width: 90},
                        {view:"button", type: 'htmlbutton',
                            label: "Пропустить (Ctrl+M)", width: 160},
                        {view:"button", type: 'htmlbutton',
                            label: "<span style='line-height: 20px;'>Ctrl+</span><span class='webix_icon fa-arrow-up'></span><span class='webix_icon fa-angle-right'></span>", width: 90}
                    ]},
                ]
            }
        }
    init() {
        this.popnew = this.ui(NewformView);
        this.poplinks = this.ui(LinksView);
        }
    }

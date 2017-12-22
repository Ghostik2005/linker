"use strict";

import {JetView} from "webix-jet";
//import {get_prc_skipped} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page} from "../views/globals";

export default class SkippedView extends JetView{
    config(){
        var top = {view: 'toolbar',
                    height: 40,
                    cols: [
                        {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", id: "_search_skip",
                            keyPressTimeout: 900, tooltip: "!слово - исключить из поиска, +слово - поиск в названии производителя",
                            on: {
                                onTimedKeyPress: (code, event) => {
                                    let count = $$("__dt_s").config.posPpage;
                                    get_data({
                                        th: this,
                                        view: "__dt_s",
                                        navBar: "__nav_s",
                                        start: 1,
                                        count: count,
                                        searchBar: "_search_skip",
                                        method: "getPrcsSkip"
                                        });
                                    //get_spr_skipped(this, "__dt_s", "__nav_s", 1, count);
                                    }
                                },
                            },
                        ]
                    }

        var bottom = {
            view: "toolbar",
            id: "__nav_s",
            height: 36,
            cols: [
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                    click: () => {
                        let start = 1;
                        let count = $$("__dt_s").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dt_s",
                            navBar: "__nav_s",
                            start: start,
                            count: count,
                            searchBar: "_search_skip",
                            method: "getPrcsSkip"
                            });
                        //get_prc_skipped(this, "__dt_s", "__nav_s", start, count)
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                    click: () => {
                        let start = $$("__dt_s").config.startPos - $$("__dt_s").config.posPpage;
                        start = (start < 0) ? 1 : start;
                        let count = $$("__dt_s").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dt_s",
                            navBar: "__nav_s",
                            start: start,
                            count: count,
                            searchBar: "_search_skip",
                            method: "getPrcsSkip"
                            });
                        }
                    },
                {view: "label", label: "Страница 1 из 1", width: 200, id: "__pager_s"},
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                    click: () => {
                        let start = $$("__dt_s").config.startPos + $$("__dt_s").config.posPpage;
                        start = (start > $$("__dt_s").config.totalPos) ? last_page("__dt_s"): start;
                        let count = $$("__dt_s").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dt_s",
                            navBar: "__nav_s",
                            start: start,
                            count: count,
                            searchBar: "_search_skip",
                            method: "getPrcsSkip"
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                    click: () => {
                        let start = last_page("__dt_s");
                        let count = $$("__dt_s").config.posPpage;
                        get_data({
                            th: this,
                            view: "__dt_s",
                            navBar: "__nav_s",
                            start: start,
                            count: count,
                            searchBar: "_search_skip",
                            method: "getPrcsSkip"
                            });
                        }
                    },
                {},
                {view: "label", label: "Всего записей: 0", width: 180, id: "__count_s"},
                ]
            };

        var sprv = {view: "datatable",
            id: "__dt_s",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            //footer: true,
            headermenu:true,
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            columns: [
                {id: "id_tovar", width: 80, sort: "int",
                    header: [{text: "ID товара"},
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "text",
                    header: [{text: "Название"},
                        ]
                    },
                { id: "c_zavod", sort: "text",
                    width: 300,
                    header: [{text: "Производитель"},
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            });
                        }
                    },
                onItemDblClick: function(item) {
                    webix.message({"type": "debug", "text": "Выполняем какое-то действие"});
                    webix.message({"type": "debug", "text": "Например - возврат позиции на сведение"});
                    //item = this.getItem(item.row);
                    //item = item.id_spr;
                    //item = get_spr(this.$scope, item);
                    //item["s_name"] = "Страна: " + item.c_strana;
                    //item["t_name"] = "Название товара: " + item.c_tovar;
                    //item["v_name"] = "Производитель: " + item.c_zavod;
                    //item["dv_name"] = "Действующее вещество: " + item.c_dv;
                    //this.$scope.popnew.show("Редактирование записи " + item.id_spr, item);
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    }
                }
            }
        var _view = {view: "cWindow",
            width: document.documentElement.clientWidth * 0.8,
            height: document.documentElement.clientHeight * 0.8,
            modal: true,
            on: {
                onShow: () => {
                    get_data({
                        th: this,
                        view: "__dt_s",
                        navBar: "__nav_s",
                        start: 1,
                        count: $$("__dt_s").config.posPpage,
                        searchBar: "_search_skip",
                        method: "getPrcsSkip"
                        });
                    }
                },
            body: {
                view: "layout",
                rows: [
                    top,
                    sprv,
                    bottom,
                    ]}
                }
        return _view
        }

    show(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
    hide(){
        this.getRoot().hide()
        }
    }

"use strict";

import {JetView} from "webix-jet";
import {get_data} from "../views/globals";
import {last_page} from "../views/globals";
import ConfirmView from "../views/yes-no";

export default class SkippedView extends JetView{
    config(){
        function delSkip () {
            let item_id = $$("__dt_s").getSelectedId()
            $$("__dt_s").remove(item_id)
            }
        var top = {//view: 'toolbar',
                    height: 40,
                    cols: [
                        {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", id: "_search_skip",
                            keyPressTimeout: 900, tooltip: "!слово - исключить из поиска, +слово - поиск в названии производителя",
                            on: {
                                onTimedKeyPress: (code, event) => {
                                    let count = $$("__dt_s").config.posPpage;
                                    let field = $$("__dt_s").config.fi;
                                    let direction = $$("__dt_s").config.di;
                                    get_data({
                                        th: this,
                                        view: "__dt_s",
                                        navBar: "__nav_s",
                                        start: 1,
                                        count: count,
                                        searchBar: "_search_skip",
                                        method: "getPrcsSkip",
                                        field: field,
                                        direction: direction
                                        });
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
                        let field = $$("__dt_s").config.fi;
                        let direction = $$("__dt_s").config.di;
                        get_data({
                            th: this,
                            view: "__dt_s",
                            navBar: "__nav_s",
                            start: start,
                            count: count,
                            searchBar: "_search_skip",
                            method: "getPrcsSkip",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                    click: () => {
                        let start = $$("__dt_s").config.startPos - $$("__dt_s").config.posPpage;
                        start = (start < 0) ? 1 : start;
                        let count = $$("__dt_s").config.posPpage;
                        let field = $$("__dt_s").config.fi;
                        let direction = $$("__dt_s").config.di;
                        get_data({
                            th: this,
                            view: "__dt_s",
                            navBar: "__nav_s",
                            start: start,
                            count: count,
                            searchBar: "_search_skip",
                            method: "getPrcsSkip",
                            field: field,
                            direction: direction
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
                        let field = $$("__dt_s").config.fi;
                        let direction = $$("__dt_s").config.di;
                        get_data({
                            th: this,
                            view: "__dt_s",
                            navBar: "__nav_s",
                            start: start,
                            count: count,
                            searchBar: "_search_skip",
                            method: "getPrcsSkip",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                    click: () => {
                        let start = last_page("__dt_s");
                        let count = $$("__dt_s").config.posPpage;
                        let field = $$("__dt_s").config.fi;
                        let direction = $$("__dt_s").config.di;
                        get_data({
                            th: this,
                            view: "__dt_s",
                            navBar: "__nav_s",
                            start: start,
                            count: count,
                            searchBar: "_search_skip",
                            method: "getPrcsSkip",
                            field: field,
                            direction: direction
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
            headermenu:true,
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            old_stri: " ",
            fi: 'c_tovar',
            di: 'asc',
            columns: [
                {id: "id_tovar", width: 80, sort: "server",
                    header: [{text: "ID товара"},
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
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
                onBeforeSort: (field, direction) => {
                    let th = this;
                    let start = $$("__dt_s").config.startPos;
                    let count = $$("__dt_s").config.posPpage;
                    $$("__dt_s").config.fi = field;
                    $$("__dt_s").config.di = direction;
                    get_data({
                        th: this,
                        view: "__dt_s",
                        navBar: "__nav_s",
                        start: start,
                        count: count,
                        searchBar: "_search_skip",
                        method: "getPrcsSkip",
                        field: field,
                        direction: direction
                        });
                    },
                onItemDblClick: function(item) {
                    let user = this.$scope.app.config.user
                    if (user === this.$scope.app.config.admin) {
                        let sh_prc = this.getSelectedItem().sh_prc
                        let params = {};
                        params["command"] = "?returnLnk";
                        params["sh_prc"] = sh_prc;
                        params["type"] = "async";
                        params["callback"] = delSkip;
                        this.$scope.popconfirm.show('Вернуть на сведение?', params);
                        }
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
                        method: "getPrcsSkip",
                        direction: "asc",
                        field: "c_tovar"
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
    init() {
        this.popconfirm = this.ui(ConfirmView);
        }
    }

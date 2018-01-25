"use strict";

import {JetView} from "webix-jet";
import {get_data} from "../views/globals";
import {last_page} from "../views/globals";
import ConfirmView from "../views/yes-no";
import {parse_unlinked_item} from "../views/globals";

export default class AllUnlinkedView extends JetView{
    config(){
        function delSkip () {
            let item_id = $$("__dt_a").getSelectedId()
            $$("__dt_a").remove(item_id)
            }
        var top = {//view: 'toolbar',
                    height: 40,
                    cols: [
                        {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", id: "_search_all",
                            keyPressTimeout: 900, tooltip: "!слово - исключить из поиска",
                            on: {
                                onTimedKeyPress: (code, event) => {
                                    let count = $$("__dt_a").config.posPpage;
                                    let field = $$("__dt_a").config.fi;
                                    let direction = $$("__dt_a").config.di;
                                    get_data({
                                        th: this,
                                        view: "__dt_a",
                                        navBar: "__nav_a",
                                        start: 1,
                                        count: count,
                                        searchBar: "_search_all",
                                        method: "getPrcsAll",
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
            id: "__nav_a",
            height: 36,
            cols: [
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                    click: () => {
                        let start = 1;
                        let count = $$("__dt_a").config.posPpage;
                        let field = $$("__dt_a").config.fi;
                        let direction = $$("__dt_a").config.di;
                        get_data({
                            th: this,
                            view: "__dt_a",
                            navBar: "__nav_a",
                            start: start,
                            count: count,
                            searchBar: "_search_all",
                            method: "getPrcsAll",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                    click: () => {
                        let start = $$("__dt_a").config.startPos - $$("__dt_a").config.posPpage;
                        start = (start < 0) ? 1 : start;
                        let count = $$("__dt_a").config.posPpage;
                        let field = $$("__dt_a").config.fi;
                        let direction = $$("__dt_a").config.di;
                        get_data({
                            th: this,
                            view: "__dt_a",
                            navBar: "__nav_a",
                            start: start,
                            count: count,
                            searchBar: "_search_all",
                            method: "getPrcsAll",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "label", label: "Страница 1 из 1", width: 200, id: "__pager_a"},
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                    click: () => {
                        let start = $$("__dt_a").config.startPos + $$("__dt_a").config.posPpage;
                        start = (start > $$("__dt_a").config.totalPos) ? last_page("__dt_a"): start;
                        let count = $$("__dt_a").config.posPpage;
                        let field = $$("__dt_a").config.fi;
                        let direction = $$("__dt_a").config.di;
                        get_data({
                            th: this,
                            view: "__dt_a",
                            navBar: "__nav_a",
                            start: start,
                            count: count,
                            searchBar: "_search_all",
                            method: "getPrcsAll",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                    click: () => {
                        let start = last_page("__dt_a");
                        let count = $$("__dt_a").config.posPpage;
                        let field = $$("__dt_a").config.fi;
                        let direction = $$("__dt_a").config.di;
                        get_data({
                            th: this,
                            view: "__dt_a",
                            navBar: "__nav_a",
                            start: start,
                            count: count,
                            searchBar: "_search_all",
                            method: "getPrcsAll",
                            field: field,
                            direction: direction
                            });
                        }
                    },
                {},
                {view: "label", label: "Всего записей: 0", width: 180, id: "__count_a"},
                ]
            };

        var sprv = {view: "datatable",
            id: "__dt_a",
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
            fi: 'c_tovar',
            di: 'asc',
            old_stri: " ",
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
                    width: 200,
                    header: [{text: "Производитель"},
                        ]
                    },
                { id: "c_user", sort: "text",
                    width: 200,
                    header: [{text: "Пользователь"},
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
                    let start = $$("__dt_a").config.startPos;
                    let count = $$("__dt_a").config.posPpage;
                    $$("__dt_a").config.fi = field;
                    $$("__dt_a").config.di = direction;
                    get_data({
                        th: this,
                        view: "__dt_a",
                        navBar: "__nav_a",
                        start: start,
                        count: count,
                        searchBar: "_search_all",
                        method: "getPrcsAll",
                        field: field,
                        direction: direction
                        });
                    },
                onItemDblClick: () => {
                    //console.log(this.getRoot().getBody());
                    let item = $$("__dt_a").getSelectedItem();
                    if (this.app.config.user === this.app.config.admin || item.c_user === this.app.config.user) {
                        //разрешено редактирование только админами или текущий пользовватель совпадает с ответственным
                        //console.log(item);
                        parse_unlinked_item(this, item);
                        this.getRoot().hide();
                    } else {
                        webix.message({"text": "Упс. Нет доступа.", "type": "debug"});
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
                        view: "__dt_a",
                        navBar: "__nav_a",
                        start: 1,
                        count: $$("__dt_a").config.posPpage,
                        searchBar: "_search_all",
                        method: "getPrcsAll",
                        field: 'c_tovar',
                        direction: 'asc'
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

"use strict";

import {JetView} from "webix-jet";
import {get_data} from "../views/globals";
import {last_page, checkKey, cEvent, fRefresh, fRender} from "../views/globals";
import {parse_unlinked_item, prcs, getDtParams, parseToLink} from "../views/globals";

export default class AllUnlinkedView extends JetView{
    config(){
        let app = $$("main_ui").$scope.app;

        webix.ui.datafilter.customFilterUnlnk = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.customFilterUnlnk.on_key_down = function(e, node, value){
                var id = this._comp_id;
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_ti) window.clearTimeout(this._filter_ti);
                this._filter_ti=window.setTimeout(function(){
                    let ui = webix.$$(id);
                    if (ui) {
                        let params = getDtParams(ui);
                        get_data({
                            view: id,
                            navBar: "__nav_a",
                            start: 1,
                            count: params[1],
                            searchBar: undefined,
                            method: "getPrcsAll",
                            field: params[2],
                            direction: params[3],
                            filter: params[0]
                            });
                        };
                    }, app.config.searchDelay);
                };
        webix.ui.datafilter.customFilterUnlnk.refresh = fRefresh;
        webix.ui.datafilter.customFilterUnlnk.render = fRender;

        var bottom = {
            view: "toolbar",
            id: "__nav_a",
            height: 36,
            cols: [
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                    click: () => {
                        var id = "__dt_a";
                        let ui = webix.$$(id);
                        if (ui) {
                            let params = getDtParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_a",
                                start: 1,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsAll",
                                field: params[2],
                                direction: params[3],
                                filter: params[0]
                                });
                            };
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                    click: () => {
                        let start = $$("__dt_a").config.startPos - $$("__dt_a").config.posPpage;
                        start = (start < 0) ? 1 : start;
                        var id = "__dt_a";
                        let ui = webix.$$(id);
                        if (ui) {
                            let params = getDtParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_a",
                                start: start,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsAll",
                                field: params[2],
                                direction: params[3],
                                filter: params[0]
                                });
                            };
                        }
                    },
                {view: "label", label: "Страница 1 из 1", width: 200, id: "__pager_a"},
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                    click: () => {
                        var id = "__dt_a";
                        let ui = webix.$$(id);
                        if (ui) {
                            let start = ui.config.startPos + ui.config.posPpage;
                            start = (start > ui.config.totalPos) ? last_page(id): start;
                            let params = getDtParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_a",
                                start: start,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsAll",
                                field: params[2],
                                direction: params[3],
                                filter: params[0]
                                });
                            };
                        }
                    },
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                    click: () => {
                        var id = "__dt_a";
                        let ui = webix.$$(id);
                        if (ui) {
                            let start = last_page(id);
                            let params = getDtParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_a",
                                start: start,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsAll",
                                field: params[2],
                                direction: params[3],
                                filter: params[0]
                                });
                            };
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
                {id: "id_tovar", width: 80, //sort: "server",
                    hidden: true,
                    header: [{text: "ID товара"},
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    headermenu:false,
                    header: [{text: "Название"},
                        {content: "customFilterUnlnk"},
                        ]
                    },
                { id: "c_vnd", sort: "server",
                    width: 200,
                    header: [{text: "Поставщик"},
                        {content: "customFilterUnlnk"},
                        ]
                    },
                { id: "c_zavod", sort: "server",
                    width: 200,
                    header: [{text: "Производитель"},
                        {content: "customFilterUnlnk"},
                        ]
                    },
                { id: "c_user", sort: "server",
                    width: 160,
                    header: [{text: "Пользователь"},
                        {content: "customFilterUnlnk"},
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    //if (!this.count) {
                        //this.showProgress({
                            //type: "icon",
                            //icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            //});
                        //}
                    },
                onBeforeSort: (field, direction) => {
                    var id = "__dt_a";
                    let ui = webix.$$(id);
                    if (ui) {
                        let start = ui.config.startPos;
                        let params = getDtParams(ui);
                        get_data({
                            view: id,
                            navBar: "__nav_a",
                            start: start,
                            count: params[1],
                            searchBar: undefined,
                            method: "getPrcsAll",
                            field: params[2],
                            direction: params[3],
                            filter: params[0]
                            });
                        };
                    },
                //onResize: function () {
                    //if (this.isColumnVisible('c_user')) {
                        //this.getFilter('c_user').value = this.$scope.app.config.user;
                        //if  (this.$scope.app.config.role !== this.$scope.app.config.admin) {
                            //this.getFilter('c_user').value = this.$scope.app.config.user;
                            //this.getFilter('c_user').readOnly = true;
                        //} else {
                            //this.getFilter('c_user').readOnly = false;
                            //}
                        //}
                    //},
                onItemDblClick: () => {
                    let item = $$("__dt_a").getSelectedItem();
                    console.log('item', item);
                    if (this.app.config.role === this.app.config.admin || item.c_user === this.app.config.user) {
                        parseToLink(item);
                        this.getRoot().hide();
                    } else {
                        webix.message({"text": "Упс. Нет доступа.", "type": "debug"});
                        }
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
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
                    var id = "__dt_a";
                    let ui = webix.$$(id);
                    if (ui) {
                        let params = getDtParams(ui);
                        get_data({
                            view: id,
                            navBar: "__nav_a",
                            start: 1,
                            count: params[1],
                            searchBar: undefined,
                            method: "getPrcsAll",
                            field: params[2],
                            direction: params[3],
                            filter: params[0]
                            });
                        };
                    },
                onHide: () => {
                    $$("_spr_search").focus();
                    }
                },
            body: {
                view: "layout",
                rows: [
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
        if ($$("__dt_a").isColumnVisible('c_user')) {
            $$("__dt_a").getFilter('c_user').value = this.app.config.user;
            if  (this.app.config.role !== this.app.config.admin) {
                $$("__dt_a").getFilter('c_user').value = this.app.config.user;
                $$("__dt_a").getFilter('c_user').readOnly = true;
            } else {
                $$("__dt_a").getFilter('c_user').readOnly = false;
                }
            }
        }
    }

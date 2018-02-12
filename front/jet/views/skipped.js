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

        function getParams(ui) {
            let c_filter = {
                        'c_tovar'   : $$(ui).getFilter('c_tovar').value,
                        'c_vnd'     : $$(ui).getFilter('c_vnd').value,
                        'c_zavod'   : $$(ui).getFilter('c_zavod').value,
                        }
            let count = ui.config.posPpage;
            let field = ui.config.fi;
            let direction = ui.config.di;
            return [c_filter, count, field, direction]
            }

        webix.ui.datafilter.customFilterSkip = webix.extend ({
            render:function(master, config){
                if (this.init) this.init(config);
                config.css = "my_filter";
                return "<input "+(config.placeholder?('placeholder="'+config.placeholder+'" '):"")+"type='text'>";
                },
            _on_key_down:function(e, node, value){
                var id = this._comp_id;
                if ((e.which || e.keyCode) == 9) return;
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(function(){
                    let ui = webix.$$(id);
                    if (ui) {
                        let params = getParams(ui);
                        get_data({
                            view: id,
                            navBar: "__nav_s",
                            start: 1,
                            count: params[1],
                            searchBar: undefined,
                            method: "getPrcsSkip",
                            field: params[2],
                            direction: params[3],
                            filter: params[0]
                            });
                        };
                    //if (ui) ui.filterByAll();
                    },webix.ui.datafilter.textWaitDelay);
                }
            },  webix.ui.datafilter.textFilter);


            
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
                        var id = "__dt_s";
                        let ui = webix.$$(id);
                        if (ui) {
                            let params = getParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_s",
                                start: 1,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsSkip",
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
                        let start = $$("__dt_s").config.startPos - $$("__dt_s").config.posPpage;
                        start = (start < 0) ? 1 : start;
                        var id = "__dt_s";
                        let ui = webix.$$(id);
                        if (ui) {
                            let params = getParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_s",
                                start: start,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsSkip",
                                field: params[2],
                                direction: params[3],
                                filter: params[0]
                                });
                            };
                        }
                    },
                {view: "label", label: "Страница 1 из 1", width: 200, id: "__pager_s"},
                {view: "button", type: 'htmlbutton',
                    label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                    click: () => {
                        var id = "__dt_s";
                        let ui = webix.$$(id);
                        if (ui) {
                            let start = ui.config.startPos + ui.config.posPpage;
                            start = (start > ui.config.totalPos) ? last_page(id): start;
                            let params = getParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_s",
                                start: start,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsSkip",
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
                        var id = "__dt_s";
                        let ui = webix.$$(id);
                        if (ui) {
                            let start = last_page(id);
                            let params = getParams(ui);
                            get_data({
                                view: id,
                                navBar: "__nav_s",
                                start: start,
                                count: params[1],
                                searchBar: undefined,
                                method: "getPrcsSkip",
                                field: params[2],
                                direction: params[3],
                                filter: params[0]
                                });
                            };
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
                {id: "id_tovar", width: 80, //sort: "server",
                    hidden: true,
                    header: [{text: "ID товара"},
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    headermenu:false,
                    header: [{text: "Название"},
                        {content: "customFilterSkip"},
                        ]
                    },
                { id: "c_vnd", sort: "server",
                    width: 200,
                    header: [{text: "Поставщик"},
                        {content: "customFilterSkip"},
                        ]
                    },
                { id: "c_zavod", sort: "text",
                    width: 200,
                    header: [{text: "Производитель"},
                        {content: "customFilterSkip"},
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
                    var id = "__dt_s";
                    let ui = webix.$$(id);
                    if (ui) {
                        let start = ui.config.startPos;
                        let params = getParams(ui);
                        get_data({
                            view: id,
                            navBar: "__nav_s",
                            start: start,
                            count: params[1],
                            searchBar: undefined,
                            method: "getPrcsSkip",
                            field: params[2],
                            direction: params[3],
                            filter: params[0]
                            });
                        };
                    },
                onItemDblClick: function(item) {
                    let user = this.$scope.app.config.user
                    if (this.$scope.app.config.role === this.$scope.app.config.admin) {
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
                    var id = "__dt_s";
                    let ui = webix.$$(id);
                    if (ui) {
                        let params = getParams(ui);
                        get_data({
                            view: id,
                            navBar: "__nav_s",
                            start: 1,
                            count: params[1],
                            searchBar: undefined,
                            method: "getPrcsSkip",
                            field: params[2],
                            direction: params[3],
                            filter: params[0]
                            });
                        };
                    }
                },
            body: {
                view: "layout",
                rows: [
                    //top,
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

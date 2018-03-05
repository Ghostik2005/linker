"use strict";

import {JetView} from "webix-jet";
import {get_data} from "../views/globals";
import {last_page} from "../views/globals";
import {checkKey, getDtParams, fRender, fRefresh, cEvent} from "../views/globals";
import ConfirmView from "../views/yes-no";
import {dt_formating_sec, dt_formating, compareTrue} from "../views/globals";

export default class SkippedView extends JetView{
    config(){

        let app = $$("main_ui").$scope.app;

        function delSkip () {
            let item_id = $$("__dt_s").getSelectedId()
            $$("__dt_s").remove(item_id)
            }

        var filtFunc = function(id){
            let ui = webix.$$(id);
            if (ui) {
                let params = getDtParams(ui);
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
        
        webix.ui.datafilter.customFilterSkip = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.customFilterSkip.on_key_down = function(e, node, value){
                var id = this._comp_id;
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(function(){
                    filtFunc(id)
                    }, app.config.searchDelay);
                }
        webix.ui.datafilter.customFilterSkip.refresh = fRefresh;
        webix.ui.datafilter.customFilterSkip.render = fRender;

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
                            let params = getDtParams(ui);
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
                            let params = getDtParams(ui);
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
                            let params = getDtParams(ui);
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
                            let params = getDtParams(ui);
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
                {id: "dt", width: 200, sort: 'server',
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{text: "Дата изменения"}, 
                        {content: "dateRangeFilter", compare: compareTrue,
                            readonly: !true, disabled: !true,
                            inputConfig:{format:dt_formating, width: 180,},
                            suggest:{
                                view:"daterangesuggest", body:{ timepicker:false, calendarCount:2}
                                },
                            },
                        ]
                    },
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onBeforeSort: (field, direction) => {
                    var id = "__dt_s";
                    $$(id).config.fi = field;
                    $$(id).config.di = direction;
                    filtFunc(id);
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
                    var id = "__dt_s";
                    filtFunc(id);
                    },
                onHide: () => {
                    $$("__dt_s").clearAll();
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
        this.popconfirm = this.ui(ConfirmView);
        $$($$("__dt_s").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$($$("__dt_s").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(function(){
                var id = "__dt_s";
                let ui = webix.$$(id);
                if (ui) {
                    let params = getDtParams(ui);
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
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
            })
        }
    }

"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page, checkKey, getDtParams, fRender, fRefresh} from "../views/globals";
import {dt_formating_sec, dt_formating, compareTrue, cEvent} from "../views/globals";
import UnlinkView from "../views/unlink";

export default class LinksViewLnk extends JetView{
    config(){
        let app = $$("main_ui").$scope.app;

        var filtFunc = function(id){
            let ui = webix.$$(id);
            if (ui) {
                let params = getDtParams(ui);
                get_data({
                    view: id,
                    navBar: "__nav_ll",
                    start: 1,
                    count: params[1],
                    searchBar: "_link_search",
                    method: "getLnkSprs",
                    field: params[2],
                    direction: params[3],
                    filter: params[0]
                    });
                };
            }

        webix.ui.datafilter.cFilt = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.cFilt.on_key_down = function(e, node, value){
                var id = this._comp_id;
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(function(){
                    filtFunc(id);
                    },app.config.searchDelay);
                }
        webix.ui.datafilter.cFilt.refresh = fRefresh;
        webix.ui.datafilter.cFilt.render = fRender;

        function delLnk() {
            let cid = $$("__ttl").getSelectedItem().id;
            $$("__ttl").remove(cid);
            }

        return {view: "layout",
            rows: [
                {view: "datatable",
                    id: "__ttl",
                    startPos: 1,
                    posPpage: 20,
                    totalPos: 1250,
                    select: true,
                    borderless: true,
                    rowHeight: 30,
                    fixedRowHeight:false,
                    headermenu: true,
                    resizeColumn:true,
                    fi: 'c_tovar',
                    di: 'asc',
                    old_stri: " ",
                    columns: [
                        {id: "id_tovar", width: 100, hidden: true,
                            header: [{text: "Код"},
                            {content: "cFilt"},
                            ]
                            },
                        {id: "c_tovar", fillspace: true, sort: 'server',
                            template:"<span>{common.treetable()} #c_tovar#</span>",
                            header: [{text: "Наименование"},
                            ],
                            headermenu:false,
                            },
                        {id: "id_spr", width: 150, hidden: true,
                            header: [{text: "id_spr"},
                            ]
                            },
                        {id: "spr", width: 350,
                            header: [{text: "Эталон"},
                            {content: "cFilt", placeholder: "!слово - исключить из поиска"},
                            ]
                            },
                        {id: "c_zavod", width: 200, hidden: true,
                            header: [{text: "Производитель"},
                            {content: "cFilt"},
                            ]
                            },
                        {id: "c_vnd", width: 160,
                            header: [{text: "Поставщик"},
                            {content: "cFilt"},
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
                        {id: "owner", width: 100, sort: 'server',
                            header: [{text: "Создал"}, 
                            {content: "cFilt"},
                            ]
                            }
                        ],
                    on: {
                        "data->onParse":function(i, data){
                            this.clearAll();
                            },
                        onBeforeRender: function() {
                            webix.extend(this, webix.ProgressBar);
                            },
                        onBeforeSort: (field, direction) => {
                            var id = "__ttl";
                            $$(id).config.fi = field;
                            $$(id).config.di = direction;
                            filtFunc(id);
                            },
                        onItemDblClick: (item, ii, iii) => {
                            let sh_prc = $$("__ttl").getSelectedItem().id;
                            let params = {};
                            //params["action"] = "return";
                            params["command"] = "?delLnk";
                            params["sh_prc"] = sh_prc;
                            params["type"] = "async";
                            params["callback"] = delLnk;
                            params["parent"] = this;
                            this.popunlink.show("Причина разрыва связки?", params);
                            },
                        onKeyPress: function(code, e){
                            if (13 === code) {
                                if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                                }
                            },
                        onBeforeSelect: function (item) {
                            },
                        onAfterSelect: function (item) {
                            $$("_break").enable();
                            }
                        },
                    },
                {view: "toolbar",
                    id: "__nav_ll",
                    height: 36,
                    cols: [
                        {view: "button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-double-left'></span>", width: 50,
                            click: () => {
                                let id = "__ttl"
                                filtFunc(id);
                                }
                            },
                        {view: "button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                            click: () => {
                                let start = $$("__ttl").config.startPos - $$("__ttl").config.posPpage;
                                start = (start < 0) ? 1 : start;
                                let ui = webix.$$("__ttl");
                                if (ui) {
                                    let params = getDtParams(ui);
                                    get_data({
                                        view: "__ttl",
                                        navBar: "__nav_ll",
                                        start: start,
                                        count: params[1],
                                        searchBar: "_link_search",
                                        method: "getLnkSprs",
                                        field: params[2],
                                        direction: params[3],
                                        filter: params[0]
                                        });
                                    };
                                    
                                }
                            },
                        {view: "label", label: "Страница 1 из 1", width: 200},
                        {view: "button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                            click: () => {
                                let start = $$("__ttl").config.startPos + $$("__ttl").config.posPpage;
                                start = (start > $$("__ttl").config.totalPos) ? last_page("__ttl"): start;
                                let ui = webix.$$("__ttl");
                                if (ui) {
                                    let params = getDtParams(ui);
                                    get_data({
                                        view: "__ttl",
                                        navBar: "__nav_ll",
                                        start: start,
                                        count: params[1],
                                        searchBar: "_link_search",
                                        method: "getLnkSprs",
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
                                let start = last_page("__ttl");
                                let ui = webix.$$("__ttl");
                                if (ui) {
                                    let params = getDtParams(ui);
                                    get_data({
                                        view: "__ttl",
                                        navBar: "__nav_ll",
                                        start: start,
                                        count: params[1],
                                        searchBar: "_link_search",
                                        method: "getLnkSprs",
                                        field: params[2],
                                        direction: params[3],
                                        filter: params[0]
                                        });
                                    };
                                }
                            },
                        {},
                        {view: "label", label: "Всего записей: 0", width: 180},
                        ]
                    },
                ],
            }
        }

    init() {
        let app = $$("main_ui").$scope.app;
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkView);
        $$($$("__ttl").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$($$("__ttl").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(function(){
                let ui = webix.$$("__ttl");
                if (ui) {
                    let params = getDtParams(ui);
                    get_data({
                        view: "__ttl",
                        navBar: "__nav_ll",
                        start: 1,
                        count: params[1],
                        searchBar: "_link_search",
                        method: "getLnkSprs",
                        field: params[2],
                        direction: params[3],
                        filter: params[0]
                        });
                    };
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
            })
        if ($$("__ttl").isColumnVisible('dt')) {
            $$("__ttl").getFilter('dt').setValue({'start':new Date()});
            }
        if ($$("__ttl").isColumnVisible('owner')) {
            if  (!app.config.roles[app.config.role].lnkdel) {
                $$("__ttl").getFilter('owner').value = this.app.config.user;;
                $$("__ttl").getFilter('owner').readOnly = true;
            } else {
                $$("__ttl").getFilter('owner').readOnly = false;
                }
            }
        }
    }



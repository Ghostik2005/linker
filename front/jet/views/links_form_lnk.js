//"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page, checkKey, getDtParams} from "../views/globals";
import UnlinkView from "../views/unlink";


export default class LinksViewLnk extends JetView{
    config(){
        webix.protoUI({
            name: "daterange",
            _footer_row: function(config, width){
                var button = { view:"button", value:"ПРИМЕНИТЬ",
                    minWidth:100, maxWidth:230,
                    align:"center", height:30, click:function(){
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
                        }
                    };
                var icons = this._icons_template(config.icons);
                var row = { css:"webix_range_footer",  cols:[
                    { width:icons.width }
                ]};
                if((config.button || config.icons) && (icons.width*2+button.minWidth) > width)
                    row.cols[0].width = 0;
                row.cols.push(config.button ? button : {});
                row.cols.push(icons);
                return row;
                },
            }, webix.ui.daterange);

        function dt_formating_sec(d) {
            return webix.Date.dateToStr("%d-%m-%Y  %G:%i:%s")(d)
            };
            
        function dt_formating(d) {
            return webix.Date.dateToStr("%d-%m-%Y")(d)
            };

        webix.ui.datafilter.filterDateRange = webix.extend ({
            compare:function(a, b){
                return true;
                },
            },  webix.ui.datafilter.dateRangeFilter);

        webix.ui.datafilter.customFilterLnkSpr = webix.extend ({
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
                    //if (ui) ui.filterByAll();
                    },webix.ui.datafilter.textWaitDelay);
                }
            },  webix.ui.datafilter.textFilter);
        
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
                            {content: "customFilterLnkSpr"},
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
                            ]
                            },
                        {id: "c_zavod", width: 200, hidden: true,
                            header: [{text: "Производитель"},
                            {content: "customFilterLnkSpr"},
                            ]
                            },
                        {id: "c_vnd", width: 160,
                            header: [{text: "Поставщик"},
                            {content: "customFilterLnkSpr"},
                            ]
                            },
                        {id: "dt", width: 200, sort: 'server',
                            format: dt_formating_sec,
                            css: 'center_p',
                            header: [{text: "Дата изменения"}, 
                            {content: "filterDateRange",
                                inputConfig:{format:dt_formating, width: 180,},
                                suggest:{
                                    view:"daterangesuggest", body:{ timepicker:false, calendarCount:2}
                                    },
                                },
                            ]
                            },
                        {id: "owner", width: 100, sort: 'server',
                            header: [{text: "Создал"}, 
                            {content: "customFilterLnkSpr"},
                            ]
                            }
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
                        onResize: function () {
                            if ($$("__ttl").isColumnVisible('dt')) {
                                console.log($$("__ttl").getFilter('dt'));
                                $$("__ttl").getFilter('dt').setValue({'start':new Date()});
                                }
                            if ($$("__ttl").isColumnVisible('owner')) {
                                if  (this.$scope.app.config.role !== this.$scope.app.config.admin) {
                                    $$("__ttl").getFilter('owner').value = this.$scope.app.config.user;;
                                    $$("__ttl").getFilter('owner').readOnly = true;
                                } else {
                                    $$("__ttl").getFilter('owner').readOnly = false;
                                    }
                                }
                            },
                        onBeforeSort: (field, direction) => {
                            let start = $$("__ttl").config.startPos;
                            $$("__ttl").config.fi = field;
                            $$("__ttl").config.di = direction;
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
                            },
                        onItemDblClick: (item, ii, iii) => {
                            let sh_prc = $$("__ttl").getSelectedItem().id;
                            let params = {};
                            //params["action"] = "return";
                            params["command"] = "?delLnk";
                            params["sh_prc"] = sh_prc;
                            params["type"] = "async";
                            params["callback"] = delLnk;
                            this.popunlink.show("Причина разрыва связкии?", params);
                            },
                        onKeyPress: function(code, e){
                            if (13 === code) {
                                this.callEvent("onItemDblClick");
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
                                let start = 1;
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
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkView);
        }
    }



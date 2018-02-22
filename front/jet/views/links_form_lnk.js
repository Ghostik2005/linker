//"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page, checkKey} from "../views/globals";
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
                                let params = getParams(ui);
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
                            //if (ui) ui.filterByAll();
                            },webix.ui.datafilter.textWaitDelay);
                        
                        //console.log('val', $$("__ttl").getFilter('dt').getValue());
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
            
        function dt_formating(d) {
            return webix.Date.dateToStr("%d-%m-%Y")(d)
            };

        function getParams(ui) {
            let c_filter = {
                        //'c_tovar'   : $$(ui).getFilter('c_tovar').value,
                        'c_vnd'     : $$(ui).getFilter('c_vnd').value,
                        'c_zavod'   : $$(ui).getFilter('c_zavod').value,
                        'id_tovar'  : $$(ui).getFilter('id_tovar').value,
                        'dt'        : $$(ui).getFilter('dt').getValue(),
                        'owner'     : $$(ui).getFilter('owner').value,
                        };
            console.log('c_filter', c_filter);
            let count = ui.config.posPpage;
            let field = ui.config.fi;
            let direction = ui.config.di;
            return [c_filter, count, field, direction]
            }

        webix.ui.datafilter.filterDateRange = webix.extend ({
            //refresh:function(master, node, value){
                //if (master.$destructed) return;
                //var select = webix.$$(value.richselect);
                //node.$webix = value.richselect;
                //node.style.marginLeft = "-10px";
                //value.compare = value.compare || this.compare;
                //value.prepare = value.prepare || this.prepare;
                //master.registerFilter(node, value, this);
                ////reattaching node back to master container
                //node.firstChild.appendChild(select.$view.parentNode);
                //},
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
                        let params = getParams(ui);
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
                {view: "treetable",
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
                        {id: "c_tovar", fillspace: true, //sort: 'server',
                            template:"<span>{common.treetable()} #c_tovar#</span>",
                            header: [{text: "Наименование"},
                            ]
                            },
                        {id: "c_zavod", width: 200,
                            header: [{text: "Производитель"},
                            {content: "customFilterLnkSpr"},
                            ]
                            },
                        {id: "c_vnd", width: 160,
                            header: [{text: "Поставщик"},
                            {content: "customFilterLnkSpr"},
                            ]
                            },
                        {id: "id_tovar", width: 100,
                            header: [{text: "Код"},
                            {content: "customFilterLnkSpr"},
                            ]
                            },
                        {id: "dt", width: 200,
                            format: dt_formating,
                            header: [{text: "Дата изменения"}, 
                            {content: "filterDateRange",
                                inputConfig:{format:dt_formating, width: 180,},
                                suggest:{
                                    view:"daterangesuggest", body:{ timepicker:false, calendarCount:2}
                                    },
                                },
                            ]
                            },
                        {id: "owner", width: 100,
                            header: [{text: "Создал"}, //сделать выпадающий список
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
                            if (!this.count) {
                                this.showProgress({
                                    type: "icon",
                                    icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                                    });
                                }
                            },
                        onBeforeSort: (field, direction) => {
                            let th = this;
                            let start = $$("__ttl").config.startPos;
                            let count = $$("__ttl").config.posPpage;
                            $$("__ttl").config.fi = field;
                            $$("__ttl").config.di = direction;
                            get_data({
                                th: this,
                                view: "__ttl",
                                navBar: "__nav_ll",
                                start: start,
                                count: count,
                                searchBar: "_link_search",
                                method: "getLnkSprs",
                                field: field,
                                direction: direction
                                });
                            },
                        onItemDblClick: function (item, ii, iii) {
                            let level = this.getSelectedItem().$level;
                            if (level === 1) {
                                if (this.$scope.app.config.role === this.$scope.app.config.admin) {
                                    item = item.row;
                                    item = get_spr(this.$scope, item);
                                    item["s_name"] = "Страна: " + item.c_strana;
                                    item["t_name"] = "Название товара: " + item.c_tovar;
                                    item["v_name"] = "Производитель: " + item.c_zavod;
                                    item["dv_name"] = "Действующее вещество: " + item.c_dv;
                                    this.$scope.popnew.show("Редактирование записи " + item.id_spr, $$("_link_search"), item);
                                } else {
                                    webix.message({"type": "error", "text": "Редактирование запрещено"})
                                    };
                            } else if (level === 2) {
                                let sh_prc = $$("__ttl").getSelectedItem().id;
                                let params = {};
                                params["action"] = "return";
                                params["command"] = "?delLnk";
                                params["sh_prc"] = sh_prc;
                                params["type"] = "async";
                                params["callback"] = delLnk; //обновление списка
                                this.$scope.popunlink.show("Причина разрыва связкии?", params);
                                };
                            },
                        onKeyPress: function(code, e){
                            if (13 === code) {
                                this.callEvent("onItemDblClick");
                                }
                            },
                        onBeforeSelect: function (item) {
                            },
                        onAfterSelect: function (item) {
                            let level = this.getSelectedItem().$level;
                            if (level === 1) {
                                $$("_break").disable();
                            } else if (level === 2) {
                                $$("_break").enable();
                                };
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
                                let count = $$("__ttl").config.posPpage;
                                let field = $$("__ttl").config.fi;
                                let direction = $$("__ttl").config.di;
                                get_data({
                                    th: this,
                                    view: "__ttl",
                                    navBar: "__nav_ll",
                                    start: start,
                                    count: count,
                                    searchBar: "_link_search",
                                    method: "getLnkSprs",
                                    field: field,
                                    direction: direction
                                    });
                                }
                            },
                        {view: "button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-left'></span>", width: 50,
                            click: () => {
                                let start = $$("__ttl").config.startPos - $$("__ttl").config.posPpage;
                                start = (start < 0) ? 1 : start;
                                let count = $$("__ttl").config.posPpage;
                                let field = $$("__ttl").config.fi;
                                let direction = $$("__ttl").config.di;
                                get_data({
                                    th: this,
                                    view: "__ttl",
                                    navBar: "__nav_ll",
                                    start: start,
                                    count: count,
                                    searchBar: "_link_search",
                                    method: "getLnkSprs",
                                    field: field,
                                    direction: direction
                                    });
                                }
                            },
                        {view: "label", label: "Страница 1 из 1", width: 200},
                        {view: "button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-right'></span>", width: 50,
                            click: () => {
                                let start = $$("__ttl").config.startPos + $$("__ttl").config.posPpage;
                                start = (start > $$("__ttl").config.totalPos) ? last_page("__ttl"): start;
                                let count = $$("__ttl").config.posPpage;
                                let field = $$("__ttl").config.fi;
                                let direction = $$("__ttl").config.di;
                                get_data({
                                    th: this,
                                    view: "__ttl",
                                    navBar: "__nav_ll",
                                    start: start,
                                    count: count,
                                    searchBar: "_link_search",
                                    method: "getLnkSprs",
                                    field: field,
                                    direction: direction
                                    });
                                }
                            },
                        {view: "button", type: 'htmlbutton',
                            label: "<span class='webix_icon fa-angle-double-right'></span>", width: 50,
                            click: () => {
                                let start = last_page("__ttl");
                                let count = $$("__ttl").config.posPpage;
                                let field = $$("__ttl").config.fi;
                                let direction = $$("__ttl").config.di;
                                get_data({
                                    th: this,
                                    view: "__ttl",
                                    navBar: "__nav_ll",
                                    start: start,
                                    count: count,
                                    searchBar: "_link_search",
                                    method: "getLnkSprs",
                                    field: field,
                                    direction: direction
                                    });
                                }
                            },
                        {},
                        {view: "label", label: "Всего записей: 0", width: 180},
                        ]
                    },
                ],
            }
        }
        
    show(new_head){
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show()
        }
    hide(){
        this.getRoot().hide()
        }
    init() {
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkView);
        }
    }



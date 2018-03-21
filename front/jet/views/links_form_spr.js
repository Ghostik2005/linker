//"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr} from "../views/globals";
import {get_data} from "../views/globals";
import {last_page, checkKey, getDtParams, fRender, fRefresh} from "../views/globals";
import UnlinkView from "../views/unlink";
import {dt_formating_sec, dt_formating} from "../views/globals";
import PagerView from "../views/pager_view";

export default class LinksViewSpr extends JetView{
    config(){
        let app = this.app;
        
        var filtFunc = () => {
            let old_v = this.$$("__page").getValue();
            this.$$("__page").setValue((+old_v ===0) ? '1' : "0");
            this.$$("__page").refresh();
            }
            
        webix.ui.datafilter.customFilterLnkSpr = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.customFilterLnkSpr.on_key_down = function(e, node, value){
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(function(){
                    filtFunc()
                    }, app.config.searchDelay);
                }
        webix.ui.datafilter.customFilterLnkSpr.refresh = fRefresh;
        webix.ui.datafilter.customFilterLnkSpr.render = fRender;

        var delLnk = () => {
            let cid = this.$$("__table").getSelectedItem().id;
            this.$$("__table").remove(cid);
            }

        let tt = {view: "treetable",
            name: "__tt",
            localId: "__table",
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            select: true,
            borderless: true,
            rowHeight: 30,
            fixedRowHeight:false,
            headermenu:{
                autowidth: true, 
                },
            resizeColumn:true,
            fi: 'c_tovar',
            di: 'asc',
            old_stri: " ",
            searchBar: "_link_search",
            searchMethod: "getSprLnks",
            //css: 'dt_css',
            columns: [
                {id: "c_tovar", fillspace: true, //sort: 'server',
                    template:"<span>{common.treetable()} #c_tovar#</span><span style='color: red'> #count#</span>",
                    header: [{text: "Наименование"},
                    ],
                    headermenu:false,
                    },
                {id: "c_zavod", width: 200, //sort: 'server',
                    header: [{text: "Производитель"},
                    {content: "customFilterLnkSpr"},
                    ]
                    },
                {id: "c_vnd", width: 160, sort: 'server',
                    header: [{text: "Поставщик"},
                    {content: "customFilterLnkSpr"},
                    ]
                    },
                {id: "id_tovar", width: 100, hidden: true, sort: 'server',
                    header: [{text: "Код"},
                    {content: "customFilterLnkSpr"},
                    ]
                    },
                {id: "dt", width: 200,
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{text: "Дата изменения"},
                    ]
                    },
                {id: "owner", width: 100,
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
                    },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    filtFunc();
                    },
                onItemDblClick: function (item, ii, iii) {
                    let level = this.getSelectedItem().$level;
                    if (level === 1) {
                        if (app.config.roles[app.config.role].spredit)  {
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
                        let sh_prc = this.$scope.$$("__table").getSelectedItem().id;
                        let params = {};
                        params["action"] = "return";
                        params["command"] = "?delLnk";
                        params["sh_prc"] = sh_prc;
                        params["type"] = "async";
                        params["callback"] = delLnk;
                        params["parent"] = this.$scope;
                        this.$scope.popunlink.show("Причина разрыва связки?", params);
                        };
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                onBeforeSelect: function (item) {
                    },
                onAfterSelect: function (item) {
                    let level = this.getSelectedItem().$level;
                    if (level === 1) {
                        $$("_break").hide();
                        //$$("_break").disable();
                        //$$("_break").define('width', 1)
                        //$$("_break").resize()
                    } else if (level === 2) {
                        $$("_break").show();
                        //$$("_break").enable();
                        //$$("_break").define('width', 220)
                        //$$("_break").resize()
                        
                        };
                    }
                },
            }

        return {view: "layout",
            rows: [
                tt,
                //pg,
                {$subview: PagerView}
                ],
            }
        }

    init() {
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkView);
        }

    ready() {
        $$("_break").hide();
        }
    }



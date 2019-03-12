"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr, request, checkVal, compareTrue} from "../views/globals";
import UnlinkView from "../views/unlink";
import {dt_formating_sec, dt_formating, mcf_filter, recalcRows} from "../views/globals";
import PagerView from "../views/pager_view";

export default class LinksViewSpr extends JetView{
    config(){
        let app = this.app;
        let vi = this;
        let url = app.config.r_url + "?getSupplAll";
        let params = {"user": app.config.user};
        let res = checkVal(request(url, params, !0).response, 's');
        var rList = []
        if (res) {
            rList = res;
            };
        var delLnk = () => {
            let cid = vi.$$("__table").getSelectedItem().id;
            vi.$$("__table").remove(cid);
            }
        let tt = {view: "treetable",
            name: "__tt",
            localId: "__table",
            startPos: 1,
            posPpage: app.config.posPpage,
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
            searchBar: undefined,
            searchMethod: "getSprLnks",
            columns: [
                {id: "c_tovar", fillspace: true, 
                    template:"<span>{common.treetable()} #c_tovar#</span><span style='color: red'> #count#</span>",
                    header: [{text: "Наименование"},
                    ],
                    headermenu:false,
                    },
                {id: "c_zavod", width: 200, 
                    header: [{text: "Производитель"},
                        {content: "cFilt"},
                        ]
                    },
                {id: "c_vnd", width: 300, sort: 'server',
                    header: [{text: "Поставщик"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                inputtype: "combo",
                                pager: 1,
                                options: {
                                    filter: mcf_filter,
                                    data: rList,
                                    },
                                },
                            }
                        ]
                    },
                {id: "id_tovar", width: 100, hidden: true, sort: 'server',
                    header: [{text: "Код"},
                        // {content: "cFilt"},
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
                        {content: "cFilt"},
                        ]
                    }
                ],
            on: {
                'onresize': function() {
                    setTimeout( () => {
                        recalcRows(this);
                        this.$scope._search.callEvent("onKeyPress", [13,])    
                    }, 150)
                },
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    let old_v = vi.getRoot().getChildViews()[1].$scope.$$("__page").getValue();
                    vi.getRoot().getChildViews()[1].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    vi.getRoot().getChildViews()[1].$scope.$$("__page").refresh();
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
                            item["dv_name"] = "Д. вещество: " + item.c_dv;
                            this.$scope.popnew.show("Редактирование записи " + item.id_spr, this.$scope._search, item);
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
                        this.$scope.popunlink.show("Причина разрыва связки?", params, this.$scope._break);
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
                        this.$scope._break.hide();
                    } else if (level === 2) {
                        this.$scope._break.show();
                        
                        };
                    }
                },
            }

        return {view: "layout",
            css: {'border-left': "1px solid #dddddd !important"},
            rows: [
                tt,
                {$subview: PagerView}
                ],
            }
        }

    init() {
        this.popnew = this.ui(NewformView);
        this.popunlink = this.ui(UnlinkView);
        }

    ready() {
        this._break = this.getRoot().getParentView().$scope.$$("_br");
        this._search = this.getRoot().getParentView().$scope.$$("_ls");
        this.$$("__table").config.searchBar = this._search.config.id;
        this._break.hide();
        this.$$("__table").markSorting(this.$$("__table").config.fi,this.$$("__table").config.di);
        
        }
    }



"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import {get_spr, compareTrue, recalcRowsRet, setRows} from "../views/globals";
import PagerView from "../views/pager_view";
import SubRow from "../views/sub_row";

export default class SprView extends JetView{
    config(){
        var app = this.app;
        
        // let url = app.config.r_url + "?getDvAll";
        // let params = {"user": app.config.user};
        // let res = checkVal(request(url, params, !0).response, 's');
        // var dvList = []
        // if (res) {
        //     res.forEach(function(it, i, res) {
        //         let tt = {'id': it.id, 'value': it.act_ingr};
        //         dvList.push(tt);
        //         });
        //     };

        var sprv = {view: "datatable",
            css: {"margin-top": "-5px !important"},
            name: "__dt",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:30,
            rowHeight:30,
            editable: false,
            //footer: true,
            headermenu:{
                autowidth: true, 
                },
            startPos: 1,
            posPpage: app.config.posPpage,
            totalPos: 0,
            fi: 'c_tovar',
            di: 'asc',
            old_stri: "",
            searchBar: "_spr_search",
            searchMethod: "getSprSearch",
            subview: (obj, target) => {
                let item = this.$$("__table").getItem(obj.id);
                item = item.id_spr;
                item = get_spr(this, item);
                item["id"] = obj.id;
                item["s_name"] = "Страна: " + item.c_strana;
                item["t_name"] = "Название товара: " + item.c_tovar;
                item["v_name"] = "Производитель: " + item.c_zavod;
                item["dv_name"] = "Д. вещество: " + item.c_dv;
                var sub = new SubRow(this.app, {
                    pager: this.$$("__table").getParentView().getChildViews()[1].$scope.$$("__page"),
                    dt: this.$$("__table"),
                    item: item,
                    header: "<span style='color: red; text-transform: uppercase;'>Редактирование записи </span>" + item.id_spr,
                    search_bar: $$("_spr_search")
                });
                this.ui(sub, { container: target });
                return sub.getRoot();
            },
            tooltip:function(obj, common){
                return "<i>" + obj.c_tovar + "</i>";
            },
            columns: [
                {id: "id_mnn", width: 75,
                    template: function (obj) {
                        return (+obj.id_dv !== 0) ? "<span class='webix_icon fa-check-circle', style='color: green'></span>" :
                                                    "<span class='webix_icon fa-times-circle', style='color: red'></span>";
                        },
                    css: "center_p",
                    header: [{text: "МНН"},
                        ],
                    },
                {id: "id_spr", width: 80, sort: "server",
                    header: [{text: "IDSPR"},
                        {content:"cFilt"}
                        ],
                    headermenu:false,
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    header: [{text: "Название"},
                        ],
                    headermenu:false,
                    },
                { id: "id_zavod", sort: "server",
                    width: 300,
                    header: [{text: "Производитель"},
                        ]
                    },
                { id: "id_strana", //sort: "text",
                    width: 200,
                    header: [{text: "Страна"},
                        ]
                    },
                { id: "c_dv", hidden: true,
                    width: 300,
                    header: [{text: "Д. в-во"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                inputtype: "combo",
                                pager: 1,
                                options: {
                                    data: []//dvList
                                    },
                                },
                            }
                        ]
                    },
                { id: "c_group", hidden: true,
                    width: 150,
                    header: [{text: "Группа"},
                        ]
                    },
                { id: "c_nds", hidden: true,
                    width: 150,
                    header: [{text: "НДС"},
                        ]
                    },
                { id: "c_hran", hidden: true,
                    width: 150,
                    header: [{text: "Условия хранения"},
                        ]
                    },
                { id: "c_sezon", hidden: true,
                    width: 150,
                    header: [{text: "Сезонность"},
                        ]
                    },
                {id: "mandat", width:100,
                    template: function (obj) {
                        let ret = (obj.c_mandat) ? "<div><span class='webix_icon fa-check-circle'></span></div>"
                                                 : "<div><span></span></div>";
                        return ret
                        },
                    hidden: true, css: "center_p",
                    header: [{text: "Обязательный"},
                        ],
                    },
                {id: "prescr", width:100,
                    template: function (obj) {
                        let ret = (obj.c_prescr) ? "<div><span class='webix_icon fa-check-circle'></span></div>"
                                                 : "<div><span></span></div>";
                        return ret
                        },
                    hidden: true, css: "center_p",
                    header: [{text: "Рецептурный"},
                        ],
                    },
                {id: "owner", width: 200, tooltip: false, //sort: 'server', 
                    hidden: true,
                    header: [{text: "Кто изменил"}, 
                    ]},
                ],
            on: {
                'onresize': function() {
                    clearTimeout(this.delayResize);
                    let rows = recalcRowsRet(this);
                    if (rows) {
                        this.config.posPpage = rows;
                        this.delayResize = setTimeout( () => {
                            this.$scope.startSearch();
                        }, 150)
                    }
                },
                "data->onParse":function(i, data){
                    let side_but = this.$scope.getRoot().getParentView().$scope.$$("sideButton");
                    if (side_but.config.formOpen) {
                        let item = {}
                        item["s_name"] = "Страна: ";
                        item["t_name"] = "Название товара: ";
                        item["v_name"] = "Производитель: ";
                        item["dv_name"] = "Д. вещество: ";
                        this.$scope.getParentView().sideForm.parse_f('', $$("_spr_search"), item);
                        }
                    this.clearAll();
                    $$("_link").hide();
                    },
                onAfterColumnShow: function (id) {
                    if (id==='c_dv') {
                        let cc = this.getColumnConfig(id);
                        var dvList = []
                        let res = $$("dv_dc").data;
                        res.each(function(it) {
                            let tt = {'id': it.id, 'value': it.act_ingr};
                            dvList.push(tt);
                            });
                        setTimeout( () => {
                            cc.header[1].inputConfig.options.data = dvList
                            }, 200)
                        }
                    },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    this.startSearch();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onSubViewClose: function(id) {
                    delete this.getItem(id)["$subContent"]
                    delete this.getItem(id)["$subHeight"]
                    delete this.getItem(id)["$subOpen"]
                    },
                onItemDblClick: function(item) {
                    let side_but = this.$scope.getRoot().getParentView().$scope.$$("sideButton");
                    let row_id = this.getSelectedId();
                    this.openSub(row_id);

                    // if (!side_but.config.formOpen) {
                    //     item = this.getSelectedItem();
                    //     item = item.id_spr;
                    //     item = get_spr(this.$scope, item);
                    //     item["s_name"] = "Страна: " + item.c_strana;
                    //     item["t_name"] = "Название товара: " + item.c_tovar;
                    //     item["v_name"] = "Производитель: " + item.c_zavod;
                    //     item["dv_name"] = "Д. вещество: " + item.c_dv;
                    //     this.$scope.popnew.show("Редактирование записи " + item.id_spr, $$("_spr_search"), item);
                    //     };
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                },
                onAfterSelect: function() {
                    let side_but = this.$scope.getRoot().getParentView().$scope.$$("sideButton");
                    if (side_but.config.formOpen) {
                        let item = this.$scope.$$("__table").getSelectedItem();
                        item = item.id_spr;
                        item = get_spr(this.$scope, item);
                        item["s_name"] = "Страна: " + item.c_strana;
                        item["t_name"] = "Название товара: " + item.c_tovar;
                        item["v_name"] = "Производитель: " + item.c_zavod;
                        item["dv_name"] = "Д. вещество: " + item.c_dv;
                        this.$scope.getParentView().sideForm.parse_f("Просмотр записи <span style='color: red'>" + item.id_spr + "</span>.  Изменения не будут сохранены", $$("_spr_search"), item);
                    }
                    if ($$("prcs_dc").count() > 0) {
                        $$("_link").show();
                    }
                },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                    }
                },
            }
        }

        var dt = {
            view: "layout",
            css: {'border-bottom': "0px solid #dddddd !important"},
            rows: [
                sprv,
                {$subview: PagerView},
            ]}
        return dt
    }

    startSearch() {
        var pager = this.getRoot().getChildViews()[1].$scope.$$("__page")
        pager.setValue((+pager.getValue() === 0) ? '1' : "0");
    }

    ready() {
        // this.$$("__table").callEvent('onResize');
        // setRows(this);
        let table = this.$$("__table");
        
        setTimeout(() => {
            let rows = recalcRowsRet(table);
            if (rows) table.config.posPpage = rows;
            this.startSearch();
        }, 10);

        // this.startSearch();
        this.$$("__table").markSorting(this.$$("__table").config.fi,this.$$("__table").config.di);
        setTimeout(() => {
            $$("_spr_search").focus();    
        }, 50);
        
        
        
    }

    init() {
        this.popnew = this.ui(NewformView);
        setRows(this);
    }
}

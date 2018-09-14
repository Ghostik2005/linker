"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import History from "../views/history";
import {get_spr} from "../views/globals";
import {checkKey, dt_formating_sec, dt_formating} from "../views/globals";
import {compareTrue, request, checkVal} from "../views/globals";
import PagerView from "../views/pager_view";
import SubRow from "../views/sub_row";
import RelinkFormView from "../views/relink_form";

export default class SprView extends JetView{
    config(){
        let app = this.app;
        var vi = this;
        let tList = $$("sezon_dc").data.getRange($$("sezon_dc").data.getFirstId(), $$("sezon_dc").data.getLastId());
        var sezonList = [], tgList = [], ndsList = [], hranList = [], stranaList = [], dvList = [], vList = [];
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.sezon};
            sezonList.push(tt);
            });
        tList = $$("hran_dc").data.getRange($$("hran_dc").data.getFirstId(), $$("hran_dc").data.getLastId());
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.usloviya};
            hranList.push(tt);
            });
        tList = $$("nds_dc").data.getRange($$("nds_dc").data.getFirstId(), $$("nds_dc").data.getLastId());
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.nds};
            ndsList.push(tt);
            });
        tList = $$("group_dc").data.getRange($$("group_dc").data.getFirstId(), $$("group_dc").data.getLastId());
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.group};
            tgList.push(tt);
            });
        tList = $$("strana_dc").data.getRange($$("strana_dc").data.getFirstId(), $$("strana_dc").data.getLastId());
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.c_strana};
            stranaList.push(tt);
            });
        tList = $$("dv_dc").data.getRange($$("dv_dc").data.getFirstId(), $$("dv_dc").data.getLastId());
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.act_ingr};
            dvList.push(tt);
            });
        tList = $$("vendor_dc").data.getRange($$("vendor_dc").data.getFirstId(), $$("vendor_dc").data.getLastId());
        if (tList.length > 1) {
            tList.forEach(function(it, i, tList) {
                let tt = {'id': it.id, 'value': it.c_zavod};
                vList.push(tt);
                });
        } else {
            let url = app.config.r_url + "?getVendorAll";
            let params = {"user": app.config.user};
            let res = checkVal(request(url, params, !0).response, 's');
            if (res) {
                res.forEach(function(it, i, res) {
                    let tt = {'id': it.id, 'value': it.c_zavod};
                    vList.push(tt);
                    });
                };
            };

        var sprv = {view: "datatable",
            name: "__dt_as",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            headermenu:{
                autowidth: true, 
                },
            subview: (obj, target) => {
                //let c_focus = document.activeElement;
                let item = this.$$("__table").getItem(obj.id);
                item = item.id_spr;
                item = get_spr(this, item);
                item["id"] = obj.id;
                item["s_name"] = "Страна: " + item.c_strana;
                item["t_name"] = "Название товара: " + item.c_tovar;
                item["v_name"] = "Производитель: " + item.c_zavod;
                item["dv_name"] = "Д. вещество: " + item.c_dv;
                var sub = new SubRow(this.app, {
                    //focus: c_focus,
                    pager: this.$$("__table").getParentView().getChildViews()[2].$scope.$$("__page"),
                    dt: this.$$("__table"),
                    item: item,
                    header: "<span style='color: red; text-transform: uppercase;'>Редактирование записи </span>" + item.id_spr,
                    search_bar: this.$$("_sb")
                    });
                this.ui(sub, { container: target });
                return sub.getRoot();
                },
            startPos: 1,
            posPpage: app.config.posPpage,
            totalPos: 1250,
            fi: 'c_tovar',
            di: 'asc',
            searchBar: undefined,
            searchMethod: "getSprSearchAdm",
            old_stri: "",
            css: 'dt_css',
            columns: [
                {id: "id_mnn", width: 75,
                    template: function (obj) {
                        //return (+obj.id_dv !== 0) ? "<div> <span style='color: green'>есть</span></div>" : "<div> <span style='color: red'>нет</span></div>";
                        return (+obj.id_dv !== 0) ? "<span class='webix_icon fa-check-circle', style='color: green'></span>" :
                                                    "<span class='webix_icon fa-times-circle', style='color: red'></span>";
                        },
                    css: "center_p",
                    header: [{text: "МНН"},
                        ],
                    },
                {id: "id_spr", width: 80, sort: "server",
                    header: [{text: "IDSPR"},
                        {content:"txtFilt"}
                        ],
                    headermenu:false,
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    header: [{text: "Наименование"},
                        ],
                    headermenu:false,
                    },
                { id: "id_zavod", sort: "server",
                    width: 300,
                    header: [{text: "Производитель"},
                        {content: "mycomboFilter2", compare: compareTrue,
                            inputConfig : {
                                options: vList
                                },
                            }
                        ]
                    },
                { id: "id_strana", sort: "server",
                    width: 200,
                    header: [{text: "Страна"},
                        {content: "mycomboFilter2", compare: compareTrue,
                            inputConfig : {
                                options: stranaList
                                },
                            }
                        ]
                    },
                { id: "c_dv", hidden: true, sort: "server",
                    width: 300,
                    header: [{text: "Д. в-во"},
                        {content: "mycomboFilter2", compare: compareTrue,
                            inputConfig : {
                                options: dvList
                                },
                            }
                        ]
                    },
                { id: "c_group", hidden: true,
                    width: 300,
                    header: [{text: "Группа"},
                        {content: "mycomboFilter2", compare: compareTrue,
                            inputConfig : {
                                options: tgList
                                },
                            }
                        ]
                    },
                { id: "c_nds", hidden: true,
                    width: 150,
                    header: [{text: "НДС"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                options: ndsList
                                },
                            }
                        ]
                    },
                { id: "c_hran", hidden: true,
                    width: 150,
                    header: [{text: "Условия хранения"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                options: hranList
                                },
                            }
                        ]
                    },
                { id: "c_sezon", hidden: true,
                    width: 180,
                    header: [{text: "Сезонность"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                options: sezonList
                                },
                            }
                        ]
                    },
                {id: "mandat", width:100,
                    template: function (obj) {
                        return (obj.c_mandat) ? "<div><span class='webix_icon fa-check-circle'></span></div>" : "<div><span class='webix_icon fa-times'></span></div>";
                        },
                    hidden: true, css: 'center_p',
                    header: [{text: "Обязательный"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {options: [{id: 1, value: "Да"}, {id: 2, value: "Нет"}]},
                            }
                        ],
                    },
                {id: "prescr", width:100, hidden: true, css: 'center_p',
                    template: function (obj) {
                        return (obj.c_prescr) ? "<div><span class='webix_icon fa-check-circle'></span></div>" : "<div><span class='webix_icon fa-times'></span></div>";
                        },
                    header: [{text: "Рецептурный"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {options: [{id: 1, value: "Да"}, {id: 2, value: "Нет"}]},
                            }
                        ],
                    },
                {id: "dt", width: 200, sort: 'server',
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{text: "Дата изменения"}, 
                    {content: "dateRangeFilter", compare: compareTrue,
                        inputConfig:{format:dt_formating, width: 180,},
                        suggest:{
                            view:"daterangesuggest", body:{ timepicker:false, calendarCount:2}
                            },
                        },
                    ]},
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    this.$scope.$$("_del").hide();
                    },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    let old_v = vi.getRoot().getChildViews()[2].$scope.$$("__page").getValue();
                    vi.getRoot().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    vi.getRoot().getChildViews()[2].$scope.$$("__page").refresh();
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
                    this.openSub(this.getSelectedId());
                    return
                    item = this.getSelectedItem();
                    item = item.id_spr;
                    item = get_spr(this.$scope, item);
                    item["s_name"] = "Страна: " + item.c_strana;
                    item["t_name"] = "Название товара: " + item.c_tovar;
                    item["v_name"] = "Производитель: " + item.c_zavod;
                    item["dv_name"] = "Д. вещество: " + item.c_dv;
                    this.$scope.popnew.show("Редактирование записи " + item.id_spr, this.$scope.$$("_sb"), item);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    this.$$("_del").show();
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                }
            }

        var top = { view: "toolbar",
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Введите наименование", localId: "_sb", //id: "_spr_search_adm",
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout(function () {
                                    let old_v = vi.getRoot().getChildViews()[2].$scope.$$("__page").getValue();
                                    vi.getRoot().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                                    vi.getRoot().getChildViews()[2].$scope.$$("__page").refresh();
                                    }, this.$scope.app.config.searchDelay);
                                }
                            }
                        },
                    },
                {view: "button", type: 'htmlbutton',
                    //width: 38, label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                    localId: "_history",
                    resizable: true,
                    sWidth: 126,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>История</span>",
                    oldLabel: "<span class='webix_icon fa-history'></span>",
                    click: () => {
                        let hist = webix.storage.session.get(this.$$("__table").config.name);
                        this.pophistory.show(hist, this.$$("_sb"));
                        },
                    },
                {view:"button", 
                    tooltip: "Сбросить фильтры",
                    type:"imageButton", image: './addons/img/unfilter.svg',
                    //width: 38,
                    localId: "_unfilt",
                    resizable: true,
                    sWidth: 180,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Сбросить фильтры</span>",
                    oldLabel: "",
                    click: () => {
                        let cv = this.$$("__table");
                        let columns = cv.config.columns;
                        columns.forEach(function(item){
                            if (cv.isColumnVisible(item.id)) {
                                if (item.header[1]) {
                                    if (typeof(cv.getFilter(item.id).setValue) === 'function') {
                                        cv.getFilter(item.id).setValue('');
                                    } else {
                                        cv.getFilter(item.id).value = '';
                                        };
                                    }
                                }
                            });
                        this.$$("_sb").callEvent("onKeyPress", [13,]);
                        }
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Добавить эталон",
                    //label: "<span class='webix_icon fa-plus'></span>", width: 38,
                    localId: "_add",
                    resizable: true,
                    sWidth: 180,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Добавить эталон</span>",
                    oldLabel: "<span class='webix_icon fa-plus'></span>",
                    click: () => {
                        this.popnew.show("Новый эталон", this.$$("_sb"));

                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "_del", tooltip: "Удалить эталон",
                    //label: "<span style='color: red', class='webix_icon fa-times'></span>", width: 38,
                    resizable: true, sWidth: 180, eWidth: 40, label: "", width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px;'>Удалить эталон</span>",
                    oldLabel: "<span style='color: red', class='webix_icon fa-times'></span>",
                    click: () => {
                        let item = this.$$("__table").getSelectedItem();
                        this.poprelink.show("Удаление эталона. Выберите товар, к которому будут привязаны связки и штрихкоды удаляемого", item, this)
                        //this.$$("__table").unselectAll();
                        //this.$$("_del").hide();
                        }
                    },
                ]
            }

            
        var dt = {
            view: "layout",
            rows: [
                top,
                sprv,
                {$subview: PagerView},
                ]}

        return dt
        }

    ready() {
        let r_but = [this.$$("_history"), this.$$("_unfilt"), this.$$("_add"), this.$$("_del")]
        r_but.forEach( (item, i, r_but) => {
            item.define({width: (this.app.config.expert) ? item.config.eWidth : item.config.sWidth,
                         label: (this.app.config.expert) ? item.config.oldLabel  : item.config.oldLabel + item.config.extLabel});
            item.refresh();
            item.resize();
            })
        this.$$("__table").config.searchBar = this.$$("_sb");
        this.$$("_sb").callEvent("onKeyPress", [13,]);
        this.$$("_sb").focus();
        }
    
    init() {
        this.popnew = this.ui(NewformView);
        this.pophistory = this.ui(History);
        this.poprelink = this.ui(RelinkFormView);
        let th = this;
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(function(){
                let thh = th.getRoot().getChildViews()[2].$scope;
                let old_v = thh.$$("__page").getValue();
                thh.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                thh.$$("__page").refresh();
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
            })
        }
    }

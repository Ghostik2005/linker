"use strict";

import {JetView} from "webix-jet";
import NewformView from "../views/new_form";
import History from "../views/history";
import {get_spr} from "../views/globals";
import {checkKey, dt_formating_sec, dt_formating} from "../views/globals";
import {compareTrue, fRefresh, fRender, rRefresh, rRender} from "../views/globals";
import PagerView from "../views/pager_view";

export default class SprView extends JetView{
    config(){
        let app = this.app;
        
        var filtFunc = () => {
            let old_v = this.getRoot().getChildViews()[2].$scope.$$("__page").getValue();
            this.getRoot().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
            this.getRoot().getChildViews()[2].$scope.$$("__page").refresh();
            }
            
        webix.ui.datafilter.richFilt = Object.create(webix.ui.datafilter.richSelectFilter);
        webix.ui.datafilter.richFilt.refresh = rRefresh;
        webix.ui.datafilter.richFilt.render = rRender(function(){
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout( () => {
                filtFunc();
                },app.config.searchDelay);
            })

        webix.ui.datafilter.txtFilt = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.txtFilt.on_key_down = function(e, node, value){
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(() => {
                    filtFunc();
                    },app.config.searchDelay);
                }
        webix.ui.datafilter.txtFilt.refresh = fRefresh;
        webix.ui.datafilter.txtFilt.render = fRender;


        function mnn_func(obj) {
            return (+obj.id_dv !== 0) ? "<div> <span class='green'>есть</span></div>" : "<div> <span class='red'>нет</span></div>";
            }

        function mandat_func(obj) {
            return (obj.c_mandat) ? "<div><span class='webix_icon fa-check-circle'></span></div>" : "<div><span class='webix_icon fa-times'></span></div>";
            }

        function prescr_func(obj) {
            return (obj.c_prescr) ? "<div><span class='webix_icon fa-check-circle'></span></div>" : "<div><span class='webix_icon fa-times'></span></div>";
            }

        let tList = $$("sezon_dc").data.getRange($$("sezon_dc").data.getFirstId(), $$("sezon_dc").data.getLastId());
        var sezonList = [], tgList = [], ndsList = [], hranList = [];
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.sezon};
            sezonList.push(tt);
            })
        tList = $$("hran_dc").data.getRange($$("hran_dc").data.getFirstId(), $$("hran_dc").data.getLastId());
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.usloviya};
            hranList.push(tt);
            })
        tList = $$("nds_dc").data.getRange($$("nds_dc").data.getFirstId(), $$("nds_dc").data.getLastId());
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.nds};
            ndsList.push(tt);
            })
        tList = $$("allTg_dc").data.getRange($$("allTg_dc").data.getFirstId(), $$("allTg_dc").data.getLastId());
        tList.forEach(function(it, i, tList) {
            let tt = {'id': it.id, 'value': it.c_tgroup};
            tgList.push(tt);
            })

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
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            fi: 'c_tovar',
            di: 'asc',
            searchBar: undefined,
            searchMethod: "getSprSearchAdm",
            old_stri: "",
            css: 'dt_css',
            columns: [
                {id: "id_mnn", width: 75, template: mnn_func,
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
                        {content:"txtFilt"}
                        ]
                    },
                { id: "id_strana", sort: "server",
                    width: 200,
                    header: [{text: "Страна"},
                        {content:"txtFilt"}
                        ]
                    },
                { id: "c_dv", hidden: true, sort: "server",
                    width: 150,
                    header: [{text: "Д. в-во"},
                        {content:"txtFilt"}
                        ]
                    },
                { id: "c_group", hidden: true,
                    width: 150,
                    header: [{text: "Группа"},
                        {content: "richFilt", compare: compareTrue,
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
                {id: "mandat", width:100, template: mandat_func, hidden: true, css: 'center_p',
                    header: [{text: "Обязательный"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {options: [{id: 1, value: "Да"}, {id: 2, value: "Нет"}]},
                            }
                        ],
                    },
                {id: "prescr", width:100, hidden: true, css: 'center_p', template: prescr_func,
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
                    filtFunc();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onItemDblClick: function(item) {
                    item = this.getSelectedItem();
                    item = item.id_spr;
                    item = get_spr(this.$scope, item);
                    item["s_name"] = "Страна: " + item.c_strana;
                    item["t_name"] = "Название товара: " + item.c_tovar;
                    item["v_name"] = "Производитель: " + item.c_zavod;
                    item["dv_name"] = "Действующее вещество: " + item.c_dv;
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
                    tooltip: "поиск от двух символов, !слово - исключить из поиска",
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout(function () {
                                    filtFunc();
                                    }, this.$scope.app.config.searchDelay);
                                }
                            }
                        },
                    },
                {view: "button", type: 'htmlbutton', width: 35,
                    label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                    click: () => {
                        let hist = webix.storage.session.get(this.$$("__table").config.name);
                        this.pophistory.show(hist, this.$$("_sb"));
                        },
                    },
                {view:"button", //type: 'htmlbutton',
                    tooltip: "Сбросить фильтры",
                    type:"imageButton", image: './addons/img/unfilter.svg',
                    //label: "<span style='line-height: 20px;'>Сбросить фильтры</span>",
                    width: 40,
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
                    label: "<span class='webix_icon fa-plus'></span>", width: 40,
                    click: () => {
                        this.popnew.show("Новый эталон", this.$$("_sb"));

                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "_del", tooltip: "Удалить эталон",
                    label: "<span style='color: red', class='webix_icon fa-times'>", width: 40,
                    click: () => {
                        webix.message({
                            text: "Удаление из SPR. Пока недоступно.",
                            type: "error",
                            })
                        this.$$("__table").unselectAll();
                        this.$$("_del").hide();
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
        this.$$("__table").config.searchBar = this.$$("_sb")
        this.$$("_sb").callEvent("onKeyPress", [13,]);
        }
    
    init() {
        this.popnew = this.ui(NewformView);
        this.pophistory = this.ui(History);
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

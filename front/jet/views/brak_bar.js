"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import {get_data_test, checkKey, getDtParams} from "../views/globals";
import {fRender, fRefresh, checkVal} from "../views/globals";
import {rRefresh, request} from "../views/globals";
import {dt_formating_sec, dt_formating, compareTrue} from "../views/globals";
import PagerView from "../views/pager_view";

export default class BrakBarView extends JetView{
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


        var getActDt = () => {
            return this.getRoot().getChildViews()[2].getChildViews()[0];
            }

        var getNavL = () => {
            return this.getRoot().getChildViews()[2].getChildViews()[1];
            }

        var getMethod = () => {
            return this.getRoot().getChildViews()[2].getChildViews()[0].config.searchMethod
            }

        let sprv = {view: "toolbar",
            css: {"border-top": "0px"},
            cols: [
            {view: "text", label: "", placeholder: "Строка поиска", height: 40, fillspace: true, localId: "_ls", //value: "анальгин",
                on: {
                    onKeyPress: function(code, event) {
                        return
                        clearTimeout(this.config._keytimed);
                        if (checkKey(code)) {
                            this.config._keytimed = setTimeout( () => {
                            let ui = getActDt();
                            if (ui) {
                                let params = getDtParams(ui);
                                get_data_test({
                                    view: ui,
                                    navBar: getNavL(),
                                    start: 1,
                                    count: params[1],
                                    searchBar: this.$scope.$$("_ls").config.id,
                                    method: getMethod(),
                                    field: params[2],
                                    direction: params[3],
                                    filter: params[0]
                                    });
                                    }
                                }, this.$scope.app.config.searchDelay);
                            }
                        }
                    },
                },
            {view: "button", type: 'htmlbutton', 
                //width: 40, label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                localId: "_history",
                resizable: true,
                sWidth: 126,
                eWidth: 40,
                label: "",
                width: 40,
                extLabel: "<span style='line-height: 20px;padding-left: 5px'>История</span>",
                oldLabel: "<span class='webix_icon fa-history'></span>",
                click: () => {
                    let hist = webix.storage.session.get(this.$$("__table".config.name));
                    this.pophistory.show(hist, this.$$("_ls"));
                    },
                },
            {view:"button", width: 40,
                tooltip: "Сбросить фильтры", type:"imageButton", image: './addons/img/unfilter.svg',
                localId: "_unfilt",
                resizable: true,
                sWidth: 180,
                eWidth: 40,
                label: "",
                width: 40,
                extLabel: "<span style='line-height: 20px;padding-left: 5px'>Сбросить фильтры</span>",
                oldLabel: "",
                click: () => {
                    return
                    //this.$$("_br").hide();
                    var cv = getActDt();
                    var columns = $$(cv).config.columns;
                    columns.forEach(function(item){
                        if (cv.isColumnVisible(item.id)) {
                            if (item.header[1]) {
                                if (typeof(cv.getFilter(item.id).setValue) === 'function') {
                                    cv.getFilter(item.id).setValue('');
                                } else {
                                    let qq = cv.getFilter(item.id);
                                    if (!qq.readOnly) qq.value = '';
                                    };
                                }
                            }
                        });
                    this.$$("_ls").callEvent("onKeyPress", [13,]);
                    }
                },
            {view: "button", type: 'htmlbutton',
                tooltip: "Загрузить брак",
                localId: "_fileload",
                resizable: true,
                sWidth: 126,
                eWidth: 40,
                label: "",
                width: 40,
                extLabel: "<span style='line-height: 20px;padding-left: 5px'>Загрузить брак</span>",
                oldLabel: "<span class='webix_icon fa-upload'></span>",
                click: () => {
                    return

                    },
                },
            {view: "button", type: 'htmlbutton',
                tooltip: "Добавить письмо",
                hidden: true,
                localId: "_addletter",
                resizable: true,
                sWidth: 126,
                eWidth: 40,
                label: "",
                width: 40,
                extLabel: "<span style='line-height: 20px;padding-left: 5px'>Добавить письмо</span>",
                oldLabel: "<span class='webix_icon fa-sticky-note '></span>",
                click: () => {
                    return
                    },
                },
            {view: "button", type: 'htmlbutton',
                hidden: true,
                tooltip: "Удалить письмо",
                localId: "_delletter",
                resizable: true,
                sWidth: 126,
                eWidth: 40,
                label: "",
                width: 40,
                extLabel: "<span style='line-height: 20px;padding-left: 5px'>Удалить письмо</span>",
                oldLabel: "<span class='webix_icon fa-trash'></span>",
                click: () => {
                    return

                    },
                },
            ]}

        var tt = {view: "datatable",
            name: "__brak",
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
            //old_stri: " ",
            searchBar: undefined,
            searchMethod: "getLnkSprs",
            subview: (obj, target) => {
                let tableSubviewItem = this.$$("__table").getItem(obj.id);
                let rowItemsCount = 4;
                let subRowHeight = rowItemsCount * 32;
                let sub = {view: "list",
                    localId: "__list",
                    $scope: this,
                    $new: false,
                    oldSelectedItem: undefined,
                    css: 'sublist',
                    item: {
                        height: 32,
                        },
                    borderless: true,
                    navigation: true,
                    select: true,
                    scroll: false,
                    height: subRowHeight,
                    on: {
                        onBeforeUnSelect: function (item) {
                            this.$scope.$$("_delletter").hide();
                            },
                        onBeforeSelect: function (item) {
                            if (this.$new === true) {
                                webix.message("Сначала сохраните изменения")
                                return false
                                }
                            },
                        onAfterSelect: function (item) {
                            this.$scope.$$("_delletter").show();
                            let selectedListItem = this.getSelectedItem();
                            this.oldSelectedItem = selectedListItem.id;
                            let selectedDataItem = this.$scope.$$("__table").getSelectedItem();
                            if (selectedListItem.id === 999999) {
                                //создаем новое письмо
                                webix.message("New letter");
                                this.getSelectedItem().value = "Новое письмо";
                                this.refresh();
                                this.$new = true
                                selectedListItem = this.getSelectedItem();
                                };
                            let parseItem = {};
                            parseItem.n_doc = selectedListItem.value;
                            parseItem.name = selectedDataItem.c_name;
                            parseItem.t_name = '';
                            parseItem.series = selectedDataItem.series;
                            parseItem.vendor = selectedDataItem.c_zavod;
                            parseItem.region = '';
                            parseItem.number = '';
                            parseItem.ch_dt = selectedDataItem.dt;
                            parseItem.gv = '';
                            parseItem.desc = '';
                            this.$scope.$$("_dHead").parse(parseItem);

                            },
                        },
                    data: [{id: 1, value: "Письмо 1"}, {id:2, value:"Письмо 2"}, {id:3, value: "Письмо какое-то"}, {id: 999999, value: "...добавить письмо"}],
                    };
                return webix.ui(sub, target);
                },
            columns: [
                {id: "id", width: 270, hidden: true, headermenu: false,
                    header: [{text: "id"},
                    ]
                    },
                {id: "sh_prc", width: 270, hidden: true,
                    header: [{text: "Хэш"},
                    ]
                    },
                {id: "series", width: 100, hidden: !true,
                    header: [{text: "Серия"},
                    ]
                    },
                {id: "c_name", fillspace: true, //sort: 'server',
                    header: [{text: "Наименование"},
                    ],
                    headermenu:false,
                    },
                {id: "c_zavod", width: 200, hidden: !true,
                    header: [{text: "Производитель"},
                    ]
                    },
                {id: "razbr", width: 150, hidden: !true, //sort: 'server',
                    header: [{text: "Разбраковка"},
                    ]
                    },
                {id: "dt", width: 200, sort: 'server', hidden: !true,
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{text: "Дата изменения"},
                    {content: "dateRangeFilter", compare: compareTrue,
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
                onSubViewClose: function(id) {
                    this.$scope.$$("_dHead").clear();
                    this.$scope.$$("_delletter").hide();
                    delete this.getItem(id)["$subContent"]
                    delete this.getItem(id)["$subHeight"]
                    delete this.getItem(id)["$subOpen"]
                    },
                onItemClick: function (item) {
                    },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    let old_v =vi.getRoot().getChildViews()[1].$scope.$$("__page").getValue();
                    vi.getRoot().getChildViews()[1].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    vi.getRoot().getChildViews()[1].$scope.$$("__page").refresh();
                    },
                onItemDblClick: (item) => {
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                onBeforeSelect: function (item) {
                    },
                onBeforeUnSelect: function (item) {
                    this.$scope.$$("_addletter").hide();
                    this.closeSub(item.id);
                    },
                onAfterSelect: function (item) {
                    this.$scope.$$("_addletter").show();
                    this.openSub(item.id, this);
                    }
                },
            data: [
                {'id': '1', 'sh_prc': '1212dffd', 'series': 'aaa', 'c_name': 'sadsdq31', 'c_zavod': 'ddd', 'razbr': '1', 'dt': '2012.02.02 15:00:00' },
                {'id': '2', 'sh_prc': '1212dffd', 'series': 'bbb', 'c_name': 'asdr4r24ff', 'c_zavod': 'fff', 'razbr': '0', 'dt': '2012.02.02 15:00:00' },
                {'id': '3', 'sh_prc': '1212dffd', 'series': 'ccc', 'c_name': 'asfrg3t', 'c_zavod': 'ggg', 'razbr': '1', 'dt': '2012.02.02 15:00:00'}
                ],
            }

        var dHead = {view: "form",
            localId: "_dHead",
            bodredless: true,
            margin: 0,
            padding: 0,
            elements: [
                {view: "text", value: "", label: "Нормативный документ", labelWidth: 155, name: "n_doc"},
                {view: "text", value: "", label: "Наименование", labelWidth: 155, name: "name"},
                {view: "text", value: "", label: "Торговое наименование", labelWidth: 155, name: "t_name"},
                {view: "text", value: "", label: "Серия", labelWidth: 155, name: "series"},
                {view: "text", value: "", label: "Производитель", labelWidth: 155, name: "vendor"},
                {view: "text", value: "", label: "Регион", labelWidth: 155, name: "region"},
                {view: "text", value: "", label: "№ записи", labelWidth: 155, name: "number"},
                {view: "text", value: "", label: "Дата изменения", labelWidth: 155, name: "ch_dt"},
                {view: "text", value: "", label: "ЖВ", labelWidth: 155, name: "gv"},
                {view: "text", value: "", label: "Описание", labelWidth: 155, name: "desc"},
                
                ],
            }

        var _view = {
            view: "layout", type: "clean",
            rows: [
                sprv,
                {height: 3},
                {view: "layout",
                    cols: [
                        {css: {'border-left': "1px solid #dddddd !important"},
                            rows: [
                                tt,
                                {$subview: PagerView},
                                ],
                            },
                        {css: {'border-left': "1px solid #dddddd !important"},
                            rows: [
                                dHead,
                                {template: "document"},
                                ],
                            },
                        ]
                    },
                //{$subview: true},
                ]}
                
        return _view
        }

    ready() {
        let r_but = [this.$$("_history"), this.$$("_unfilt"), this.$$("_fileload"), this.$$("_addletter"), this.$$("_delletter")];
        r_but.forEach( (item, i, r_but) => {
            item.define({width: (this.app.config.expert) ? item.config.eWidth : item.config.sWidth,
                         label: (this.app.config.expert) ? item.config.oldLabel  : item.config.oldLabel + item.config.extLabel});
            item.refresh();
            item.resize();
            });
        let th = this;
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(() => {
                let thh = th.getRoot().getChildViews()[1].$scope;
                let old_v = thh.$$("__page").getValue();
                thh.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                thh.$$("__page").setValue('0');
                thh.$$("__page").refresh();
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
            })
        this._search = this.getRoot().getParentView().$scope.$$("_ls")
        this.$$("__table").config.searchBar = this._search.config.id;
        }

    init() {
        this.pophistory = this.ui(History);
        }
    }


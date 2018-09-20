"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import {get_data_test, checkKey, getDtParams} from "../views/globals";
import {fRender, fRefresh, checkVal} from "../views/globals";
import {rRefresh, request} from "../views/globals";
import {dt_formating_sec, dt_formating, compareTrue} from "../views/globals";
import PagerView from "../views/pager_view";
import BrakSideInfoView from "../views/brak_side_info";

export default class BrakBarView extends JetView{
    config(){
        let app = this.app;
        let vi = this;

        let sprv = {view: "toolbar",
            css: {"border-top": "0px"},
            cols: [
            {view: "text", label: "", placeholder: "Строка поиска", height: 40, fillspace: true, localId: "_ls",
                on: {
                    onKeyPress: function(code, event) {
                        clearTimeout(this.config._keytimed);
                        if (checkKey(code)) {
                            this.config._keytimed = setTimeout( () => {
                                let pager = vi.getRoot().getChildViews()[2].getChildViews()[0].getChildViews()[1];
                                let old_v = pager.$scope.$$("__page").getValue();
                                pager.$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                                pager.$scope.$$("__page").refresh();
                                }, this.$scope.app.config.searchDelay);
                            }
                        }
                    },
                },
            {view: "button", type: 'htmlbutton', 
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
                    let tableSelectedId = this.$$("__table").getSelectedId();
                    let subView = this.$$("__table").getSubView(tableSelectedId);
                    if (subView) {
                        let listItemId = subView.getSelectedId();
                        if (listItemId) {
                            let url = app.config.r_url + "?delBrakMail";
                            let params = {"user": app.config.user, 'id': listItemId}
                            let res = request(url, params, !0).response;
                            res = checkVal(res, 's');
                            if (res) {
                                subView.remove(listItemId);
                                this.$$("__table").closeSub(tableSelectedId);
                                this.$$("__table").openSub(tableSelectedId, this.$$("__table"));
                                //renew info
                                };
                            };
                        };
                    },
                },
            ]}

        var tt = {view: "datatable",
            name: "__brak",
            localId: "__table",
            select: true,
            borderless: true,
            rowHeight: 30,
            fixedRowHeight:false,
            headermenu:{
                autowidth: true, 
                },
            resizeColumn:true,
            startPos: 1,
            posPpage: app.config.posPpage,
            totalPos: 0,
            fi: 'c_name',
            di: 'asc',
            searchBar: undefined,
            searchMethod: "getBrakSearch",
            old_stri: "",
            subview: (obj, target) => {
                let tableSubviewItem = this.$$("__table").getItem(obj.id);
                let url = app.config.r_url + "?getBrakMail";
                let params = {"sh_prc": tableSubviewItem.sh_prc, "series": tableSubviewItem.series, "user": app.config.user};
                let parsingData = checkVal(request(url, params, !0).response, 's');
                parsingData.push({"id": 99999999, "n_doc": "...добавить письмо"})
                let rowItemsCount = parsingData.length;
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
                    template: "#n_doc#",
                    on: {
                        onBeforeUnSelect: function (item) {
                            this.$scope.$$("_delletter").hide();
                            },
                        onBeforeSelect: function (item) {
                            if (this.config.$new === true) {
                                webix.message("Сначала сохраните изменения")
                                return false
                                }
                            },
                        onAfterSelect: function (item) {
                            this.$scope.sideView.$scope.enable_info();
                            let selectedListItem = this.getSelectedItem();
                            this.oldSelectedItem = selectedListItem.id;
                            if (selectedListItem.id === 99999999) {
                                //создаем новое письмо
                                selectedListItem.n_doc = "Новое письмо";
                                selectedListItem.name = tableSubviewItem.c_name;
                                selectedListItem.t_name = tableSubviewItem.c_name;
                                selectedListItem.series = tableSubviewItem.series;
                                selectedListItem.vendor = tableSubviewItem.c_zavod;
                                this.refresh();
                                this.config.$new = true;
                                //this.$scope.sideView.$scope.show_b();
                            } else {
                                this.$scope.$$("_delletter").show();
                                };
                            this.$scope.sideView.$scope.load_data(selectedListItem, this, this.$scope.$$("__table"));
                            this.$scope.sideView.$scope.enable_info();
                            },
                        },
                    data: parsingData,
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
                {id: "series", width: 100, hidden: !true, sort: 'server',
                    header: [{text: "Серия"},
                    ]
                    },
                {id: "c_name", fillspace: true, sort: 'server',
                    header: [{text: "Наименование"},
                    ],
                    headermenu:false,
                    },
                {id: "c_zavod", width: 200, hidden: !true, sort: 'server',
                    header: [{text: "Производитель"},
                    ]
                    },
                {id: "razbr", width: 100, hidden: !true, //sort: 'server',
                    header: [{text: "Разбраковка"},
                        ],
                    template: "<span class='center_p'>{common.checkbox()}</span>",
                    },
                {id: "dt", width: 200, sort: 'server', hidden: !true, sort: 'server',
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
                onCheck: function (id, col, value) {
                    let item = this.getItem(id);
                    let url = app.config.r_url + "?setRazbr";
                    let params = {"user": app.config.user, "sh_prc": item.sh_prc, "series": item.series, "razbr": value};
                    let res = request(url, params, !0).response;
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onSubViewClose: function(id) {
                    this.$scope.sideView.$scope.hide_b();
                    delete this.getItem(id)["$subContent"];
                    delete this.getItem(id)["$subHeight"];
                    delete this.getItem(id)["$subOpen"];
                    },
                onItemClick: function (item) {
                    },
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    let pager = vi.getRoot().getChildViews()[2].getChildViews()[0].getChildViews()[1];
                    let old_v = pager.$scope.$$("__page").getValue();
                    pager.$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    pager.$scope.$$("__page").refresh();
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
                    //this.$scope.$$("_addletter").hide();
                    this.$scope.$$("_delletter").hide();
                    this.$scope.sideView.$scope.clear_info();
                    this.$scope.sideView.$scope.disable_info();
                    if (this.getItem(item.id)) {
                        this.closeSub(item.id);
                        };
                    },
                onAfterSelect: function (item) {
                    //this.$scope.$$("_addletter").show();
                    this.openSub(item.id, this);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                },
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
                        {$subview: BrakSideInfoView},
                        ]
                    },
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
        this._search = this.$$("_ls");
        this.$$("__table").config.searchBar = this._search.config.id;
        this.sideView = this.getRoot().getChildViews()[2].getChildViews()[1]
        this._search.callEvent("onKeyPress", [13,]);
        this._search.focus()
        }

    init() {
        this.pophistory = this.ui(History);
        }
    }


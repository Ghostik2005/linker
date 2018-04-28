"use strict";

import {JetView} from "webix-jet";
import {checkKey, fRender, fRefresh} from "../views/globals";
import ConfirmView from "../views/yes-no";
import {dt_formating_sec, dt_formating, compareTrue} from "../views/globals";
import PagerView from "../views/pager_view";


export default class SkippedBarView extends JetView{
    config(){

        let app = this.app;
        var vi = this;

        var delSkip = () => {
            let item_id = this.$$("__table").getSelectedId()
            this.$$("__table").remove(item_id)
            }

        webix.ui.datafilter.customFilterSkip = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.customFilterSkip.on_key_down = function(e, node, value){
                var id = this._comp_id;
                var vi = webix.$$(id);
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(function(){
                    let old_v = vi.getParentView().getChildViews()[2].$scope.$$("__page").getValue();
                    vi.getParentView().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    vi.getParentView().getChildViews()[2].$scope.$$("__page").refresh();
                    }, app.config.searchDelay);
                }
        webix.ui.datafilter.customFilterSkip.refresh = fRefresh;
        webix.ui.datafilter.customFilterSkip.render = fRender;

        var sprv = {view: "datatable",
            name: "__dt_s",
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
            old_stri: " ",
            searchBar: undefined,
            searchMethod: "getPrcsSkip",
            fi: 'c_tovar',
            di: 'asc',
            columns: [
                {id: "id_tovar", width: 80, //sort: "server",
                    hidden: true,
                    header: [{text: "ID товара"},
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    headermenu:false,
                    header: [{text: "Название"},
                        {content: "customFilterSkip"},
                        ]
                    },
                { id: "c_vnd", sort: "server",
                    width: 200,
                    header: [{text: "Поставщик"},
                        {content: "customFilterSkip"},
                        ]
                    },
                { id: "c_zavod", sort: "server",
                    width: 200,
                    header: [{text: "Производитель"},
                        {content: "customFilterSkip"},
                        ]
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
                onBeforeSort: (field, direction) => {
                    this.$$("__table").config.fi = field;
                    this.$$("__table").config.di = direction;
                    let old_v = vi.getRoot().getChildViews()[2].$scope.$$("__page").getValue();
                    vi.getRoot().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                    vi.getRoot().getChildViews()[2].$scope.$$("__page").refresh();
                    },
                onItemDblClick: function(item) {
                    let user = this.$scope.app.config.user
                    let app = this.$scope.app;
                    if (app.config.roles[app.config.role].adm) {
                        let sh_prc = this.getSelectedItem().sh_prc
                        let params = {};
                        params["command"] = "?returnLnk";
                        params["sh_prc"] = sh_prc;
                        params["type"] = "async";
                        params["callback"] = delSkip;
                        this.$scope.popconfirm.show('Вернуть на сведение?', params);
                        }
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                }
            }

        var top_menu = {
            view: 'toolbar',
            css: {"border-top": "0px"},
            height: 40,
            cols: [
                {},
                {view: "button", type: "htmlbutton", tooltip: "Обновить",
                    label: "<span class='webix_icon fa-refresh'></span>", width: 40,
                    click: () => {
                        this.$$("__table").callEvent("onBeforeSort");
                        }
                    },
                {view:"button",  tooltip: "Сбросить фильтры",
                    type:"imageButton", image: './addons/img/unfilter.svg', width: 40,
                    click: () => {
                        var cv = this.$$("__table");
                        var columns = cv.config.columns;
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
                        this.$$("__table").callEvent("onBeforeSort");
                        }
                    },
                ]
            }

        var _view = {
            view: "layout", type: "clean",
            //css: {'border-left': "1px solid #dddddd !important"},
            rows: [
                top_menu,
                sprv,
                {$subview: PagerView},
                ]}
        return _view
        }

    ready() {
        let old_v = this.getRoot().getChildViews()[2].$scope.$$("__page").getValue();
        this.getRoot().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
        this.getRoot().getChildViews()[2].$scope.$$("__page").refresh();
        let th = this;
        let u = webix.$$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id)
        u.getChildViews()[1].getChildViews()[1].setValue('Применить');
        u.getChildViews()[1].getChildViews()[1].define('click', function() {
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

    init() {
        this.popconfirm = this.ui(ConfirmView);
        }
    }

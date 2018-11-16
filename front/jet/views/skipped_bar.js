"use strict";

import {JetView} from "webix-jet";
import {checkVal, setButtons, request} from "../views/globals";
import ConfirmView from "../views/yes-no";
import {dt_formating_sec, dt_formating, compareTrue, mcf_filter} from "../views/globals";
import PagerView from "../views/pager_view";


export default class SkippedBarView extends JetView{
    config(){

        let app = this.app;
        var vi = this;

        var delSkip = () => {
            let item_id = this.$$("__table").getSelectedId()
            this.$$("__table").remove(item_id)
            }

        let url = app.config.r_url + "?getSupplAll";
        let params = {"user": app.config.user};
        let res = checkVal(request(url, params, !0).response, 's');
        var rList = []
        if (res) {
            rList = res;
            };

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
            posPpage: app.config.posPpage,
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
                {id: "sh_prc", width: 280, 
                    hidden: true,
                    header: [{text: "sh_prc"},
                        {content: "cFilt",
                            inputConfig : {
                                    pager: 2
                                    },
                            },
                        ],
                    },
                { id: "c_tovar", fillspace: 1, sort: "server",
                    headermenu:false,
                    header: [{text: "Название"},
                        {content: "cFilt",
                            inputConfig : {
                                    pager: 2
                                    },
                            },
                        ]
                    },
                { id: "c_vnd", sort: "server",
                    width: 200,
                    header: [{text: "Поставщик"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                inputtype: "combo",
                                options: {
                                    filter: mcf_filter,
                                    data: rList,
                                    },
                                },
                            }
                        ]
                    },
                { id: "c_zavod", sort: "server",
                    width: 200,
                    header: [{text: "Производитель"},
                        {content: "cFilt",
                            inputConfig : {
                                    pager: 2
                                    },
                            },
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
                {id: "source", width: 150, hidden: true,
                    header: [{text: "Источник"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                pager: 2,
                                options: [{id: '0', value: 'Без источника'}, {id: '1', value: 'PLExpert'}, {id: '2', value: 'Склад'}, {id: '3', value: "Агент"}, {id: '4', value: "edocs"}]
                                },
                            }
                        ]
                    },
                {id: "id_org", width: 100, hidden: true,
                    header: [{text: "id_org"},
                        {content: "cFilt",
                            inputConfig : {
                                    pager: 2
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
                    var focused = document.activeElement;
                    if (focused.type !== 'text' && 13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                }
            }

        var top_menu = {rows: [
            {view: 'toolbar',
                css: {"border-top": "0px"},
                height: 40,
                cols: [
                    {},
                    {view: "button", type: "htmlbutton", tooltip: "Обновить", localId: "_renew",
                        //label: "<span class='webix_icon fa-refresh'></span>", width: 40,
                        resizable: true,
                        sWidth: 136,
                        eWidth: 40,
                        label: "",
                        width: 40,
                        extLabel: "<span style='line-height: 20px;padding-left: 5px'>Обновить</span>",
                        oldLabel: "<span class='webix_icon fa-refresh'></span>",
                        click: () => {
                            this.$$("__table").callEvent("onBeforeSort");
                            }
                        },
                    {view:"button",  tooltip: "Сбросить фильтры", 
                        type:"imageButton", image: './addons/img/unfilter.svg', width: 40,
                        localId: "_unfilt",
                        resizable: true,
                        sWidth: 180,
                        eWidth: 40,
                        label: "",
                        width: 40,
                        extLabel: "<span style='line-height: 20px;padding-left: 5px'>Сбросить фильтры</span>",
                        oldLabel: "",
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
                },
            {height: 3},
            ]}

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
        let r_but = [this.$$("_renew"), this.$$("_unfilt")]
        setButtons(this.app, r_but);
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
        this.$$("__table").getFilter("c_tovar").focus();
        this.$$("__table").markSorting(this.$$("__table").config.fi,this.$$("__table").config.di);
        }
    init() {
        this.popconfirm = this.ui(ConfirmView);
        }
    }

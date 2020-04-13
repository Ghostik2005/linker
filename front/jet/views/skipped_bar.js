"use strict";

import {JetView} from "webix-jet";
import {checkVal, setButtons, request, recalcRowsRet} from "../views/globals";
import ConfirmView from "../views/yes-no";
import {dt_formating_sec, dt_formating, compareTrue, mcf_filter, unFilter} from "../views/globals";
import PagerView from "../views/pager_view";
import {buttons} from "../models/variables";
import {options} from "../models/variables";


export default class SkippedBarView extends JetView{
    config(){

        let app = this.app;
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
            tooltip: true,
            columns: [
                {id: "id_tovar", width: 80, //sort: "server",
                    hidden: true,
                    tooltip: false,
                    header: [{text: "ID товара"},
                        {content: "cFilt",
                            inputConfig : {
                                pager: 2
                            },
                        }
                    ],
                },
                {id: "sh_prc", width: 280,  css: "overflow",
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
                    css: "overflow",
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
                    css: "overflow",
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
                    css: "overflow",
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
                    tooltip: false,
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
                    tooltip: false,
                    header: [{text: "Источник"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                pager: 2,
                                options: options.sources,
                                },
                            }
                        ]
                    },
                {id: "id_org", width: 100, hidden: true,
                    tooltip: false,
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
                'onresize': function() {
                    clearTimeout(this.delayResize);
                    let rows = recalcRowsRet(this);
                    if (rows) {
                        this.delayResize = setTimeout( () => {
                            this.config.posPpage = rows;
                            this.$scope.startSearch();
                        }, 150)
                    };
                },
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onBeforeSort: (field, direction) => {
                    setTimeout( () => {
                        this.$$("__table").config.fi = field;
                        this.$$("__table").config.di = direction;
                        this.startSearch();
                    }, app.config.searchDelay)                 
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
                    {view: "checkbox", localId: "_process",
                        hidden: !app.config.roles[app.config.role].lnkdel,
                        value: 0,
                        labelRight: "<span style='color: white; font-weight: 600'>спец.обработка</span>",
                        width: 200,
                        on: {
                            onChange: function() {
                                this.$scope.setSearchMethod(this.getValue())
                            },
                        },
                        click: () => {
                            // this.$$("__table").callEvent("onBeforeSort");
                            }
                        },
                    {view: "button", type: "htmlbutton", tooltip: "Обновить", localId: "_renew",
                        resizable: true,
                        sWidth: 136,
                        eWidth: 40,
                        label: "",
                        width: 40,
                        extLabel: "<span class='button_label'>Обновить</span>",
                        oldLabel: "<span class='webix_icon fa-refresh'></span>",
                        click: () => {
                            this.$$("__table").callEvent("onBeforeSort");
                            }
                        },
                    {view:"button",  tooltip: "Сбросить фильтры", 
                        type:"imageButton", image: buttons.unFilter.icon, 
                        width: 40,
                        localId: "_unfilt",
                        resizable: true,
                        sWidth: 180,
                        eWidth: 40,
                        label: "",
                        width: 40,
                        extLabel: buttons.unFilter.label,
                        oldLabel: "",
                        click: () => {
                            var cv = this.$$("__table");
                            unFilter(cv);
                            this.startSearch()
                            }
                        },
                    ]
                },
            {height: 3},
            ]}

        var _view = {
            view: "layout", type: "clean",
            rows: [
                top_menu,
                sprv,
                {$subview: PagerView},
            ]}
        return _view
    }

    setSearchMethod(val){
        console.log(val, typeof val)
        if (val == 1) {
            // применяем  особые условия
            this.$$("__table").config.searchMethod = 'getPrcsProcess'
        } else if (val == 0) {
            //обычные условия
            this.$$("__table").config.searchMethod = 'getPrcsSkip'
        }
        this.startSearch()

    }

    startSearch() {
        let old_v = this.getRoot().getChildViews()[2].$scope.$$("__page").getValue();
        this.getRoot().getChildViews()[2].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
    }

    ready() {
        setButtons(this.app, this.app.config.getButt(this.getRoot()));
        var table = this.$$("__table");
        let th = this;
        let u = webix.$$(table.getColumnConfig('dt').header[1].suggest.body.id)
        u.getChildViews()[1].getChildViews()[1].setValue('Применить');
        u.getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(function(){
                th.startSearch();
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
            });
        table.getFilter('dt').setValue(new Date());
        this.startSearch();
        // table.callEvent('onresize');
        table.getFilter('dt').blockEvent();
        setTimeout( () => {
            table.getFilter('dt').setValue(null);
            table.getFilter('dt').unblockEvent();
        }, 150);
        setTimeout(() => {
            table.getFilter("c_tovar").focus();    
        }, 50);
        
        table.markSorting(table.config.fi,table.config.di);
        }
    init() {
        this.popconfirm = this.ui(ConfirmView);
        }
    }

"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, recalcRowsRet, setRows} from "../views/globals";
import {dt_formating_sec, dt_formating, compareTrue, mcf_filter} from "../views/globals";
import UnlinkView from "../views/unlink";
import PagerView from "../views/pager_view";
import {options} from "../models/variables";

export default class LinksViewLnk extends JetView{
    config(){
        let app = this.app;
        let url = app.config.r_url + "?getSupplAll";
        let params = {"user": app.config.user};
        let res = checkVal(request(url, params, !0).response, 's');
        var rList = []
        if (res) {
            rList = res;
            };

        var delLnk = () => {
            let cid = this.$$("__table").getSelectedItem().id;
            this.$$("__table").remove(cid);
            }

        var tt = {view: "datatable",
            name: "__ttl",
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
            fi: 'dt',
            di: 'desc',
            //old_stri: " ",
            searchBar: undefined,
            searchMethod: "getLnkSprs",
            columns: [
                {id: "id", width: 270, hidden: true,
                    header: [{text: "Хэш"},
                    {content: "cFilt"},
                    ]
                    },
                {id: "id_tovar", width: 100, hidden: true, 
                    header: [{text: "Код"},
                    {content: "cFilt"},
                    ]
                    },
                {id: "c_tovar", fillspace: true, sort: 'server',
                    header: [{text: "Наименование"}
                    ],
                    headermenu:false,
                    },
                {id: "c_zavod", width: 200, hidden: true,
                    header: [{text: "Производитель"},
                    {content: "cFilt"},
                    ]
                    },
                {id: "id_spr", width: 150, hidden: true, sort: 'server',
                    header: [{text: "id_spr"},
                    {content: "cFilt"},
                    ]
                    },
                {id: "spr", width: 350,
                    header: [{text: "Эталон"},
                    {content: "cFilt", placeholder: "!слово - исключить из поиска",
                        inputConfig : {
                                height: 30
                                },
                        },
                    ]
                    },
                {id: "e_zavod", width: 300, hidden: true,
                    header: [{text: "Производитель эталона"},
                    ]
                    },
                {id: "c_vnd", width: 300,
                    header: [
                        {text: "Поставщик"},
                        {content: "richFilt", compare: compareTrue,  //height: 60, 
                            inputConfig : {
                                inputtype: "multicombo",
                                tagMode: false,
                                keepText: true,
                                pager: 1,
                                //column_name: "c_vnd",
                                options: {
                                    filter: mcf_filter,
                                    data: rList,
                                    body: {yCount: 10},
                                    },
                                },
                            }
                        ]
                    },
                {id: "dt", width: 200, sort: 'server',
                    format: dt_formating_sec,
                    css: 'center_p',
                    header: [{text: "Дата изменения"},
                    {content: "dateRangeFilter", compare: compareTrue,
                        inputConfig:{format:dt_formating, width: 180},
                        suggest:{
                            view:"daterangesuggest", body:{ timepicker:false, calendarCount:2}
                            },
                        },
                    ]
                    },
                {id: "owner", width: 100, sort: 'server',
                    header: [{text: "Создал"}, 
                        {content: "cFilt"},
                        ]
                    },
                {id: "source", width: 150, hidden: true,
                    header: [{text: "Источник"},
                        {content: "richFilt", compare: compareTrue,
                            inputConfig : {
                                pager: 1,
                                options: options.users,
                                },
                            }
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
                    }
                },
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                    },
                onBeforeSort: function(field, direction) {
                    this.config.fi = field;
                    this.config.di = direction;
                    this.$scope.startSearch();
                    },
                onItemDblClick: (item) => {
                    let sh_prc = this.$$("__table").getSelectedItem().id;
                    let params = {};
                    params["command"] = "?delLnk";
                    params["sh_prc"] = sh_prc;
                    params["type"] = "async";
                    params["callback"] = delLnk;
                    params["parent"] = this;
                    let linkBy = $$("_link_by");
                    if (!linkBy) {
                        webix.message({text: "Для работы со связками откройте вкладку Линкер вначале.", type: "debug", expire: 4000});
                        return false;
                    }
                    if (+linkBy.getValue() === 1) {
                        this.popunlink.show("Причина разрыва связки?", params, this._break);
                    } else {
                        webix.message({"text": "Выберите в параметрах сведение по поставщикам", "type": "debug"});
                    }
                },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                        }
                    },
                onAfterSelect: function (item) {
                    this.$scope._break.show();
                    },
                onAfterLoad: function() {
                    let filter = this.getFilter('c_vnd');
                    let filtering_value = filter.$getValue()
                    $$(filter.config.popup).getList().filter("#value#", filtering_value);
                    },
                },
            } 

        return {view: "layout",
            css: {'border-left': "1px solid #dddddd !important"},
            rows: [
                tt,
                {$subview: PagerView},
                ],
            }
        }

    startSearch() {
        var pager = this.getRoot().getChildViews()[1].$scope.$$("__page")
        pager.setValue((+pager.getValue() === 0) ? '1' : "0");
    }

    ready() {
        let app = this.app;
        let th = this;
        let table = this.$$("__table");
        $$(table.getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$(table.getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(() => {
                th.startSearch();
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
            })
        if (table.isColumnVisible('owner')) {
            if  (!app.config.roles[app.config.role].lnkdel) {
                table.getFilter('owner').value = this.app.config.user;;
                table.getFilter('owner').readOnly = true;
            } else {
                table.getFilter('owner').readOnly = false;
                }
            }
        this._break = this.getRoot().getParentView().$scope.$$("_br")
        this._search = this.getRoot().getParentView().$scope.$$("_ls")
        table.config.searchBar = this._search.config.id;
        this._break.hide();
        table.getFilter('dt').setValue(new Date());

        table.callEvent('onresize');

        table.getFilter('dt').blockEvent();
        setTimeout( () => {
            table.getFilter('dt').setValue(null);
            table.getFilter('dt').unblockEvent();
        }, 150);
        table.markSorting(table.config.fi,table.config.di);
        $$(table.config.searchBar).focus();
    }

    init() {
        setRows(this);
        this.popunlink = this.ui(UnlinkView);
    }

}



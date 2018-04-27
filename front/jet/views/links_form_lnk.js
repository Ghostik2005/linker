"use strict";

import {JetView} from "webix-jet";
import {checkKey, fRender, fRefresh} from "../views/globals";
import {dt_formating_sec, dt_formating, compareTrue} from "../views/globals";
import UnlinkView from "../views/unlink";
import PagerView from "../views/pager_view";

export default class LinksViewLnk extends JetView{
    config(){
        let app = this.app;
    
        var filtFunc = () => {
            let old_v = this.getRoot().getChildViews()[1].$scope.$$("__page").getValue();
            this.getRoot().getChildViews()[1].$scope.$$("__page").setValue((+old_v ===0) ? '1' : "0");
            this.getRoot().getChildViews()[1].$scope.$$("__page").refresh();
            }

        webix.ui.datafilter.cFilt = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.cFilt.on_key_down = function(e, node, value){
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(function(){
                    filtFunc();
                    },app.config.searchDelay);
                }
        webix.ui.datafilter.cFilt.refresh = fRefresh;
        webix.ui.datafilter.cFilt.render = fRender;

        var delLnk = () => {
            let cid = this.$$("__table").getSelectedItem().id;
            this.$$("__table").remove(cid);
            }

        var tt = {view: "datatable",
            name: "__ttl",
            localId: "__table",
            startPos: 1,
            posPpage: 20,
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
            searchMethod: "getLnkSprs",
            //css: 'dt_css',
            columns: [
                {id: "id_tovar", width: 100, hidden: true,
                    header: [{text: "Код"},
                    {content: "cFilt"},
                    ]
                    },
                {id: "c_tovar", fillspace: true, sort: 'server',
                    header: [{text: "Наименование"},
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
                    {content: "cFilt", placeholder: "!слово - исключить из поиска"},
                    ]
                    },
                {id: "e_zavod", width: 300, hidden: true,
                    header: [{text: "Производитель эталона"},
                    ]
                    },
                {id: "c_vnd", width: 300,
                    header: [{text: "Поставщик"},
                    {content: "cFilt"},
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
                {id: "owner", width: 100, sort: 'server',
                    header: [{text: "Создал"}, 
                    {content: "cFilt"},
                    ]
                    }
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
                    filtFunc();
                    },
                onItemDblClick: (item, ii, iii) => {
                    let sh_prc = this.$$("__table").getSelectedItem().id;
                    let params = {};
                    params["command"] = "?delLnk";
                    params["sh_prc"] = sh_prc;
                    params["type"] = "async";
                    params["callback"] = delLnk;
                    params["parent"] = this;
                    if (+$$("_link_by").getValue() === 1) {
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
                onBeforeSelect: function (item) {
                    },
                onAfterSelect: function (item) {
                    this.$scope._break.show();
                    }
                },
            } 

        return {view: "layout",
            rows: [
                tt,
                {$subview: PagerView},
                ],
            }
        }

    ready() {
        let app = this.app;
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
        if (this.$$("__table").isColumnVisible('dt')) {
            this.$$("__table").getFilter('dt').setValue({'start':new Date()});
            }
        if (this.$$("__table").isColumnVisible('owner')) {
            if  (!app.config.roles[app.config.role].lnkdel) {
                this.$$("__table").getFilter('owner').value = this.app.config.user;;
                this.$$("__table").getFilter('owner').readOnly = true;
            } else {
                this.$$("__table").getFilter('owner').readOnly = false;
                }
            }
        }

    init() {
        this.popunlink = this.ui(UnlinkView);
        }

    ready() {
        this._break = this.getRoot().getParentView().$scope.$$("_br")
        this._search = this.getRoot().getParentView().$scope.$$("_ls")
        this.$$("__table").config.searchBar = this._search.config.id;
        this._break.hide();
        
        }
        
    }



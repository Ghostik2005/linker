"use strict";

import {JetView} from "webix-jet";
import {get_data} from "../views/globals";
import {last_page} from "../views/globals";
import {checkKey, getDtParams, fRender, fRefresh} from "../views/globals";
import ConfirmView from "../views/yes-no";
import {dt_formating_sec, dt_formating, compareTrue} from "../views/globals";
import PagerView from "../views/pager_view";


export default class SkippedBarView extends JetView{
    config(){

        let app = this.app;

        var delSkip = () => {
            let item_id = this.$$("__table").getSelectedId()
            this.$$("__table").remove(item_id)
            }

        var filtFunc = () => {
            let old_v = this.$$("__page").getValue();
            this.$$("__page").setValue((+old_v ===0) ? '1' : "0");
            this.$$("__page").refresh();
            }
        
        webix.ui.datafilter.customFilterSkip = Object.create(webix.ui.datafilter.textFilter);
        webix.ui.datafilter.customFilterSkip.on_key_down = function(e, node, value){
                if ((e.which || e.keyCode) == 9) return;
                if (!checkKey(e.keyCode)) return;
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout(function(){
                    filtFunc()
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
                            readonly: !true, disabled: !true,
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
                    filtFunc();
                    },
                onItemDblClick: function(item) {
                    let user = this.$scope.app.config.user
                    if (this.$scope.app.config.role === this.$scope.app.config.admin) {
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
                onBeforeSelect: () => {
                    }
                }
            }
            
        var _view = {
            id: "sk_bar",
            view: "layout",
            css: {'border-left': "1px solid #dddddd !important"},
            rows: [
                sprv,
                {$subview: PagerView},
                ]}
        return _view
        }

    ready() {
        let old_v = this.$$("__page").getValue();
        this.$$("__page").setValue((+old_v ===0) ? '1' : "0");
        this.$$("__page").refresh();
        }

    init() {
        //console.log('init tab bar');
        this.popconfirm = this.ui(ConfirmView);
        let th = this;
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].setValue('Применить');
        $$(this.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1].define('click', function() {
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            this._filter_timer=window.setTimeout(function(){
                let old_v = th.$$("__page").getValue();
                th.$$("__page").setValue((+old_v ===0) ? '1' : "0");
                th.$$("__page").refresh();
                },webix.ui.datafilter.textWaitDelay);
            this.getParentView().getParentView().hide();
            })
        }
    }

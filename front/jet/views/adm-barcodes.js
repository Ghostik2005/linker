"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import {get_data_test, checkKey, getDtParams} from "../views/globals";

export default class BarcodesView extends JetView{
    config(){

        var top = {height: 40,  view: "toolbar",
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Начните набирать название товара здесь",  fillspace: true, localId: "_sb",
                    keyPressTimeout: 900, tooltip: "поиск по ШК", _keytimed: undefined,
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout(() => {
                                    let ui = this.$scope.getRoot().getChildViews()[1].getChildViews()[0];
                                    if (ui) {
                                        let params = getDtParams(ui);
                                        let cbars = (this.$scope.$$("_chbar").getValue() === 1) ? "0,100" : this.$scope.$$("_bnum").getValue();
                                        get_data_test({
                                            view: ui,
                                            navBar: this.$scope.getRoot().getChildViews()[1].getChildViews()[1],
                                            start: 1,
                                            count: params[1],
                                            searchBar: this.$scope.getRoot().getChildViews()[1].getChildViews()[0].config.searchBar,
                                            method: this.$scope.getRoot().getChildViews()[1].getChildViews()[0].config.searchMethod,
                                            field: params[2],
                                            direction: params[3],
                                            filter: params[0],
                                            cbars: cbars
                                            });
                                        }
                                    }, this.$scope.app.config.searchDelay);
                                };
                            },
                        },
                    },
                {view: "button", type: 'htmlbutton', width: 35,
                    label: "<span class='webix_icon fa-history'></span><span style='line-height: 20px;'></span>",
                    click: () => {
                        let v = this.getRoot().getChildViews()[1].getChildViews()[0];
                        let hist = webix.storage.session.get(v.config.name);
                        this.pophistory.show(hist, this.$$("_sb"));
                        },
                    },
                {view:"rangeslider", label:"Диапазон кол-ва ШК", value: "0,15", width: 350, labelWidth: 140,
                    hidden: function(){
                        return (this.$scope.$$("_chbar").getValue() === 1) 
                        },
                    localId: "_bnum",
                    title: webix.template("#value#"),
                    stringResult:true,
                    max: 15,
                    min: 0,
                    on: {
                        onChange: () => {
                            this.$$("_sb").focus();
                            },
                        },
                    },
                {view: "checkbox", labelRight: "<span style='color: white'>Все</span>", labelWidth: 0, value: 1, width: 60, localId: "_chbar",
                    on: {
                        onChange: () => {
                            this.$$("_sb").focus();
                            if (this.$$("_chbar").getValue() === 1) {
                                this.$$("_bnum").hide();
                            } else {
                                this.$$("_bnum").show();
                                };
                            },
                        },
                    },
                {view: "checkbox", labelRight: "<span style='color: white'>Поиск по справочнику</span>", labelWidth: 0, value: 1, width: 160, 
                    on: {
                        onChange: function () {
                            this.$scope.$$("_sb").setValue('');
                            if (this.getValue() === 1) {
                                this.$scope.$$("_sb").define('placeholder', "Начните набирать название товара");
                                if (this.$scope.$$("_chbar").getValue()===0) this.$scope.$$("_bnum").show();
                                this.$scope.$$("_chbar").show();
                                this.$scope.show('adm-barcodes-s')
                            } else if (this.getValue() === 0) {
                                this.$scope.$$("_sb").define('placeholder', "Начните набирать баркод");
                                this.$scope.$$("_bnum").hide();
                                this.$scope.$$("_chbar").hide();
                                this.$scope.show('adm-barcodes-b')
                                }
                            this.$scope.$$("_sb").refresh();
                            },
                        }
                    },
                ]
            }

        return {
            view: "layout",
            rows: [
                top,
                { $subview: true},
                ]
            }
        }
    init() {
        this.pophistory = this.ui(History);
        this.show('adm-barcodes-s')
        }
    }

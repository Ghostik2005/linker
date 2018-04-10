"use strict";

import {JetView} from "webix-jet";
import History from "../views/history";
import {get_data_test, checkKey, getDtParams} from "../views/globals";

export default class BarcodesView extends JetView{
    config(){

        var top = {//view: 'layout',
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Начните набирать название товара здесь", id: "__s_b", fillspace: true,
                    keyPressTimeout: 900, tooltip: "поиск по ШК", _keytimed: undefined,
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout(() => {
                                    let ui = this.$scope.getRoot().getChildViews()[1].getChildViews()[0];
                                    if (ui) {
                                        let params = getDtParams(ui);
                                        let cbars = ($$("__checkbars").getValue() === 1) ? "0,100" : $$("_bar_num").getValue();
                                        console.log('sb', this.$scope.getRoot().getChildViews()[1].getChildViews()[0].config.searchBar);
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
                        this.pophistory.show(hist, $$("__s_b"));
                        },
                    },
                {view: "checkbox", labelRight: "Поиск по справочнику", labelWidth: 0, value: 1, disabled: !true, width: 160, 
                    on: {
                        onChange: function () {
                            $$("__s_b").setValue('');
                            if (this.getValue() === 1) {
                                $$("__s_b").define('placeholder', "Начните набирать название товара здесь");
                                $$("_bar_num").show();
                                $$("__checkbars").show();
                                //this.$scope.show('/start/adm/adm-barcodes/adm-barcodes-s')
                                //this.$scope.app.show('/start/adm/adm-references/adm-barcodes/adm-barcodes-s')
                                this.$scope.show('adm-barcodes-s')
                            } else if (this.getValue() === 0) {
                                $$("__s_b").define('placeholder', "Начните набирать баркод");
                                $$("_bar_num").hide();
                                $$("__checkbars").hide();
                                //this.$scope.show('/start/adm/adm-barcodes/adm-barcodes-b')
                                //this.$scope.app.show('/start/adm/adm-references/adm-barcodes/adm-barcodes-b')
                                this.$scope.show('adm-barcodes-b')
                                }
                            $$("__s_b").refresh();
                            },
                        }
                    },
                {view:"rangeslider", label:"Диапазон кол-ва ШК", value:[0, 15], width: 350, labelWidth: 140,
                    disabled: function(){
                        if ($$("__checkbars").getValue() === 1) { return true}
                        else {return false;}
                        },
                    id: "_bar_num",
                    title:function(obj){
                        let v = obj.value;
                        return (v[0]==v[1]?v[0]: v[0]+" - "+v[1]);
                        },
                    stringResult:true,
                    max: 15,
                    min: 0,
                    on: {
                        onChange: () => {
                            $$("__s_b").focus();
                            },
                        },
                    },
                {view: "checkbox", labelRight: "Все", labelWidth: 0, value: 1, disabled: !true, width: 60, id: "__checkbars",
                    on: {
                        onChange: () => {
                            $$("__s_b").focus();
                            if ($$("__checkbars").getValue() === 1) {
                                $$("_bar_num").disable();
                            } else {
                                $$("_bar_num").enable();
                                };
                            },
                        },
                    },
                ]
                //},
            //{cols: [
                //{fillspace: true,
                    //},
                //{view: "label", label:"Диапазон кол-ва ШК", width: 140},
                //{view: "counter", label: "min", value: 0, step: 1, id: '_min', labelWidth: 35, width: 140},
                //{view: "counter", label: "max", value: 0, step: 1, id: '_max', labelWidth: 35, width: 140},
                ////{view:"rangeslider", label:"Диапазон кол-ва ШК", value:[0, 15], width: 350, labelWidth: 140,
                    ////disabled: !true,
                    ////id: "_bar_num1",
                    ////title:function(obj){
                        ////let v = obj.value;
                        ////let r = (v[0]==v[1]?v[0]: v[0]+" - "+v[1])
                        ////r = "<span class='slide1'>" + r + "</span>";
                        ////return r;
                        ////},
                    ////stringResult:true,
                    ////max: 15,
                    ////min: 0,
                    ////},
                //{view: "button", label: "Все", width: 60,
                    //click: function() {
                        //$$("_min").setValue(0);
                        //$$("_max").setValue(0);
                        //}
                    //},
                //]}
                //]
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
    ready(){
        //this.app.show('/start/adm/adm-references/adm-barcodes/adm-barcodes-s')
        }
    }

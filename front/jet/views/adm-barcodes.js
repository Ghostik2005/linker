"use strict";

import {JetView} from "webix-jet";
import {get_data} from "../views/globals";

export default class BarcodesView extends JetView{
    config(){

        var top = {//view: 'layout',
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Начните набирать название товара здесь", id: "__s_b", fillspace: true,
                    keyPressTimeout: 900, tooltip: "поиск по ШК",
                    on: {
                        onAfterRender: function () {
                            },
                        onTimedKeyPress: function(code, event) {
                            let th = this.$scope;
                            let v = ($$("__ssearch").getValue() === 1) ? "__dtd" : "__dtdb";
                            let n = ($$("__ssearch").getValue() === 1) ? "__nav_b" : "__nav_bb";
                            let m = ($$("__ssearch").getValue() === 1) ? "getSprBars" : "getBarsSpr";
                            let count = $$(v).config.posPpage;
                            let field = $$(v).config.fi;
                            let direction = $$(v).config.di;
                            get_data({
                                th: th,
                                view: v,
                                navBar: n,
                                start: 1,
                                count: count,
                                searchBar: "__s_b",
                                method: m,
                                field: field,
                                direction: direction
                                });
                            }
                        },
                    },
                {view: "checkbox", labelRight: "Поиск по справочнику", labelWidth: 0, value: 1, disabled: !true, width: 200, id: "__ssearch",
                    on: {
                        onChange: () => {
                            $$("__s_b").setValue('');
                            if ($$("__ssearch").getValue() === 1) {
                                $$("__s_b").define('placeholder', "Начните набирать название товара здесь");
                                this.show('/start/adm/adm-barcodes/adm-barcodes-s')
                            } else if ($$("__ssearch").getValue() === 0) {
                                $$("__s_b").define('placeholder', "Начните набирать баркод");
                                this.show('/start/adm/adm-barcodes/adm-barcodes-b')
                                }
                            $$("__s_b").refresh();
                            },
                        }
                    }
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
    }

//"use strict";

import {JetView} from "webix-jet";
import {request, barcodes, get_bars} from "../views/globals";


export default class NewbarView extends JetView{
    config(){
        function check_b(value) {
            var esum=0;
            if (isNaN(value) || value.length !== 13) return false;
            for (let i=0; i<13; i++) esum += Number(value[i])*(i%2*2+1);
            return !(esum % 10)
            }

        return {view: "cWindow",
            modal: true,
            on: {
                onHide: () => {
                    this.$$("_nbar").setValue('');
                    this.$$("_n_b").clearValidation();
                    //this.$$("b_list").clearAll();
                    },
                onShow: () => {
                    let id_spr = this.$$("_n_b").config.id_spr
                    get_bars(this, id_spr);
                    this.$$("_nbar").setValue('');
                    this.$$("b_list").clearAll();
                    this.$$("b_list").parse(barcodes);
                    },
                },
            body: { view: "form",
                localId: "_n_b",
                margin: 0,
                id_spr: NaN,
                th: NaN,
                rules:{
                    "_new_bar": check_b,
                    },
                elements: [
                    {rows: [
                        {cols: [
                            {view: "text", label: "Название", value: "", name: "_new_bar", placeholder: "Введите новое значение", localId: "_nbar", //required: true,
                                },
                            {view: "button", type: "htmlbutton", label: "<span class='webix_icon fa-plus'></span>", width: 30, disabled: !true,
                                on: {
                                    },
                                click: () => {
                                    //var valid = this.$$("_n_b").validate();
                                    let valid = check_b(this.$$("_nbar").getValue());
                                    if (valid) {
                                        let val = {"barcode": this.$$("_nbar").getValue()};
                                        this.$$("b_list").add(val);
                                        this.$$("_nbar").setValue('');
                                        }
                                    }
                                },
                            ]},
                        {cols: [
                            {view:"list",
                                localId: "b_list",
                                width:250,
                                height:350,
                                template:"#barcode#",
                                select:true,
                                on: {
                                    onAfterSelect: function () {
                                        let item = this.getSelectedItem();
                                        this.$scope.$$("b_code").setValue(item.barcode);
                                        },
                                    onItemDblClick: function(uid) {
                                        this.remove(uid);
                                        this.$scope.$$("b_code").setValue('0000000000000')
                                        },
                                    },
                                },
                            {width: 10},
                            {rows: [
                                {view: "barcode", type: "ean13", value: '0000000000000', width: 300, name: "_new_", localId: "b_code", hieght: 200,
                                    },
                                {}
                                ]},
                            ]},
                        {cols: [
                            {view: "button", type: "base", label: "Отменить", width: 120,
                                click: () => {
                                    this.hide();
                                    }
                                },
                            {},
                            {view: "button", type: "base", label: "Применить", width: 120,
                                click: () => {
                                    this.$$("b_list").selectAll();
                                    let bars = this.$$("b_list").getSelectedItem();
                                    var parse = '';
                                    if (bars) {
                                        let t = typeof(bars);
                                        try {
                                            bars.forEach(function(item, i, bars) {
                                                parse += item.barcode + ' ';
                                                });
                                        } catch(err) {
                                            parse = bars.barcode;
                                            }
                                        }
                                    let th = this.$$("_n_b").config.th;
                                    th.$$("_barc").setValue(parse);
                                    this.hide();
                                    }
                                }
                            ]}
                        ]}
                    ],
            on: {
                onBeforeShow: function() {
                    },
                onShow: function() {
                    }
                }
            }
            }
        }
        
    show(new_head, id_spr, th){
        this.$$("_n_b").config.id_spr = id_spr;
        this.$$("_n_b").config.th = th;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        }
    hide(){
        this.getRoot().hide()
        }
    }



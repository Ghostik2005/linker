//"use strict";

import {JetView} from "webix-jet";
import {barcodes, get_bars} from "../views/globals";


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
                    this.$$("_nbar").setValue("");
                    this.$$("b_code").setValue('0000000000000');
                    this.$$("_n_b").reconstruct();
                    //this.$$("b_list").clearAll();
                    },
                onShow: () => {
                    this.$$("_nbar").setValue("");
                    this.$$("b_code").setValue('0000000000000');
                    let id_spr = this.$$("_n_b").config.id_spr
                    get_bars(this, id_spr);
                    this.$$("b_list").clearAll();
                    this.$$("b_list").parse(barcodes);
                    },
                },
            body: { view: "form",
                localId: "_n_b",
                margin: 0,
                id_spr: undefined,
                th: undefined,
                callback: undefined,
                rules:{
                    //"_new_bar": check_b,
                    },
                elements: [
                    {rows: [
                        {cols: [
                            {view: "text", label: "Название", value: "", name: "_new_bar", placeholder: "Введите новый штрихкод", localId: "_nbar", required: !true,
                                },
                            {view: "button", type: "htmlbutton", label: "<span class='webix_icon fa-plus'></span>", width: 30, disabled: !true,
                                click: () => {
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
                            {view:"activeList",
                                activeContent:{
                                    deleteBut:{
                                        view:"button",
                                        type: "htmlbutton",
                                        label: "<span class='webix_icon fa-minus'></span>",
                                        width:30,
                                        click: (id, e) => {
                                            var item_id = this.$$("b_list").locate(e);
                                            this.$$("b_list").callEvent("onItemDblClick", [item_id,]);
                                            },
                                        },
                                    },
                                localId: "b_list",
                                width:250,
                                height:350,
                                type: {
                                    height: 32,
                                    },
                                template: "<div class ='barcode'>#barcode#</div>" + "<div class = 'butt1'>{common.deleteBut()}</div>",
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
                        {height: 10},
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
                                    let th = this.$$("_n_b").config.th;
                                    let id_spr = this.$$("_n_b").config.id_spr;
                                    let callback = this.$$("_n_b").config.callback;
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
                                    if (th) th.$$("_barc").setValue(parse);
                                    if (callback) callback(id_spr, parse);
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
        
    show(new_head, id_spr, th, callback){
        this.$$("_n_b").config.id_spr = id_spr;
        this.$$("_n_b").config.th = th;
        this.$$("_n_b").config.callback = callback;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.getRoot().show();
        }
    hide(){
        this.getRoot().hide()
        }
    }



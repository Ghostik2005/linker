"use strict";

import {JetView} from "webix-jet";
import {vendor, addVendor, delVendor, updVendor, request, checkVal} from "../views/globals";
import NewPropView from "../views/new_prop";

export default class VendorsView extends JetView{
    config(){

        var sprv = {view: "datatable",
            localId: "__dtv",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            //footer: true,
            headermenu:true,
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            old_stri: "",
            columns: [
                {id: "id",
                    width: 75,
                    header: [{text: "ID"},
                        ],
                    },
                { id: "c_zavod",
                    headermenu: false,
                    fillspace: 1, sort: "text",
                    header: [{text: "Производитель"},
                        ]
                    },
                { id: "id_state", 
                    width: 150,
                    header: [{text: "Статус"},
                        ]
                    },
                { id: "dt", 
                    width: 250,
                    header: [{text: "Дата заведения"},
                        ]
                    }
                ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                    },
                onBeforeRender: function() {
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            });
                        }
                    },
                onItemDblClick: function(item) {
                    item = this.getSelectedItem();
                    let params = {'text': item.c_zavod, 'id': item.id, 'type': 'Vendor', 'callback': updVendor, 'mode': 'upd', 'source': this};
                    this.$scope.popnew.show('Редактирование поставщика', params);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    this.$$("_del").show();
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                },
            }

        var top = { view: "toolbar",
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", 
                    keyPressTimeout: 900, tooltip: "поиск по поставщику",
                    on: {
                        onTimedKeyPress: function(code, event) {
                            let value = this.getValue().toString().toLowerCase();
                            this.$scope.$$("__dtv").filter(function(obj){
                                return obj.c_zavod.toString().toLowerCase().indexOf(value) != -1;
                                })
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Добавить поставщика",
                    label: "<span class='webix_icon fa-plus'></span>", width: 40,
                    click: () => {
                        let params = {'type': 'Vendor', 'callback': addVendor, 'mode': 'new', 'source': this.$$("__dtv")};
                        this.popnew.show('Добавление производителя', params);
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "_del", tooltip: "Удалить поставщика",
                    label: "<span style='color: red', class='webix_icon fa-times'></span>", width: 40,
                    click: () => {
                        let item_id = this.$$("__dtv").getSelectedItem().id
                        let params = {};
                        params['user'] = this.app.config.user;
                        params['id'] = item_id;
                        let url = this.app.config.r_url + "?delVendor";
                        let res = request(url, params, !0).response;
                        res = checkVal(res, 's');
                        if (res) {
                            delVendor(res.id);
                            this.$$("_del").hide();
                            };
                        }
                    },
                ]
            }

        return {
            view: "layout",
            rows: [
                top,
                sprv,
                ]
            }
        }
        
    init() {
        this.popnew = this.ui(NewPropView);
        webix.extend(this.$$("__dtv"), webix.ProgressBar);
        this.$$("__dtv").sync(vendor.data);
        }
    }

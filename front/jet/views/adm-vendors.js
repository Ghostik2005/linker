"use strict";

import {JetView} from "webix-jet";
import {vendor, addVendor, delVendor, updVendor, request, checkVal} from "../views/globals";
import NewPropView from "../views/new_prop";

export default class VendorsView extends JetView{
    config(){

        var sprv = {view: "datatable",
            name: "_vendors",
            localId: "__table",
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
                            this.$scope.$$("__table").filter(function(obj){
                                return obj.c_zavod.toString().toLowerCase().indexOf(value) != -1;
                                })
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Добавить производителя",
                    //label: "<span class='webix_icon fa-plus'></span>", width: 40,
                    localId: "_add",
                    resizable: true,
                    sWidth: 200,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Добавить производителя</span>",
                    oldLabel: "<span class='webix_icon fa-plus'></span>",
                    click: () => {
                        let params = {'type': 'Vendor', 'callback': addVendor, 'mode': 'new', 'source': this.$$("__table")};
                        this.popnew.show('Добавление производителя', params);
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "_del", tooltip: "Удалить производителя",
                    //label: "<span style='color: red', class='webix_icon fa-times'></span>", width: 40,
                    resizable: true, sWidth: 200, eWidth: 40, label: "", width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px;'>Удалить производителя</span>",
                    oldLabel: "<span style='color: red', class='webix_icon fa-times'></span>",
                    click: () => {
                        let item_id = this.$$("__table").getSelectedItem().id
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

    ready() {
        let r_but = [this.$$("_add"), this.$$("_del")]
        r_but.forEach( (item, i, r_but) => {
            item.define({width: (this.app.config.expert) ? item.config.eWidth : item.config.sWidth,
                         label: (this.app.config.expert) ? item.config.oldLabel  : item.config.oldLabel + item.config.extLabel});
            item.refresh();
            item.resize();
            })
        }
        
    init() {
        this.popnew = this.ui(NewPropView);
        webix.extend(this.$$("__table"), webix.ProgressBar);
        this.$$("__table").sync(vendor.data);
        }
    }

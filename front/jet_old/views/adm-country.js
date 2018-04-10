"use strict";

import {JetView} from "webix-jet";
import {strana, addStrana, delStrana, updStrana, request, checkVal} from "../views/globals";
import NewPropView from "../views/new_prop";

export default class CountryView extends JetView{
    config(){

        var sprv = {view: "datatable",
            localId: "__dtc",
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
                { id: "c_strana", headermenu: false,
                    fillspace: 1, sort: "text",
                    header: [{text: "Страна"},
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
                    let params = {'text': item.c_strana, 'id': item.id, 'type': 'Strana', 'callback': updStrana, 'mode': 'upd', 'source': this};
                    this.$scope.popnew.show('Редактирование страны', params);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    this.$$("_del").enable();
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                },
            }

        var top = {//view: 'layout',
            height: 40,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", 
                    keyPressTimeout: 900, tooltip: "поиск по стране",
                    on: {
                        onTimedKeyPress: function(code, event) {
                            let value = this.getValue().toString().toLowerCase();
                            this.$scope.$$("__dtc").filter(function(obj){
                                return obj.c_strana.toString().toLowerCase().indexOf(value) != -1;
                                })
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', disabled: !true, 
                    label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'> Добавить</span>", width: 140,
                    click: () => {
                        let params = {'type': 'Strana', 'callback': addStrana, 'mode': 'new', 'source': this.$$("__dtc")};
                        this.popnew.show('Добавление страны', params);
                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true, localId: "_del",
                    label: "<span style='color: red', class='webix_icon fa-times'></span><span style='line-height: 20px;'> Удалить</span>", width: 140,
                    click: () => {
                        let item_id = this.$$("__dtc").getSelectedItem().id
                        let params = {};
                        params['user'] = this.app.config.user;
                        params['id'] = item_id;
                        let url = this.app.config.r_url + "?delStrana";
                        let res = request(url, params, !0).response;
                        res = checkVal(res, 's');
                        if (res) {
                            delStrana(res.id);
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
        webix.extend(this.$$("__dtc"), webix.ProgressBar);
        this.$$("__dtc").sync(strana.data);
        }
    }
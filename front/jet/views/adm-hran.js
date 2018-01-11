"use strict";

import {JetView} from "webix-jet";
import {hran, addHran, delHran, updHran, request} from "../views/globals";
import NewPropView from "../views/new_prop";


export default class HranView extends JetView{
    config(){

        var sprv = {view: "datatable",
            localId: "__dth",
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
                { id: "usloviya",
                    fillspace: 1, sort: "text",
                    header: [{text: "Условия хранения"},
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
                onBeforeRender: function() {
                    //webix.extend(this, webix.ProgressBar);
                    if (!this.count) {
                        this.showProgress({
                            type: "icon",
                            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
                            });
                        }
                    },
                onItemDblClick: function(item) {
                    item = this.getSelectedItem();
                    console.log(item);
                    let params = {'text': item.usloviya, 'id': item.id, 'type': 'Hran', 'callback': updHran, 'mode': 'upd', 'source': this};
                    this.$scope.popnew.show('Редактирование условия хранения', params);
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
                    keyPressTimeout: 900, tooltip: "поиск по условиям хранения",
                    on: {
                        onTimedKeyPress: function(code, event) {
                            let value = this.getValue().toString().toLowerCase();
                            this.$scope.$$("__dth").filter(function(obj){
                                return obj.usloviya.toString().toLowerCase().indexOf(value) != -1;
                                })
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', disabled: !true, 
                    label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'> Добавить</span>", width: 140,
                    click: () => {
                        //////сделать добавление на сервер
                        let params = {'type': 'Hran', 'callback': addHran, 'mode': 'new', 'source': this.$$("__dth")};
                        this.popnew.show('Добавление условия хранения', params);
                        webix.message({
                            text: "Добавление",
                            type: "debug",
                            })
                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true, localId: "_del",
                    label: "<span style='color: red', class='webix_icon fa-times'></span><span style='line-height: 20px;'> Удалить</span>", width: 140,
                    click: () => {
                        ///////сделать удаление с сервера
                        let item_id = this.$$("__dth").getSelectedItem().id
                        console.log(item_id);
                        let params = {};
                        params['user'] = this.app.config.user;
                        params['id'] = item_id;
                        let url = this.app.config.r_url + "?delHran";
                        let ret_data = request(url, params, !0).response;
                        ret_data = JSON.parse(ret_data);
                        if (ret_data.result) {
                            delHran(ret_data.ret_val.id);
                        } else {
                            webix.message({
                                text: ret_data.ret_val,
                                type: "debug",
                                })
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
        webix.extend(this.$$("__dth"), webix.ProgressBar);
        this.$$("__dth").sync(hran.data);
        }
    }

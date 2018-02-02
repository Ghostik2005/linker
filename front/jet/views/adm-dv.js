"use strict";

import {JetView} from "webix-jet";
import {dv, addDv, delDv, updDv, request} from "../views/globals";
import NewDvView from "../views/new_dv";

export default class DvView extends JetView{
    config(){

        var sprv = {view: "datatable",
            localId: "__dtd",
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
                    width: 75, sort: "text",
                    header: [{text: "ID"},
                        {content:"selectFilter"}
                        ],
                    },
                { id: "act_ingr",
                    fillspace: 1, sort: "text", headermenu: false,
                    header: [{text: "Действующее вещество"},
                        {content:"selectFilter"}
                        ]
                    },
                { id: "oa",
                    width: 200, sort: "text",
                    header: [{text: "Обязательный ассортимент"},
                        {content:"selectFilter"}
                        ]
                    },
                { id: "id_state", 
                    width: 150,
                    header: [{text: "Статус"},
                        {content:"selectFilter"}
                        ]
                    },
                { id: "dt", 
                    width: 250,
                    header: [{text: "Дата заведения"},
                        {content:"selectFilter"}
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
                    let params = {'text': item.act_ingr, 'id': item.id, "oa": item.oa,'type': 'Dv', 'callback': updDv, 'mode': 'upd', 'source': this};
                    console.log(params);
                    this.$scope.popnew.show('Редактирование действующего в-ва', params);
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
                    keyPressTimeout: 900, tooltip: "поиск по действующему веществу",
                    on: {
                        onTimedKeyPress: function(code, event) {
                            let value = this.getValue().toString().toLowerCase();
                            this.$scope.$$("__dtd").filter(function(obj){
                                return obj.act_ingr.toString().toLowerCase().indexOf(value) != -1;
                                })
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', disabled: !true, 
                    label: "<span class='webix_icon fa-plus'></span><span style='line-height: 20px;'> Добавить</span>", width: 140,
                    click: () => {
                        let params = {'type': 'Dv', 'callback': addDv, 'mode': 'new', 'source': this.$$("__dtd")};
                        this.popnew.show('Добавление действующего в-ва', params);
                        }
                    },
                {view:"button", type: 'htmlbutton', disabled: true, localId: "_del",
                    label: "<span style='color: red', class='webix_icon fa-times'></span><span style='line-height: 20px;'> Удалить</span>", width: 140,
                    click: () => {
                        let item_id = this.$$("__dtd").getSelectedItem().id
                        let params = {};
                        params['user'] = this.app.config.user;
                        params['id'] = item_id;
                        let url = this.app.config.r_url + "?delDv";
                        let ret_data = request(url, params, !0).response;
                        ret_data = JSON.parse(ret_data);
                        if (ret_data.result) {
                            delDv(ret_data.ret_val.id);
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
        this.popnew = this.ui(NewDvView);
        webix.extend(this.$$("__dtd"), webix.ProgressBar);
        this.$$("__dtd").sync(dv.data);
        }
    }

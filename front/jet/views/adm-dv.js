"use strict";

import {JetView} from "webix-jet";
import {DelEdIcons, dvReload, setButtons, addDv, delDv, updDv, request, checkVal} from "../views/globals";
import {refTemplate} from "../views/globals";
import NewDvView from "../views/new_dv";

export default class DvView extends JetView{
    config(){

        var sprv = {view: "datatable",
            name: "_dv",
            localId: "__table",
            navigation: "row",
            select: true,
            resizeColumn:true,
            fixedRowHeight:false,
            rowLineHeight:32,
            rowHeight:32,
            editable: false,
            headermenu:true,
            startPos: 1,
            posPpage: 20,
            totalPos: 1250,
            old_stri: "",
            type:{
                itemIcon: DelEdIcons,
            }, 
            onClick:{
                delete_button:function(ev, id, html){
                    let item = this.getItem(id);
                    if (item.delete===false) {
                        webix.message({"type": "debug", "text": "Удаление группы "+ item.c_issue  + " невозможно", "expire": 5000});
                        return
                    };
                    setTimeout( () => {
                        this.select(item.id, false);
                        this.$scope.$$("_del").callEvent("onItemClick");
                    }, 50)
                },
                edit_button:function(ev, id, html){
                    this.select(id, false);
                    this.callEvent("onItemDblClick", id);
                },
            },
            columns: [
                { id: "act_ingr",
                    fillspace: 1, sort: "text", headermenu: false,
                    header: [{text: "Действующее вещество"},
                        //{content:"textFilter"}
                        ],
                    template: refTemplate,
                },
                { id: "oa",
                    width: 200, sort: "text",
                    header: [{text: "Обязательный ассортимент"},
                        {content:"selectFilter"}
                        ]
                    },
                {id: "id",
                    width: 75, sort: "text",
                    header: [{text: "ID"},
                        //{content:"selectFilter"}
                        ],
                    },
                { id: "id_state", 
                    width: 150, hidden: true,
                    header: [{text: "Статус"},
                        //{content:"selectFilter"}
                        ]
                    },
                { id: "dt", 
                    width: 250, hidden: true,
                    header: [{text: "Дата заведения"},
                        //{content:"selectFilter"}
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
                    //console.log(params);
                    this.$scope.popnew.show('Редактирование действующего в-ва', params);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    //this.$$("_del").show()
                    },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        this.callEvent("onItemDblClick");
                        }
                    },
                },
            }

        var top = {height: 40, view: "toolbar",
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка поиска", 
                    keyPressTimeout: 900, tooltip: "поиск по действующему веществу",
                    on: {
                        onTimedKeyPress: function(code, event) {
                            let value = this.getValue().toString().toLowerCase();
                            this.$scope.$$("__table").filter(function(obj){
                                return obj.act_ingr.toString().toLowerCase().indexOf(value) != -1;
                                })
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Добавить действующее вещество",
                    //label: "<span class='webix_icon fa-plus'></span>", width: 40,
                    localId: "_add",
                    resizable: true,
                    sWidth: 180,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Добавить ДВ</span>",
                    oldLabel: "<span class='webix_icon fa-plus'></span>",
                    click: () => {
                        let params = {'type': 'Dv', 'callback': addDv, 'mode': 'new', 'source': this.$$("__table")};
                        this.popnew.show('Добавление действующего в-ва', params);
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "_del", tooltip: "Удалить дейтсвующее вещество",
                    //label: "<span style='color: red', class='webix_icon fa-times'></span>", width: 40,
                    resizable: true, sWidth: 180, eWidth: 40, label: "", width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px;'>Удалить ДВ</span>",
                    oldLabel: "<span style='color: red', class='webix_icon fa-times'></span>",
                    on: {
                        onItemClick: () => {
                            let item_id = this.$$("__table").getSelectedItem().id
                            let params = {};
                            params['user'] = this.app.config.user;
                            params['id'] = item_id;
                            let url = this.app.config.r_url + "?delDv";
                            let res = request(url, params, !0).response;
                            res = checkVal(res, 's');
                            if (res) {
                                delDv(res.id, this.$$("__table"));
                                this.$$("_del").hide()
                                };
                            },
                        },
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
        setButtons(this.app, r_but);
        dvReload(this.app, this.$$("__table"));
        }
        
    init() {
        this.popnew = this.ui(NewDvView);
        webix.extend(this.$$("__table"), webix.ProgressBar);
        //this.$$("__table").sync(dv.data);
        }
    }

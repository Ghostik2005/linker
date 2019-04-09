"use strict";

import {JetView} from "webix-jet";
import {singleRefReload, addTGr, setButtons, delTGr, updTGr, request, checkVal, DelEdIcons} from "../views/globals";
import {refTemplate} from "../views/globals";
import NewPropView from "../views/new_prop";

export default class TGroupsView extends JetView{
    config(){

        var th = this;
        var app = th.app;

        var delete_gr = function() {
            let canDeleted = th.$$("__table").getSelectedItem().delete;
            if (!canDeleted) {
                webix.message({"type": "debug", "text": "Удаление невозможно", "expire": 5000});
                return
            }
            let item_id = th.$$("__table").getSelectedId().id;
            let params = {};
            params['user'] = app.config.user;
            params['id'] = item_id;
            let url = app.config.r_url + "?delGr";
            let res = request(url, params, !0).response;
            res = checkVal(res, 's');
            if (res) {
                delTGr(item_id, th.$$("__table"));
                th.$$("_del").hide();
                };

        }

        var sprv = {view: "datatable",
            name: "_tgroups",
            localId: "__table",
            navigation: "row",
            select: "row",
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
                        webix.message({"type": "debug", "text": "Удаление группы "+ item.c_tgroup  + " невозможно", "expire": 5000});
                        return
                    };
                    setTimeout( () => {
                        this.select(item.id, false);
                        delete_gr();    
                    }, 50)
                },
                edit_button:function(ev, id, html){
                    let item = this.getItem(id);
                    this.select(id, false);
                    this.callEvent("onItemDblClick", id);
                },

            },

            columns: [
                { id: "c_tgroup", headermenu: false,
                    fillspace: 1, sort: "text",
                    header: [{text: "Группа"},
                    ],
                    template: refTemplate,
                },
                {id: "id",
                    width: 300,
                    header: [{text: "ID"},
                        ],
                    },
                { id: "id_state", hidden: true,
                    width: 150,
                    header: [{text: "Статус"},
                        ]
                    },
                { id: "dt", hidden: true,
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
                onAfterRender: function(data) {
                    // let butts =  Array.from(document.getElementsByClassName("delete_button"));
                    let butts =  Array.prototype.slice.call(document.getElementsByClassName("delete_button"));
                    butts.forEach((butt) => {
                        butt.onmousedown =  (event) => {
                            this.$scope.$$("_del").blockEvent();
                            butt.onmouseup = () => {
                                clearInterval(this.interval);
                            };
                            this.interval = setTimeout ( () => {
                                this.$scope.$$("_del").unblockEvent();
                            }, app.config.popDelay);
                        }
                    });
                },
                onItemDblClick: function(item) {
                    item = this.getSelectedItem();
                    let params = {'text': item.c_tgroup, 'id': item.id, 'type': 'Gr', 'callback': updTGr, 'mode': 'upd', 'source': this};
                    this.$scope.popnew.show('Редактирование группы', params);
                    },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onAfterSelect: function(item) {
                    //item = this.getItem(item);
                    //this.$scope.$$("_del").show();
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
                    keyPressTimeout: 900, tooltip: "поиск по группе",
                    on: {
                        onTimedKeyPress: function(code, event) {
                            let value = this.getValue().toString().toLowerCase();
                            this.$scope.$$("__table").filter(function(obj){
                                return obj.c_tgroup.toString().toLowerCase().indexOf(value) != -1;
                                })
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', tooltip: "Добавить группу",
                    //label: "<span class='webix_icon fa-plus'></span>", width: 40,
                    localId: "_add",
                    resizable: true,
                    sWidth: 180,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='button_label'>Добавить группу</span>",
                    oldLabel: "<span class='webix_icon fa-plus'></span>",
                    click: () => {
                        let params = {'type': 'Gr', 'callback': addTGr, 'mode': 'new', 'source': this.$$("__table"), 'index': 7};
                        this.popnew.show('Добавление группы', params, true);
                        }
                    },
                {view:"button", type: 'htmlbutton', hidden: true, localId: "_del", tooltip: "Удалить группу",
                    resizable: true, sWidth: 180, eWidth: 40, label: "", width: 40,
                    extLabel: "<span class='button_label'>Удалить гпуппу</span>",
                    oldLabel: "<span style='color: red', class='webix_icon fa-times'></span>",
                    on: {
                        onItemClick: delete_gr,
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
        singleRefReload(this.app, "getTgAll", this.$$("__table"));
        }
        
    init() {
        this.popnew = this.ui(NewPropView);
        webix.extend(this.$$("__table"), webix.ProgressBar);
        
        }
    }

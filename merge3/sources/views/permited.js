"use strict";

import {JetView} from "webix-jet";
import {checkKey, user_inn_w} from "../views/globals";
import {checkVal, request} from "../views/globals";
import merge3View from "../views/merge3_window";

export default class PView extends JetView{
    config(){
        var app = this.app;
        var view_this = this;

        var insert_values = function(items) {
            if (!items.length) {
                items = [items,];
            };
            //var inns = user_inn_w.data.order;
            var inns = view_this.parent.w;
            var ins = [];
            var add_item, inn;
            inns.forEach( (inn_id)=>{
                //var inn = user_inn_w.getItem(inn_id).inn;
                var inn = inn_id.inn;
                items.forEach((item) => {
                    add_item = {};
                    add_item.vnd = item.c_vnd;
                    add_item.dt = "";
                    add_item.hard = 0;
                    add_item.id_spr = view_this.parent.spr_table.getSelectedItem().id_spr;
                    add_item.inn = inn;
                    //add_item.c_inn = c_inn;
                    //add_item.id = add_item.inn + add_item.c_vnd;
                    ins.push(add_item);
                });
            });
            //передаем значения ins на сервер
            ////////////////////////////////////
            //отправляем на сервер измененные данные
            let url = app.config.r_url + "?setVnd";
            let params = {'user': app.config.user, 'datas': ins, 'remove': false};
            view_this.parent.active_table.showProgress({type: "top"});
            request(url, params).then( (data) => {
                data = checkVal(data, 'a');
                if (data) {
                    view_this.parent.spr_table.callEvent('onAfterSelect');
                }
                view_this.parent.active_table.hideProgress();
                if (!data) return false;
                else return true;
            });
        }
        
        var header = {view: 'toolbar', height: 40,
            cols: [
                {view: "text", label: "", labelWidth: 1, placeholder: "Поиск по поставщику", 
                    _keytimed: undefined, localId: "_local_spr_search",
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout(() => {
                                    var value = this.getValue();
                                    this.$scope.$$("__table").filter(function(item) {
                                        value = value.toString().toLowerCase()
                                        value = value.replace(/ /g, ".*");
                                        return item.c_vnd.toString().toLowerCase().search(value) != -1;
                                    });
                                }, this.$scope.app.config.searchDelay);
                            }
                        }
                    },
                },
                {view:"button", width: 38,
                    tooltip: "Сбросить фильтры", type:"imageButton", image: './library/img/unfilter.svg',
                    localId: "_unfilt",
                    label: "",
                    click: () => {
                        this.$$("_local_spr_search").setValue("");
                        this.$$("_local_spr_search").callEvent("onKeyPress", [13,]);
                    }
                },
                //{},
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: true, localId: "_to_r",
                    tooltip: "Перенести выделенные",
                    //label: "<span class='webix_icon fas fa-angle-right'></span><span style='line-height: 20px;'></span>",
                    type:"imageButton", image: './library/img/right-arrow.svg',
                    on: {
                        onItemClick: () => {
                            let items = this.$$("__table").getSelectedItem();
                            var ins = insert_values(items);
                        },
                    }
                },
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: !true,
                    tooltip: "Перенести все",
                    //label: "<span class='webix_icon fas fa-angle-double-right'></span><span style='line-height: 20px;'></span>",
                    type:"imageButton", image: './library/img/double-right-arrows.svg',
                    click: () => {
                        if (!this.parent.spr_table.getSelectedItem()) {
                            webix.message({type: "error", text: "Выберите товар", expire: 2000})
                            return false;
                        };    
                        let items = this.$$("__table").serialize();
                        var ins = insert_values(items);
                    },
                },
            ]
        }

        var sprv = {view: "datatable",
            //css: {"margin-top": "-5px !important"},
            name: "_spr",
            localId: "__table",
            navigation: "row",
            select: true,
            multiselect: true,
            resizeColumn:true,
            fixedRowHeight:false,
            editable: false,
            headermenu:{
                autowidth: true, 
                },
            fi: 'c_vnd',
            di: 'asc',
            drag: true,
            columns: [
                {id: "id_vnd", width: 80, sort: "text",
                    header: [{text: "IDSPR"},
                    ],
                    headermenu:!false,
                    hidden: true,
                },
                { id: "c_vnd", fillspace: 1, sort: "text",
                    header: [{text: "Поставщик"},
                    ],
                    headermenu:false,
                },
            ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                },
                onItemDblClick: function(item) {
                    this.$scope.$$("_to_r").callEvent('onItemClick');

                },
                onBeforeDrop: function(context, event) {
                    return false
                },
                onBeforeDrag: function(context, native_event) {
                    if (!view_this.parent.spr_table.getSelectedItem()) return false;
                    context.html = "<div style='padding:8px;'>";
                    for (var i=0; i< context.source.length; i++){
                        context.html += context.from.getItem(context.source[i]).c_vnd + "<br>" ;
                    }
                    context.html += "</div>";
                    return true;
                },
                onBeforeDropOut: function(context, native_event) {
                    //let items = this.$$("__table").getSelectedItem();
                    let items = [];
                    context.source.forEach( (i) => {
                        items.push(context.from.getItem(i))
                    });
                    var ins = insert_values(items);
                    return false;
                },
                onAfterLoad: function() {
                    this.hideProgress();
                    },
                onBeforeSelect: () => {
                    if (!this.parent.spr_table.getSelectedItem()) {
                        webix.message({type: "error", text: "Выберите товар", expire: 2000})
                        return false;
                    }
                },
                onAfterSelect: function() {
                    this.$scope.$$("_to_r").show();
                },
                onAfterUnSelect: function() {
                    let rows = this.data.order;
                    let check = false;
                    rows.forEach( (item) => {
                        if (this.isSelected(item)) {
                            check = true;
                        }
                    })
                    if (!check) this.$scope.$$("_to_r").hide();
                },
                onKeyPress: function(code, e){
                    if (13 === code) {
                        if (this.getSelectedItem()) this.callEvent("onItemDblClick");
                    }
                },
            }
        }
        var view = {
            view: "layout",
            //width: document.documentElement.clientWidth*.3,
            gravity: 3,
            css: {'border-top': "1px solid #dadee0 !important", "background": "orange"},
            rows: [
                {cols: [
                    {view: "label", 
                        width: 40,
                        align: "center",
                        css: {'border-left': "1px solid #dadee0 !important", 'border-right': "1px solid #dadee0 !important",
                            },
                        label: "<span class='custom_image', style='background-image:url(./library/img/options_permited.svg); width: 30px; height: 30px;'></span>",
                        on: {
                            onItemClick: () => {
                                this.popvnd.show_w(this.getParentView());
                            },
                        }
                    },
                    {view: "label", 
                        label: "<div style='text-align: center'>Неактивные</div>", 
                        css: {'border-left': "1px solid #dadee0 !important", 'border-right': "1px solid #dadee0 !important"},
                        on: {
                            onItemClick: () => {
                                this.popvnd.show_w(this.getParentView());
                                //console.log("click")
                            },
                        }
                    },

                ]},
                header,
                sprv
            ]
        }

        return view
        }

    parse(data){
        this.clear()
        this.$$("__table").parse(data);
    }

    clear() {
        this.$$("__table").clearAll();
    }

    ready(view) {
        this.parent = this.getRoot().getParentView().$scope;
        this.$$("__table").markSorting(this.$$("__table").config.fi,this.$$("__table").config.di);
        let url = this.app.config.r_url + "?getVnd";
        let params = {"user": this.app.config.user, "all": true};
        request(url, params, 0).then((data) => {
            data = checkVal(data, 'a');
            if (data) {
                this.parse(data.all);
            }
        })
    }

    init(view) {
        this.popvnd = this.ui(merge3View)
    }

}
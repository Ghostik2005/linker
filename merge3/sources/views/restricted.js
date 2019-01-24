"use strict";

import {JetView} from "webix-jet";
import groupView from "../views/group_pop";
import {checkVal, request} from "../views/globals";
import {dt_format, unique_arr} from "../views/globals";

export default class RView extends JetView{
    config(){
        var app = this.app;
        let view_this = this;

        var remAll = function (parentTable, items, all=false) {
            let id_spr = 50516;
            let inns = ['3525165470', '3525211102', '3525014376', '3525016140', '3525142956', '3525303699', '3528112460',
                        '3525261142', '3525087085', '3526009890', '3525313697', '3528291272', '440701038915', '2907003938', 
                        '3528083025', '2907017722', '3526022193', '2901258714', '2901101953', '2901294180'];
            let url = app.config.r_url + "?delVndAll";
            let params = {'user': app.config.user, 'id_spr': id_spr, 'inn': inns};
            request(url, params).then( (data) => {
                data = checkVal(data, 'a');
                if (data) {
                    console.log('res_data', data)        
                }
            });
        }

        var removeFromTable = function (parentTable, items, all=false) {
            var removes = [];
            //console.log('remove items', items);
            var all_items = parentTable.data;
            if (!items.length) items = [items,];
            items.forEach( (item) => {
                if (item.$group) {
                    //верхний уровень
                    //добавляем в  список на удаление id всех элементов у которых parent === item.id
                    all_items.each((item1) => {
                        if (item1.$parent === item.id) {
                            removes.push(item1.id);
                        }
                    });
                } else {
                    //вложенный уровень
                    //добавляем id в список на удаление 
                    removes.push(item.id);
                }
            });
            //пробегаем список и удаляем повторяющиеся id
            removes = unique_arr(removes);
            //parentTable.unselectAll();
            //удаляем с сервера
            // console.log('removes', removes);
            let server_removes = []
            removes.forEach( (i) => {
                var item = parentTable.getItem(i);
                server_removes.push({"vnd": item.c_vnd,
                                     "dt": item.dt,
                                     "hard": item.hard,
                                     "id_spr": view_this.parent.spr_table.getSelectedItem().id_spr,
                                     "inn": item.inn});
            });
            ////////////////////////////////////
            //отправляем на сервер измененные данные
            let url = app.config.r_url + "?setVnd";
            let params = {'user': app.config.user, 'datas': server_removes, 'remove': true};
            view_this.parent.active_table.showProgress({type: "top"});
            //console.log('items', server_removes)
            request(url, params).then( (data) => {
                data = checkVal(data, 'a');
                if (data) {
                    console.log('res_data', data)        
                }
                view_this.parent.active_table.hideProgress();
                if (!data) return
                else{
                    if (all) {
                        parentTable.clearAll();
                    }else{
                        if (removes.length > 0) {
                            parentTable.remove(removes)
                        };
                        //проверяем, нет ли пустых групп, если есть - удаляем
                        all_items = parentTable.data;
                        all_items.each((item)=>{
                            if (item.$group && item.$count === 0) {
                                parentTable.remove(item.id);
                            }
                        });
                    }
                }
            });
        }

        var header = {view: 'toolbar', height: 40,
            cols: [
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: !true,
                    tooltip: "Перенести все",
                    //label: "<span class='webix_icon fas fa-angle-double-left'>",
                    type:"imageButton", image: './library/img/double-left-arrows.svg',
                    click: () => {
                        let table = this.$$("__table");
                        if (table.count() < 1) {
                            //webix.message({type: "error", text: "Нет активных элементов", expire: 2000})
                            //
                            return false;
                        };
                        //remAll(table, table.serialize(), true);
                        removeFromTable(table, table.serialize(), true);
                    },
                },
                {view: "button", //type: 'htmlbutton', 
                    width: 38, hidden: true, localId: "_remove_sel",
                    tooltip: "Перенести выделенные",
                    //label: "<span class='webix_icon fas fa-angle-left'></span>",
                    type:"imageButton", image: './library/img/left-arrow.svg',
                    click: () => {
                        removeFromTable(this.$$("__table"), this.$$("__table").getSelectedItem());
                    },
                },
                {},
                {view: "button", width: 38, hidden: !true, groupBy: "c_vnd", localId: "_gr",
                    tooltip: "Группировать...",
                    type:"imageButton", image: './library/img/list.svg',
                    //label: "<span class='webix_icon fas fa-list-ul'></span>", type: 'htmlbutton',
                    click: (id) => {
                        let parent = this.getParentView();
                        (this.popgr.isVisible()) ? this.popgr.hide() : this.popgr.show($$(id), this.$$("__table"), parent);
                    },
                },
            ]
        }

        var checkDates = function(table, parent) {
            let data = table.data;
            if (parent) {
                let all_match = true;
                let date = parent.dt;
                if (date.getDate) date = date.getFullYear() +"-" + (date.getMonth() + 1) + "-" + date.getDate();
                else date = date.split(' ')[0]
                data.each( (item) => {
                    if (item.$parent === parent.$parent) {
                        let date_item = item.dt;
                        if (date_item.getDate) date_item = date_item.getFullYear() +"-" + (date_item.getMonth() + 1) + "-" + date_item.getDate();
                        else date_item = date_item.split(' ')[0]
                        if (date != date_item) all_match = false;
                    }
                });
                let item = table.getItem(parent.$parent);
                item.dt = (all_match) ? date : undefined;
            } else {
                let parents = []
                data.each( (item) => {
                    if (item.$group) parents.push(item)
                });
                let dates = new Set();
                parents.forEach( (parent_s) => {
                    dates.clear();
                    var date_item = undefined;
                    data.each( (c_item) => {
                        if (!c_item.$group && c_item.$parent === parent_s.id) {
                            date_item = c_item.dt;
                            if (date_item) {
                                if (date_item.getDate) date_item = date_item.getFullYear() +"-" + (date_item.getMonth() + 1) + "-" + date_item.getDate();
                                else date_item = date_item.split(' ')[0]
                                dates.add(date_item);
                            } else {
                            }
                        }
                    })
                    if (dates.size === 1) table.getItem(parent_s.id).dt = dates.values().next().value;
                    else table.getItem(parent_s.id).dt = undefined;
                    table.refresh();
                })
            }
        }

        var sprv = {//view: "datatable",
            view: "treetable",
            name: "_active",
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
            drag: true,
            editable: true,
            fi: 'c_vnd',
            di: 'asc',
            old_stri: "",
            threeState: true,
            //type: "lineTree",
            columns: [
                {id: "inn",  sort: "text", fillspace: 1, 
                    //template: "{common.icon()} #inn#",
                    template: function(obj, common){
                        if (obj.$group) return common.icon(obj, common) + obj.inn;
                        return common.space(obj) + common.space(obj) + obj.c_inn ;
                    }, 
                    header: [{text: "Организация"},
                    ],
                    headermenu:false, 
                },
                { id: "c_vnd", width: 160, sort: "text",
                    header: [{text: "Поставщик"},
                    ],
                    headermenu:false,
                },
                {id: "hard", width: 80,
                    template: "{common.treecheckbox()}",
                    header: "Жестко",
                },
                {id: "dt", editor: "date", 
                    suggest:{
                        type:"calendar",
                        body:{
                            multiselect: false,
                            timepicker: !true,
                            weekNumber:!true,
                            icons: true
                        }
                    },
                    width: 160, sort: "text", format: dt_format, 
                    header: [{text: "Дата окончания"},
                    ],
                    headermenu:false,
                },
            ],
            on: {
                "data->onParse":function(i, data){
                    //this.clearAll();
                    this.ungroup();
                },
                onBeforeDrop: function(context, event) {
                    return false
                },
                onBeforeDrag: function(context, native_event) {
                    if (!view_this.parent.spr_table.getSelectedItem()) return false;
                    context.html = "<div style='padding:8px;'>";
                    for (var i=0; i< context.source.length; i++){
                        context.html += context.from.getItem(context.source[i]).inn + "<br>" ;
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
                    removeFromTable(this, items)
                    // console.log('removes', items);
                    return false;
                },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                },
                onItemDblClick: function(item) {
                    //
                },
                onAfterLoad: function() {
                    this.hideProgress();
                    setTimeout(()=> {
                        this.blockEvent();
                        this.group({
                            by: this.$scope.$$("_gr").config.groupBy,
                                map:{inn:[this.$scope.$$("_gr").config.groupBy]}
                            });
                        this.data.each( (item)=>{
                            if (item.hard === 1 && item.$level != 1) {
                                this.checkItem(item.id);
                            }
                        });
                        //console.log('load')
                        checkDates(this);
                        this.unblockEvent();
                    }, 0);
                },
                onAfterEditStop: function (item, obj) {
                    if (obj.column === 'dt') {
                        let row_id = obj.row;
                        let row_item = this.getItem(row_id);
                        let date = item.value;
                        if (date.getDate) date = date.getFullYear() +"-" + (date.getMonth() + 1) + "-" + date.getDate();
                        else date = date.split(' ')[0]
                        // console.log('date', date);
                        if (!row_item.$group) checkDates(this, row_item);
                        let items_list = []
                        let id_spr = this.$scope.parent.spr_table.getSelectedItem().id_spr;
                        if (row_item.$group) {
                            this.data.each( (data_item) => {
                                if (data_item.$parent === row_id) {
                                    data_item.dt = row_item.dt;
                                    items_list.push({'inn': data_item.inn, 
                                                     'vnd': data_item.c_vnd, 
                                                     'id_spr': id_spr,
                                                     'hard': data_item.hard,
                                                     'dt':date});
                                }
                            });
                        } else {
                            items_list.push({'inn': row_item.inn, 'vnd': row_item.c_vnd, 'id_spr': id_spr, 'hard': row_item.hard, 'dt':date});
                        };
                        ////////////////////////////////////
                        //отправляем на сервер измененные данные
                        let url = app.config.r_url + "?setVnd";
                        let params = {'user': app.config.user, 'datas': items_list, 'remove': false};
                        this.showProgress({type: "top"});
                        request(url, params).then( (data) => {
                            data = checkVal(data, 'a');
                            if (data) {
                                console.log('res_data', data)
                            }
                            this.hideProgress();
                        });
                        ///////////////////////////////////
                        // console.log("item", items_list); 
                    }
                },
                onItemCheck: function(item_id, state) {
                    let item = this.getItem(item_id);
                    let items_list = []
                    let id_spr = this.$scope.parent.spr_table.getSelectedItem().id_spr;
                    if (item.$group) {
                        this.data.each( (data_item) => {
                            if (data_item.$parent === item_id) items_list.push({'inn': data_item.inn, 
                                                                                'vnd': data_item.c_vnd, 
                                                                                'id_spr': id_spr,
                                                                                'hard': state,
                                                                                'dt':data_item.dt});
                        });
                    } else {
                        items_list.push({'inn': item.inn, 'vnd': item.c_vnd, 'id_spr': id_spr, 'hard': state});
                    };
                    ////////////////////////////////////
                    //отправляем на сервер измененные данные
                    let url = app.config.r_url + "?setVnd";
                    let params = {'user': app.config.user, 'datas': items_list, 'remove': false};
                    this.showProgress({type: "top"});
                    request(url, params).then( (data) => {
                        data = checkVal(data, 'a');
                        if (data) {
                            console.log('res_data', data)
                            
                        }
                        this.hideProgress();
                    });
                    ///////////////////////////////////
                    // console.log("item", items_list);
                },
                onAfterUnSelect: function() {
                    let rows = this.data.order;
                    let check = false;
                    rows.forEach( (item) => {
                        if (this.isSelected(item)) {
                            check = true;
                        }
                    })
                    if (!check) this.$scope.$$("_remove_sel").hide();
                },
                onAfterSelect: function(row) {
                    let item = this.getItem(row.id);
                    //console.log('ite', item);
                    //
                    this.$scope.$$("_remove_sel").show();
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
            gravity: 4,
            css: {'border-top': "1px solid #dadee0 !important", "background": "lightgreen"},
            rows: [
                {view: "label", label: "Активные", align:"center"},
                header,
                sprv,
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
        this.parent = view.getParentView().$scope;
        this.$$("__table").markSorting(this.$$("__table").config.fi,this.$$("__table").config.di);
    }

    init() {
        this.popgr = this.ui(groupView);
        
    }
}
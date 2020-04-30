"use strict";

import {JetView} from "webix-jet";
import {request, setButtons, checkVal, dt_formating_sec} from "../views/globals";

export default class LinkVendorsView extends JetView{
    config(){

        let th = this;
        th.options = th.getUGroups();
        let app = this.app;
        
        var top = {height: 40, view: "toolbar",
            borderless: true,
            cols: [
                {},
                {view: "combo",
                    label: "Назначить помеченные на:", labelWidth: 'auto',
                    localId: "__group_selection",
                    hidden: true,
                    width: 350,
                    options: th.options,
                    on: {
                        onChange: function(new_value, old_value) {
                            let items = [];
                            let table_data = this.$scope.$$("__table").serialize(true);
                            table_data.forEach( (i)=> {
                                if (i._check == 1) items.push(i);
                            });

                            th.confirmSelection({ok: () => {
                                let url = app.config.r_url + "?setVndsUsers";
                                let params = {"user": app.config.user, "group": new_value, "rows": items};
                                if (!checkVal(request(url, params, !0).response, 's')) {
                                } else {
                                    //refresh
                                    th.$$("__renew").callEvent('onItemClick');
                                    this.blockEvent();
                                    this.setValue();
                                    this.unblockEvent();
                                    th.setGroupImmediately(th, new_value);
                                }},
                                error: () => {
                                    this.blockEvent();
                                    this.setValue();
                                    this.unblockEvent();
                                }
                            }, new_value);


                        }
                    }

                },
                {view: "button", type: "htmlbutton",
                    //label: "<span class='webix_icon fa-refresh'></span>", width: 40,
                    localId: "__renew",
                    resizable: true,
                    sWidth: 136,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span class='button_label'>Обновить</span>",
                    oldLabel: "<span class='webix_icon fa-refresh'></span>",
                    on: {
                        onItemClick: () => {
                            th.$$("__group_selection").hide();
                            let user = this.app.config.user;
                            let url = this.app.config.r_url + "?getVndsUsers";
                            let params = {"user": user};
                            request(url, params).then( (data) => {
                                data = checkVal(data, 'a');
                                if (data.length > 0) {
                                    this.$$("__table").parse(data);
                                } else {
                                    this.$$("__table").clearAll();
                                }
                            })
                        }
                    }
                },
            ]
        }

        var sprv = {view: "datatable",
            name: "_vendors",
            localId: "__table",
            select: true,
            resizeColumn:true,
            borderless: true,
            navigation: "row",
            rowHeight: 32,
            fixedRowHeight:false,
            rowLineHeight:32,
            editable: ! false,
            editaction:"dblclick",
            columns: [
                { id:"_check", header:{ content:"masterCheckbox", css:"center_p" },
                    css:"center_p",
                    width:80, 
                    template:"{common.checkbox()}"
                },
                {id: "id_vnd", width: 260,
                    sort: "int",
                    header: [{text: "id поставщика"},
                    {content: "textFilter"}
                    ]
                },
                {id: "c_vnd", fillspace: 1,
                    sort: "text",
                    header: [{text: "Поставщик"},
                    {content: "textFilter"}
                    ]
                },
                {id: "users_group", hidden: true},
                {id: "c_group", width: 130,
                    sort: "text",
                    editor:"combo",
                    options: th.options,
                    // suggest:{
                    //     template:'#value#', //template of the input when editor is opened, default
                    //     filter:function(item,value){ //redefines default webix combo filter
                    //         console.log(value, item.value);
                    //         if (item.value.toString().toLowerCase().indexOf(value.toLowerCase())===0) return true;
                    //         return false;
                    //     },
                    // },
                    header: [{text: "Группа пользователей"},
                    {content: "selectFilter"}
                    ]
                },
                {id: "c_description", width: 170,
                    header: [{text: "Описание"},
                    ]
                },

            ],
            on: {
                "data->onParse":function(i, data){
                    this.clearAll();
                },
                onBeforeRender: function() {
                    webix.extend(this, webix.ProgressBar);
                },
                onAfterLoad: function() {
                    this.sort("id_vnd", "asc");
                    this.markSorting("id_vnd", "asc");
                },
                onDataUpdate: function(row_id, new_value, old_value, i){
                    //отсылаем на сервер, если ОК - тогда оставляем, иначе апдейтим назад
                    if (new_value._check != old_value._check) return false;
                    th.confirmSelection({ok: () => {
                        let url = th.app.config.r_url + "?setVndsUsers";
                        let params = {"user": th.app.config.user, "group": new_value.c_group, "rows": [new_value,]};
                        if (!checkVal(request(url, params, !0).response, 's')) {
                            this.blockEvent();
                            this.updateItem(row_id, old_value);
                            this.unblockEvent();
                        } else {
                            th.setGroupImmediately(th, new_value);
                        }},
                        error: () => {
                            this.blockEvent();
                            this.updateItem(row_id, old_value);
                            this.unblockEvent();
                        }

                    }, new_value);

                    this.filterByAll();
                },
                onCheck: function(row_id, col_id, value){
                    let table_data = this.$scope.$$("__table").serialize(true);
                    let unselected = []
                    table_data.forEach( (i)=> {
                        if (i._check != 1) unselected.push(i);
                    });
                    if (table_data.length === unselected.length) {
                        th.$$("__group_selection").hide();
                    } else {
                        th.$$("__group_selection").show();
                        th.$$("__group_selection").blockEvent();
                        th.$$("__group_selection").setValue();
                        th.$$("__group_selection").unblockEvent();
                    }

                }
            },
        }

        return {
            view: "layout",
            css: {'border-left': "1px solid #dddddd !important"},
            rows: [
                top,
                sprv,
                ]
            }
        }

    confirmSelection(callback, new_value) {
        let vnd = (new_value.c_vnd) ? `у постащика ${new_value.c_vnd}` : 'у выбранных поставщиков'
        let group = (new_value.c_group) ? new_value.c_group : new_value;
        webix.confirm({
            type:"confirm-error",
            ok: "Да", 
            cancel: "Нет",
            text:`<span style='font-size: 14px; line-height: 20px'>Сменить ${vnd} группу на ${group}?</span>`,
            callback: function (answer) {
                if (answer) {
                    callback.ok();
                } else {
                    callback.error();
                }
            }
        })

    }

    setGroupImmediately(th, new_value) {
        let vnd = (new_value.c_vnd) ? new_value.c_vnd : ''
        let group = (new_value.c_group) ? new_value.c_group : new_value;
        webix.confirm({
            type:"confirm-warning",
            ok: "Да", 
            cancel: "Нет",
            text:`<span style='font-size: 14px; line-height: 20px'>Переназначить ВСЕ позиции ${vnd} на группу ${group}?</span>`,
            callback: function(result) {
                if (result) {
                    let url = th.app.config.r_url + "?updatePrcNewUsers";
                    let params = {"user": th.app.config.user};
                    request(url, params).then( (data) => {
                        webix.message('updated')
                    })
                } else {
                    webix.message('not updated')
                }
            }
        })

    }
    
    getUGroups() {
        let url = this.app.config.r_url + "?getUsersGroups";
        let params = {"user": this.app.config.user};
        return checkVal(request(url, params, !0).response, 's')
    }
        
    ready(view) {
        let r_but = [this.$$("__renew")]
        setButtons(this.app, r_but);
        let user = this.app.config.user;
        let url = this.app.config.r_url + "?getVndsUsers";
        let params = {"user": user};
        request(url, params).then( (data) => {
            data = checkVal(data, 'a');
            // console.log('data', data);
            if (data.length > 0) {
                this.$$("__table").parse(data);
            }
        })
    }
}

"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, checkKey} from "../views/globals";
//import NewCodeView from "../views/new_code";

export default class LinkCodesView extends JetView{
    config(){

        let app = this.app;

        var leftList = {rows: [
            {view: "label", label: "Сводить по кодам автоматически"},
            {view:"list",
                localId: "_lList",
                //width:350,
                //height: document.documentElement.clientHeight * 0.7,
                //template:"#c_tgroup#",
                select:true,
                on: {
                    onItemDblClick: function(cid) {
                        return
                        let item = this.getItem(cid);
                        this.remove(cid);
                        this.$scope.$$("e_list").add(item);
                        this.$scope.$$("e_list").sort("c_tgroup", "asc")
                        },
                    },
                },
            ]}

        var rightList = {rows: [
            {view: "label", label: "Не сводить по кодам автоматически"},
            {view:"list",
                localId: "_rList",
                //width:350,
                //height: document.documentElement.clientHeight * 0.7,
                //template:"#c_tgroup#",
                select:true,
                on: {
                    onItemDblClick: function(cid) {
                        return
                        let item = this.getItem(cid);
                        this.remove(cid);
                        this.$scope.$$("e_list").add(item);
                        this.$scope.$$("e_list").sort("c_tgroup", "asc")
                        },
                    },
                },
            ]}
        
        var top = {height: 40, view: "toolbar",
            borderless: true,
            cols: [
                {view: "text", label: "", value: "", labelWidth: 1, placeholder: "Строка фильтра", 
                    on: {
                        onKeyPress: function(code, event) {
                            clearTimeout(this.config._keytimed);
                            if (checkKey(code)) {
                                this.config._keytimed = setTimeout( () => {
                                    let value = this.getValue().toString().toLowerCase();
                                    this.$scope.$$("__table").filter(function(obj){
                                        return obj.name.toString().toLowerCase().indexOf(value) != -1;
                                        })
                                    }, this.$scope.app.config.searchDelay);
                                };
                            }
                        },
                    },
                {view:"button", type: 'htmlbutton', localId: "apply", hidden: true,
                    //label: "<span class='webix_icon fa-check'></span><span style='line-height: 20px;'> Применить</span>", width: 130,
                    resizable: true,
                    sWidth: 130,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Применить</span>",
                    oldLabel: "<span class='webix_icon fa-check'></span>",
                    click: () => {
                        let data = [];
                        this.$$("__table").eachRow( 
                            (id) => {
                                let item = this.$$("__table").getItem(id) 
                                if (item.change > 0) {
                                    data.push(item);
                                    console.log('item', item);
                                    console.log('pr', item.process);
                                    }
                            }, true);
                        this.$$("del").hide();
                        setTimeout( () => {
                            this.$$("apply").hide();
                            this.$$("cancel").hide();
                            }, 100);
                        let user = app.config.user;
                        let url = app.config.r_url + "?setLinkCodes";
                        let params = {"user": user, 'data': data};
                        request(url, params).then( (data) => {
                            data = checkVal(data, 'a');
                            if (data) {
                                this.$$("__table").parse(data);
                                }
                            });
                        this.$$("__table").getHeaderContent("ch1").uncheck();
                        }
                    },
                {view:"button", type: 'htmlbutton', localId: "cancel", hidden: true,
                    resizable: true,
                    sWidth: 130,
                    eWidth: 40,
                    label: "",
                    width: 40,
                    extLabel: "<span style='line-height: 20px;padding-left: 5px'>Отменить</span>",
                    oldLabel: "<span class='webix_icon fa-times'></span>",
                    click: () => {
                        let user = app.config.user;
                        let url = app.config.r_url + "?getLinkCodes";
                        let params = {"user": user};
                        this.$$("del").hide();
                        setTimeout( () => {
                            this.$$("apply").hide();
                            this.$$("cancel").hide();
                            }, 100);
                        request(url, params).then( (data) => {
                            data = checkVal(data, 'a');
                            if (data) {
                                this.$$("__table").parse(data);
                                }
                            });
                        this.$$("__table").getHeaderContent("ch1").uncheck();
                        }
                    },
                ]
            }

        return {
            view: "layout",
            css: {'border-left': "1px solid #dddddd !important"},
            rows: [
                top,
                {
                    cols: [
                        leftList,
                        {width: 10},
                        rightList
                        ]
                    },
                ]
            }
        }
        
    init() {
        //this.newcode = this.ui(NewCodeView);
        }
        
    ready() {
        let r_but = [this.$$("_add"), this.$$("del"), this.$$("apply"), this.$$("cancel")]
        r_but.forEach( (item, i, r_but) => {
            item.define({width: (this.app.config.expert) ? item.config.eWidth : item.config.sWidth,
                         label: (this.app.config.expert) ? item.config.oldLabel  : item.config.oldLabel + item.config.extLabel});
            item.refresh();
            item.resize();
            })
        let user = this.app.config.user;
        //let url = this.app.config.r_url + "?getLinkCodes";
        //let params = {"user": user};
        //request(url, params).then( (data) => {
            //data = checkVal(data, 'a');
            //if (data) {
                //this.$$("__table").parse(data);
                //}
            //});
        }
    }

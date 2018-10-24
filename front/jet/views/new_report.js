"use strict";

import {JetView} from "webix-jet";
import {request, checkVal, getDtParams} from "../views/globals";
import {spinIconEnable, spinIconDisable} from "../views/globals";

export default class NewReportView extends JetView{
    config(){
        var app = this.app;
        
        var seps = {
            1: "Табуляция",
            2: ";",
            3: ",",
            4: ".",
            5: "Свое значение"
            };
            
        var types = {
            1: "xlsx",
            2: "ods",
            3: "pdf",
            4: "текст с разделителем",
            };
            
        var form = { view: "form",
            localId: "_form",
            c_view: undefined,
            margin: 0,
            elements: [
                {rows: [
                    {cols: [
                        {rows: [
                            {view: "label", label: "КОЛОНКИ", align: 'center'},
                            {localId: "_check", view: "form", borderless: true,
                                elements: [],
                                },
                            ]},
                        {width: 10},
                        {rows: [
                            {view: "label", label: "ТИП ФАЙЛА", align: 'center'},
                            {view:"radio",  value:1, localId: "_type",
                                margin: 30,
                                //labelWidth: 100,
                                //labelPosition:"top",
                                //labelAlign: "center",
                                align: "center",
                                width: 200,
                                vertical: true,
                                options:[
                                    { id:1, value:"<span style='color: #74747d'>" + types[1] + "</span>" }, 
                                    { id:2, value:"<span style='color: #74747d'>" + types[2] + "</span>" }, 
                                    //{ id:3, value:"<span style='color: #74747d'>" + types[3] + "</span>" }, 
                                    { id:4, value:"<span style='color: #74747d'>" + types[4] + "</span>" }, 
                                    ],
                                on: {
                                    onChange: function() {
                                        let v = this.getValue();
                                        if (+v===4) {
                                            this.$scope.$$("_separator").show();
                                            if (+this.$scope.$$("_separator").getValue() === 5) {
                                                this.$scope.$$("_custom").show();
                                                }
                                        } else {
                                            this.$scope.$$("_separator").hide();
                                            this.$scope.$$("_custom").hide();
                                            };
                                        },
                                    },
                                },
                            {height: 10},
                            {view:"radio",  value:1, label: "РАЗДЕЛИТЕЛЬ", hidden: true,
                                localId: "_separator",
                                margin: 30,
                                labelWidth: 100,
                                labelPosition:"top",
                                labelAlign: "center",
                                align: "center",
                                width: 200,
                                vertical: true,
                                options:[
                                    { id:1, value:"<span style='color: #74747d'>" + seps[1] + "</span>" }, 
                                    { id:2, value:"<span style='color: #74747d'>" + seps[2] + "</span>" }, 
                                    { id:3, value:"<span style='color: #74747d'>" + seps[3] + "</span>" }, 
                                    { id:4, value:"<span style='color: #74747d'>" + seps[4] + "</span>" }, 
                                    { id:5, value:"<span style='color: #74747d'>" + seps[5] + "</span>" }, 
                                    ],
                                on: {
                                    onChange: function() {
                                        let v = this.getValue();
                                        if (+v===5) {
                                            this.$scope.$$("_custom").show();
                                        } else {
                                            this.$scope.$$("_custom").hide();
                                            };
                                        },
                                    },
                                },
                            {view: "text", label: "ЗНАЧЕНИЕ", value: "", hidden: true, localId: "_custom"},
                            ]},
                        ]},
                    {height: 10},
                    {cols: [
                        {view: "button", type: "base", label: "Отменить", width: 120,
                            click: () => {
                                this.hide_w();
                                }
                            },
                        {},
                        {view: "button", type: "base", label: "Создать", width: 120,
                            click: () => {
                                let cv = this.$$("_form").config.c_view
                                let url = app.config.r_url + "?saveData";
                                let headers = [];
                                let hh = this.$$("_check").getChildViews();
                                hh.forEach(function(item, i, hh) {
                                    let v = {};
                                    if (+item.getValue() === 1) {
                                        let k = item.config.id;
                                        v[k] = item.config.labelRight;
                                        headers.push(v);
                                        };
                                    });
                                let pa = getDtParams(cv);
                                console.log("pa", pa);
                                let s_params = {"c_filt": pa[0], "field": pa[2], "direction": pa[3]};
                                let search = undefined;
                                try {
                                    search = $$(cv.getParentView().$scope.$$("__table").config.searchBar).getValue();
                                } catch (Err) {
                                    //console.log("err", Err);
                                    }
                                let type = types[+this.$$("_type").getValue()]
                                let params = {
                                    "headers": headers,
                                    "user": app.config.user,
                                    "type": (type === types[4]) ? 'csv' : type,
                                    "s_params": s_params,
                                    "sep": seps[+this.$$("_separator").getValue()],
                                    "c_sep": this.$$("_custom").getValue(),
                                    "table": this.$$("_form").config.c_view.config.name,
                                    "search": search || ''
                                    };
                                spinIconEnable($$("_rep_button"));
                                $$("_rep_button").blockEvent();
                                webix.ajax().timeout(180000).headers({'Content-type': 'application/json'}).response("blob").post(url, params, function(text, data) {
                                    webix.html.download(data, "report." + params.type);
                                    $$("_rep_button").unblockEvent();
                                    spinIconDisable($$("_rep_button"));
                                    })
                                this.hide_w();
                                }
                            }
                        ]}
                    ]}
                ],
            }

        return {view: "cWindow",
            modal: true,
            on: {
                onHide: () => {
                    this.$$("_form").reconstruct();
                    },
                onShow: () => {
                    },
                },
            body: form
            }
        }
        
    show_w(new_head, c_view){
        let th = this;
        this.getRoot().getHead().getChildViews()[0].setValue(new_head);
        this.$$("_form").config.c_view = c_view;
        c_view.eachColumn(function (columnId){
            let ch = {
                view: "checkbox",
                labelRight: c_view.getColumnConfig(columnId).header[0].text,
                id: columnId,
                value: 1,
                labelWidth: 0,
                width: 175
                };
            th.$$("_check").addView(ch);
            }, true)
        this.getRoot().show();
        }
    hide_w(){
        this.getRoot().hide()
        }
    }


